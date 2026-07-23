import React from 'react';
import { Debt } from '../types';
import { formatToman, toPersianDigits, formatCardNumber } from '../utils/persian';
import { X, Archive, RefreshCw, Trash2, CheckCircle2, Sparkles } from 'lucide-react';

interface ArchivedDebtsModalProps {
  isOpen: boolean;
  archivedDebts: Debt[];
  onClose: () => void;
  onRestore: (debtId: string) => void;
  onDeletePermanently: (debtId: string) => void;
}

export const ArchivedDebtsModal: React.FC<ArchivedDebtsModalProps> = ({
  isOpen,
  archivedDebts,
  onClose,
  onRestore,
  onDeletePermanently,
}) => {
  if (!isOpen) return null;

  const totalFreedAmount = archivedDebts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                اقساط تمام شده (بایگانی)
              </h3>
              <p className="text-xs text-slate-400">
                وام‌ها و اقساطی که تسویه شده و از لیست جاری خارج شده‌اند
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Freed Amount Banner */}
        {archivedDebts.length > 0 && (
          <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center justify-between gap-3 text-emerald-900">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-medium text-emerald-800 block">
                  مجموع بار مالی ماهانه تسویه شده:
                </span>
                <span className="font-extrabold text-base text-emerald-950">
                  {formatToman(totalFreedAmount)}
                </span>
              </div>
            </div>
            <span className="text-xs bg-emerald-200/80 text-emerald-900 font-bold px-2.5 py-1 rounded-full">
              {toPersianDigits(archivedDebts.length)} وام تمام شده
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-3">
          {archivedDebts.length > 0 ? (
            archivedDebts.map((debt) => (
              <div
                key={debt.id}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {toPersianDigits(debt.title)}
                    </h4>
                  </div>
                  {debt.cardNumber && (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <span>کارت:</span>
                      <span dir="ltr">{formatCardNumber(debt.cardNumber)}</span>
                    </div>
                  )}
                  {debt.notes && (
                    <div className="text-xs text-slate-500 line-clamp-1">
                      {toPersianDigits(debt.notes)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">مبلغ قسط</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatToman(debt.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onRestore(debt.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-200/60"
                      title="بازگرداندن به لیست فعال"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>بازگردانی</span>
                    </button>

                    <button
                      onClick={() => onDeletePermanently(debt.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف کامل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Archive className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">
                هیچ وام یا قسط بایگانی‌شده‌ای وجود ندارد
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                وقتی سری اقساط یک وام تمام شد، از منوی سه نقطه روی کارت قسط گزینه "انتقال به تمام شده‌ها" را انتخاب کنید تا به این بخش منتقل شود.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-left">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
