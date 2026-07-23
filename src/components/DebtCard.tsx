import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Debt, UnpaidMonthInfo } from '../types';
import {
  formatToman,
  formatCardNumber,
  formatIBAN,
  copyToClipboard,
  toPersianDigits,
  toEnglishDigits,
} from '../utils/persian';
import {
  Copy,
  Check,
  ExternalLink,
  CreditCard,
  FileText,
  AlertTriangle,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  Building2,
  CheckCircle,
  AlertCircle,
  Flame,
  Clock,
  CalendarX,
  CalendarCheck,
  ChevronDown,
  MessageSquare,
  Pencil,
  PlusCircle,
  Save,
} from 'lucide-react';

interface DebtCardProps {
  debt: Debt;
  isPaid: boolean;
  isPendingTransition?: boolean;
  overdueInfo?: { isOverdue: boolean; prevMonthLabel?: string };
  unpaidMonths?: UnpaidMonthInfo[];
  monthNote?: string;
  onTogglePaid: (debtId: string) => void;
  onPayAllUnpaid?: (debtId: string) => void;
  onSaveMonthNote?: (debtId: string, note: string) => void;
  onEdit: (debt: Debt) => void;
  onArchive: (debtId: string) => void;
  onDelete: (debtId: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  rankIndex?: number;
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  isPaid,
  isPendingTransition = false,
  overdueInfo,
  unpaidMonths = [],
  monthNote = '',
  onTogglePaid,
  onPayAllUnpaid,
  onSaveMonthNote,
  onEdit,
  onArchive,
  onDelete,
  onShowToast,
  rankIndex,
}) => {
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedIBAN, setCopiedIBAN] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showUnpaidTooltip, setShowUnpaidTooltip] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState(monthNote);

  React.useEffect(() => {
    setNoteInput(monthNote);
  }, [monthNote]);

  const unpaidCount = unpaidMonths.length;

  const handleCopyCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!debt.cardNumber) return;
    const success = await copyToClipboard(debt.cardNumber);
    if (success) {
      setCopiedCard(true);
      onShowToast(`شماره کارت (${debt.title}) کپی شد`, 'success');
      setTimeout(() => setCopiedCard(false), 2000);
    } else {
      onShowToast('خطا در کپی شماره کارت', 'error');
    }
  };

  const handleCopyIBAN = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!debt.iban) return;
    const success = await copyToClipboard(debt.iban);
    if (success) {
      setCopiedIBAN(true);
      onShowToast(`شماره شبا (${debt.title}) کپی شد`, 'success');
      setTimeout(() => setCopiedIBAN(false), 2000);
    } else {
      onShowToast('خطا در کپی شماره شبا', 'error');
    }
  };

  return (
    <div
      className={`relative bg-white rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden ${
        isPendingTransition
          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
          : isPaid
          ? 'border-emerald-200 bg-emerald-50/20'
          : overdueInfo?.isOverdue
          ? 'border-2 border-rose-500 bg-gradient-to-b from-rose-50/80 via-white to-white ring-4 ring-rose-500/20 shadow-lg shadow-rose-500/15'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Pending Transition Feedback Banner */}
      {isPendingTransition && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-90"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-200 animate-bounce shrink-0" />
            <span className="font-extrabold text-xs sm:text-sm">
              پرداخت با موفقیت ثبت شد! (انتقال به لیست پرداخت‌شده‌ها...)
            </span>
          </div>
          <span className="bg-black/25 backdrop-blur-sm text-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 border border-emerald-300/30">
            در حال انتقال
          </span>
        </div>
      )}

      {/* Overdue High-Attention Warning Banner */}
      {overdueInfo?.isOverdue && !isPaid && !isPendingTransition && (
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-90"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
            </span>
            <AlertTriangle className="w-4 h-4 text-yellow-300 animate-bounce shrink-0" />
            <span className="font-extrabold text-xs sm:text-sm">
              هشدار مهم: این قسط معوقه است (پرداخت‌نشده از {overdueInfo.prevMonthLabel})
            </span>
          </div>
          <span className="bg-black/25 backdrop-blur-sm text-yellow-200 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 border border-yellow-300/30 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>اولویت فوری</span>
          </span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {/* Rank badge (Highest to lowest amount indicator) */}
            {typeof rankIndex === 'number' && (
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                  overdueInfo?.isOverdue && !isPaid
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {toPersianDigits(rankIndex + 1)}
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-bold text-base sm:text-lg tracking-tight ${
                    isPaid
                      ? 'text-slate-600 line-through decoration-emerald-500'
                      : overdueInfo?.isOverdue
                      ? 'text-rose-950 font-extrabold'
                      : 'text-slate-900'
                  }`}
                >
                  {toPersianDigits(debt.title)}
                </h3>

                {/* Overdue Badge next to Title */}
                {overdueInfo?.isOverdue && !isPaid && (
                  <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-sm shadow-rose-600/30 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-300" />
                    <span>معوقه</span>
                  </span>
                )}
              </div>
              {debt.notes && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[280px] sm:max-w-md">{toPersianDigits(debt.notes)}</span>
                </div>
              )}

              {/* Month Specific Note Editor / View */}
              <div className="mt-2">
                {isEditingNote ? (
                  <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-2.5 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>یادداشت این ماه برای این قسط:</span>
                      </span>
                    </div>
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(toPersianDigits(e.target.value))}
                      placeholder="مثال: «این ماه به دلیل خرید ماشین، این قسط معوق شد»..."
                      rows={2}
                      className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingNote(false);
                          setNoteInput(monthNote);
                        }}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 rounded-lg font-medium"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSaveMonthNote) {
                            onSaveMonthNote(debt.id, noteInput);
                          }
                          setIsEditingNote(false);
                        }}
                        className="px-3 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>ذخیره یادداشت</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {monthNote ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-semibold text-[11px] sm:text-xs">
                          یادداشت این ماه: <span className="font-normal text-amber-950">«{toPersianDigits(monthNote)}»</span>
                        </span>
                        {onSaveMonthNote && (
                          <button
                            type="button"
                            onClick={() => setIsEditingNote(true)}
                            className="mr-1 text-amber-700 hover:text-amber-950 p-0.5 rounded-md hover:bg-amber-200/50 transition-colors"
                            title="ویرایش یادداشت این ماه"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      onSaveMonthNote && (
                        <button
                          type="button"
                          onClick={() => setIsEditingNote(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-0.5 rounded-lg transition-colors border border-dashed border-slate-200 hover:border-indigo-300"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                          <span>+ یادداشت این ماه (مثلاً دلیل معوق شدن)</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Unpaid Months Concise Summary & Interactive Hover Tooltip */}
              <div className="mt-2 flex items-center">
                <div
                  className="relative inline-block"
                  onMouseEnter={() => setShowUnpaidTooltip(true)}
                  onMouseLeave={() => setShowUnpaidTooltip(false)}
                >
                  <button
                    type="button"
                    onClick={() => setShowUnpaidTooltip(!showUnpaidTooltip)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer select-none ${
                      unpaidCount > 0
                        ? unpaidCount > 1
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {unpaidCount > 0 ? (
                      <CalendarX
                        className={`w-3.5 h-3.5 shrink-0 ${
                          unpaidCount > 1 ? 'text-rose-600 animate-pulse' : 'text-amber-600'
                        }`}
                      />
                    ) : (
                      <CalendarCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    )}

                    <span>
                      {unpaidCount > 0
                        ? `پرداخت‌نشده در ${toPersianDigits(unpaidCount)} ماه`
                        : 'پرداخت کامل تمام ماه‌ها'}
                    </span>

                    <ChevronDown
                      className={`w-3 h-3 opacity-60 transition-transform ${
                        showUnpaidTooltip ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Floating Tooltip / Popover List */}
                  {showUnpaidTooltip && (
                    <div className="absolute right-0 top-full mt-1.5 z-30 w-72 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-1 duration-200 text-xs font-sans">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2 font-extrabold text-slate-100">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>وضعیت پرداخت ماه‌ها</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            unpaidCount > 0
                              ? 'bg-rose-950 text-rose-200 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-200 border border-emerald-800'
                          }`}
                        >
                          {unpaidCount > 0
                            ? `${toPersianDigits(unpaidCount)} ماه معوق`
                            : 'تسویه کامل'}
                        </span>
                      </div>

                      {unpaidCount > 0 ? (
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                          <p className="text-[11px] text-slate-400 font-medium mb-1.5">
                            این قسط در ماه‌های زیر هنوز پرداخت نشده است:
                          </p>
                          {unpaidMonths.map((m) => (
                            <div
                              key={m.monthId}
                              className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/80 hover:bg-slate-800 transition-colors space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-bold text-slate-100">
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
                                  <span>{m.label}</span>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold shrink-0 ${
                                    m.isCurrentMonth
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  {m.isCurrentMonth ? 'ماه جاری' : 'معوقه'}
                                </span>
                              </div>
                              {m.note && (
                                <div className="text-[11px] text-amber-200/90 bg-amber-950/60 p-1.5 rounded-lg border border-amber-800/40 font-medium flex items-start gap-1">
                                  <MessageSquare className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                  <span className="break-words">«{toPersianDigits(m.note)}»</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-emerald-300 font-bold p-2.5 text-center bg-emerald-950/50 rounded-xl border border-emerald-800/50 flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>این قسط در تمامی ماه‌ها به طور کامل پرداخت شده است.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amount Badge & Action Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-left">
              <div className="flex items-center gap-1.5 justify-end flex-wrap">
                <div
                  className={`text-base sm:text-lg font-extrabold ${
                    overdueInfo?.isOverdue && !isPaid ? 'text-rose-700' : 'text-indigo-950'
                  }`}
                >
                  {formatToman(debt.amount)}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-medium text-left">
                مبلغ قسط ماهانه
                {unpaidCount > 1 && (
                  <span className="text-rose-600 font-bold mr-1">
                    ({toPersianDigits(unpaidCount)} ماه پرداخت‌نشده)
                  </span>
                )}
              </div>
            </div>

            {/* Context Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="عملیات"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-20 text-xs font-medium text-slate-700">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(debt);
                      }}
                      className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ویرایش اطلاعات</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onArchive(debt.id);
                      }}
                      className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-emerald-700"
                    >
                      <Archive className="w-3.5 h-3.5 text-emerald-600" />
                      <span>انتقال به تمام شده‌ها</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(debt.id);
                      }}
                      className="w-full text-right px-3 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف قسط</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Middle Row: Large Copy Buttons (Card & IBAN) */}
        <div className="my-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Large Card Number Copy Button */}
          {debt.cardNumber ? (
            <button
              onClick={handleCopyCard}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-right active:scale-[0.98] ${
                copiedCard
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/20'
                  : overdueInfo?.isOverdue && !isPaid
                  ? 'bg-rose-50/50 hover:bg-rose-100/70 border-rose-200 text-slate-800'
                  : 'bg-slate-50 hover:bg-indigo-50/60 border-slate-200 hover:border-indigo-300 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    copiedCard
                      ? 'bg-emerald-700 text-white'
                      : overdueInfo?.isOverdue && !isPaid
                      ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white'
                      : 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'
                  }`}
                >
                  {copiedCard ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-semibold opacity-75">
                    {copiedCard ? 'کپی شد!' : 'شماره کارت (کلیک جهت کپی)'}
                  </div>
                  <div dir="ltr" className="font-bold text-xs sm:text-sm tracking-wider text-right">
                    {formatCardNumber(debt.cardNumber)}
                  </div>
                </div>
              </div>

              <div
                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                  copiedCard
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-slate-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600'
                }`}
              >
                {copiedCard ? 'کپی شد' : 'کپی'}
              </div>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-400 text-xs flex items-center gap-2">
              <CreditCard className="w-4 h-4 opacity-50" />
              <span>شماره کارت ثبت نشده</span>
            </div>
          )}

          {/* Large IBAN Copy Button */}
          {debt.iban ? (
            <button
              onClick={handleCopyIBAN}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-right active:scale-[0.98] ${
                copiedIBAN
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/20'
                  : overdueInfo?.isOverdue && !isPaid
                  ? 'bg-rose-50/50 hover:bg-rose-100/70 border-rose-200 text-slate-800'
                  : 'bg-slate-50 hover:bg-sky-50/60 border-slate-200 hover:border-sky-300 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    copiedIBAN
                      ? 'bg-emerald-700 text-white'
                      : overdueInfo?.isOverdue && !isPaid
                      ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white'
                      : 'bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white'
                  }`}
                >
                  {copiedIBAN ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Building2 className="w-5 h-5" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-semibold opacity-75">
                    {copiedIBAN ? 'کپی شد!' : 'شماره شبا (کلیک جهت کپی)'}
                  </div>
                  <div dir="ltr" className="font-bold text-xs tracking-wider text-right truncate max-w-[160px] sm:max-w-[180px]">
                    {formatIBAN(debt.iban)}
                  </div>
                </div>
              </div>

              <div
                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                  copiedIBAN
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-slate-200 text-sky-600 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600'
                }`}
              >
                {copiedIBAN ? 'کپی شد' : 'کپی'}
              </div>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-400 text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 opacity-50" />
              <span>شماره شبا ثبت نشده</span>
            </div>
          )}
        </div>

        {/* Bottom Row: Direct Gateway Link & Big Payment Status Toggle Button */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Payment Portal Link if available */}
          {debt.paymentUrl ? (
            <a
              href={
                toEnglishDigits(debt.paymentUrl).startsWith('http')
                  ? toEnglishDigits(debt.paymentUrl)
                  : `https://${toEnglishDigits(debt.paymentUrl)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors border border-indigo-100"
            >
              <span>ورود به درگاه / لینک پرداخت</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-xs text-slate-400 hidden sm:inline">
              لینک آنلاین تعریف نشده
            </span>
          )}

          {/* Dynamic Payment Action Buttons */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {unpaidCount > 1 || (overdueInfo?.isOverdue && !isPaid) ? (
              <>
                {/* Button 1: Pay Current Month Only */}
                <button
                  type="button"
                  onClick={() => onTogglePaid(debt.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 ${
                    isPaid
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                      : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700'
                  }`}
                  title="پرداخت یا تغییر وضعیت فقط برای قسط ماه جاری"
                >
                  {isPaid ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-200" />
                      <span>پرداخت‌شده این ماه</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-300" />
                      <span>پرداخت فقط این ماه</span>
                    </>
                  )}
                </button>

                {/* Button 2: Pay All including Overdue Arrears */}
                {onPayAllUnpaid && (
                  <button
                    type="button"
                    onClick={() => onPayAllUnpaid(debt.id)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50"
                    title={`تسویه کامل کل اقساط معوقه و جاری (${toPersianDigits(unpaidCount)} ماه)`}
                  >
                    <Flame className="w-4 h-4 text-yellow-300 shrink-0" />
                    <span>
                      پرداخت با معوقات ({formatToman(debt.amount * unpaidCount)})
                    </span>
                  </button>
                )}
              </>
            ) : (
              /* Standard Single Payment Button */
              <button
                type="button"
                onClick={() => onTogglePaid(debt.id)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-95 ${
                  isPaid
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20 ring-2 ring-emerald-400/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 group'
                }`}
              >
                {isPaid ? (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      className="w-5 h-5 bg-emerald-500 text-white rounded-md flex items-center justify-center shrink-0 border border-emerald-300/40"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.div>
                    <span>پرداخت شد</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 border-2 border-white/70 rounded-md flex items-center justify-center shrink-0 group-hover:border-white transition-colors" />
                    <span>علامت زدن به عنوان پرداخت شده</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

