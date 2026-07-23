import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Debt, DebtFilter, DebtSort, UnpaidMonthInfo } from '../types';
import { DebtCard } from './DebtCard';
import { Search, Filter, ArrowUpDown, CheckCircle, Plus } from 'lucide-react';
import { toPersianDigits, toEnglishDigits } from '../utils/persian';

interface DebtListProps {
  debts: Debt[];
  paidDebtIds: Set<string>;
  overdueDebtsMap: Map<string, string>; // debtId -> prevMonthLabel
  unpaidMonthsMap?: Map<string, UnpaidMonthInfo[]>;
  monthNotesMap?: Map<string, string>;
  onTogglePaid: (debtId: string) => void;
  onPayAllUnpaid?: (debtId: string) => void;
  onSaveMonthNote?: (debtId: string, note: string) => void;
  onEdit: (debt: Debt) => void;
  onArchive: (debtId: string) => void;
  onDelete: (debtId: string) => void;
  onOpenAddModal: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DebtList: React.FC<DebtListProps> = ({
  debts,
  paidDebtIds,
  overdueDebtsMap,
  unpaidMonthsMap,
  monthNotesMap,
  onTogglePaid,
  onPayAllUnpaid,
  onSaveMonthNote,
  onEdit,
  onArchive,
  onDelete,
  onOpenAddModal,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<DebtFilter>('all');
  const [sortBy, setSortBy] = useState<DebtSort>('amount-desc'); // Default sorted highest to lowest amount!
  const [pendingTransitionIds, setPendingTransitionIds] = useState<Set<string>>(new Set());

  // Active debts only (excluding archived ones)
  const activeDebts = useMemo(() => debts.filter((d) => !d.isArchived), [debts]);

  // Delayed payment toggle to allow user to see checkmark animation before card transitions away
  const handleTogglePaidWithDelay = (debtId: string) => {
    // If card was unpaid, add to pending transition so it stays visible for 800ms
    if (!paidDebtIds.has(debtId)) {
      setPendingTransitionIds((prev) => {
        const next = new Set(prev);
        next.add(debtId);
        return next;
      });

      onTogglePaid(debtId);

      setTimeout(() => {
        setPendingTransitionIds((prev) => {
          const next = new Set(prev);
          next.delete(debtId);
          return next;
        });
      }, 850);
    } else {
      // Unpaying: toggle immediately
      onTogglePaid(debtId);
    }
  };

  const handlePayAllUnpaidWithDelay = (debtId: string) => {
    setPendingTransitionIds((prev) => {
      const next = new Set(prev);
      next.add(debtId);
      return next;
    });

    if (onPayAllUnpaid) {
      onPayAllUnpaid(debtId);
    }

    setTimeout(() => {
      setPendingTransitionIds((prev) => {
        const next = new Set(prev);
        next.delete(debtId);
        return next;
      });
    }, 850);
  };

  // Counts for filters
  const counts = useMemo(() => {
    const total = activeDebts.length;
    const paid = activeDebts.filter((d) => paidDebtIds.has(d.id)).length;
    const unpaid = total - paid;
    const overdue = activeDebts.filter((d) => overdueDebtsMap.has(d.id) && !paidDebtIds.has(d.id)).length;
    return { total, paid, unpaid, overdue };
  }, [activeDebts, paidDebtIds, overdueDebtsMap]);

  // Process filtered and sorted list
  const filteredDebts = useMemo(() => {
    let result = [...activeDebts];

    // Filter by search query
    if (searchQuery.trim()) {
      const qEn = toEnglishDigits(searchQuery).toLowerCase().trim();
      const qFa = toPersianDigits(searchQuery).toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(qEn) ||
          d.title.toLowerCase().includes(qFa) ||
          d.cardNumber.includes(qEn) ||
          d.cardNumber.includes(qFa) ||
          d.iban.toLowerCase().includes(qEn) ||
          d.iban.toLowerCase().includes(qFa) ||
          d.notes.toLowerCase().includes(qEn) ||
          d.notes.toLowerCase().includes(qFa)
      );
    }

    // Filter by tab (keeping pending transition cards briefly visible so the user sees checkbox feedback)
    if (filter === 'paid') {
      result = result.filter((d) => paidDebtIds.has(d.id));
    } else if (filter === 'unpaid') {
      result = result.filter((d) => !paidDebtIds.has(d.id) || pendingTransitionIds.has(d.id));
    } else if (filter === 'overdue') {
      result = result.filter((d) => overdueDebtsMap.has(d.id) || pendingTransitionIds.has(d.id));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount; // Highest to lowest
      } else if (sortBy === 'amount-asc') {
        return a.amount - b.amount; // Lowest to highest
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'fa');
      }
      return 0;
    });

    return result;
  }, [activeDebts, searchQuery, filter, sortBy, paidDebtIds, overdueDebtsMap, pendingTransitionIds]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(toPersianDigits(e.target.value))}
              placeholder="جستجو در عنوان، شماره کارت یا یادداشت..."
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>ترتیب:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as DebtSort)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="amount-desc">بیشترین به کمترین مبلغ (پیش‌فرض)</option>
              <option value="amount-asc">کمترین به بیشترین مبلغ</option>
              <option value="title">عنوان (الفبا)</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>همه اقساط</span>
            <span className="bg-white/20 text-current px-1.5 py-0.2 rounded-md text-[10px]">
              {toPersianDigits(counts.total)}
            </span>
          </button>

          <button
            onClick={() => setFilter('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filter === 'unpaid'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60'
            }`}
          >
            <span>پرداخت‌نشده</span>
            <span className="bg-amber-950/20 text-current px-1.5 py-0.2 rounded-md text-[10px]">
              {toPersianDigits(counts.unpaid)}
            </span>
          </button>

          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filter === 'paid'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
            }`}
          >
            <span>پرداخت‌شده</span>
            <span className="bg-emerald-950/20 text-current px-1.5 py-0.2 rounded-md text-[10px]">
              {toPersianDigits(counts.paid)}
            </span>
          </button>

          {counts.overdue > 0 && (
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                filter === 'overdue'
                  ? 'bg-rose-600 text-white shadow-sm animate-pulse'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/60'
              }`}
            >
              <span>معوقات ماه قبل</span>
              <span className="bg-rose-950/20 text-current px-1.5 py-0.2 rounded-md text-[10px]">
                {toPersianDigits(counts.overdue)}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Debts Vertical Cards List */}
      {filteredDebts.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredDebts.map((debt, index) => {
              const isPaid = paidDebtIds.has(debt.id);
              const isOverdue = overdueDebtsMap.has(debt.id);
              const prevMonthLabel = overdueDebtsMap.get(debt.id);
              const isPendingTransition = pendingTransitionIds.has(debt.id);

              return (
                <motion.div
                  key={debt.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.92,
                    y: -12,
                    transition: { duration: 0.35, ease: 'easeOut' },
                  }}
                  transition={{
                    layout: { duration: 0.3, ease: 'easeInOut' },
                    opacity: { duration: 0.25 },
                  }}
                >
                  <DebtCard
                    debt={debt}
                    isPaid={isPaid}
                    isPendingTransition={isPendingTransition}
                    overdueInfo={{ isOverdue, prevMonthLabel }}
                    unpaidMonths={unpaidMonthsMap?.get(debt.id) || []}
                    monthNote={monthNotesMap?.get(debt.id) || ''}
                    onTogglePaid={handleTogglePaidWithDelay}
                    onPayAllUnpaid={handlePayAllUnpaidWithDelay}
                    onSaveMonthNote={onSaveMonthNote}
                    onEdit={onEdit}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onShowToast={onShowToast}
                    rankIndex={index}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            {filter === 'paid' ? (
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            ) : (
              <Filter className="w-8 h-8 text-indigo-500" />
            )}
          </div>

          <div className="max-w-xs mx-auto">
            <h3 className="font-bold text-slate-800 text-base">
              {filter === 'paid'
                ? 'هنوز هیچ قسطی در این ماه پرداخت نشده است'
                : filter === 'unpaid' && counts.total > 0 && counts.unpaid === 0
                ? 'تمامی اقساط این ماه پرداخت شده‌اند 🎉'
                : 'هیچ قسطی یافت نشد'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {filter === 'all' && activeDebts.length === 0
                ? 'شما هنوز هیچ بدهی یا قسطی تعریف نکرده‌اید. با دکمه زیر اولین قسط خود را اضافه کنید.'
                : 'می‌توانید فیلتر جستجو را تغییر دهید یا قسط جدیدی تعریف کنید.'}
            </p>
          </div>

          {activeDebts.length === 0 && (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن اولین قسط</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
