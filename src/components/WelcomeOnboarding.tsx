import React, { useState } from 'react';
import { UserProfile, CycleValidationResult } from '../types';
import { DEFAULT_USER_PROFILE } from '../data/sampleData';
import { validateCycleParameters } from '../utils/cycleCalculations';

interface WelcomeOnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onUseDemoData: () => void;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({
  onComplete,
  onUseDemoData,
}) => {
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<UserProfile>({ ...DEFAULT_USER_PROFILE });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'cramps_mild',
    'tender_breasts',
    'bloating',
  ]);
  const [validationResult, setValidationResult] = useState<CycleValidationResult>({
    isValid: true,
    errors: {},
    warnings: {},
  });

  const totalSteps = 5;

  const goals = [
    {
      id: 'track_period' as const,
      icon: '🌸',
      title: 'Track My Period & Menstrual Cycle',
      desc: 'Predict upcoming cycles, track flow intensity, and monitor personal health patterns.',
    },
    {
      id: 'conceive' as const,
      icon: '🌿',
      title: 'Trying to Conceive (TTC)',
      desc: 'Identify fertile windows, ovulation surges, and peak conception probability days.',
    },
    {
      id: 'symptoms' as const,
      icon: '✨',
      title: 'Hormonal & Mood Wellness',
      desc: 'Connect physical symptoms, mood shifts, and nutrition to natural hormonal waves.',
    },
    {
      id: 'perimenopause' as const,
      icon: '🌙',
      title: 'Perimenopause & Cycle Changes',
      desc: 'Track irregular intervals, hot flushes, and body transformations with compassion.',
    },
  ];

  const symptomOptions = [
    { id: 'cramps_mild', label: 'Mild Cramps' },
    { id: 'cramps_severe', label: 'Severe Cramps' },
    { id: 'tender_breasts', label: 'Tender Breasts' },
    { id: 'headache', label: 'Headaches' },
    { id: 'bloating', label: 'Bloating' },
    { id: 'backache', label: 'Lower Back Ache' },
    { id: 'fatigue', label: 'Fatigue' },
    { id: 'acne', label: 'Skin Changes / Acne' },
  ];

  const handleNext = () => {
    if (step === 3) {
      // Validate cycle metrics
      const validation = validateCycleParameters(
        profile.lastPeriodStartDate,
        profile.averageCycleLength,
        profile.averagePeriodLength
      );
      setValidationResult(validation);
      if (!validation.isValid) {
        return; // block step until resolved
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete({ ...profile, hasCompletedOnboarding: true });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl border border-pink-100 shadow-xl shadow-pink-100/50 p-6 sm:p-10 relative overflow-hidden">
        {/* Step Progress Bar */}
        <div className="relative z-10 mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-900/60 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <button
              onClick={onUseDemoData}
              className="text-pink-600 hover:text-pink-700 underline text-xs font-medium"
            >
              Skip to Demo with Sample Data →
            </button>
          </div>
          <div className="h-1.5 w-full bg-pink-100/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* ================= STEP 1: WELCOME & PHILOSOPHY ================= */}
        {step === 1 && (
          <div className="relative z-10 text-center animate-fadeIn">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-400 to-purple-400 p-1 shadow-lg shadow-pink-200/70">
              <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center">
                <svg className="w-10 h-10 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-2.38 1.05-4.52 2.71-6 1.48 3.73 4.96 6.5 9.29 7.08-.2 3.86-3.3 6.92-7.29 6.92z" />
                  <circle cx="15.5" cy="8.5" r="2.5" fill="#C084FC" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">
              Welcome to CycleCare
            </h1>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base max-w-md mx-auto mb-6">
              Your mindful, private cycle companion. Track natural rhythms, decode hormonal moods, and connect deeply with your body.
            </p>

            <div className="bg-pink-50/70 border border-pink-100/90 rounded-2xl p-4 text-left mb-8 space-y-2">
              <div className="flex items-center gap-2.5 text-xs font-bold text-pink-900">
                <span>🛡️</span>
                <span>The CycleCare Privacy Pledge</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your health data is completely private. CycleCare stores logs exclusively on your device. No third-party ad networks, no data brokers, and no tracking.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleNext}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-base shadow-lg shadow-pink-200/80 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Let’s Personalize Your Journey →
              </button>
              <button
                onClick={onUseDemoData}
                className="w-full py-3 px-6 rounded-2xl bg-white border border-pink-200 text-slate-700 font-medium text-sm hover:bg-pink-50/50 transition-colors"
              >
                Explore Demo with Sample Data
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CHOOSE PRIMARY GOAL ================= */}
        {step === 2 && (
          <div className="relative z-10 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
              What is your primary goal?
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              This helps CycleCare tailor your daily tips, insights, and cycle calculations.
            </p>

            <div className="space-y-3 mb-8">
              {goals.map((g) => {
                const isSelected = profile.goal === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setProfile({ ...profile, goal: g.id })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50/60 shadow-sm ring-2 ring-pink-400/30'
                        : 'border-pink-100 hover:border-pink-200 bg-white hover:bg-pink-50/20'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{g.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 text-sm">{g.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{g.desc}</p>
                    </div>
                    <span className={`text-base font-bold ${isSelected ? 'text-pink-600' : 'text-slate-300'}`}>
                      {isSelected ? '●' : '○'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm shadow-md shadow-pink-200 hover:shadow-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CYCLE RHYTHM METRICS & VALIDATION ================= */}
        {step === 3 && (
          <div className="relative z-10 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
              Your Natural Cycle Inputs
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              Enter your cycle metrics. All resulting dates are estimated predictions, not contraception advice.
            </p>

            <div className="space-y-5 mb-8">
              {/* Last Period Start Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  When did your last period start?
                </label>
                <input
                  type="date"
                  value={profile.lastPeriodStartDate}
                  onChange={(e) => {
                    setProfile({ ...profile, lastPeriodStartDate: e.target.value });
                    setValidationResult(prev => ({ ...prev, errors: { ...prev.errors, lastPeriodStartDate: undefined } }));
                  }}
                  className={`w-full px-4 py-3 rounded-2xl border bg-white font-medium text-slate-800 text-sm ${
                    validationResult.errors.lastPeriodStartDate ? 'border-rose-400 bg-rose-50/20' : 'border-pink-200'
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Average Cycle Length
                  </label>
                  <span className="text-sm font-bold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                    {profile.averageCycleLength} days
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={profile.averageCycleLength}
                  onChange={(e) => {
                    setProfile({ ...profile, averageCycleLength: Number(e.target.value) });
                    setValidationResult(prev => ({ ...prev, errors: { ...prev.errors, averageCycleLength: undefined } }));
                  }}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>15 days (Shorter)</span>
                  <span>28 days (Typical)</span>
                  <span>60 days (Longer)</span>
                </div>
                {validationResult.errors.averageCycleLength && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    ⚠️ {validationResult.errors.averageCycleLength}
                  </p>
                )}
              </div>

              {/* Period Duration */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Average Bleeding Duration
                  </label>
                  <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    {profile.averagePeriodLength} days
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={profile.averagePeriodLength}
                  onChange={(e) => {
                    setProfile({ ...profile, averagePeriodLength: Number(e.target.value) });
                    setValidationResult(prev => ({ ...prev, errors: { ...prev.errors, averagePeriodLength: undefined } }));
                  }}
                  className="w-full accent-purple-500"
                />
                {validationResult.errors.averagePeriodLength && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    ⚠️ {validationResult.errors.averagePeriodLength}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm shadow-md shadow-pink-200 hover:shadow-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: TYPICAL SYMPTOMS ================= */}
        {step === 4 && (
          <div className="relative z-10 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
              Common Signals & Symptoms
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Select symptoms you frequently notice. CycleCare flags patterns for your health provider.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-8">
              {symptomOptions.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.id)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-semibold text-left transition-all border ${
                      isSelected
                        ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-pink-200'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      {sym.label}
                      {isSelected ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm shadow-md shadow-pink-200 hover:shadow-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: PRIVACY & PERSONALIZATION ================= */}
        {step === 5 && (
          <div className="relative z-10 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
              Privacy & Preferences
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Customize how your profile appears and protects your personal privacy.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  How should we address you?
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. Maya Chen"
                  className="w-full px-4 py-3 rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400/50 bg-white text-sm"
                />
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Anonymous Mode</h4>
                  <p className="text-xs text-slate-500">Hide personal name throughout reports and exports.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, isAnonymous: !profile.isAnonymous })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    profile.isAnonymous ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    profile.isAnonymous ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Discreet Notification Alerts</h4>
                  <p className="text-xs text-slate-500">Previews display gentle reminders instead of cycle terminology.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, discreetNotifications: !profile.discreetNotifications })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    profile.discreetNotifications ? 'bg-pink-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    profile.discreetNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-pink-200/80 hover:shadow-xl transition-all"
              >
                Finish & Enter CycleCare ✨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
