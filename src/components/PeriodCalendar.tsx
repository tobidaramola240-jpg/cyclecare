import React, { useState } from 'react';
import { UserProfile, DailyLog } from '../types';
import { getDateCycleClassification, formatDateISO } from '../utils/cycleCalculations';

interface PeriodCalendarProps {
  profile: UserProfile;
  logs: Record<string, DailyLog>;
  onOpenLogForDate: (dateStr: string) => void;
  onUpdateLog: (dateStr: string, logData: Partial<DailyLog>) => void;
  onDeleteLog: (dateStr: string) => void;
}

export const PeriodCalendar: React.FC<PeriodCalendarProps> = ({
  profile,
  logs,
  onOpenLogForDate,
  onUpdateLog,
  onDeleteLog,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date(2026, 9, 1)); // Oct 2026 default
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatDateISO(new Date(2026, 9, 29)));

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const handlePrevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));
  const handleJumpToday = () => {
    const today = new Date(2026, 9, 29);
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(formatDateISO(today));
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedClassification = getDateCycleClassification(selectedDateStr, profile, logs);
  const selectedLog = logs[selectedDateStr];

  const handleTogglePeriodForSelected = () => {
    const isCurrentlyPeriod = Boolean(selectedLog && selectedLog.isPeriodDay);
    onUpdateLog(selectedDateStr, {
      date: selectedDateStr,
      isPeriodDay: !isCurrentlyPeriod,
      flow: !isCurrentlyPeriod ? (selectedLog?.flow || 'medium') : 'none',
      symptoms: selectedLog?.symptoms || [],
      moods: selectedLog?.moods || [],
    });
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete all logged data for ${selectedDateStr}?`)) {
      onDeleteLog(selectedDateStr);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Month Navigation & Title */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {monthName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Color-coded calendar showing recorded flows and estimated biological predictions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleJumpToday}
            className="px-3.5 py-2 rounded-2xl bg-pink-50 border border-pink-200 text-xs font-semibold text-pink-700 hover:bg-pink-100 transition-colors"
          >
            Jump to Today
          </button>
          <div className="flex items-center border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Previous Month"
            >
              ‹
            </button>
            <div className="w-[1px] h-4 bg-slate-200" />
            <button
              onClick={handleNextMonth}
              className="p-2.5 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Next Month"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 8 cols Calendar + 4 cols Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-7 border border-pink-100 shadow-sm">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-xs font-bold uppercase tracking-wider text-slate-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => {
              const prevDateNum = daysInPrevMonth - firstDayOfMonth + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-[56px] sm:min-h-[68px] p-1.5 rounded-2xl bg-slate-50/40 text-slate-300 text-xs font-medium flex items-center justify-center select-none"
                >
                  {prevDateNum}
                </div>
              );
            })}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dStr;
              const isToday = dStr === '2026-10-29';
              const classification = getDateCycleClassification(dStr, profile, logs);

              return (
                <div
                  key={dStr}
                  onClick={() => setSelectedDateStr(dStr)}
                  className={`min-h-[60px] sm:min-h-[74px] p-1.5 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-between relative border ${
                    isSelected
                      ? 'border-pink-500 ring-2 ring-pink-400/40 shadow-sm z-10'
                      : 'border-slate-100 hover:border-pink-200 hover:bg-pink-50/30'
                  } ${
                    classification.isRecordedPeriod
                      ? 'bg-rose-50/90 text-rose-900 border-rose-200'
                      : classification.isPredictedPeriod
                      ? 'bg-pink-50/50 text-pink-900 border-dashed border-pink-200'
                      : classification.isOvulationDay
                      ? 'bg-purple-50/80 text-purple-900 border-purple-200'
                      : classification.isFertileWindow
                      ? 'bg-emerald-50/60 text-emerald-900 border-emerald-100'
                      : 'bg-white text-slate-700'
                  }`}
                >
                  {/* Top: Day number */}
                  <div className="w-full flex items-center justify-between px-1">
                    <span className={`text-xs sm:text-sm font-bold ${
                      isToday ? 'w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[11px]' : ''
                    }`}>
                      {dayNum}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      d{classification.cycleDay}
                    </span>
                  </div>

                  {/* Middle: Icon badge */}
                  <div className="my-auto flex items-center justify-center">
                    {classification.isRecordedPeriod && (
                      <span className="text-xs" title="Recorded Period Flow">🩸</span>
                    )}
                    {classification.isPredictedPeriod && !classification.isRecordedPeriod && (
                      <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-pink-100 text-pink-700 border border-pink-200" title="Estimated Predicted Period">
                        Est.
                      </span>
                    )}
                    {classification.isOvulationDay && (
                      <span className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[9px] font-bold shadow-sm" title="Estimated Peak Ovulation">
                        ★
                      </span>
                    )}
                    {classification.isFertileWindow && !classification.isOvulationDay && (
                      <span className="text-[10px]" title="Estimated Fertile Window">🌿</span>
                    )}
                  </div>

                  {/* Bottom: Dot indicator if logged */}
                  <div className="h-2 flex items-center gap-1">
                    {classification.hasLog && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" title="Has Logged Entry" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="mt-6 pt-5 border-t border-pink-100/80 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🩸</span>
              <span className="font-semibold text-rose-800">Period (Recorded by User)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-50 border border-dashed border-pink-300 text-pink-700">Est.</span>
              <span className="font-medium">Estimated Period Prediction</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-lg bg-purple-500 text-white flex items-center justify-center text-[9px] font-bold">★</span>
              <span className="font-medium">Estimated Ovulation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🌿</span>
              <span className="font-medium">Estimated Fertile Window</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="font-medium">Has Logged Symptoms</span>
            </div>
          </div>
        </div>

        {/* Day Inspector & Editing Sidebar */}
        <div className="lg:col-span-4 bg-gradient-to-b from-white to-pink-50/30 rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col">
          <div className="border-b border-pink-100 pb-4 mb-4">
            <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">
              Selected Date Inspector
            </span>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cycle Day {selectedClassification.cycleDay} · {
                selectedClassification.isRecordedPeriod
                  ? 'Recorded Menstrual Day'
                  : selectedClassification.isOvulationDay
                  ? 'Estimated Ovulation Day'
                  : selectedClassification.isFertileWindow
                  ? 'Estimated Fertile Window'
                  : 'Normal Cycle Rhythm'
              }
            </p>
          </div>

          <div className="flex-1 space-y-4">
            {/* Flow Status */}
            <div className="p-3.5 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Menstrual Bleeding</span>
                <span className="text-xs text-slate-500">
                  {selectedLog?.isPeriodDay ? `Flow: ${selectedLog.flow || 'Recorded'}` : 'No flow recorded for this day'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleTogglePeriodForSelected}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedLog?.isPeriodDay
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-pink-50'
                }`}
              >
                {selectedLog?.isPeriodDay ? 'Remove Flow' : '+ Mark Flow'}
              </button>
            </div>

            {/* Symptoms */}
            <div className="p-3.5 rounded-2xl bg-white border border-pink-100 shadow-sm">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">Symptoms Logged</span>
              {selectedLog && selectedLog.symptoms && selectedLog.symptoms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLog.symptoms.map((s) => (
                    <span key={s} className="px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-[11px] font-medium">
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No symptoms recorded.</p>
              )}
            </div>

            {/* Moods */}
            <div className="p-3.5 rounded-2xl bg-white border border-pink-100 shadow-sm">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">Moods Logged</span>
              {selectedLog && selectedLog.moods && selectedLog.moods.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLog.moods.map((m) => (
                    <span key={m} className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No moods recorded.</p>
              )}
            </div>

            {/* Notes if any */}
            {selectedLog?.notes && (
              <div className="p-3.5 rounded-2xl bg-white border border-pink-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-700 block mb-1">Journal Note</span>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{selectedLog.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Action buttons: Edit & Delete Entry */}
          <div className="pt-4 mt-auto border-t border-pink-100 space-y-2">
            <button
              onClick={() => onOpenLogForDate(selectedDateStr)}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <span>✏️</span>
              <span>{selectedLog ? 'Edit Full Day Entry' : '+ Add Log For This Day'}</span>
            </button>

            {selectedLog && (
              <button
                onClick={handleDeleteSelected}
                className="w-full py-2 px-3 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <span>🗑️</span>
                <span>Delete This Day's Log</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
