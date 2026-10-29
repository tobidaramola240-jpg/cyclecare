import React from 'react';
import { UserProfile, PastCycle, DailyLog } from '../types';
import { computeInsights } from '../utils/cycleCalculations';

interface DoctorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  pastCycles: PastCycle[];
  logs: Record<string, DailyLog>;
}

export const DoctorReportModal: React.FC<DoctorReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  pastCycles,
  logs,
}) => {
  if (!isOpen) return null;

  const insights = computeInsights(pastCycles, logs);
  const printReport = () => {
    window.print();
  };

  const patientIdentifier = profile.isAnonymous ? 'Anonymous Patient (ID: CC-8924)' : profile.name;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 shadow-2xl relative my-auto print:border-none print:shadow-none print:max-w-none print:max-h-none">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
              📋
            </span>
            <span className="text-sm font-bold text-slate-800">Clinical Gynecological Summary</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={printReport}
              className="py-1.5 px-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= PRINTABLE CLINICAL DOCUMENT ================= */}
        <div className="space-y-6 text-slate-800 font-sans text-xs">
          {/* Document Title Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                CycleCare · Menstrual & Endocrine History Report
              </h1>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Generated from objective on-device biometric logging
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <span className="font-bold block text-slate-800">Date: {new Date().toLocaleDateString()}</span>
              <span>Report Ref: CC-2026-MED</span>
            </div>
          </div>

          {/* Patient Details & Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Patient</span>
              <span className="font-bold text-slate-800 text-sm">{patientIdentifier}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Avg Cycle Length</span>
              <span className="font-bold text-slate-800 text-sm">{insights.averageLength} days</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Bleeding Duration</span>
              <span className="font-bold text-slate-800 text-sm">{insights.averagePeriod} days</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Regularity Index</span>
              <span className="font-bold text-emerald-700 text-sm">{insights.regularityScore}% (Regular)</span>
            </div>
          </div>

          {/* Past 6 Cycles Table */}
          <div>
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              1. Recent Menstrual Cycles Recorded (Last 6 Months)
            </h3>
            <table className="w-full border-collapse border border-slate-200 text-left">
              <thead>
                <tr className="bg-slate-100 text-[10px] text-slate-600 font-bold uppercase">
                  <th className="border border-slate-200 p-2">Cycle Start Date</th>
                  <th className="border border-slate-200 p-2">Cycle Length</th>
                  <th className="border border-slate-200 p-2">Flow Duration</th>
                  <th className="border border-slate-200 p-2">Ovulation Window</th>
                  <th className="border border-slate-200 p-2">Reported Symptoms</th>
                </tr>
              </thead>
              <tbody>
                {pastCycles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 text-[11px]">
                    <td className="border border-slate-200 p-2 font-medium">{c.startDate}</td>
                    <td className="border border-slate-200 p-2 font-bold">{c.cycleLength} days</td>
                    <td className="border border-slate-200 p-2">{c.periodDuration} days</td>
                    <td className="border border-slate-200 p-2">{c.ovulationDate}</td>
                    <td className="border border-slate-200 p-2 text-slate-600">
                      {c.symptomsSummary.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Symptom Frequency & Correlated Timing */}
          <div>
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              2. Recurring Symptom Frequencies & Clinical Correlations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {insights.symptomCorrelations.map((s, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{s.symptom}</span>
                    <span className="text-purple-700">{s.frequencyText}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Timing: {s.timing}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{s.insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Note Footer */}
          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 space-y-1">
            <p>
              * Confidential Medical Summary for patient-doctor review. This document summarizes self-reported logs and mathematical cycle models. It does not replace independent diagnostic imaging or laboratory bloodwork.
            </p>
            <p>Exported from CycleCare 1.0 (Privacy-First Architecture).</p>
          </div>
        </div>

        {/* Close Button at Bottom */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
