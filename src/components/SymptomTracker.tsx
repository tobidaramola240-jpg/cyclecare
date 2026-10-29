import React, { useState, useEffect } from 'react';
import { DailyLog, FlowLevel, MoodType, PhysicalSymptom, CervicalFluid, EnergyLevel, SleepQuality, LibidoLevel, SexActivity } from '../types';

interface SymptomTrackerProps {
  initialDate?: string;
  logs: Record<string, DailyLog>;
  onSaveLog: (log: DailyLog) => void;
  onDeleteLog: (dateStr: string) => void;
}

export const SymptomTracker: React.FC<SymptomTrackerProps> = ({
  initialDate,
  logs,
  onSaveLog,
  onDeleteLog,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || '2026-10-29');
  const [currentTab, setCurrentTab] = useState<'log' | 'history'>('log');

  const [formLog, setFormLog] = useState<DailyLog>(() => {
    const existing = logs[selectedDate];
    return existing || {
      date: selectedDate,
      isPeriodDay: false,
      flow: 'none',
      symptoms: [],
      moods: [],
      sleepHours: 8,
      sleepQuality: 'restful',
      waterGlasses: 8,
      notes: '',
      pillTaken: true,
    };
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    const existing = logs[selectedDate];
    if (existing) {
      setFormLog({ ...existing });
    } else {
      setFormLog({
        date: selectedDate,
        isPeriodDay: false,
        flow: 'none',
        symptoms: [],
        moods: [],
        sleepHours: 8,
        sleepQuality: 'restful',
        waterGlasses: 8,
        notes: '',
        pillTaken: true,
      });
    }
    setSavedSuccess(false);
  }, [selectedDate, logs]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLog(formLog);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete your entry for ${selectedDate}?`)) {
      onDeleteLog(selectedDate);
      setFormLog({
        date: selectedDate,
        isPeriodDay: false,
        flow: 'none',
        symptoms: [],
        moods: [],
        notes: '',
      });
    }
  };

  const toggleSymptom = (s: PhysicalSymptom) => {
    const current = formLog.symptoms || [];
    const updated = current.includes(s)
      ? current.filter(item => item !== s)
      : [...current, s];
    setFormLog({ ...formLog, symptoms: updated });
  };

  const toggleMood = (m: MoodType) => {
    const current = formLog.moods || [];
    const updated = current.includes(m)
      ? current.filter(item => item !== m)
      : [...current, m];
    setFormLog({ ...formLog, moods: updated });
  };

  const setFlow = (flow: FlowLevel) => {
    setFormLog({
      ...formLog,
      flow,
      isPeriodDay: flow !== 'none',
    });
  };

  const recentLogEntries = Object.values(logs)
    .sort((a, b) => b.date.localeCompare(a.date));

  const hasExistingEntry = Boolean(logs[selectedDate]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* Tracker Header */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Record Period & Symptoms
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log your flow intensity, physical discomfort, and emotional rhythms
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-pink-50/70 rounded-2xl border border-pink-100">
          <button
            onClick={() => setCurrentTab('log')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'log'
                ? 'bg-white text-pink-700 shadow-sm'
                : 'text-slate-600 hover:text-pink-600'
            }`}
          >
            Log / Edit Entry
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'history'
                ? 'bg-white text-pink-700 shadow-sm'
                : 'text-slate-600 hover:text-pink-600'
            }`}
          >
            Past Logs ({recentLogEntries.length})
          </button>
        </div>
      </div>

      {currentTab === 'history' ? (
        /* History View */
        <div className="space-y-4">
          {recentLogEntries.map((log) => (
            <div
              key={log.date}
              className="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{log.date}</span>
                  {log.isPeriodDay && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                      🩸 Flow: {log.flow}
                    </span>
                  )}
                  {log.temperature && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                      🌡️ {log.temperature}°F
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {log.symptoms.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 text-[11px] font-medium">
                      {s.replace('_', ' ')}
                    </span>
                  ))}
                  {log.moods.map(m => (
                    <span key={m} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-medium">
                      {m}
                    </span>
                  ))}
                </div>

                {log.notes && (
                  <p className="text-xs text-slate-500 italic mt-1">"{log.notes}"</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedDate(log.date);
                    setCurrentTab('log');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-pink-200 text-pink-700 font-semibold text-xs hover:bg-pink-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete entry for ${log.date}?`)) {
                      onDeleteLog(log.date);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Logging Form */
        <form onSubmit={handleSave} className="space-y-6">
          {/* Date Picker Bar */}
          <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>📅 Selected Date:</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate('2026-10-29')}
                className="text-xs font-semibold text-pink-600 hover:underline mr-1"
              >
                Today
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-pink-200 text-xs font-semibold text-slate-800 bg-pink-50/50"
              />
            </div>
          </div>

          {/* Menstrual Flow */}
          <section className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>🩸</span>
              <span>Menstrual Flow (Record Period)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: 'none', label: 'No Bleeding', icon: '⚪' },
                { id: 'spotting', label: 'Spotting', icon: '🔹' },
                { id: 'light', label: 'Light Flow', icon: '💧' },
                { id: 'medium', label: 'Medium Flow', icon: '💧💧' },
                { id: 'heavy', label: 'Heavy Flow', icon: '🩸🩸' },
              ].map((f) => {
                const isSelected = formLog.flow === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFlow(f.id as FlowLevel)}
                    className={`py-3 px-3 rounded-2xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-200 shadow-sm'
                        : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-pink-50/20'
                    }`}
                  >
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Physical Symptoms */}
          <section className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>⚡</span>
              <span>Physical Symptoms</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'cramps_mild', label: 'Mild Cramps', icon: '🌿' },
                { id: 'cramps_severe', label: 'Severe Cramps', icon: '💥' },
                { id: 'backache', label: 'Lower Back Ache', icon: '🦴' },
                { id: 'tender_breasts', label: 'Tender Breasts', icon: '🌸' },
                { id: 'headache', label: 'Headache / Migraine', icon: '⚡' },
                { id: 'bloating', label: 'Abdominal Bloating', icon: '🎈' },
                { id: 'pelvic_pressure', label: 'Pelvic Pressure', icon: '🪨' },
                { id: 'fatigue', label: 'Body Fatigue', icon: '🛌' },
              ].map((sym) => {
                const isSelected = formLog.symptoms.includes(sym.id as PhysicalSymptom);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.id as PhysicalSymptom)}
                    className={`py-2 px-3.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-pink-100 border-pink-300 text-pink-800 font-semibold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-pink-200'
                    }`}
                  >
                    <span>{sym.icon}</span>
                    <span>{sym.label} {isSelected ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Moods */}
          <section className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>✨</span>
              <span>Moods & Emotional State</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'calm', label: 'Calm & Grounded', icon: '🕊️' },
                { id: 'happy', label: 'Joyful & Confident', icon: '☀️' },
                { id: 'energetic', label: 'High Vitality', icon: '⚡' },
                { id: 'sensitive', label: 'Tender & Sensitive', icon: '🌧️' },
                { id: 'irritable', label: 'Edgy / Irritable', icon: '🌪️' },
                { id: 'anxious', label: 'Anxious / Overthinking', icon: '💭' },
                { id: 'brain_fog', label: 'Brain Fog', icon: '🌫️' },
              ].map((m) => {
                const isSelected = formLog.moods.includes(m.id as MoodType);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMood(m.id as MoodType)}
                    className={`py-2 px-3.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-100 border-purple-300 text-purple-900 font-semibold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-purple-200'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notes */}
          <section className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>📝</span>
              <span>Journal Notes</span>
            </h3>
            <textarea
              rows={2}
              placeholder="Record any details, supplements taken, or notes..."
              value={formLog.notes || ''}
              onChange={(e) => setFormLog({ ...formLog, notes: e.target.value })}
              className="w-full p-3 rounded-2xl border border-pink-200 text-xs text-slate-800 bg-white"
            />
          </section>

          {/* Submit and Delete Bar */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div>
              {hasExistingEntry && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="py-2.5 px-4 rounded-2xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                >
                  🗑️ Delete Entry for {selectedDate}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {savedSuccess && (
                <span className="text-emerald-600 text-xs font-bold animate-fadeIn">
                  ✓ Saved successfully!
                </span>
              )}
              <button
                type="submit"
                className="py-3 px-8 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Save Changes ✨
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
