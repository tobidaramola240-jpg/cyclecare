import React, { useState } from 'react';
import { UserProfile, CycleStatus, DailyLog, PageId, CycleValidationResult } from '../types';
import { validateCycleParameters } from '../utils/cycleCalculations';

interface HomeDashboardProps {
  profile: UserProfile;
  cycleStatus: CycleStatus;
  todayLog: DailyLog;
  onUpdateTodayLog: (updated: Partial<DailyLog>) => void;
  onDeleteLogForDate: (dateStr: string) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenQuickLog: () => void;
  onNavigate: (page: PageId) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  profile,
  cycleStatus,
  todayLog,
  onUpdateTodayLog,
  onDeleteLogForDate,
  onUpdateProfile,
  onOpenQuickLog,
  onNavigate,
}) => {
  // Modal / Drawer state for in-place Cycle Calibration
  const [isEditingCycle, setIsEditingCycle] = useState<boolean>(false);
  const [calibLastPeriod, setCalibLastPeriod] = useState<string>(profile.lastPeriodStartDate || '2026-10-15');
  const [calibCycleLength, setCalibCycleLength] = useState<number>(profile.averageCycleLength || 28);
  const [calibPeriodLength, setCalibPeriodLength] = useState<number>(profile.averagePeriodLength || 5);
  const [calibIsIrregular, setCalibIsIrregular] = useState<boolean>(Boolean(profile.isIrregularCycle));
  const [validationResult, setValidationResult] = useState<CycleValidationResult>({
    isValid: true,
    errors: {},
    warnings: {},
  });

  // Quick Water Tracker handlers
  const currentGlasses = todayLog.waterGlasses || 0;
  const setWater = (count: number) => {
    onUpdateTodayLog({ waterGlasses: Math.max(0, Math.min(12, count)) });
  };

  // Quick Mood toggle
  const handleMoodSelect = (mood: any) => {
    const existing = todayLog.moods || [];
    const updated = existing.includes(mood)
      ? existing.filter(m => m !== mood)
      : [...existing, mood];
    onUpdateTodayLog({ moods: updated });
  };

  // Quick Period Started Toggle
  const togglePeriodToday = () => {
    const isCurrentlyPeriod = Boolean(todayLog.isPeriodDay);
    onUpdateTodayLog({
      isPeriodDay: !isCurrentlyPeriod,
      flow: !isCurrentlyPeriod ? (todayLog.flow && todayLog.flow !== 'none' ? todayLog.flow : 'medium') : 'none',
    });
  };

  // Cycle Calibration Save Handler with Validation
  const handleSaveCycleCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateCycleParameters(calibLastPeriod, calibCycleLength, calibPeriodLength);
    setValidationResult(result);

    if (result.isValid) {
      onUpdateProfile({
        lastPeriodStartDate: calibLastPeriod,
        averageCycleLength: calibCycleLength,
        averagePeriodLength: calibPeriodLength,
        isIrregularCycle: calibIsIrregular,
      });
      setIsEditingCycle(false);
    }
  };

  // Cycle Ring Progress Calculation
  const cycleLength = profile.averageCycleLength || 28;
  const currentDay = cycleStatus.currentCycleDay;
  const cyclePercent = Math.min(100, Math.round((currentDay / cycleLength) * 100));

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cyclePercent / 100) * circumference;

  // 7-day strip calculation (Today - 3 to Today + 3)
  const timelineDays = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const d = new Date(2026, 9, 29);
    d.setDate(d.getDate() + offset);
    const dayNum = currentDay + offset;
    const isToday = offset === 0;
    const isPeriod = dayNum <= (profile.averagePeriodLength || 5);
    const isOvulation = dayNum === (cycleLength - (profile.lutealPhaseLength || 14));
    const isFertile =
      dayNum >= cycleLength - (profile.lutealPhaseLength || 14) - 5 &&
      dayNum <= cycleLength - (profile.lutealPhaseLength || 14) + 1;

    return {
      offset,
      dayNum: Math.max(1, dayNum),
      isToday,
      isPeriod,
      isOvulation,
      isFertile,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
    };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* ================= CRITICAL MEDICAL & PREDICTION DISCLAIMER BANNER ================= */}
      <aside className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/90 shadow-sm flex items-start gap-3.5">
        <span className="text-xl mt-0.5">⚠️</span>
        <div className="flex-1 text-xs text-amber-900 leading-relaxed">
          <span className="font-bold uppercase tracking-wider block mb-0.5">
            Important Prediction Notice & Health Advisory
          </span>
          All upcoming period dates, fertile windows, and ovulation markers are statistical estimates derived from your entered data. They are{' '}
          <strong className="underline">predictions, not medical diagnoses or fertility guarantees</strong>. CycleCare does not provide contraception advice and these estimates must never be relied upon for birth control.
        </div>
      </aside>

      {/* ================= OPTIONAL UPCOMING PERIOD REMINDER CARD ================= */}
      {profile.periodReminderEnabled !== false && cycleStatus.daysUntilNextPeriod <= (profile.periodReminderDaysBefore || 2) && (
        <aside className="p-4 rounded-3xl bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 border border-pink-200 shadow-sm flex items-start gap-3.5 animate-fadeIn">
          <span className="text-xl">🔔</span>
          <div className="flex-1 text-xs text-slate-800 leading-relaxed">
            <div className="flex items-center justify-between">
              <span className="font-bold text-pink-700 uppercase tracking-wider text-[11px]">
                {profile.discreetNotifications ? 'Personal Health Reminder' : 'Upcoming Period Alert'}
              </span>
              <button
                onClick={() => onNavigate('settings')}
                className="text-[11px] text-purple-700 font-semibold hover:underline"
              >
                Reminder Settings
              </button>
            </div>
            <p className="mt-0.5 text-slate-700">
              {profile.discreetNotifications
                ? `Your CycleCare wellness window begins in ${cycleStatus.daysUntilNextPeriod} day${cycleStatus.daysUntilNextPeriod === 1 ? '' : 's'}. Remember to stay hydrated, prioritize rest, and track changes.`
                : `Your next period is predicted to arrive in approximately ${cycleStatus.daysUntilNextPeriod} day${cycleStatus.daysUntilNextPeriod === 1 ? '' : 's'} (${cycleStatus.nextPeriodDate}). Keep your period products ready.`}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">
              * Prediction estimate based on your personal {profile.averageCycleLength}-day cycle rhythm. Not a medical guarantee.
            </span>
          </div>
        </aside>
      )}

      {/* ================= HERO CYCLE STATUS CARD ================= */}
      <section className="bg-gradient-to-br from-pink-50/90 via-white to-purple-50/80 rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Circular Cycle Wheel Graphic */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="transparent"
                  stroke="#FCE7EC"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="cycleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EC4899" />
                    <stop offset="50%" stopColor="#F472B6" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="transparent"
                  stroke="url(#cycleGradient)"
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <span className="text-xs font-bold tracking-widest uppercase text-purple-900/60 mb-1">
                  Day of Cycle
                </span>
                <span className="text-5xl sm:text-6xl font-extrabold text-slate-800 tracking-tight leading-none">
                  {cycleStatus.currentCycleDay}
                </span>
                <span className="text-xs font-semibold text-pink-600 mt-2 px-3 py-1 rounded-full bg-pink-100/80">
                  {cycleStatus.phaseTitle}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 font-medium">
                  {cycleStatus.daysUntilNextPeriod} days to next predicted period
                </span>
              </div>
            </div>

            {/* Prediction Certainty / Confidence Badge */}
            <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/90 border border-purple-100 shadow-sm text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-slate-600 font-medium">Forecast Confidence:</span>
                <span className="font-bold text-purple-800">{cycleStatus.predictionConfidence}</span>
              </div>
              <span className="text-[10px] text-slate-400 italic">
                {profile.isIrregularCycle ? 'Irregular rhythm active — wider prediction window shown' : 'Based on entered cycle lengths'}
              </span>
            </div>
          </div>

          {/* Right Hero Overview: Estimates & Calibration Button */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 text-purple-800 text-xs font-semibold mb-2.5">
                  <span>Cycle Calibration</span>
                  <span>•</span>
                  <span>{cycleLength}-Day Average</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                  {cycleStatus.phaseTitle}
                </h1>
                <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
                  {cycleStatus.phaseDescription}
                </p>
              </div>

              {/* Button to open Cycle Calibration */}
              <button
                onClick={() => setIsEditingCycle(true)}
                className="py-2 px-3.5 rounded-2xl bg-white border border-pink-200 text-pink-700 font-bold text-xs hover:bg-pink-50 shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <span>⚙️</span>
                <span>Edit Cycle Inputs</span>
              </button>
            </div>

            {/* Estimated Dates Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white/90 border border-pink-100 shadow-sm">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <span>🩸</span>
                  <span>Estimated Next Period (Prediction)</span>
                </span>
                <span className="text-base font-extrabold text-slate-800 block">
                  {cycleStatus.nextPeriodDate}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Range: {cycleStatus.nextPeriodRange.start} to {cycleStatus.nextPeriodRange.end}
                </span>
              </div>

              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-pink-100 sm:pl-4 pt-2 sm:pt-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                  <span>🌿</span>
                  <span>Estimated Fertile Window (Prediction)</span>
                </span>
                <span className="text-base font-extrabold text-slate-800 block">
                  {cycleStatus.fertileWindowStart} – {cycleStatus.fertileWindowEnd}
                </span>
                <span className="text-[11px] text-purple-700 font-semibold block">
                  Ovulation Estimate: {cycleStatus.ovulationDate}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onOpenQuickLog}
                className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-semibold text-sm shadow-md shadow-pink-200 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>+</span>
                <span>Log Symptoms & Flow</span>
              </button>

              <button
                onClick={togglePeriodToday}
                className={`py-3 px-5 rounded-2xl border text-sm font-semibold transition-all flex items-center gap-2 ${
                  todayLog.isPeriodDay
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-inner'
                    : 'bg-white border-pink-200 text-slate-700 hover:bg-pink-50/50'
                }`}
              >
                <span>{todayLog.isPeriodDay ? '🩸 Period Logged Today' : '💧 Period Started Today?'}</span>
              </button>

              {todayLog.isPeriodDay && (
                <button
                  onClick={() => onDeleteLogForDate('2026-10-29')}
                  title="Remove today's log"
                  className="py-3 px-3 rounded-2xl border border-slate-200 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                >
                  Clear Entry
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= MODAL: EDIT CYCLE INPUTS & PARAMETERS ================= */}
      {isEditingCycle && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-pink-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Your Period & Cycle Inputs</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update parameters to recalibrate your cycle predictions immediately.
                </p>
              </div>
              <button
                onClick={() => setIsEditingCycle(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCycleCalibration} className="space-y-4">
              {/* First Day of Last Period */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  First Day of Last Period
                </label>
                <input
                  type="date"
                  value={calibLastPeriod}
                  onChange={(e) => setCalibLastPeriod(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold bg-white ${
                    validationResult.errors.lastPeriodStartDate ? 'border-rose-400 bg-rose-50/30' : 'border-pink-200'
                  }`}
                />
                {validationResult.errors.lastPeriodStartDate && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    ⚠️ {validationResult.errors.lastPeriodStartDate}
                  </p>
                )}
                {validationResult.warnings.dateAgeNote && (
                  <p className="text-xs text-amber-700 mt-1">
                    ℹ️ {validationResult.warnings.dateAgeNote}
                  </p>
                )}
              </div>

              {/* Average Cycle Length */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Average Cycle Length
                  </label>
                  <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                    {calibCycleLength} days
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={calibCycleLength}
                  onChange={(e) => setCalibCycleLength(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>15 days (Very short)</span>
                  <span>28 days (Typical)</span>
                  <span>60 days (Long)</span>
                </div>
                {validationResult.errors.averageCycleLength && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    ⚠️ {validationResult.errors.averageCycleLength}
                  </p>
                )}
                {validationResult.warnings.cycleLengthNote && (
                  <p className="text-xs text-amber-700 mt-1">
                    ℹ️ {validationResult.warnings.cycleLengthNote}
                  </p>
                )}
              </div>

              {/* Period Bleeding Duration */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Bleeding Duration
                  </label>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {calibPeriodLength} days
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={calibPeriodLength}
                  onChange={(e) => setCalibPeriodLength(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                {validationResult.errors.averagePeriodLength && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    ⚠️ {validationResult.errors.averagePeriodLength}
                  </p>
                )}
              </div>

              {/* Irregular Cycle Checkbox */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Irregular or Variable Cycle?</h4>
                  <p className="text-[11px] text-slate-500">
                    CycleCare will display estimated prediction ranges instead of rigid single dates.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={calibIsIrregular}
                  onChange={(e) => setCalibIsIrregular(e.target.checked)}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingCycle(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-pink-500 text-white text-xs font-bold shadow-md hover:bg-pink-600 transition-all"
                >
                  Save & Update Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 7-DAY HORIZON TIMELINE STRIP ================= */}
      <section className="bg-white rounded-3xl p-5 border border-pink-100/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Cycle Horizon</span>
            <span className="text-xs font-normal text-slate-400">7-Day View</span>
          </h3>
          <button
            onClick={() => onNavigate('calendar')}
            className="text-xs font-semibold text-pink-600 hover:text-pink-700"
          >
            Open Full Calendar →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {timelineDays.map((item) => (
            <div
              key={item.offset}
              onClick={() => onNavigate('calendar')}
              className={`p-2.5 sm:p-3 rounded-2xl text-center cursor-pointer transition-all border ${
                item.isToday
                  ? 'bg-gradient-to-b from-pink-50 to-purple-50 border-pink-400 ring-2 ring-pink-300/40 shadow-sm'
                  : 'bg-slate-50/60 border-slate-100 hover:border-pink-200 hover:bg-pink-50/30'
              }`}
            >
              <span className="block text-[11px] font-medium text-slate-400">
                {item.dayName}
              </span>
              <span className={`block text-base sm:text-lg font-bold my-0.5 ${
                item.isToday ? 'text-pink-600 font-extrabold' : 'text-slate-700'
              }`}>
                {item.dateNum}
              </span>

              <div className="h-5 flex items-center justify-center">
                {item.isPeriod ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title="Period Flow" />
                ) : item.isOvulation ? (
                  <span className="w-3 h-3 rounded-full bg-purple-500 border border-white shadow-sm flex items-center justify-center text-[8px] text-white" title="Estimated Ovulation">
                    ★
                  </span>
                ) : item.isFertile ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Estimated Fertile Window" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                )}
              </div>

              <span className="block text-[10px] text-slate-400 font-medium">
                Day {item.dayNum}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= DUAL GRID: HYDRATION & MOODS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-gradient-to-br from-purple-50/60 via-white to-pink-50/40 rounded-3xl p-6 border border-purple-100/90 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🌿</span>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                Daily Hormonal Synergy · {cycleStatus.dailyTip.category}
              </span>
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">
              How to support your body today
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              {cycleStatus.dailyTip.text}
            </p>
            <div className="pt-3 border-t border-purple-100/70 flex items-center justify-between text-xs text-purple-900/70">
              <span className="italic">“Listen to your rhythmic cycles with mindful reverence.”</span>
              <button
                onClick={() => onNavigate('education')}
                className="font-semibold text-pink-600 hover:underline"
              >
                Read Guide →
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Hydration Tracker */}
          <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>💧</span>
                <span>Hydration Tracker</span>
              </h4>
              <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                {currentGlasses} / 8 Glasses
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
              {Array.from({ length: 8 }).map((_, idx) => {
                const isFilled = idx < currentGlasses;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWater(idx + 1)}
                    className={`h-11 rounded-xl flex items-center justify-center transition-all ${
                      isFilled
                        ? 'bg-gradient-to-t from-pink-400 to-rose-400 text-white shadow-sm scale-105'
                        : 'bg-slate-100 hover:bg-pink-100 text-slate-400'
                    }`}
                  >
                    💧
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWater(currentGlasses - 1)}
                className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                - Remove
              </button>
              <button
                type="button"
                onClick={() => setWater(currentGlasses + 1)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-pink-50 border border-pink-200 text-xs font-semibold text-pink-700 hover:bg-pink-100"
              >
                + Add Glass
              </button>
            </div>
          </div>

          {/* Quick Moods */}
          <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <span>🌸</span>
              <span>Today's Mood Check-in</span>
            </h4>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { id: 'calm', label: 'Calm & Centered', icon: '🕊️' },
                { id: 'happy', label: 'Joyful / Radiant', icon: '☀️' },
                { id: 'energetic', label: 'Vibrant Energy', icon: '⚡' },
                { id: 'sensitive', label: 'Tender / Soft', icon: '🌧️' },
                { id: 'irritable', label: 'Edgy / Irritable', icon: '🌪️' },
                { id: 'anxious', label: 'Anxious', icon: '💭' },
                { id: 'brain_fog', label: 'Brain Fog', icon: '🌫️' },
              ].map((m) => {
                const isSelected = (todayLog.moods || []).includes(m.id as any);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleMoodSelect(m.id)}
                    className={`py-1.5 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-sm font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-pink-200'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
