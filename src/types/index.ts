export type PageId = 
  | 'onboarding'
  | 'dashboard'
  | 'calendar'
  | 'tracker'
  | 'insights'
  | 'education'
  | 'settings';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export type FlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export type MoodType = 
  | 'calm'
  | 'happy'
  | 'energetic'
  | 'sensitive'
  | 'irritable'
  | 'anxious'
  | 'low'
  | 'brain_fog';

export type PhysicalSymptom = 
  | 'cramps_mild'
  | 'cramps_severe'
  | 'backache'
  | 'tender_breasts'
  | 'headache'
  | 'bloating'
  | 'pelvic_pressure'
  | 'nausea'
  | 'acne'
  | 'fatigue';

export type CervicalFluid = 
  | 'dry'
  | 'sticky'
  | 'creamy'
  | 'egg_white'
  | 'watery';

export type EnergyLevel = 'high' | 'balanced' | 'sluggish' | 'exhausted';

export type SleepQuality = 'restful' | 'fair' | 'restless';

export type LibidoLevel = 'high' | 'moderate' | 'low';

export type SexActivity = 'none' | 'protected' | 'unprotected' | 'high_drive';

export interface DailyLog {
  date: string; // ISO format: YYYY-MM-DD
  isPeriodDay: boolean;
  flow?: FlowLevel;
  symptoms: PhysicalSymptom[];
  moods: MoodType[];
  cervicalFluid?: CervicalFluid;
  energy?: EnergyLevel;
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  waterGlasses?: number; // 0-12
  libido?: LibidoLevel;
  sexActivity?: SexActivity;
  temperature?: number; // Basal body temp e.g. 98.2
  notes?: string;
  pillTaken?: boolean;
}

export interface PastCycle {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  cycleLength: number; // in days
  periodDuration: number; // in days
  ovulationDate: string;
  symptomsSummary: string[];
}

export interface UserProfile {
  name: string;
  isAnonymous: boolean;
  goal: 'track_period' | 'conceive' | 'symptoms' | 'perimenopause';
  lastPeriodStartDate: string; // YYYY-MM-DD
  averageCycleLength: number; // e.g. 28 (validated 15-90)
  averagePeriodLength: number; // e.g. 5 (validated 1-15, < cycleLength)
  lutealPhaseLength: number; // e.g. 14
  isIrregularCycle?: boolean; // User toggled irregular cycle
  pinLockEnabled: boolean;
  pinCode?: string;
  biometricSimulation: boolean;
  discreetNotifications: boolean;
  periodReminderEnabled?: boolean;
  periodReminderDaysBefore: number;
  fertileAlert: boolean;
  pillReminderEnabled: boolean;
  pillReminderTime: string; // e.g. "09:00"
  hasCompletedOnboarding: boolean;
}

export interface ArticleSource {
  title: string;
  citation: string;
  year?: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: 'all' | 'basics' | 'hormones' | 'nutrition' | 'fertility' | 'wellness';
  readTimeMinutes: number;
  featuredImage: string;
  author: string;
  authorTitle: string;
  publishDate: string;
  medicalReviewer?: string;
  medicalReviewerTitle?: string;
  reviewDate?: string;
  sources?: ArticleSource[];
  disclaimer?: string;
  isBookmarked?: boolean;
  summary: string;
  keyTakeaways: string[];
  contentParagraphs: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  mythStatement: string;
  isFact: boolean;
  explanation: string;
  scientificReference: string;
}

export interface CycleStatus {
  currentCycleDay: number;
  currentPhase: CyclePhase;
  phaseTitle: string;
  phaseDescription: string;
  daysUntilNextPeriod: number;
  nextPeriodDate: string;
  nextPeriodRange: {
    start: string;
    end: string;
  };
  ovulationDate: string;
  ovulationRange: {
    start: string;
    end: string;
  };
  fertileWindowStart: string;
  fertileWindowEnd: string;
  pregnancyChance: 'Low' | 'Moderate' | 'High' | 'Peak (Ovulation)';
  predictionConfidence: 'High (Consistent Data)' | 'Moderate (Mathematical Estimate)' | 'Wide Window (Irregular Rhythm)';
  isPrediction: boolean;
  isIrregular: boolean;
  medicalDisclaimer: string;
  hormonalHappenings: {
    estrogen: 'Rising' | 'Peak' | 'Dropping' | 'Low';
    progesterone: 'Low' | 'Rising' | 'Peak' | 'Dropping';
    lh: 'Base' | 'Surging' | 'Low';
  };
  dailyTip: {
    category: 'Nutrition' | 'Movement' | 'Mindset' | 'Self-Care';
    text: string;
  };
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export interface CycleValidationResult {
  isValid: boolean;
  errors: {
    lastPeriodStartDate?: string;
    averageCycleLength?: string;
    averagePeriodLength?: string;
  };
  warnings: {
    cycleLengthNote?: string;
    dateAgeNote?: string;
  };
}

// =====================================================================
// Supabase Authentication & Sync Types
// =====================================================================

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  isAnonymous?: boolean;
  createdAt?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'config';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt?: string | null;
  error?: string | null;
}
