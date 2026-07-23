import React, { useState } from 'react';
import {
  X,
  Sparkles,
  History,
  Check,
  Tag,
  Rocket,
  Info,
  ChevronDown,
  ChevronUp,
  GitCommit
} from 'lucide-react';
import {
  CURRENT_VERSION,
  CHANGELOG_RELEASES,
  getLatestRelease,
  markVersionAsSeen,
  ChangeCategory,
} from '../data/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'whats-new' | 'history';
  onAcknowledge?: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'whats-new',
  onAcknowledge,
}) => {
  const [activeTab, setActiveTab] = useState<'whats-new' | 'history'>(initialTab);
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    [CURRENT_VERSION]: true,
  });

  if (!isOpen) return null;

  const latestRelease = getLatestRelease();

  const handleAcknowledge = () => {
    markVersionAsSeen(CURRENT_VERSION);
    if (onAcknowledge) onAcknowledge();
    onClose();
  };

  const toggleVersionExpand = (version: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [version]: !prev[version],
    }));
  };

  const getBadgeStyle = (type: ChangeCategory) => {
    switch (type) {
      case 'feat':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'improvement':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'ui':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'fix':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getBadgeLabel = (type: ChangeCategory) => {
    switch (type) {
      case 'feat':
        return 'امکان جدید';
      case 'improvement':
        return 'بهبود کارایی';
      case 'ui':
        return 'رابط کاربری';
      case 'fix':
        return 'رفع باگ';
      default:
        return 'تغییرات';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/90 flex items-center justify-center text-indigo-100 ring-2 ring-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">
                  تغییرات و نسخه‌های برنامه
                </h3>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                  v{CURRENT_VERSION}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                سیستم نسخه‌بندی معنایی (Semantic Versioning)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('whats-new')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'whats-new'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Rocket className="w-4 h-4 text-indigo-600" />
            <span>چه خبر در این نسخه؟ (v{latestRelease.version})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>تاریخچه کامل بروزرسانی‌ها</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'whats-new' ? (
            /* What's New Tab */
            <div className="space-y-5">
              {/* Feature Hero Card */}
              <div className="p-4 bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50/40 border border-indigo-100 rounded-2xl relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 shadow-xs">
                      <Sparkles className="w-3 h-3" />
                      نسخه جدید {latestRelease.version}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                      {latestRelease.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {latestRelease.summary}
                    </p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-xl text-center shrink-0 shadow-xs">
                    <span className="text-[10px] text-slate-400 block font-medium">تاریخ انتشار</span>
                    <span className="text-xs font-bold text-slate-700 font-mono">{latestRelease.date}</span>
                  </div>
                </div>
              </div>

              {/* Highlights List */}
              <div className="space-y-2">
                <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>مهم‌ترین قابلیت‌ها و برچسب‌های این نسخه:</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {latestRelease.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium leading-tight">
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Changes Breakdown for current version */}
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <h5 className="text-xs font-bold text-slate-700">فهرست ریز تغییرات اعمال شده:</h5>
                <ul className="space-y-2">
                  {latestRelease.changes.map((change, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 border border-slate-200/70 rounded-xl"
                    >
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getBadgeStyle(
                          change.type
                        )}`}
                      >
                        {getBadgeLabel(change.type)}
                      </span>
                      <span className="leading-normal">{change.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            /* Full Release History Tab */
            <div className="space-y-5">
              {/* SemVer Education Info Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>راهنمای ساختار نسخه‌بندی معنایی (Semantic Versioning):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  فرمت نسخه‌ها به صورت <strong className="font-mono text-slate-700">MAJOR.MINOR.PATCH</strong> (مثلا <span className="font-mono">1.2.0</span>) است:
                </p>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="bg-white p-2 border border-slate-200 rounded-lg text-center">
                    <span className="font-bold text-indigo-700 font-mono block">MAJOR (۱)</span>
                    <span className="text-[10px] text-slate-500">تغییرات اصلی یا ساختاری</span>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded-lg text-center">
                    <span className="font-bold text-emerald-700 font-mono block">MINOR (۲)</span>
                    <span className="text-[10px] text-slate-500">افزودن امکانات جدید</span>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded-lg text-center">
                    <span className="font-bold text-amber-700 font-mono block">PATCH (۰)</span>
                    <span className="text-[10px] text-slate-500">رفع باگ و بهبودهای جزئی</span>
                  </div>
                </div>
              </div>

              {/* Timeline of all releases */}
              <div className="space-y-3 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {CHANGELOG_RELEASES.map((rel) => {
                  const isExpanded = !!expandedVersions[rel.version];
                  const isCurrent = rel.version === CURRENT_VERSION;

                  return (
                    <div
                      key={rel.version}
                      className={`relative pr-9 transition-all ${
                        isCurrent ? 'opacity-100' : 'opacity-90'
                      }`}
                    >
                      {/* Timeline Dot */}
                      <div
                        className={`absolute right-2 top-3 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isCurrent
                            ? 'bg-indigo-600 border-indigo-200 ring-4 ring-indigo-100 text-white'
                            : 'bg-slate-300 border-white text-slate-600'
                        }`}
                      >
                        <GitCommit className="w-2.5 h-2.5" />
                      </div>

                      {/* Version Card */}
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        {/* Title Bar */}
                        <button
                          onClick={() => toggleVersionExpand(rel.version)}
                          className="w-full p-3.5 flex items-center justify-between text-right hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                              v{rel.version}
                            </span>
                            {isCurrent && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                نسخه کنونی شما
                              </span>
                            )}
                            <h4 className="font-bold text-xs text-slate-800">
                              {rel.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">
                              {rel.date}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Collapsible Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/40">
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {rel.summary}
                            </p>

                            <ul className="space-y-1.5">
                              {rel.changes.map((ch, i) => (
                                <li
                                  key={i}
                                  className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60"
                                >
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getBadgeStyle(
                                      ch.type
                                    )}`}
                                  >
                                    {getBadgeLabel(ch.type)}
                                  </span>
                                  <span>{ch.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            نسخه فعلی: <strong className="font-mono text-slate-800">v{CURRENT_VERSION}</strong>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'whats-new' ? (
              <button
                onClick={handleAcknowledge}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>متوجه شدم (تایید نسخه جدید)</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                بستن
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
