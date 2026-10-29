import React, { useState } from 'react';
import { DailyLog, FlowLevel, PhysicalSymptom, MoodType, CervicalFluid } from '../types';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  existingLog?: DailyLog;
  onSave: (log: DailyLog) => void;
  onDelete?: (dateStr: string) => void;
}

export const LogModal: React.FC<LogModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  existingLog,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const [flow, setFlow] = useState<FlowLevel>(existingLog?.flow || (existingLog?.isPeriodDay ? 'medium' : 'none'));
  const [symptoms, setSymptoms] = useState<PhysicalSymptom[]>(existingLog?.symptoms || []);
  const [moods, setMoods] = useState<MoodType[]>(existingLog?.moods || []);
  const [cervicalFluid, setCervicalFluid] = useState<CervicalFluid | undefined>(existingLog?.cervicalFluid);
  const [temperature, setTemperature] = useState<string>(existingLog?.temperature ? String(existingLog.temperature) : '');
  const [notes, setNotes] = useState<string>(existingLog?.notes || '');
  const [water, setWater] = useState<number>(existingLog?.waterGlasses || 8);
  const [pillTaken, setPillTaken] = useState<boolean>(existingLog?.pillTaken ?? true);

  const toggleSymptom = (s: PhysicalSymptom) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleMood = (m: MoodType) => {
    setMoods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DailyLog = {
      date: dateStr,
      isPeriodDay: flow !== 'none',
      flow,
      symptoms,
      moods,
      cervicalFluid,
      temperature: temperature ? parseFloat(temperature) : undefined,
      notes,
      waterGlasses: water,
      pillTaken,
    };
    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Delete entry for ${dateStr}?`)) {
      onDelete(dateStr);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 border border-pink-100 shadow-2xl relative my-auto space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600">
              Quick Log · {dateStr}
            </span>
            <h3 className="text-xl font-extrabold text-slate-800">
              Record Flow & Symptoms
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Flow Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              🩸 Menstrual Flow (Period)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'none', label: 'None' },
                { id: 'spotting', label: 'Spotting' },
                { id: 'light', label: 'Light' },
                { id: 'medium', label: 'Medium' },
                { id: 'heavy', label: 'Heavy' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFlow(f.id as FlowLevel)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold text-center border transition-all ${
                    flow === f.id
                      ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-pink-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Symptoms */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ⚡ Symptoms
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'cramps_mild', label: 'Mild Cramps' },
                { id: 'cramps_severe', label: 'Severe Cramps' },
                { id: 'tender_breasts', label: 'Tender Breasts' },
                { id: 'headache', label: 'Headache' },
                { id: 'bloating', label: 'Bloating' },
                { id: 'backache', label: 'Backache' },
                { id: 'fatigue', label: 'Fatigue' },
              ].map((s) => {
                const isSelected = symptoms.includes(s.id as PhysicalSymptom);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSymptom(s.id as PhysicalSymptom)}
                    className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-pink-100 border-pink-300 text-pink-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-pink-200'
                    }`}
                  >
                    {s.label} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Moods */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ✨ Mood
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'calm', label: 'Calm 🕊️' },
                { id: 'happy', label: 'Joyful ☀️' },
                { id: 'energetic', label: 'Vibrant ⚡' },
                { id: 'sensitive', label: 'Sensitive 🌧️' },
                { id: 'irritable', label: 'Irritable 🌪️' },
                { id: 'anxious', label: 'Anxious 💭' },
                { id: 'brain_fog', label: 'Brain Fog 🌫️' },
              ].map((m) => {
                const isSelected = moods.includes(m.id as MoodType);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMood(m.id as MoodType)}
                    className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-purple-100 border-purple-300 text-purple-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-purple-200'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Private Note
            </label>
            <input
              type="text"
              placeholder="e.g. Took magnesium, cramps reduced..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-pink-200 text-xs text-slate-800 bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              {existingLog && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="py-2 px-3 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                >
                  Delete Entry
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
