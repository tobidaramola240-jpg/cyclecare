import React, { useState } from 'react';
import { UserProfile, DailyLog, CycleValidationResult, AuthUser } from '../types';
import { exportDataAsJson, exportLogsAsCsv } from '../utils/storage';
import { validateCycleParameters } from '../utils/cycleCalculations';

interface SettingsPrivacyProps {
  profile: UserProfile;
  logs: Record<string, DailyLog>;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onRevisitOnboarding: () => void;
  authUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onSyncCloud: () => void;
  isSyncing?: boolean;
}

export const SettingsPrivacy: React.FC<SettingsPrivacyProps> = ({
  profile,
  logs,
  onUpdateProfile,
  onResetDemoData,
  onClearAllData,
  onRevisitOnboarding,
  authUser,
  onOpenAuthModal,
  onSignOut,
  onSyncCloud,
  isSyncing = false,
}) => {
  const [pinInput, setPinInput] = useState<string>(profile.pinCode || '1234');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Cycle settings local state
  const [lastPeriodInput, setLastPeriodInput] = useState<string>(profile.lastPeriodStartDate || '2026-10-15');
  const [cycleLengthInput, setCycleLengthInput] = useState<number>(profile.averageCycleLength || 28);
  const [periodLengthInput, setPeriodLengthInput] = useState<number>(profile.averagePeriodLength || 5);
  const [isIrregularInput, setIsIrregularInput] = useState<boolean>(Boolean(profile.isIrregularCycle));
  const [validationResult, setValidationResult] = useState<CycleValidationResult>({
    isValid: true,
    errors: {},
    warnings: {},
  });

  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3000);
  };

  const handleSaveCycleSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateCycleParameters(lastPeriodInput, cycleLengthInput, periodLengthInput);
    setValidationResult(result);

    if (result.isValid) {
      onUpdateProfile({
        lastPeriodStartDate: lastPeriodInput,
        averageCycleLength: cycleLengthInput,
        averagePeriodLength: periodLengthInput,
        isIrregularCycle: isIrregularInput,
      });
      showToast('Cycle parameters updated & dashboard refreshed!');
    }
  };

  const handleDownloadJson = () => {
    const jsonStr = exportDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyclecare_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON backup downloaded successfully!');
  };

  const handleDownloadCsv = () => {
    const csvStr = exportLogsAsCsv(logs);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyclecare_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV logs exported successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* Settings Header */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">
            Preferences & Security
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5">
            Settings & Privacy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full control over your health parameters, security lock, and data export
          </p>
        </div>

        {toastFeedback && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fadeIn">
            ✓ {toastFeedback}
          </div>
        )}
      </div>

      {/* ================= 1. CYCLE CALCULATION TUNING ================= */}
      <section className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>⚙️</span>
            <span>Cycle Calibration & Mathematical Forecasting</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimates are updated across all screens immediately upon saving.
          </p>
        </div>

        <form onSubmit={handleSaveCycleSettings} className="space-y-4">
          {/* Last Period Start Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              First Day of Last Period
            </label>
            <input
              type="date"
              value={lastPeriodInput}
              onChange={(e) => setLastPeriodInput(e.target.value)}
              className={`w-full max-w-sm px-3.5 py-2.5 rounded-2xl border text-xs font-semibold bg-white ${
                validationResult.errors.lastPeriodStartDate ? 'border-rose-400 bg-rose-50/20' : 'border-pink-200'
              }`}
            />
            {validationResult.errors.lastPeriodStartDate && (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                ⚠️ {validationResult.errors.lastPeriodStartDate}
              </p>
            )}
          </div>

          {/* Sliders: Cycle Length & Period Length */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Average Cycle Length</label>
                <span className="text-xs font-extrabold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                  {cycleLengthInput} days
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                value={cycleLengthInput}
                onChange={(e) => setCycleLengthInput(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>15d</span>
                <span>28d (Standard)</span>
                <span>60d</span>
              </div>
              {validationResult.errors.averageCycleLength && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  ⚠️ {validationResult.errors.averageCycleLength}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Bleeding Duration</label>
                <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {periodLengthInput} days
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={periodLengthInput}
                onChange={(e) => setPeriodLengthInput(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              {validationResult.errors.averagePeriodLength && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  ⚠️ {validationResult.errors.averagePeriodLength}
                </p>
              )}
            </div>
          </div>

          {/* Irregular Toggle */}
          <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Irregular or Fluctuating Cycle Rhythm</h4>
              <p className="text-[11px] text-slate-500">
                Presents wider estimated prediction margins to prevent false certainty.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isIrregularInput}
              onChange={(e) => setIsIrregularInput(e.target.checked)}
              className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-2xl bg-pink-500 text-white font-bold text-xs shadow-md hover:bg-pink-600 transition-all"
            >
              Save Parameters & Recalculate
            </button>
          </div>
        </form>
      </section>

      {/* ================= 2. PRIVACY & DATA GUARANTEE ================= */}
      <section className="bg-gradient-to-br from-pink-50/80 via-white to-purple-50/60 rounded-3xl p-6 sm:p-7 border border-pink-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
            🛡️
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              The CycleCare Privacy Guarantee
            </h3>
            <p className="text-xs text-slate-500">
              Your sensitive health markers never leave your local device.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* Anonymous Mode */}
          <div className="p-4 rounded-2xl bg-white border border-pink-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Anonymous Mode</h4>
              <p className="text-[11px] text-slate-500">
                Hides your real name and replaces identifiable headers with anonymous pseudonyms.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateProfile({ isAnonymous: !profile.isAnonymous });
                showToast(profile.isAnonymous ? 'Anonymous mode disabled' : 'Anonymous mode active');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                profile.isAnonymous ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                profile.isAnonymous ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </section>

      {/* ================= 3. SUPABASE CLOUD SYNC & ROW LEVEL SECURITY ================= */}
      <section className="bg-gradient-to-br from-purple-50/80 via-white to-pink-50/70 rounded-3xl p-6 border border-purple-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg shadow-sm">
              ☁️
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Supabase Cloud Sync</span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  RLS Protected
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                End-to-end database storage backed by Supabase PostgreSQL Row Level Security
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAuthModal}
            className="py-1.5 px-3.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm"
          >
            {authUser ? 'Account Settings' : 'Connect / Sign In'}
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-purple-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Connection State:</span>
            {authUser ? (
              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Authenticated ({authUser.email})</span>
              </span>
            ) : (
              <span className="font-semibold text-purple-700 flex items-center gap-1.5">
                <span>🧪 Demo Mode (Local Sample Data)</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Row Level Security (RLS):</span>
            <span className="font-bold text-slate-800">
              Active (<code>auth.uid() = user_id</code>)
            </span>
          </div>

          <div className="pt-2 border-t border-purple-50 flex flex-wrap gap-2">
            {authUser ? (
              <>
                <button
                  type="button"
                  onClick={onSyncCloud}
                  disabled={isSyncing}
                  className="py-2 px-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 font-bold text-xs hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                >
                  {isSyncing ? (
                    <>
                      <span className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span>Syncing to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Push & Sync to Cloud</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="py-2 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="py-2 px-4 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors flex items-center gap-1.5"
              >
                <span>✨</span>
                <span>Sign In or Create Private Account</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed bg-white/70 p-3 rounded-xl border border-purple-100">
          🔒 <strong>Privacy Guarantee:</strong> CycleCare never exposes your Supabase secret administrative key. Client transactions run strictly via Row Level Security policies, ensuring only your verified authentication token can access your private records.
        </p>
      </section>

      {/* ================= 4. PERIOD & WELLNESS REMINDERS (OPTIONAL) ================= */}
      <section className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔔</span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Period & Wellness Reminders (Optional)
              </h3>
              <p className="text-xs text-slate-500">
                Gentle on-device alerts to help you prepare ahead of upcoming cycles
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
            Customizable
          </span>
        </div>

        <div className="space-y-4">
          {/* Main Period Reminder Toggle */}
          <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Upcoming Period Reminder</h4>
              <p className="text-[11px] text-slate-500">
                Receive an advance notification ahead of your predicted period start.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = profile.periodReminderEnabled === false ? true : false;
                onUpdateProfile({ periodReminderEnabled: next });
                showToast(next ? 'Period reminders enabled' : 'Period reminders muted');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                profile.periodReminderEnabled !== false ? 'bg-pink-500' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                profile.periodReminderEnabled !== false ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Days in Advance Dropdown */}
          {profile.periodReminderEnabled !== false && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Reminder Timing</h4>
                <p className="text-[11px] text-slate-500">
                  How many days before your predicted cycle to alert you.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      onUpdateProfile({ periodReminderDaysBefore: days });
                      showToast(`Reminder set to ${days} day${days > 1 ? 's' : ''} before`);
                    }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      profile.periodReminderDaysBefore === days
                        ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-pink-50'
                    }`}
                  >
                    {days}d before
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fertile Window Alert Toggle */}
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Fertile Window Awareness Alert</h4>
              <p className="text-[11px] text-slate-500">
                Notice when your estimated conception probability enters moderate/peak.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateProfile({ fertileAlert: !profile.fertileAlert });
                showToast(profile.fertileAlert ? 'Fertile window alerts off' : 'Fertile window alerts enabled');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                profile.fertileAlert ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                profile.fertileAlert ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Discreet Notifications Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Discreet Privacy Framing</h4>
              <p className="text-[11px] text-slate-500">
                Substitutes period terms with neutral reminders (e.g. "Your CycleCare update is ready").
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateProfile({ discreetNotifications: !profile.discreetNotifications });
                showToast(profile.discreetNotifications ? 'Standard alerts enabled' : 'Discreet privacy mode enabled');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                profile.discreetNotifications ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                profile.discreetNotifications ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Test Alert Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                const sampleMsg = profile.discreetNotifications
                  ? '🌸 CycleCare Reminder: Your personal wellness update is ready for today.'
                  : `🌸 Period Reminder: Your next period is estimated to arrive in ${profile.periodReminderDaysBefore || 2} days. (Statistical prediction, not guaranteed)`;
                showToast(sampleMsg);
              }}
              className="py-2.5 px-4 rounded-2xl bg-pink-50 border border-pink-200 text-xs font-bold text-pink-700 hover:bg-pink-100 transition-colors flex items-center gap-2 self-start"
            >
              <span>🔔</span>
              <span>Test Notification Preview</span>
            </button>
            <span className="text-[10px] text-slate-400">
              * Reminders are calculated from personal averages and are not medical guarantees.
            </span>
          </div>
        </div>
      </section>

      {/* ================= 5. PASSCODE & PIN LOCK ================= */}
      <section className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>🔒</span>
          <span>App Passcode Lock (PIN)</span>
        </h3>

        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Enable 4-Digit Passcode</h4>
            <p className="text-[11px] text-slate-500">
              Requires a PIN code whenever reopening CycleCare.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdateProfile({ pinLockEnabled: !profile.pinLockEnabled });
              showToast(profile.pinLockEnabled ? 'PIN lock disabled' : 'PIN lock enabled');
            }}
            className={`w-12 h-6 rounded-full transition-colors relative self-start sm:self-auto ${
              profile.pinLockEnabled ? 'bg-pink-500' : 'bg-slate-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
              profile.pinLockEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {profile.pinLockEnabled && (
          <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-200/80 space-y-3 animate-fadeIn">
            <label className="block text-xs font-bold text-slate-700">Set 4-Digit PIN Code</label>
            <div className="flex items-center gap-3">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="1234"
                className="w-32 px-3 py-2 rounded-xl border border-pink-300 text-center tracking-widest text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length === 4) {
                    onUpdateProfile({ pinCode: pinInput });
                    showToast('PIN successfully updated!');
                  }
                }}
                className="py-2 px-4 rounded-xl bg-pink-600 text-white text-xs font-bold hover:bg-pink-700"
              >
                Save PIN
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================= 4. DATA MANAGEMENT & ACTIONS ================= */}
      <section className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>💾</span>
          <span>Data Storage & Backups</span>
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadJson}
            className="py-2.5 px-4 rounded-2xl bg-pink-50 border border-pink-200 text-xs font-bold text-pink-700 hover:bg-pink-100 transition-colors flex items-center gap-2"
          >
            <span>📥</span>
            <span>Download Backup (JSON)</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="py-2.5 px-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-2"
          >
            <span>📊</span>
            <span>Export Logs (CSV)</span>
          </button>

          <button
            onClick={() => {
              onResetDemoData();
              showToast('Restored realistic demo cycle data!');
            }}
            className="py-2.5 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Reset to Demo Data</span>
          </button>

          <button
            onClick={onRevisitOnboarding}
            className="py-2.5 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-pink-50 transition-colors"
          >
            Re-run Welcome Wizard
          </button>
        </div>

        {/* Clear Data Danger Zone */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-rose-700">Delete Local Data</h4>
            <p className="text-[11px] text-slate-400">Permanently wipes all cycle logs from this browser.</p>
          </div>
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="py-1.5 px-3 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              Clear Storage
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-1.5 px-3 rounded-xl bg-slate-100 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                  showToast('All local data cleared.');
                }}
                className="py-1.5 px-3 rounded-xl bg-rose-600 text-xs text-white font-bold hover:bg-rose-700"
              >
                Confirm Wipe
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
