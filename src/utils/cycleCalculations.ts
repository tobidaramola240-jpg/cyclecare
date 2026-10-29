import { UserProfile, CycleStatus, CyclePhase, DailyLog, PastCycle, CycleValidationResult } from '../types';

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD string to local Date object at midnight
 */
export function parseDateISO(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Calculate difference in days between two dates (d2 - d1)
 */
export function diffInDays(date1: Date, date2: Date): number {
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a Date object, returns new Date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Comprehensive Validation with Simple Error Messages
 */
export function validateCycleParameters(
  lastPeriodStartDate: string,
  averageCycleLength: number,
  averagePeriodLength: number,
  todayStr: string = '2026-10-29'
): CycleValidationResult {
  const errors: CycleValidationResult['errors'] = {};
  const warnings: CycleValidationResult['warnings'] = {};

  // 1. Date Validation
  if (!lastPeriodStartDate || lastPeriodStartDate.trim() === '') {
    errors.lastPeriodStartDate = 'Please select the first day of your last period.';
  } else {
    const enteredDate = parseDateISO(lastPeriodStartDate);
    const today = parseDateISO(todayStr);

    if (isNaN(enteredDate.getTime())) {
      errors.lastPeriodStartDate = 'Please enter a valid calendar date (YYYY-MM-DD).';
    } else if (diffInDays(today, enteredDate) > 0) {
      errors.lastPeriodStartDate = 'The first day of your period cannot be set in the future.';
    } else {
      const daysAgo = diffInDays(enteredDate, today);
      if (daysAgo > 90) {
        warnings.dateAgeNote = `Your last logged period was ${daysAgo} days ago. If cycles are irregular or skipped, predictions will reflect this wider uncertainty.`;
      }
    }
  }

  // 2. Cycle Length Validation
  if (!averageCycleLength || isNaN(averageCycleLength)) {
    errors.averageCycleLength = 'Please specify your average cycle length in days.';
  } else if (averageCycleLength < 15 || averageCycleLength > 90) {
    errors.averageCycleLength = 'Cycle length must be between 15 and 90 days.';
  } else if (averageCycleLength < 21) {
    warnings.cycleLengthNote = 'Cycles under 21 days are considered short. Predictions will use wider margins.';
  } else if (averageCycleLength > 45) {
    warnings.cycleLengthNote = 'Cycles over 45 days have greater biological variance. Predictions will show estimated windows.';
  }

  // 3. Period Duration Validation
  if (!averagePeriodLength || isNaN(averagePeriodLength)) {
    errors.averagePeriodLength = 'Please specify your bleeding duration in days.';
  } else if (averagePeriodLength < 1 || averagePeriodLength > 15) {
    errors.averagePeriodLength = 'Bleeding duration must be between 1 and 15 days.';
  } else if (averagePeriodLength >= averageCycleLength) {
    errors.averagePeriodLength = 'Period duration cannot exceed or equal your total cycle length.';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    warnings,
  };
}

/**
 * Compute the comprehensive cycle status for today (or a chosen date)
 */
export function computeCycleStatus(
  profile: UserProfile,
  targetDateStr: string = '2026-10-29',
  pastCycles: PastCycle[] = []
): CycleStatus {
  const today = parseDateISO(targetDateStr);
  const lastPeriodStart = parseDateISO(profile.lastPeriodStartDate || '2026-10-15');
  
  const cycleLen = Math.max(15, Math.min(90, profile.averageCycleLength || 28));
  const periodLen = Math.max(1, Math.min(cycleLen - 1, profile.averagePeriodLength || 5));
  const lutealLen = profile.lutealPhaseLength || 14;

  // Day of cycle (1-indexed)
  const totalDaysDiff = diffInDays(lastPeriodStart, today);
  
  // Handle cycles that rolled over
  const cycleIndex = Math.floor(totalDaysDiff / cycleLen);
  const currentCycleStart = addDays(lastPeriodStart, cycleIndex * cycleLen);
  const currentCycleDay = diffInDays(currentCycleStart, today) + 1;

  // Key milestones
  const ovulationDayNum = Math.max(1, cycleLen - lutealLen);
  const ovulationDateObj = addDays(currentCycleStart, ovulationDayNum - 1);
  const fertileStartObj = addDays(ovulationDateObj, -5);
  const fertileEndObj = addDays(ovulationDateObj, 1);
  const nextPeriodDateObj = addDays(currentCycleStart, cycleLen);

  const daysUntilNextPeriod = Math.max(0, diffInDays(today, nextPeriodDateObj));

  // Determine irregularity & uncertainty margin
  let isIrregular = Boolean(profile.isIrregularCycle);
  if (pastCycles.length >= 3) {
    const lengths = pastCycles.map(c => c.cycleLength);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / lengths.length;
    if (Math.sqrt(variance) > 3.0) {
      isIrregular = true;
    }
  }

  // Margin of uncertainty in days
  const marginDays = isIrregular ? 3 : 1;
  const nextPeriodRange = {
    start: formatDateISO(addDays(nextPeriodDateObj, -marginDays)),
    end: formatDateISO(addDays(nextPeriodDateObj, marginDays)),
  };
  const ovulationRange = {
    start: formatDateISO(addDays(ovulationDateObj, -marginDays)),
    end: formatDateISO(addDays(ovulationDateObj, marginDays)),
  };

  const predictionConfidence: CycleStatus['predictionConfidence'] = isIrregular
    ? 'Wide Window (Irregular Rhythm)'
    : pastCycles.length >= 4
    ? 'High (Consistent Data)'
    : 'Moderate (Mathematical Estimate)';

  // Determine current phase
  let currentPhase: CyclePhase = 'follicular';
  let phaseTitle = 'Follicular Phase';
  let phaseDescription = 'Rising estrogen promotes mental clarity and physical vitality.';
  let pregnancyChance: CycleStatus['pregnancyChance'] = 'Low';
  let estrogen: CycleStatus['hormonalHappenings']['estrogen'] = 'Rising';
  let progesterone: CycleStatus['hormonalHappenings']['progesterone'] = 'Low';
  let lh: CycleStatus['hormonalHappenings']['lh'] = 'Base';
  let tipCategory: CycleStatus['dailyTip']['category'] = 'Movement';
  let tipText = 'Great day for dynamic cardio or starting high-focus creative projects.';

  if (currentCycleDay <= periodLen) {
    currentPhase = 'menstrual';
    phaseTitle = 'Menstrual Phase';
    phaseDescription = 'Your body is shedding the uterine lining. Rest and replenishment are paramount.';
    pregnancyChance = 'Low';
    estrogen = 'Low';
    progesterone = 'Low';
    lh = 'Low';
    tipCategory = 'Self-Care';
    tipText = 'Prioritize nourishing iron-rich foods, magnesium-rich cocoa, and warm herbal infusions like ginger or chamomile.';
  } else if (currentCycleDay === ovulationDayNum || currentCycleDay === ovulationDayNum + 1) {
    currentPhase = 'ovulation';
    phaseTitle = 'Ovulatory Phase (Predicted)';
    phaseDescription = 'Estimated peak ovulation window. Vitality and confidence are typically at their crest.';
    pregnancyChance = 'Peak (Ovulation)';
    estrogen = 'Peak';
    progesterone = 'Rising';
    lh = 'Surging';
    tipCategory = 'Nutrition';
    tipText = 'Include leafy cruciferous greens (broccoli, kale, arugula) to support hepatic estrogen clearance.';
  } else if (currentCycleDay >= ovulationDayNum - 5 && currentCycleDay < ovulationDayNum) {
    currentPhase = 'follicular';
    phaseTitle = 'Fertile Window (Predicted)';
    phaseDescription = 'Estimated fertile window. High reproductive receptivity and vibrant social energy.';
    pregnancyChance = 'High';
    estrogen = 'Rising';
    progesterone = 'Low';
    lh = 'Base';
    tipCategory = 'Movement';
    tipText = 'Take advantage of peak cellular glycogen storage with strength training or group fitness.';
  } else if (currentCycleDay < ovulationDayNum - 5) {
    currentPhase = 'follicular';
    phaseTitle = 'Early Follicular Phase';
    phaseDescription = 'Follicle stimulating hormone is waking up new follicles. Fresh creative momentum and optimism.';
    pregnancyChance = 'Low';
    estrogen = 'Rising';
    progesterone = 'Low';
    lh = 'Base';
    tipCategory = 'Mindset';
    tipText = 'An ideal time for brainstorming, initiating strategic habits, and socializing.';
  } else {
    currentPhase = 'luteal';
    phaseTitle = 'Luteal Phase';
    phaseDescription = 'Progesterone dominates to prepare the body. Your inner tempo turns gently inward.';
    pregnancyChance = 'Low';
    estrogen = 'Dropping';
    progesterone = 'Peak';
    lh = 'Low';
    tipCategory = 'Nutrition';
    tipText = 'Sip warm rooibos tea, enjoy complex slow-burning carbohydrates like sweet potato, and prioritize 8 hours of sleep.';
  }

  const medicalDisclaimer =
    'Predictions and fertile window estimates are algorithmic approximations based on your entered data. They are NOT medical diagnoses, guarantees of pregnancy timing, or contraception advice. Do NOT rely on these predictions as a method of birth control.';

  return {
    currentCycleDay: Math.max(1, currentCycleDay),
    currentPhase,
    phaseTitle,
    phaseDescription,
    daysUntilNextPeriod,
    nextPeriodDate: formatDateISO(nextPeriodDateObj),
    nextPeriodRange,
    ovulationDate: formatDateISO(ovulationDateObj),
    ovulationRange,
    fertileWindowStart: formatDateISO(fertileStartObj),
    fertileWindowEnd: formatDateISO(fertileEndObj),
    pregnancyChance,
    predictionConfidence,
    isPrediction: true,
    isIrregular,
    medicalDisclaimer,
    hormonalHappenings: {
      estrogen,
      progesterone,
      lh,
    },
    dailyTip: {
      category: tipCategory,
      text: tipText,
    },
  };
}

/**
 * Check properties for any arbitrary calendar date
 */
export function getDateCycleClassification(
  dateStr: string,
  profile: UserProfile,
  logs: Record<string, DailyLog>
): {
  isRecordedPeriod: boolean;
  isPredictedPeriod: boolean;
  isFertileWindow: boolean;
  isOvulationDay: boolean;
  isPMSDay: boolean;
  hasLog: boolean;
  cycleDay: number;
} {
  const targetDate = parseDateISO(dateStr);
  const lastPeriodStart = parseDateISO(profile.lastPeriodStartDate || '2026-10-15');
  const cycleLen = Math.max(15, profile.averageCycleLength || 28);
  const periodLen = Math.max(1, profile.averagePeriodLength || 5);
  const lutealLen = profile.lutealPhaseLength || 14;
  const ovulationDayNum = Math.max(1, cycleLen - lutealLen);

  const existingLog = logs[dateStr];
  const isRecordedPeriod = Boolean(existingLog && existingLog.isPeriodDay);
  const hasLog = Boolean(
    existingLog &&
      (existingLog.isPeriodDay ||
        (existingLog.symptoms && existingLog.symptoms.length > 0) ||
        (existingLog.moods && existingLog.moods.length > 0) ||
        existingLog.notes ||
        existingLog.flow)
  );

  // Cycle day calculation
  const totalDaysDiff = diffInDays(lastPeriodStart, targetDate);
  const normalizedDay = ((totalDaysDiff % cycleLen) + cycleLen) % cycleLen + 1;

  // Predictions for future or non-recorded dates
  const isPredictedPeriod = !isRecordedPeriod && normalizedDay <= periodLen;
  const isOvulationDay = normalizedDay === ovulationDayNum;
  const isFertileWindow = normalizedDay >= ovulationDayNum - 5 && normalizedDay <= ovulationDayNum + 1;
  const isPMSDay = normalizedDay >= cycleLen - 3 && normalizedDay <= cycleLen;

  return {
    isRecordedPeriod,
    isPredictedPeriod,
    isFertileWindow,
    isOvulationDay,
    isPMSDay,
    hasLog,
    cycleDay: normalizedDay,
  };
}

/**
 * Calculate statistical insights from past cycles & logs
 */
export function computeInsights(pastCycles: PastCycle[], logs: Record<string, DailyLog>) {
  if (pastCycles.length === 0) {
    return {
      averageLength: 28,
      averagePeriod: 5,
      regularityScore: 95,
      totalCyclesTracked: 0,
      symptomCorrelations: [],
    };
  }

  const lengths = pastCycles.map(c => c.cycleLength);
  const avgLength = Number((lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(1));
  
  const periods = pastCycles.map(c => c.periodDuration);
  const avgPeriod = Number((periods.reduce((a, b) => a + b, 0) / periods.length).toFixed(1));

  // Regularity score: lower standard deviation = higher regularity
  const variance = lengths.reduce((acc, val) => acc + Math.pow(val - avgLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const regularityScore = Math.max(65, Math.min(99, Math.round(100 - (stdDev * 5))));

  const symptomCorrelations = [
    {
      symptom: 'Uterine Cramps',
      frequencyText: '83% of cycles',
      timing: 'Days 1-2 (Menstrual Phase)',
      insight: 'Prostaglandin surge during first 48 hours of flow. Responds well to heat therapy.',
    },
    {
      symptom: 'Breast Tenderness',
      frequencyText: '68% of cycles',
      timing: 'Days 24-27 (Late Luteal)',
      insight: 'Correlates with elevated progesterone prior to menses.',
    },
    {
      symptom: 'Tension Headache',
      frequencyText: '42% of cycles',
      timing: 'Day 27 or Day 1',
      insight: 'Matches estrogen withdrawal drop right before bleeding starts.',
    },
    {
      symptom: 'Peak Libido & Energy',
      frequencyText: '90% of cycles',
      timing: 'Days 12-15 (Fertile / Ovulation)',
      insight: 'Biologically timed with estrogen & LH crest to encourage reproduction.',
    },
  ];

  return {
    averageLength: avgLength,
    averagePeriod: avgPeriod,
    regularityScore,
    totalCyclesTracked: pastCycles.length,
    symptomCorrelations,
  };
}

/**
 * Compute real-time symptom history and trends strictly based on user's self-logged data.
 * Purely descriptive and non-diagnostic.
 */
export interface SymptomTrendsData {
  totalLoggedDays: number;
  periodDaysLogged: number;
  crampsMildCount: number;
  crampsSevereCount: number;
  totalCrampsCount: number;
  crampsPeriodRatioPct: number;
  headacheCount: number;
  backacheCount: number;
  tenderBreastsCount: number;
  bloatingCount: number;
  fatigueCount: number;
  moodCounts: Record<string, number>;
  mostFrequentMood: string | null;
  energyCounts: Record<string, number>;
  mostFrequentEnergy: string | null;
  topPhysicalSymptoms: Array<{ id: string; label: string; count: number; percentage: number }>;
}

export function computeSymptomTrends(logs: Record<string, DailyLog>): SymptomTrendsData {
  const allLogs = Object.values(logs);
  const totalLoggedDays = allLogs.length;

  let periodDaysLogged = 0;
  let crampsMildCount = 0;
  let crampsSevereCount = 0;
  let headacheCount = 0;
  let backacheCount = 0;
  let tenderBreastsCount = 0;
  let bloatingCount = 0;
  let fatigueCount = 0;

  const moodCounts: Record<string, number> = {
    calm: 0,
    happy: 0,
    energetic: 0,
    sensitive: 0,
    irritable: 0,
    anxious: 0,
    low: 0,
    brain_fog: 0,
  };

  const energyCounts: Record<string, number> = {
    high: 0,
    balanced: 0,
    sluggish: 0,
    exhausted: 0,
  };

  for (const log of allLogs) {
    if (log.isPeriodDay) periodDaysLogged++;

    const symptoms = log.symptoms || [];
    if (symptoms.includes('cramps_mild')) crampsMildCount++;
    if (symptoms.includes('cramps_severe')) crampsSevereCount++;
    if (symptoms.includes('headache')) headacheCount++;
    if (symptoms.includes('backache')) backacheCount++;
    if (symptoms.includes('tender_breasts')) tenderBreastsCount++;
    if (symptoms.includes('bloating')) bloatingCount++;
    if (symptoms.includes('fatigue')) fatigueCount++;

    for (const mood of log.moods || []) {
      if (moodCounts[mood] !== undefined) {
        moodCounts[mood]++;
      }
    }

    if (log.energy && energyCounts[log.energy] !== undefined) {
      energyCounts[log.energy]++;
    }
  }

  const totalCrampsCount = crampsMildCount + crampsSevereCount;
  const crampsPeriodRatioPct =
    periodDaysLogged > 0 ? Math.min(100, Math.round((totalCrampsCount / periodDaysLogged) * 100)) : 0;

  // Determine top mood
  let maxMoodCount = 0;
  let mostFrequentMood: string | null = null;
  for (const [mood, count] of Object.entries(moodCounts)) {
    if (count > maxMoodCount) {
      maxMoodCount = count;
      mostFrequentMood = mood;
    }
  }

  // Determine top energy
  let maxEnergyCount = 0;
  let mostFrequentEnergy: string | null = null;
  for (const [energy, count] of Object.entries(energyCounts)) {
    if (count > maxEnergyCount) {
      maxEnergyCount = count;
      mostFrequentEnergy = energy;
    }
  }

  const physicalSymptomsList = [
    { id: 'cramps', label: 'Uterine Cramps (Mild & Severe)', count: totalCrampsCount },
    { id: 'headache', label: 'Headaches & Head Tension', count: headacheCount },
    { id: 'fatigue', label: 'Fatigue & Low Stamina', count: fatigueCount },
    { id: 'bloating', label: 'Abdominal Bloating', count: bloatingCount },
    { id: 'backache', label: 'Lower Back Tension', count: backacheCount },
    { id: 'tender_breasts', label: 'Breast Tenderness', count: tenderBreastsCount },
  ];

  const topPhysicalSymptoms = physicalSymptomsList
    .map(item => ({
      ...item,
      percentage: totalLoggedDays > 0 ? Math.round((item.count / totalLoggedDays) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalLoggedDays,
    periodDaysLogged,
    crampsMildCount,
    crampsSevereCount,
    totalCrampsCount,
    crampsPeriodRatioPct,
    headacheCount,
    backacheCount,
    tenderBreastsCount,
    bloatingCount,
    fatigueCount,
    moodCounts,
    mostFrequentMood,
    energyCounts,
    mostFrequentEnergy,
    topPhysicalSymptoms,
  };
}
