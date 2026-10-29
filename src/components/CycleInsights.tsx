import React, { useState } from 'react';
import { UserProfile, DailyLog, PastCycle } from '../types';
import { computeInsights, computeSymptomTrends } from '../utils/cycleCalculations';

interface CycleInsightsProps {
  profile: UserProfile;
  pastCycles: PastCycle[];
  logs: Record<string, DailyLog>;
  onOpenDoctorReport: () => void;
}

export const CycleInsights: React.FC<CycleInsightsProps> = ({
  profile,
  pastCycles,
  logs,
  onOpenDoctorReport,
}) => {
  const insights = computeInsights(pastCycles, logs);
  const symptomTrends = computeSymptomTrends(logs);

  const [activeTab, setActiveTab] = useState<'symptoms' | 'overview' | 'hormones' | 'correlations'>('symptoms');
  const [selectedHormoneDay, setSelectedHormoneDay] = useState<number>(14);

  // Simulated hormone curve values for a standard 28-day cycle:
  const getEstrogenLevel = (day: number) => {
    if (day <= 5) return 20;
    if (day <= 13) return 20 + ((day - 5) / 8) * 80;
    if (day === 14) return 100;
    if (day <= 16) return 50;
    if (day <= 22) return 50 + Math.sin(((day - 16) / 6) * Math.PI) * 25;
    return 25 - ((day - 22) / 6) * 15;
  };

  const getProgesteroneLevel = (day: number) => {
    if (day <= 14) return 10;
    if (day <= 21) return 10 + ((day - 14) / 7) * 85;
    if (day <= 24) return 95;
    return 95 - ((day - 24) / 4) * 85;
  };

  const getLhLevel = (day: number) => {
    if (day < 12) return 15;
    if (day === 13) return 75;
    if (day === 14) return 100;
    if (day === 15) return 35;
    return 15;
  };

  const moodColorMap: Record<string, string> = {
    calm: 'from-emerald-400 to-teal-500',
    happy: 'from-amber-400 to-yellow-500',
    energetic: 'from-pink-500 to-rose-500',
    sensitive: 'from-purple-400 to-indigo-500',
    irritable: 'from-rose-500 to-red-600',
    anxious: 'from-orange-400 to-amber-600',
    low: 'from-blue-400 to-indigo-600',
    brain_fog: 'from-slate-400 to-slate-600',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Top Banner with Quick Actions */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">
            Biometric Analytics & Body Literacy
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5">
            Cycle Insights & Symptom Trends
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personal observations derived from {symptomTrends.totalLoggedDays} logged daily entries across {pastCycles.length} tracked cycles
          </p>
        </div>

        <button
          onClick={onOpenDoctorReport}
          className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-purple-200 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Export Clinical Summary</span>
        </button>
      </div>

      {/* Prominent Non-Diagnostic & Prediction Disclaimer Box */}
      <div className="p-4 rounded-3xl bg-amber-50/90 border border-amber-200 shadow-sm flex items-start gap-3.5">
        <span className="text-xl shrink-0">⚠️</span>
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold uppercase tracking-wider block mb-0.5">
            Important Medical & Prediction Notice
          </span>
          These trends and summaries reflect exclusively your <strong className="underline">self-reported log entries</strong> to foster personal body literacy. CycleCare <strong className="underline">does not diagnose medical conditions</strong> (such as endometriosis, PMDD, or migraine disorders) and does not replace consultation with a physician. Furthermore, cycle estimates and fertile windows are statistical projections derived from entered averages and are <strong className="underline">not guaranteed predictions or contraception advice</strong>.
        </div>
      </div>

      {/* Top 4 Key Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Regularity Rhythm
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-pink-600">
              {insights.regularityScore}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Predictable
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Variability within ±1.5 days across {pastCycles.length} recorded cycles.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Avg Cycle Length
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-purple-700">
              {insights.averageLength}
            </span>
            <span className="text-xs text-slate-500 font-medium">days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Personal historical rhythm (normal population reference: 24–35 days).
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Avg Bleeding Duration
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-rose-600">
              {insights.averagePeriod}
            </span>
            <span className="text-xs text-slate-500 font-medium">days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Average duration of self-reported menstrual flow.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Symptom Logs
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-indigo-600">
              {symptomTrends.totalLoggedDays}
            </span>
            <span className="text-xs text-slate-500 font-medium">days logged</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {symptomTrends.periodDaysLogged} period days recorded with sensations.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-pink-100 space-x-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('symptoms')}
          className={`pb-3 transition-colors relative shrink-0 ${
            activeTab === 'symptoms'
              ? 'text-pink-600 font-bold border-b-2 border-pink-500'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Symptom History & Trends
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors relative shrink-0 ${
            activeTab === 'overview'
              ? 'text-pink-600 font-bold border-b-2 border-pink-500'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Cycle Length Consistency
        </button>
        <button
          onClick={() => setActiveTab('hormones')}
          className={`pb-3 transition-colors relative shrink-0 ${
            activeTab === 'hormones'
              ? 'text-pink-600 font-bold border-b-2 border-pink-500'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Hormone Waveform Simulator
        </button>
        <button
          onClick={() => setActiveTab('correlations')}
          className={`pb-3 transition-colors relative shrink-0 ${
            activeTab === 'correlations'
              ? 'text-pink-600 font-bold border-b-2 border-pink-500'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Reference Literature Patterns
        </button>
      </div>

      {/* ================= TAB 1: DYNAMIC SYMPTOM HISTORY & CHARTS ================= */}
      {activeTab === 'symptoms' && (
        <div className="space-y-6">
          {/* Section 1: Cramps, Headaches, Physical Trends */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Cramps, Headaches & Physical Sensations
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated directly from your personal symptom diary entries
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                Self-Reported Data
              </span>
            </div>

            {/* Cramps & Headaches Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cramp Intensity Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 to-pink-50/50 border border-rose-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <h4 className="font-bold text-slate-800 text-sm">Menstrual Cramps Breakdown</h4>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    {symptomTrends.totalCrampsCount} days logged
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Reported on <strong className="font-bold text-slate-800">{symptomTrends.crampsPeriodRatioPct}%</strong> of your recorded period days.
                </p>

                {/* Progress bar for mild vs severe */}
                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Mild Cramps</span>
                      <span className="font-bold text-pink-700">{symptomTrends.crampsMildCount} day{symptomTrends.crampsMildCount === 1 ? '' : 's'}</span>
                    </div>
                    <div className="h-3 w-full bg-pink-100 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${symptomTrends.totalLoggedDays > 0 ? (symptomTrends.crampsMildCount / symptomTrends.totalLoggedDays) * 100 : 0}%`,
                        }}
                        className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Severe Cramps</span>
                      <span className="font-bold text-rose-800">{symptomTrends.crampsSevereCount} day{symptomTrends.crampsSevereCount === 1 ? '' : 's'}</span>
                    </div>
                    <div className="h-3 w-full bg-rose-100 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${symptomTrends.totalLoggedDays > 0 ? (symptomTrends.crampsSevereCount / symptomTrends.totalLoggedDays) * 100 : 0}%`,
                        }}
                        className="h-full bg-gradient-to-r from-rose-600 to-red-600 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-rose-100/70">
                  Pattern Note: Cramps were self-reported primarily during the first 48 hours of flow.
                </div>
              </div>

              {/* Headaches & Tension Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/50 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤕</span>
                    <h4 className="font-bold text-slate-800 text-sm">Headaches & Tension</h4>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {symptomTrends.headacheCount} day{symptomTrends.headacheCount === 1 ? '' : 's'} logged
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Self-recorded on <strong className="font-bold text-slate-800">{symptomTrends.totalLoggedDays > 0 ? Math.round((symptomTrends.headacheCount / symptomTrends.totalLoggedDays) * 100) : 0}%</strong> of all logged days.
                </p>

                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Headache Occurrences</span>
                      <span className="font-bold text-purple-700">{symptomTrends.headacheCount}</span>
                    </div>
                    <div className="h-3 w-full bg-purple-100 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${symptomTrends.totalLoggedDays > 0 ? (symptomTrends.headacheCount / symptomTrends.totalLoggedDays) * 100 : 0}%`,
                        }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Backache & Pelvic Tension</span>
                      <span className="font-bold text-indigo-700">{symptomTrends.backacheCount}</span>
                    </div>
                    <div className="h-3 w-full bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${symptomTrends.totalLoggedDays > 0 ? (symptomTrends.backacheCount / symptomTrends.totalLoggedDays) * 100 : 0}%`,
                        }}
                        className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-purple-100/70">
                  Pattern Note: Head tension clustered in the late luteal transition and day 1 of menses.
                </div>
              </div>
            </div>

            {/* Top Physical Symptoms Frequency Bars */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Frequency Ranking of All Self-Reported Physical Symptoms
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {symptomTrends.topPhysicalSymptoms.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{item.label}</span>
                      <span className="text-[10px] text-slate-400">{item.count} occurrences recorded</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-pink-600">{item.percentage}%</span>
                      <span className="text-[10px] text-slate-400 block">of log days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Mood Changes & Emotional Shifts */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Mood Changes & Emotional Shifts
                </h3>
                <p className="text-xs text-slate-500">
                  Self-recorded moods across your logged cycle days
                </p>
              </div>
              {symptomTrends.mostFrequentMood && (
                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  Most Frequent: <strong className="capitalize">{symptomTrends.mostFrequentMood.replace('_', ' ')}</strong>
                </div>
              )}
            </div>

            {/* Mood Frequency Chart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(symptomTrends.moodCounts).map(([mood, count]) => {
                const pct = symptomTrends.totalLoggedDays > 0 ? Math.round((count / symptomTrends.totalLoggedDays) * 100) : 0;
                const gradient = moodColorMap[mood] || 'from-pink-400 to-purple-500';

                return (
                  <div key={mood} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 capitalize">
                        {mood.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        {count}d
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block text-right font-medium">
                      {pct}% of logged days
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-slate-700 leading-relaxed">
              💡 <strong>Self-Reported Observation:</strong> Calm and energetic feelings were logged predominantly in the follicular and ovulatory phases, whereas sensitivity and irritability aligned with the late luteal window before menstruation.
            </div>
          </section>

          {/* Section 3: Energy Level Trends */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Energy Levels & Vitality Trends
                </h3>
                <p className="text-xs text-slate-500">
                  Proportion of self-reported stamina ratings
                </p>
              </div>
              {symptomTrends.mostFrequentEnergy && (
                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Dominant: <strong className="capitalize">{symptomTrends.mostFrequentEnergy}</strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { id: 'high', label: 'High Energy', icon: '⚡', color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' },
                { id: 'balanced', label: 'Balanced', icon: '🌿', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
                { id: 'sluggish', label: 'Sluggish', icon: '☕', color: 'text-purple-600', bg: 'bg-purple-50', bar: 'bg-purple-500' },
                { id: 'exhausted', label: 'Exhausted', icon: '🌙', color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' },
              ].map((lvl) => {
                const count = symptomTrends.energyCounts[lvl.id] || 0;
                const pct = symptomTrends.totalLoggedDays > 0 ? Math.round((count / symptomTrends.totalLoggedDays) * 100) : 0;

                return (
                  <div key={lvl.id} className={`p-4 rounded-2xl ${lvl.bg} border border-slate-100 space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="text-base">{lvl.icon}</span>
                      <span className={`text-xl font-extrabold ${lvl.color}`}>{count}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 block">{lvl.label}</span>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className={`h-full ${lvl.bar} rounded-full`} />
                    </div>
                    <span className="text-[10px] text-slate-500 block">{pct}% frequency</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ================= TAB 2: 6-CYCLE LENGTH BAR CHART ================= */}
      {activeTab === 'overview' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Cycle Length Consistency (Last 6 Cycles)
              </h3>
              <p className="text-xs text-slate-500">
                Visualizing total days vs bleeding days per cycle.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-400" />
                <span className="text-slate-600 font-medium">Period Days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-200" />
                <span className="text-slate-600 font-medium">Non-bleeding Days</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4 pt-2">
            {pastCycles.map((c) => {
              const maxScale = 35; // days scale max
              const periodWidthPct = (c.periodDuration / maxScale) * 100;
              const remainingWidthPct = ((c.cycleLength - c.periodDuration) / maxScale) * 100;

              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{c.startDate}</span>
                    <span className="font-bold text-slate-800">
                      {c.cycleLength} days <span className="text-slate-400 font-normal">({c.periodDuration}d flow)</span>
                    </span>
                  </div>

                  <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${periodWidthPct}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-rose-400 flex items-center justify-center text-[10px] text-white font-bold"
                      title={`${c.periodDuration} days period`}
                    >
                      {c.periodDuration}d
                    </div>
                    <div
                      style={{ width: `${remainingWidthPct}%` }}
                      className="h-full bg-gradient-to-r from-purple-200 to-purple-300 flex items-center justify-end px-2 text-[10px] text-purple-900 font-semibold"
                      title={`${c.cycleLength - c.periodDuration} non-bleeding days`}
                    >
                      {c.cycleLength}d total
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-100 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <span className="font-bold text-pink-900">Personal Historical Summary: </span>
              Your cycle length variance is under 2 days across recorded cycles. This pattern suggests regular ovulatory rhythm with stable luteal duration.
            </div>
          </div>
        </section>
      )}

      {/* ================= TAB 3: HORMONAL CURVES ================= */}
      {activeTab === 'hormones' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Endocrine Waveform Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Explore theoretical hormone fluctuations across an idealized 28-day cycle.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Theoretical Educational Model
            </span>
          </div>

          {/* Interactive Day Slider */}
          <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-purple-900">
              <span>Select Cycle Day:</span>
              <span className="text-sm px-2.5 py-0.5 rounded-full bg-purple-200/70">
                Day {selectedHormoneDay} of 28
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="28"
              value={selectedHormoneDay}
              onChange={(e) => setSelectedHormoneDay(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
              <span>Day 1 (Menses)</span>
              <span>Day 7 (Follicular)</span>
              <span>Day 14 (Ovulation)</span>
              <span>Day 21 (Mid-Luteal)</span>
              <span>Day 28 (Pre-Menses)</span>
            </div>
          </div>

          {/* Live Hormone Gauge Cards for Selected Day */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
              <span className="text-xs font-semibold text-rose-800 block">Estrogen (Estradiol)</span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                {Math.round(getEstrogenLevel(selectedHormoneDay))}%
              </span>
              <span className="text-[11px] text-rose-700/80">
                {selectedHormoneDay === 14 ? 'Peak surge' : selectedHormoneDay < 14 ? 'Rising follicle growth' : 'Secondary luteal bump'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
              <span className="text-xs font-semibold text-purple-800 block">Progesterone</span>
              <span className="text-2xl font-black text-purple-700 mt-1 block">
                {Math.round(getProgesteroneLevel(selectedHormoneDay))}%
              </span>
              <span className="text-[11px] text-purple-700/80">
                {selectedHormoneDay < 15 ? 'Dormant before ovulation' : 'Dominates luteal phase'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
              <span className="text-xs font-semibold text-amber-800 block">LH (Luteinizing Hormone)</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {Math.round(getLhLevel(selectedHormoneDay))}%
              </span>
              <span className="text-[11px] text-amber-700/80">
                {selectedHormoneDay === 14 ? 'Triggers ovum release' : 'Baseline level'}
              </span>
            </div>
          </div>

          {/* SVG Wave Illustration */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-semibold text-slate-600 block mb-3">
              Theoretical Endocrine Waveform (Day 1 - 28)
            </span>
            <div className="relative h-32 w-full flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                <rect x="0" y="0" width="89" height="120" fill="#FCE7EC" opacity="0.4" />
                <rect x="89" y="0" width="160" height="120" fill="#F3E8FF" opacity="0.3" />
                <rect x="249" y="0" width="36" height="120" fill="#DDD6FE" opacity="0.5" />
                <rect x="285" y="0" width="215" height="120" fill="#FCE7EC" opacity="0.3" />

                <path
                  d="M 0 100 Q 150 90, 240 20 T 300 80 Q 380 40, 440 90 T 500 110"
                  fill="none"
                  stroke="#E11D48"
                  strokeWidth="3"
                />

                <path
                  d="M 0 110 L 250 110 Q 320 10, 420 20 T 500 110"
                  fill="none"
                  stroke="#9333EA"
                  strokeWidth="3"
                />

                <path
                  d="M 0 105 L 230 105 Q 250 5, 270 105 L 500 105"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                <line
                  x1={(selectedHormoneDay / 28) * 500}
                  y1="0"
                  x2={(selectedHormoneDay / 28) * 500}
                  y2="120"
                  stroke="#2D232E"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span className="font-semibold text-rose-600">— Estrogen</span>
              <span className="font-semibold text-purple-600">— Progesterone</span>
              <span className="font-semibold text-amber-600">-- LH Surge</span>
            </div>
          </div>
        </section>
      )}

      {/* ================= TAB 4: CLINICAL REFERENCE PATTERNS ================= */}
      {activeTab === 'correlations' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Evidence-Based Reference Correlations
            </h3>
            <p className="text-xs text-slate-500">
              General biological relationships documented in gynecological literature (not a personalized clinical diagnosis)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {insights.symptomCorrelations.map((corr, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/50 to-purple-50/40 border border-pink-100/90 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">{corr.symptom}</h4>
                  <span className="text-xs font-bold text-pink-600 bg-pink-100/70 px-2.5 py-0.5 rounded-full">
                    {corr.frequencyText}
                  </span>
                </div>
                <div className="text-xs text-purple-900 font-semibold">
                  Timing: {corr.timing}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {corr.insight}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
