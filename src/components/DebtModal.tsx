import React, { useState, useEffect } from 'react';
import { Debt } from '../types';
import { toEnglishDigits, toPersianDigits, formatToman } from '../utils/persian';
import { X, CreditCard, Building2, Link as LinkIcon, FileText, Check, Plus, Edit3 } from 'lucide-react';

interface DebtModalProps {
  isOpen: boolean;
  debtToEdit: Debt | null;
  onClose: () => void;
  onSave: (debtData: Omit<Debt, 'id' | 'createdAt' | 'isArchived'>) => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  debtToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [iban, setIban] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (debtToEdit) {
      setTitle(toPersianDigits(debtToEdit.title));
      setAmountRaw(toPersianDigits(debtToEdit.amount || ''));
      setCardNumber(toPersianDigits(debtToEdit.cardNumber || ''));
      setIban(toPersianDigits(debtToEdit.iban || ''));
      setPaymentUrl(toPersianDigits(debtToEdit.paymentUrl || ''));
      setNotes(toPersianDigits(debtToEdit.notes || ''));
    } else {
      setTitle('');
      setAmountRaw('');
      setCardNumber('');
      setIban('');
      setPaymentUrl('');
      setNotes('');
    }
    setError('');
  }, [debtToEdit, isOpen]);

  if (!isOpen) return null;

  const parsedAmount = parseInt(toEnglishDigits(amountRaw).replace(/\D/g, ''), 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('لطفاً عنوان قسط را وارد کنید.');
      return;
    }
    if (parsedAmount <= 0) {
      setError('لطفاً مبلغ قسط را به صورت معتبر وارد کنید.');
      return;
    }

    // Standardize Card Number (only digits)
    const cleanedCard = toEnglishDigits(cardNumber).replace(/\D/g, '');
    let cleanedIban = toEnglishDigits(iban).trim().toUpperCase();
    if (cleanedIban && !cleanedIban.startsWith('IR')) {
      cleanedIban = 'IR' + cleanedIban.replace(/^IR/i, '');
    }

    onSave({
      title: title.trim(),
      amount: parsedAmount,
      cardNumber: cleanedCard,
      iban: cleanedIban,
      paymentUrl: paymentUrl.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            {debtToEdit ? (
              <Edit3 className="w-5 h-5 text-indigo-400" />
            ) : (
              <Plus className="w-5 h-5 text-indigo-400" />
            )}
            <h3 className="font-bold text-base text-slate-100">
              {debtToEdit ? 'ویرایش اطلاعات قسط' : 'افزودن قسط جدید'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان قسط / بدهی <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(toPersianDigits(e.target.value))}
              placeholder="مثلاً: وام ایران زمین، قسط خودرو، وام مسکن"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
            />
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                مبلغ قسط ماهانه (تومان) <span className="text-rose-500">*</span>
              </label>
              {parsedAmount > 0 && (
                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {formatToman(parsedAmount)}
                </span>
              )}
            </div>
            <input
              type="text"
              dir="ltr"
              required
              value={amountRaw}
              onChange={(e) => setAmountRaw(toPersianDigits(e.target.value))}
              placeholder="مثلاً: ۳,۵۰۰,۰۰۰"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 text-left"
            />
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              <span>شماره کارت ۱۶ رقمی مقصد</span>
            </label>
            <input
              type="text"
              dir="ltr"
              maxLength={19}
              value={cardNumber}
              onChange={(e) => setCardNumber(toPersianDigits(e.target.value))}
              placeholder="۶۰۳۷۹۹۷۱۲۳۴۵۶۷۸۹"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 text-left tracking-wider"
            />
          </div>

          {/* IBAN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>شماره شبا (با IR)</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={iban}
              onChange={(e) => setIban(toPersianDigits(e.target.value))}
              placeholder="IR۱۲۰۱۷۰۰۰۰۰۰۰۰۱۲۳۴۵۶۷۸۹۰۱"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 text-left tracking-wider uppercase"
            />
          </div>

          {/* Payment Link / Portal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>درگاه یا لینک آنلاین پرداخت (اختیاری)</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={paymentUrl}
              onChange={(e) => setPaymentUrl(toPersianDigits(e.target.value))}
              placeholder="https://epayment.example.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 text-left"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>یادداشت / شماره قرارداد / یادآوری</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(toPersianDigits(e.target.value))}
              placeholder="مثلاً: شماره قرارداد ۱۲۳۴۵ - سررسید ۵ هر ماه"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-900/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{debtToEdit ? 'ذخیره تغییرات' : 'افزودن قسط'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
