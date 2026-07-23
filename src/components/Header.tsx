import React from 'react';
import { MonthRecord } from '../types';
import { ChevronRight, ChevronLeft, CalendarPlus, Plus, Archive, Download, Wallet, Sparkles } from 'lucide-react';
import { toPersianDigits } from '../utils/persian';
import { CURRENT_VERSION } from '../data/changelog';

interface HeaderProps {
  activeMonth: MonthRecord;
  allMonths: MonthRecord[];
  archivedCount: number;
  hasUnseenVersion?: boolean;
  onSelectMonth: (monthId: string) => void;
  onStartNextMonth: () => void;
  onOpenAddDebtModal: () => void;
  onOpenArchiveModal: () => void;
  onOpenExportModal: () => void;
  onOpenChangelogModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMonth,
  allMonths,
  archivedCount,
  hasUnseenVersion = false,
  onSelectMonth,
  onStartNextMonth,
  onOpenAddDebtModal,
  onOpenArchiveModal,
  onOpenExportModal,
  onOpenChangelogModal,
}) => {
  // Find current index in months list
  const sortedMonths = [...allMonths].sort((a, b) => a.id.localeCompare(b.id));
  const currentIndex = sortedMonths.findIndex((m) => m.id === activeMonth.id);

  const hasPrevMonth = currentIndex > 0;
  const hasNextMonth = currentIndex < sortedMonths.length - 1;

  const handlePrevMonth = () => {
    if (hasPrevMonth) {
      onSelectMonth(sortedMonths[currentIndex - 1].id);
    }
  };

  const handleNextMonth = () => {
    if (hasNextMonth) {
      onSelectMonth(sortedMonths[currentIndex + 1].id);
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md text-slate-800 border-b border-slate-200/80 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Right side (RTL): Brand Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="hidden min-[420px]:block">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  مدیریت اقساط
                </h1>
                {/* Version Badge Button */}
                <button
                  onClick={onOpenChangelogModal}
                  className="relative group flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer"
                  title="مشاهده تغییرات و نسخه جدید"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600 group-hover:rotate-12 transition-transform" />
                  <span>v{CURRENT_VERSION}</span>
                  {hasUnseenVersion && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  )}
                  {hasUnseenVersion && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                سامانه هوشمند و منظم پرداخت
              </p>
            </div>
          </div>

          {/* Center: Month Navigation */}
          <div className="flex items-center bg-slate-100/90 border border-slate-200/90 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              disabled={!hasPrevMonth}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="relative px-2 sm:px-3 py-0.5">
              <select
                value={activeMonth.id}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="bg-transparent text-slate-800 font-bold text-xs sm:text-sm cursor-pointer focus:outline-none appearance-none pl-5 pr-1"
              >
                {sortedMonths.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white text-slate-800">
                    {m.label}
                  </option>
                ))}
              </select>
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              disabled={!hasNextMonth}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Left side (RTL): Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Start New Month Button */}
            <button
              onClick={onStartNextMonth}
              className="px-2.5 sm:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              title="شروع دوره و ماه جدید"
            >
              <CalendarPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="hidden sm:inline">شروع ماه جدید</span>
            </button>

            {/* Add Debt Button */}
            <button
              onClick={onOpenAddDebtModal}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">قسط جدید</span>
            </button>

            {/* Archive Modal Trigger */}
            <button
              onClick={onOpenArchiveModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 rounded-xl transition-all relative flex items-center gap-1 text-xs font-medium"
              title="اقساط تمام شده"
            >
              <Archive className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">تمام شده‌ها</span>
              {archivedCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                  {toPersianDigits(archivedCount)}
                </span>
              )}
            </button>

            {/* Export Modal Trigger */}
            <button
              onClick={onOpenExportModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 rounded-xl transition-all flex items-center gap-1 text-xs font-medium"
              title="پشتیبان و اکسل"
            >
              <Download className="w-4 h-4 text-sky-600" />
              <span className="hidden lg:inline">پشتیبان</span>
            </button>

            {/* Changelog Modal Trigger */}
            <button
              onClick={onOpenChangelogModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/70 rounded-xl transition-all relative flex items-center gap-1 text-xs font-medium"
              title="تغییرات و نسخه جدید"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="hidden xl:inline">چه خبر؟</span>
              {hasUnseenVersion && (
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

