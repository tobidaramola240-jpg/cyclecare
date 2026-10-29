import { DailyLog, PastCycle, UserProfile, AuthUser, SupabaseConfig } from '../types';

const STORAGE_KEY_URL = 'cyclecare_supabase_url';
const STORAGE_KEY_ANON = 'cyclecare_supabase_anon_key';
const STORAGE_KEY_SESSION = 'cyclecare_auth_session';

/**
 * Validates that the provided key is a public anon key and NOT a secret service_role key.
 */
export function validateSupabaseKey(key: string): { isValid: boolean; error?: string } {
  if (!key || key.trim() === '') {
    return { isValid: false, error: 'Supabase Anon Key is required.' };
  }

  const cleanKey = key.trim();

  // Reject secret service_role keys
  if (
    cleanKey.toLowerCase().includes('service_role') ||
    cleanKey.startsWith('sb_secret_') ||
    cleanKey.startsWith('secret_')
  ) {
    return {
      isValid: false,
      error: 'CRITICAL SECURITY ERROR: Secret service_role key detected! Never expose service_role keys in client applications. Please only provide the public "anon" key.',
    };
  }

  // Basic JWT structure check (3 base64 segments separated by dots) or modern Supabase key format
  const parts = cleanKey.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(atob(parts[1]));
      if (payload && payload.role === 'service_role') {
        return {
          isValid: false,
          error: 'CRITICAL SECURITY ERROR: Decoded JWT payload has role "service_role". Only public "anon" keys are permitted in frontend code.',
        };
      }
    } catch {
      // Not a fatal issue if atob fails on non-standard encoding, but flag if known
    }
  }

  return { isValid: true };
}

/**
 * Retrieves the currently configured Supabase credentials.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

  const storedUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const storedKey = localStorage.getItem(STORAGE_KEY_ANON) || '';

  const url = (storedUrl || envUrl).trim();
  const anonKey = (storedKey || envKey).trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && !url.includes('your-project-id')),
  };
}

/**
 * Stores custom Supabase credentials in local storage.
 */
export function setSupabaseConfig(url: string, anonKey: string): void {
  const validation = validateSupabaseKey(anonKey);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid Supabase Anon Key.');
  }

  let formattedUrl = url.trim();
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }

  localStorage.setItem(STORAGE_KEY_URL, formattedUrl);
  localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
}

/**
 * Clears stored Supabase credentials.
 */
export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
}

// =====================================================================
// Session Management
// =====================================================================

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    return session;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: StoredSession | null): void {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  } else {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  }
}

// =====================================================================
// Isomorphic Supabase HTTP Client (Zero Network Bloat, Direct RLS)
// =====================================================================

async function supabaseFetch(
  endpoint: string,
  options: RequestInit = {},
  customToken?: string
): Promise<any> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    throw new Error('Supabase is not configured. Please supply a valid URL and Anon Key.');
  }

  const session = getStoredSession();
  const token = customToken || session?.accessToken || config.anonKey;

  const url = `${config.url}${endpoint}`;
  const headers: Record<string, string> = {
    'apikey': config.anonKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const responseText = await response.text();
  let data: any = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.error_description ||
      data?.msg ||
      data?.message ||
      data?.error ||
      `Supabase request failed with status ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
}

// =====================================================================
// Supabase Authentication Methods
// =====================================================================

/**
 * Sign up a new user with email, password, and optional metadata.
 */
export async function supabaseSignUp(params: {
  email: string;
  password: string;
  fullName?: string;
  isAnonymous?: boolean;
}): Promise<{ user: AuthUser; session: StoredSession | null; requiresEmailConfirmation: boolean }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    throw new Error('Supabase connection not configured. Please enter your project URL & Anon key.');
  }

  const payload = {
    email: params.email,
    password: params.password,
    data: {
      full_name: params.fullName || 'CycleCare Friend',
      is_anonymous: Boolean(params.isAnonymous),
    },
  };

  const res = await supabaseFetch('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const authUser: AuthUser = {
    id: res.user?.id || res.id,
    email: res.user?.email || res.email,
    fullName: res.user?.user_metadata?.full_name || params.fullName || 'CycleCare Friend',
    isAnonymous: Boolean(res.user?.user_metadata?.is_anonymous),
    createdAt: res.user?.created_at || new Date().toISOString(),
  };

  let session: StoredSession | null = null;
  const requiresEmailConfirmation = !res.access_token;

  if (res.access_token) {
    session = {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresAt: Date.now() + (res.expires_in || 3600) * 1000,
      user: authUser,
    };
    saveStoredSession(session);
  }

  return { user: authUser, session, requiresEmailConfirmation };
}

/**
 * Sign in existing user with email and password.
 */
export async function supabaseSignIn(params: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; session: StoredSession }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    throw new Error('Supabase connection not configured. Please enter your project URL & Anon key.');
  }

  const payload = {
    email: params.email,
    password: params.password,
  };

  const res = await supabaseFetch('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const authUser: AuthUser = {
    id: res.user.id,
    email: res.user.email,
    fullName: res.user.user_metadata?.full_name || 'CycleCare Friend',
    isAnonymous: Boolean(res.user.user_metadata?.is_anonymous),
    createdAt: res.user.created_at,
  };

  const session: StoredSession = {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    expiresAt: Date.now() + (res.expires_in || 3600) * 1000,
    user: authUser,
  };

  saveStoredSession(session);
  return { user: authUser, session };
}

/**
 * Send password reset email instructions.
 */
export async function supabaseResetPassword(email: string): Promise<{ success: boolean; message: string }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    throw new Error('Supabase connection not configured.');
  }

  await supabaseFetch('/auth/v1/recover', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  return {
    success: true,
    message: `Password reset instructions have been dispatched to ${email}.`,
  };
}

/**
 * Sign out user and clear stored session.
 */
export async function supabaseSignOut(): Promise<void> {
  const session = getStoredSession();
  if (session) {
    try {
      await supabaseFetch('/auth/v1/logout', { method: 'POST' });
    } catch {
      // Ignore if session already invalid on server
    }
  }
  saveStoredSession(null);
}

// =====================================================================
// Row Level Security (RLS) Database Operations
// =====================================================================

/**
 * Fetch profile for the authenticated user.
 */
export async function fetchUserProfileCloud(userId: string): Promise<UserProfile | null> {
  try {
    const res = await supabaseFetch(`/rest/v1/profiles?id=eq.${userId}&select=*`, {
      method: 'GET',
    });

    if (Array.isArray(res) && res.length > 0) {
      const row = res[0];
      return {
        name: row.name,
        isAnonymous: row.is_anonymous,
        goal: row.goal || 'track_period',
        lastPeriodStartDate: row.last_period_start_date,
        averageCycleLength: row.average_cycle_length,
        averagePeriodLength: row.average_period_length,
        lutealPhaseLength: row.luteal_phase_length,
        isIrregularCycle: Boolean(row.is_irregular_cycle),
        pinLockEnabled: Boolean(row.pin_lock_enabled),
        pinCode: row.pin_code || '1234',
        biometricSimulation: true,
        discreetNotifications: true,
        periodReminderDaysBefore: 2,
        fertileAlert: true,
        pillReminderEnabled: true,
        pillReminderTime: '09:00',
        hasCompletedOnboarding: true,
      };
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch cloud profile:', err);
    return null;
  }
}

/**
 * Upsert user profile in Supabase (respecting RLS auth.uid() = id).
 */
export async function upsertUserProfileCloud(userId: string, profile: UserProfile): Promise<void> {
  const payload = {
    id: userId,
    name: profile.name,
    is_anonymous: profile.isAnonymous,
    goal: profile.goal,
    last_period_start_date: profile.lastPeriodStartDate,
    average_cycle_length: profile.averageCycleLength,
    average_period_length: profile.averagePeriodLength,
    luteal_phase_length: profile.lutealPhaseLength,
    is_irregular_cycle: Boolean(profile.isIrregularCycle),
    pin_lock_enabled: Boolean(profile.pinLockEnabled),
    pin_code: profile.pinCode || '1234',
    updated_at: new Date().toISOString(),
  };

  await supabaseFetch('/rest/v1/profiles', {
    method: 'POST',
    headers: {
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch all daily cycle logs for the authenticated user from Supabase.
 */
export async function fetchCycleLogsCloud(userId: string): Promise<Record<string, DailyLog>> {
  const res = await supabaseFetch(`/rest/v1/cycle_logs?user_id=eq.${userId}&select=*`, {
    method: 'GET',
  });

  const logs: Record<string, DailyLog> = {};
  if (Array.isArray(res)) {
    for (const row of res) {
      logs[row.date] = {
        date: row.date,
        isPeriodDay: Boolean(row.is_period_day),
        flow: row.flow || 'none',
        symptoms: row.symptoms || [],
        moods: row.moods || [],
        cervicalFluid: row.cervical_fluid,
        energy: row.energy,
        sleepHours: row.sleep_hours ? Number(row.sleep_hours) : undefined,
        sleepQuality: row.sleep_quality,
        waterGlasses: row.water_glasses !== undefined ? Number(row.water_glasses) : 8,
        temperature: row.temperature ? Number(row.temperature) : undefined,
        libido: row.libido,
        sexActivity: row.sex_activity,
        notes: row.notes || '',
        pillTaken: row.pill_taken !== undefined ? Boolean(row.pill_taken) : true,
      };
    }
  }
  return logs;
}

/**
 * Upsert a daily log into Supabase (respecting RLS auth.uid() = user_id).
 */
export async function upsertCycleLogCloud(userId: string, log: DailyLog): Promise<void> {
  const payload = {
    user_id: userId,
    date: log.date,
    is_period_day: Boolean(log.isPeriodDay),
    flow: log.flow || 'none',
    symptoms: log.symptoms || [],
    moods: log.moods || [],
    cervical_fluid: log.cervicalFluid || null,
    energy: log.energy || null,
    sleep_hours: log.sleepHours !== undefined ? log.sleepHours : null,
    sleep_quality: log.sleepQuality || null,
    water_glasses: log.waterGlasses !== undefined ? log.waterGlasses : 8,
    temperature: log.temperature !== undefined ? log.temperature : null,
    libido: log.libido || null,
    sex_activity: log.sexActivity || null,
    notes: log.notes || '',
    pill_taken: log.pillTaken !== undefined ? log.pillTaken : true,
    updated_at: new Date().toISOString(),
  };

  await supabaseFetch('/rest/v1/cycle_logs', {
    method: 'POST',
    headers: {
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a daily log from Supabase for a specific date (respecting RLS auth.uid() = user_id).
 */
export async function deleteCycleLogCloud(userId: string, dateStr: string): Promise<void> {
  await supabaseFetch(`/rest/v1/cycle_logs?user_id=eq.${userId}&date=eq.${dateStr}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch past cycles history for authenticated user from Supabase.
 */
export async function fetchPastCyclesCloud(userId: string): Promise<PastCycle[]> {
  const res = await supabaseFetch(`/rest/v1/past_cycles?user_id=eq.${userId}&order=start_date.desc&select=*`, {
    method: 'GET',
  });

  if (Array.isArray(res)) {
    return res.map((r: any) => ({
      id: r.id,
      startDate: r.start_date,
      endDate: r.end_date,
      cycleLength: Number(r.cycle_length),
      periodDuration: Number(r.period_duration),
      ovulationDate: r.ovulation_date,
      symptomsSummary: r.symptoms_summary || [],
    }));
  }
  return [];
}

/**
 * Push all local data into Supabase (initial sync after signup / signin).
 */
export async function pushAllLocalToCloud(
  userId: string,
  profile: UserProfile,
  logs: Record<string, DailyLog>,
  pastCycles: PastCycle[]
): Promise<void> {
  await upsertUserProfileCloud(userId, profile);

  for (const log of Object.values(logs)) {
    await upsertCycleLogCloud(userId, log);
  }

  for (const cycle of pastCycles) {
    const payload = {
      user_id: userId,
      start_date: cycle.startDate,
      end_date: cycle.endDate,
      cycle_length: cycle.cycleLength,
      period_duration: cycle.periodDuration,
      ovulation_date: cycle.ovulationDate,
      symptoms_summary: cycle.symptomsSummary,
    };
    await supabaseFetch('/rest/v1/past_cycles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
