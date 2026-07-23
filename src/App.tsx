import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppState, Debt, PaymentLog, UnpaidMonthInfo } from './types';
import { INITIAL_DEBTS, INITIAL_MONTHS, INITIAL_PAYMENTS } from './data/initialData';
import {
  getNextMonthRecord,
  getPreviousMonthId,
  compareMonthIds,
} from './utils/persian';
import { Header } from './components/Header';
import { MonthSummary } from './components/MonthSummary';
import { DebtList } from './components/DebtList';
import { DebtModal } from './components/DebtModal';
import { ArchivedDebtsModal } from './components/ArchivedDebtsModal';
import { ExportImportModal } from './components/ExportImportModal';
import { ChangelogModal } from './components/ChangelogModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { CURRENT_VERSION, isNewVersionSeen, markVersionAsSeen } from './data/changelog';

const LOCAL_STORAGE_KEY = 'INSTALMENT_APP_STORAGE_V3';

export default function App() {
  // App State Initialization
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.debts) && Array.isArray(parsed.months) && parsed.months.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial
    }

    // Default initial state
    const sortedInitialMonths = [...INITIAL_MONTHS].sort((a, b) =>
      compareMonthIds(a.id, b.id)
    );
    const lastMonth = sortedInitialMonths[sortedInitialMonths.length - 1];

    return {
      debts: INITIAL_DEBTS,
      months: sortedInitialMonths,
      activeMonthId: lastMonth ? lastMonth.id : INITIAL_MONTHS[0].id,
      payments: INITIAL_PAYMENTS,
    };
  });

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modals state
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Semantic Versioning & Changelog Modals state
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [changelogTab, setChangelogTab] = useState<'whats-new' | 'history'>('whats-new');
  const [hasUnseenVersion, setHasUnseenVersion] = useState(false);

  // Check on app launch if new version was unseen
  useEffect(() => {
    if (!isNewVersionSeen(CURRENT_VERSION)) {
      setHasUnseenVersion(true);
      setChangelogTab('whats-new');
      setIsChangelogModalOpen(true);
    }
  }, []);

  const handleOpenChangelog = (tab: 'whats-new' | 'history' = 'history') => {
    setChangelogTab(tab);
    setIsChangelogModalOpen(true);
  };

  const handleAcknowledgeVersion = () => {
    markVersionAsSeen(CURRENT_VERSION);
    setHasUnseenVersion(false);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));
    } catch {
      // LocalStorage full or private browsing error
    }
  }, [appState]);

  // Active Month object
  const activeMonth = useMemo(() => {
    return (
      appState.months.find((m) => m.id === appState.activeMonthId) ||
      appState.months[appState.months.length - 1]
    );
  }, [appState.months, appState.activeMonthId]);

  // Active Debts (Non-Archived)
  const activeDebts = useMemo(() => {
    return appState.debts.filter((d) => !d.isArchived);
  }, [appState.debts]);

  // Archived Debts
  const archivedDebts = useMemo(() => {
    return appState.debts.filter((d) => d.isArchived);
  }, [appState.debts]);

  // Set of Paid Debt IDs for the active month
  const paidDebtIds = useMemo(() => {
    const set = new Set<string>();
    appState.payments
      .filter((p) => p.monthId === appState.activeMonthId && p.paid)
      .forEach((p) => set.add(p.debtId));
    return set;
  }, [appState.payments, appState.activeMonthId]);

  // Overdue Detection for active month:
  // Check if debt was active and UNPAID in preceding month
  const { overdueDebtsMap, overdueDebtsList } = useMemo(() => {
    const map = new Map<string, string>(); // debtId -> prevMonthLabel
    const list: { debt: Debt; prevMonthLabel: string }[] = [];

    const prevMonthId = getPreviousMonthId(activeMonth, appState.months);
    if (!prevMonthId) return { overdueDebtsMap: map, overdueDebtsList: list };

    const prevMonthObj = appState.months.find((m) => m.id === prevMonthId);
    const prevMonthLabel = prevMonthObj ? prevMonthObj.label : prevMonthId;

    // Check payments in previous month
    activeDebts.forEach((debt) => {
      // Find if debt was recorded as unpaid in previous month
      const prevPaymentLog = appState.payments.find(
        (p) => p.monthId === prevMonthId && p.debtId === debt.id
      );

      // If it exists in previous month log and was NOT paid
      if (prevPaymentLog && !prevPaymentLog.paid) {
        map.set(debt.id, prevMonthLabel);
        list.push({ debt, prevMonthLabel });
      }
    });

    return { overdueDebtsMap: map, overdueDebtsList: list };
  }, [activeMonth, appState.months, appState.payments, activeDebts]);

  // Map of debtId -> UnpaidMonthInfo[] across all tracked months
  const unpaidMonthsMap = useMemo(() => {
    const map = new Map<string, UnpaidMonthInfo[]>();
    const sortedMonths = [...appState.months].sort((a, b) => compareMonthIds(b.id, a.id));

    appState.debts.forEach((debt) => {
      const unpaidList: UnpaidMonthInfo[] = [];

      sortedMonths.forEach((m) => {
        const paymentLog = appState.payments.find(
          (p) => p.monthId === m.id && p.debtId === debt.id
        );
        const isPaid = paymentLog?.paid ?? false;
        if (!isPaid) {
          unpaidList.push({
            monthId: m.id,
            label: m.label,
            isCurrentMonth: m.id === appState.activeMonthId,
            note: paymentLog?.note,
          });
        }
      });

      map.set(debt.id, unpaidList);
    });

    return map;
  }, [appState.debts, appState.months, appState.payments, appState.activeMonthId]);

  // Map of debtId -> current month note
  const monthNotesMap = useMemo(() => {
    const map = new Map<string, string>();
    appState.payments.forEach((p) => {
      if (p.monthId === appState.activeMonthId && p.note) {
        map.set(p.debtId, p.note);
      }
    });
    return map;
  }, [appState.payments, appState.activeMonthId]);

  // Actions: Toggle Payment Status for a Debt in Active Month
  const handleTogglePaid = (debtId: string) => {
    setAppState((prev) => {
      const monthId = prev.activeMonthId;
      const existingLogIndex = prev.payments.findIndex(
        (p) => p.monthId === monthId && p.debtId === debtId
      );

      let updatedPayments = [...prev.payments];

      if (existingLogIndex >= 0) {
        const currentPaid = updatedPayments[existingLogIndex].paid;
        updatedPayments[existingLogIndex] = {
          ...updatedPayments[existingLogIndex],
          paid: !currentPaid,
          paidAt: !currentPaid ? new Date().toISOString() : undefined,
        };
      } else {
        updatedPayments.push({
          monthId,
          debtId,
          paid: true,
          paidAt: new Date().toISOString(),
        });
      }

      return { ...prev, payments: updatedPayments };
    });
  };

  // Actions: Pay All Unpaid Months for a Debt
  const handlePayAllUnpaid = (debtId: string) => {
    setAppState((prev) => {
      let updatedPayments = [...prev.payments];
      const nowIso = new Date().toISOString();

      prev.months.forEach((m) => {
        const existingIndex = updatedPayments.findIndex(
          (p) => p.monthId === m.id && p.debtId === debtId
        );
        if (existingIndex >= 0) {
          if (!updatedPayments[existingIndex].paid) {
            updatedPayments[existingIndex] = {
              ...updatedPayments[existingIndex],
              paid: true,
              paidAt: nowIso,
            };
          }
        } else {
          updatedPayments.push({
            monthId: m.id,
            debtId,
            paid: true,
            paidAt: nowIso,
          });
        }
      });

      return { ...prev, payments: updatedPayments };
    });
    showToast('تمام اقساط معوقه و جاری این قسط با موفقیت تسویه شدند', 'success');
  };

  // Actions: Save Note for Active Month on a Debt
  const handleSaveMonthNote = (debtId: string, note: string) => {
    setAppState((prev) => {
      const monthId = prev.activeMonthId;
      const existingIndex = prev.payments.findIndex(
        (p) => p.monthId === monthId && p.debtId === debtId
      );
      let updatedPayments = [...prev.payments];
      if (existingIndex >= 0) {
        updatedPayments[existingIndex] = {
          ...updatedPayments[existingIndex],
          note: note.trim() ? note.trim() : undefined,
        };
      } else {
        updatedPayments.push({
          monthId,
          debtId,
          paid: false,
          note: note.trim() ? note.trim() : undefined,
        });
      }
      return { ...prev, payments: updatedPayments };
    });
    showToast('یادداشت این ماه ذخیره شد', 'success');
  };

  // Actions: Start Next Month
  const handleStartNextMonth = () => {
    // Find highest month currently in state
    const sorted = [...appState.months].sort((a, b) => compareMonthIds(a.id, b.id));
    const highestMonth = sorted[sorted.length - 1];

    const nextMonthObj = getNextMonthRecord(highestMonth);

    setAppState((prev) => {
      // Add month if doesn't exist
      const monthExists = prev.months.some((m) => m.id === nextMonthObj.id);
      const updatedMonths = monthExists
        ? prev.months
        : [...prev.months, nextMonthObj];

      // Initialize payment logs for next month as false for active debts
      const activeDebtsList = prev.debts.filter((d) => !d.isArchived);
      const newPayments: PaymentLog[] = activeDebtsList.map((d) => ({
        monthId: nextMonthObj.id,
        debtId: d.id,
        paid: false,
      }));

      // Filter out duplicates if any
      const existingNewMonthPayments = prev.payments.filter(
        (p) => p.monthId !== nextMonthObj.id
      );

      return {
        ...prev,
        months: updatedMonths,
        activeMonthId: nextMonthObj.id,
        payments: [...existingNewMonthPayments, ...newPayments],
      };
    });

    showToast(`ماه جدید (${nextMonthObj.label}) آغاز شد!`, 'success');
  };

  // Actions: Save Debt (Add or Edit)
  const handleSaveDebt = (
    debtData: Omit<Debt, 'id' | 'createdAt' | 'isArchived'>
  ) => {
    if (debtToEdit) {
      setAppState((prev) => ({
        ...prev,
        debts: prev.debts.map((d) =>
          d.id === debtToEdit.id ? { ...d, ...debtData } : d
        ),
      }));
      showToast(`اطلاعات قسط "${debtData.title}" بروزرسانی شد`, 'success');
    } else {
      const newId = 'debt-' + Date.now().toString();
      const newDebt: Debt = {
        id: newId,
        ...debtData,
        isArchived: false,
        createdAt: new Date().toISOString(),
      };

      setAppState((prev) => ({
        ...prev,
        debts: [...prev.debts, newDebt],
      }));
      showToast(`قسط جدید "${debtData.title}" اضافه شد`, 'success');
    }
  };

  // Actions: Archive Debt (Move to "تمام شده‌ها")
  const handleArchiveDebt = (debtId: string) => {
    const targetDebt = appState.debts.find((d) => d.id === debtId);
    setAppState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) =>
        d.id === debtId
          ? { ...d, isArchived: true, archivedAt: new Date().toISOString() }
          : d
      ),
    }));
    showToast(
      `قسط "${targetDebt?.title || ''}" به بخش تمام شده‌ها منتقل شد`,
      'info'
    );
  };

  // Actions: Restore Debt from Archive
  const handleRestoreDebt = (debtId: string) => {
    const targetDebt = appState.debts.find((d) => d.id === debtId);
    setAppState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) =>
        d.id === debtId ? { ...d, isArchived: false, archivedAt: undefined } : d
      ),
    }));
    showToast(`قسط "${targetDebt?.title || ''}" به لیست اقساط فعال بازگشت`, 'success');
  };

  // Actions: Delete Debt
  const handleDeleteDebt = (debtId: string) => {
    const targetDebt = appState.debts.find((d) => d.id === debtId);
    if (
      confirm(`آیا از حذف کامل قسط "${targetDebt?.title || ''}" اطمینان دارید؟`)
    ) {
      setAppState((prev) => ({
        ...prev,
        debts: prev.debts.filter((d) => d.id !== debtId),
        payments: prev.payments.filter((p) => p.debtId !== debtId),
      }));
      showToast(`قسط "${targetDebt?.title || ''}" حذف شد`, 'info');
    }
  };

  // Actions: Reset to Demo Data
  const handleResetData = () => {
    const sortedInitialMonths = [...INITIAL_MONTHS].sort((a, b) =>
      compareMonthIds(a.id, b.id)
    );
    const lastMonth = sortedInitialMonths[sortedInitialMonths.length - 1];

    const resetState: AppState = {
      debts: INITIAL_DEBTS,
      months: sortedInitialMonths,
      activeMonthId: lastMonth ? lastMonth.id : INITIAL_MONTHS[0].id,
      payments: INITIAL_PAYMENTS,
    };

    setAppState(resetState);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    showToast('اطلاعات به نمونه اولیه بازنشانی شد', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-16">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Main App Header */}
      <Header
        activeMonth={activeMonth}
        allMonths={appState.months}
        archivedCount={archivedDebts.length}
        hasUnseenVersion={hasUnseenVersion}
        onSelectMonth={(monthId) => setAppState((prev) => ({ ...prev, activeMonthId: monthId }))}
        onStartNextMonth={handleStartNextMonth}
        onOpenAddDebtModal={() => {
          setDebtToEdit(null);
          setIsDebtModalOpen(true);
        }}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenChangelogModal={() => handleOpenChangelog('history')}
      />

      {/* Container Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Month Progress & Overview Summary */}
        <MonthSummary
          activeMonth={activeMonth}
          activeDebts={activeDebts}
          paidDebtIds={paidDebtIds}
          overdueDebts={overdueDebtsList}
        />

        {/* Debts Vertical Main List */}
        <DebtList
          debts={appState.debts}
          paidDebtIds={paidDebtIds}
          overdueDebtsMap={overdueDebtsMap}
          unpaidMonthsMap={unpaidMonthsMap}
          monthNotesMap={monthNotesMap}
          onTogglePaid={handleTogglePaid}
          onPayAllUnpaid={handlePayAllUnpaid}
          onSaveMonthNote={handleSaveMonthNote}
          onEdit={(debt) => {
            setDebtToEdit(debt);
            setIsDebtModalOpen(true);
          }}
          onArchive={handleArchiveDebt}
          onDelete={handleDeleteDebt}
          onOpenAddModal={() => {
            setDebtToEdit(null);
            setIsDebtModalOpen(true);
          }}
          onShowToast={showToast}
        />
      </main>

      {/* Create / Edit Debt Modal */}
      <DebtModal
        isOpen={isDebtModalOpen}
        debtToEdit={debtToEdit}
        onClose={() => setIsDebtModalOpen(false)}
        onSave={handleSaveDebt}
      />

      {/* Completed / Archived Debts Modal */}
      <ArchivedDebtsModal
        isOpen={isArchiveModalOpen}
        archivedDebts={archivedDebts}
        onClose={() => setIsArchiveModalOpen(false)}
        onRestore={handleRestoreDebt}
        onDeletePermanently={handleDeleteDebt}
      />

      {/* Export / Import & Backup Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        appState={appState}
        onClose={() => setIsExportModalOpen(false)}
        onImportState={(newState) => setAppState(newState)}
        onResetData={handleResetData}
        onShowToast={showToast}
        onOpenChangelogModal={() => handleOpenChangelog('history')}
      />

      {/* Semantic Versioning & What's New Modal */}
      <ChangelogModal
        isOpen={isChangelogModalOpen}
        initialTab={changelogTab}
        onClose={() => setIsChangelogModalOpen(false)}
        onAcknowledge={handleAcknowledgeVersion}
      />
    </div>
  );
}
