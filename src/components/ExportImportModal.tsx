import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import { X, Download, Upload, FileSpreadsheet, RotateCcw, ShieldCheck, FileCheck, Loader2, Sparkles } from 'lucide-react';
import { getJalaliBackupFileName } from '../utils/persian';
import { CURRENT_VERSION } from '../data/changelog';
import {
  exportFullStateToExcel,
  exportActiveMonthToExcel,
  restoreDataFromFile,
} from '../utils/excelUtils';

interface ExportImportModalProps {
  isOpen: boolean;
  appState: AppState;
  onClose: () => void;
  onImportState: (newState: AppState) => void;
  onResetData: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenChangelogModal?: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  appState,
  onClose,
  onImportState,
  onResetData,
  onShowToast,
  onOpenChangelogModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Export to JSON Backup File
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getJalaliBackupFileName('MyGhesd_Backup', 'json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('فایل پشتیبان JSON با موفقیت دانلود شد', 'success');
  };

  // Export Full Excel Workbook
  const handleExportExcelFull = () => {
    try {
      exportFullStateToExcel(appState);
      onShowToast('پشتیبان کامل اکسل (XLSX) با موفقیت دانلود شد', 'success');
    } catch (err) {
      onShowToast('خطا در دانلود فایل اکسل', 'error');
    }
  };

  // Export Month Excel Report
  const handleExportExcelMonth = () => {
    try {
      exportActiveMonthToExcel(appState);
      onShowToast('گزارش اکسل ماه جاری با موفقیت دانلود شد', 'success');
    } catch (err) {
      onShowToast('خطا در ایجاد گزارش اکسل', 'error');
    }
  };

  // Import Backup File (JSON, Excel .xlsx / .xls, or CSV)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await restoreDataFromFile(file, appState, importMode);
      if (result.success && result.newState) {
        onImportState(result.newState);
        onShowToast(result.message, 'success');
        onClose();
      } else {
        onShowToast(result.message || 'خطا در بازگردانی اطلاعات', 'error');
      }
    } catch (err) {
      onShowToast('خطای غیرمنتظره در پردازش فایل پشتیبان', 'error');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base text-slate-100">
              پشتیبان‌گیری و بازیابی داده‌ها
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            امکان دانلود فایل پشتیبان و همچنین بازیابی اطلاعات از روی فایل‌های <strong className="text-emerald-700">اکسل (xlsx, xls, csv)</strong> و <strong className="text-indigo-700">JSON</strong> فراهم است.
          </p>

          {/* Export Options */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">دریافت خروجی و پشتیبان:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Export Excel Full */}
              <button
                onClick={handleExportExcelFull}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl text-emerald-900 text-right space-y-1.5 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-xs">پشتیبان اکسل (XLSX)</div>
                <div className="text-[10px] text-emerald-700/80 leading-tight">
                  تمام اطلاعات و ماه‌ها در فایل اکسل
                </div>
              </button>

              {/* Export Excel Month Report */}
              <button
                onClick={handleExportExcelMonth}
                className="p-3 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl text-teal-900 text-right space-y-1.5 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-xs">گزارش این ماه</div>
                <div className="text-[10px] text-teal-700/80 leading-tight">
                  خروجی اکسل اقساط ماه فعال
                </div>
              </button>

              {/* Export JSON */}
              <button
                onClick={handleExportJSON}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl text-indigo-900 text-right space-y-1.5 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-xs">پشتیبان (JSON)</div>
                <div className="text-[10px] text-indigo-700/80 leading-tight">
                  ذخیره کامل برنامه به صورت ساختاریافته
                </div>
              </button>
            </div>
          </div>

          {/* Import / Restore Section */}
          <div className="border-t border-slate-100 pt-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">بازیابی اطلاعات از فایل پشتیبان:</span>
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    importMode === 'merge'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="اقساط فایل به اقساط فعلی شما اضافه و ادغام می‌شوند"
                >
                  ترکیب با داده‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    importMode === 'replace'
                      ? 'bg-white text-amber-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="اطلاعات قبلی پاک شده و فقط اطلاعات فایل جایگزین می‌شود"
                >
                  جایگزینی کامل
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
            />

            <button
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>در حال خواندن و بازگردانی اطلاعات...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-white" />
                  <span>بارگذاری فایل پشتیبان (Excel / CSV / JSON)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              پشتیبانی از فرمت‌های <span className="font-mono text-emerald-700">.xlsx</span>, <span className="font-mono text-emerald-700">.xls</span>, <span className="font-mono text-emerald-700">.csv</span> و <span className="font-mono text-indigo-700">.json</span>
            </p>
          </div>

          {/* Reset Demo Data */}
          <div className="border-t border-slate-100 pt-3">
            <button
              onClick={() => {
                if (confirm('آیا از بازنشانی داده‌ها به نمونه اولیه مطمئن هستید؟')) {
                  onResetData();
                  onClose();
                }
              }}
              className="w-full py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی به نمونه اطلاعات اولیه</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {onOpenChangelogModal ? (
            <button
              onClick={() => {
                onClose();
                onOpenChangelogModal();
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>نسخه {CURRENT_VERSION} (مشاهده تغییرات)</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-mono">
              نسخه {CURRENT_VERSION}
            </span>
          )}

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
