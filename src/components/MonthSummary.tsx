import React from 'react';
import { MonthRecord, Debt } from '../types';
import { formatToman, toPersianDigits } from '../utils/persian';
import { CheckCircle2, Clock, AlertTriangle, ArrowDownRight, Layers } from 'lucide-react';

interface MonthSummaryProps {
  activeMonth: MonthRecord;
  activeDebts: Debt[];
  paidDebtIds: Set<string>;
  overdueDebts: { debt: Debt; prevMonthLabel: string }[];
  onFilterOverdue?: () => void;
}

export const MonthSummary: React.FC<MonthSummaryProps> = ({
  activeMonth,
  activeDebts,
  paidDebtIds,
  overdueDebts,
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

  return (
    <div className="space-y-4">
      {/* Overdue Warning Alert Box if any past month debts are unpaid */}
      {overdueDebts.length > 0 && (
        <div
          onClick={onFilterOverdue}
          className="cursor-pointer bg-gradient-to-r from-rose-900/90 via-rose-800 to-amber-900/90 text-rose-100 p-4 rounded-2xl border border-rose-600/60 shadow-lg shadow-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:border-rose-400 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-300 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  هشدار اقساط معوقه از ماه قبل
                </span>
                <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {toPersianDigits(overdueDebts.length)} قسط
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-0.5">
                قسط‌های زیر در ماه قبل ({overdueDebts[0]?.prevMonthLabel}) پرداخت نشده‌اند. اولویت پرداخت با این اقساط است.
              </p>
            </div>
          </div>
          <button className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1 shadow-sm">
            <span>مشاهده معوقات</span>
            <ArrowDownRight className="w-4 h-4" />
          </button>
        </div>
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
