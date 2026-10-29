import { UserProfile, DailyLog, PastCycle, Article } from '../types';
import { DEFAULT_USER_PROFILE, INITIAL_LOGS, INITIAL_PAST_CYCLES, ARTICLES_DATA } from '../data/sampleData';

const KEY_PROFILE = 'cyclecare_user_profile_v1';
const KEY_LOGS = 'cyclecare_daily_logs_v1';
const KEY_PAST_CYCLES = 'cyclecare_past_cycles_v1';
const KEY_BOOKMARKS = 'cyclecare_bookmarked_articles_v1';

export function loadStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    if (raw) {
      return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error loading stored profile:', err);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving profile:', err);
  }
}

export function loadStoredLogs(): Record<string, DailyLog> {
  try {
    const raw = localStorage.getItem(KEY_LOGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading stored logs:', err);
  }
  return INITIAL_LOGS;
}

export function saveStoredLogs(logs: Record<string, DailyLog>): void {
  try {
    localStorage.setItem(KEY_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving logs:', err);
  }
}

export function loadStoredPastCycles(): PastCycle[] {
  try {
    const raw = localStorage.getItem(KEY_PAST_CYCLES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading past cycles:', err);
  }
  return INITIAL_PAST_CYCLES;
}

export function saveStoredPastCycles(cycles: PastCycle[]): void {
  try {
    localStorage.setItem(KEY_PAST_CYCLES, JSON.stringify(cycles));
  } catch (err) {
    console.error('Error saving past cycles:', err);
  }
}

export function loadBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(KEY_BOOKMARKS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading bookmarks:', err);
  }
  return ['season-of-cycle', 'ovulation-demystified'];
}

export function saveBookmarks(ids: string[]): void {
  try {
    localStorage.setItem(KEY_BOOKMARKS, JSON.stringify(ids));
  } catch (err) {
    console.error('Error saving bookmarks:', err);
  }
}

export function resetToDemoData(): void {
  saveStoredProfile(DEFAULT_USER_PROFILE);
  saveStoredLogs(INITIAL_LOGS);
  saveStoredPastCycles(INITIAL_PAST_CYCLES);
  saveBookmarks(['season-of-cycle', 'ovulation-demystified']);
}

export function clearAllData(): void {
  localStorage.removeItem(KEY_PROFILE);
  localStorage.removeItem(KEY_LOGS);
  localStorage.removeItem(KEY_PAST_CYCLES);
  localStorage.removeItem(KEY_BOOKMARKS);
}

export function exportDataAsJson(): string {
  const data = {
    exportDate: new Date().toISOString(),
    app: 'CycleCare',
    version: '1.0.0',
    profile: loadStoredProfile(),
    logs: loadStoredLogs(),
    pastCycles: loadStoredPastCycles(),
  };
  return JSON.stringify(data, null, 2);
}

export function exportLogsAsCsv(logs: Record<string, DailyLog>): string {
  const headers = ['Date', 'PeriodDay', 'Flow', 'Symptoms', 'Moods', 'Energy', 'SleepHours', 'WaterGlasses', 'BBT', 'Notes'];
  const rows = Object.values(logs).map(log => [
    log.date,
    log.isPeriodDay ? 'Yes' : 'No',
    log.flow || 'none',
    `"${log.symptoms.join('; ')}"`,
    `"${log.moods.join('; ')}"`,
    log.energy || '',
    log.sleepHours || '',
    log.waterGlasses || '',
    log.temperature || '',
    `"${(log.notes || '').replace(/"/g, '""')}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
