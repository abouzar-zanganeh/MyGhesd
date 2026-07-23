import React from 'react';
import { MonthRecord, Debt, DebtFilter } from '../types';
import { formatToman, toPersianDigits } from '../utils/persian';
import { CheckCircle2, Clock, AlertTriangle, ArrowDownRight, Layers } from 'lucide-react';

interface MonthSummaryProps {
  activeMonth: MonthRecord;
  activeDebts: Debt[];
  paidDebtIds: Set<string>;
  overdueDebts: { debt: Debt; prevMonthLabel: string; unpaidCount?: number; overdueTotal?: number }[];
  activeFilter?: DebtFilter;
  onFilterOverdue?: () => void;
}

export const MonthSummary: React.FC<MonthSummaryProps> = ({
  activeMonth,
  activeDebts,
  paidDebtIds,
  overdueDebts,
  activeFilter,
  onFilterOverdue,
}) => {
  const totalAmount = activeDebts.reduce((sum, debt) => sum + debt.amount, 0);

  const paidDebts = activeDebts.filter((debt) => paidDebtIds.has(debt.id));
  const paidAmount = paidDebts.reduce((sum, debt) => sum + debt.amount, 0);

  const remainingAmount = totalAmount - paidAmount;
  const totalCount = activeDebts.length;
  const paidCount = paidDebts.length;
  const remainingCount = totalCount - paidCount;

  const progressPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // Calculate total overdue amount across all delayed debts
  const totalOverdueAmount = overdueDebts.reduce(
    (sum, item) => sum + (item.overdueTotal ?? item.debt.amount),
    0
  );

  const isOverdueTabActive = activeFilter === 'overdue';

  return (
    <div className="space-y-4">
      {/* Overdue Alert Section */}
      {overdueDebts.length > 0 && (
        <>
          {isOverdueTabActive ? (
            /* FULL DETAILED WARNING CARD (Visible when user is in 'معوقات' view) */
            <div
              className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-rose-100 p-4 sm:p-5 rounded-2xl border border-rose-700/60 shadow-xl shadow-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-3.5 z-10">
                <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-300 mt-0.5">
                  <AlertTriangle className="w-6 h-6 animate-pulse text-rose-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-white">
                      هشدار اقساط معوقه از ماه‌های قبل
                    </span>
                    <span className="bg-rose-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      {toPersianDigits(overdueDebts.length)} قسط معوقه
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    مبلغ کل معوقات پرداخت نشده:{' '}
                    <strong className="text-white font-bold">{formatToman(totalOverdueAmount)}</strong>
                  </p>
                  <div className="text-[11px] text-rose-300/80 flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                    <span>
                      اقساط: {overdueDebts.slice(0, 3).map((d) => d.debt.title).join('، ')}
                      {overdueDebts.length > 3 ? ' و موارد دیگر' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* COMPACT ALERT TRIGGER BUTTON (Visible when user is in other views) */
            <div className="bg-gradient-to-r from-rose-950/90 via-rose-900/90 to-amber-950/90 text-rose-100 p-3.5 sm:p-4 rounded-2xl border border-rose-700/50 shadow-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-300">
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white">
                      {toPersianDigits(overdueDebts.length)} قسط معوقه پرداخت‌نشده داری
                    </span>
                    <span className="hidden sm:inline-block bg-rose-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {formatToman(totalOverdueAmount)}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 truncate mt-0.5">
                    برای مشاهده جزئیات و تسویه اقساط معوقه کلیک کنید
                  </p>
                </div>
              </div>

              <button
                onClick={onFilterOverdue}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-rose-950/40 border border-rose-400/30 group hover:scale-[1.02]"
              >
                <span>مشاهده و تسویه معوقات</span>
                <ArrowDownRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Main Metrics Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">
              خلاصه وضعیت {activeMonth.label}
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
            {toPersianDigits(paidCount)} از {toPersianDigits(totalCount)} قسط پرداخت شده
          </span>
        </div>

        {/* 3 Columns Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total Obligation */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>مجموع کل اقساط</span>
              <span className="text-[11px] bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700">
                {toPersianDigits(totalCount)} موارد
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {formatToman(totalAmount)}
            </div>
          </div>

          {/* Paid Amount */}
          <div className="bg-emerald-50/70 rounded-xl p-3.5 border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-medium mb-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>پرداخت شده</span>
              </span>
              <span className="text-[11px] bg-emerald-200/60 px-1.5 py-0.5 rounded text-emerald-800 font-semibold">
                {toPersianDigits(paidCount)} قسط
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-900 tracking-tight">
              {formatToman(paidAmount)}
            </div>
          </div>

          {/* Remaining Amount */}
          <div className="bg-amber-50/70 rounded-xl p-3.5 border border-amber-100">
            <div className="flex items-center justify-between text-amber-700 text-xs font-medium mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>باقی‌مانده</span>
              </span>
              <span className="text-[11px] bg-amber-200/60 px-1.5 py-0.5 rounded text-amber-800 font-semibold">
                {toPersianDigits(remainingCount)} قسط
              </span>
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-900 tracking-tight">
              {formatToman(remainingAmount)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-600">پیشرفت پرداخت‌های این ماه</span>
            <span className="font-bold text-indigo-600">
              {toPersianDigits(progressPercent)}٪
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent === 100
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : progressPercent > 50
                  ? 'bg-indigo-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {progressPercent === 100 && totalCount > 0 && (
            <div className="mt-2 p-2 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تبریک! تمامی اقساط این ماه با موفقیت پرداخت شده‌اند 🎉</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
