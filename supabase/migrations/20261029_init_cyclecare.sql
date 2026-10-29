-- =====================================================================
-- CycleCare Database Initialization & Row Level Security (RLS)
-- Migration: 20261029_init_cyclecare.sql
-- =====================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. PROFILES TABLE (Linked to auth.users)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'CycleCare Friend',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  goal TEXT NOT NULL DEFAULT 'track_period' CHECK (goal IN ('track_period', 'conceive', 'symptoms', 'perimenopause')),
  last_period_start_date DATE NOT NULL DEFAULT CURRENT_DATE - INTERVAL '14 days',
  average_cycle_length INTEGER NOT NULL DEFAULT 28 CHECK (average_cycle_length BETWEEN 15 AND 90),
  average_period_length INTEGER NOT NULL DEFAULT 5 CHECK (average_period_length BETWEEN 1 AND 15),
  luteal_phase_length INTEGER NOT NULL DEFAULT 14 CHECK (luteal_phase_length BETWEEN 8 AND 18),
  is_irregular_cycle BOOLEAN NOT NULL DEFAULT false,
  pin_lock_enabled BOOLEAN NOT NULL DEFAULT false,
  pin_code TEXT DEFAULT '1234',
  period_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  period_reminder_days_before INTEGER NOT NULL DEFAULT 2 CHECK (period_reminder_days_before BETWEEN 1 AND 7),
  discreet_notifications BOOLEAN NOT NULL DEFAULT true,
  fertile_alert BOOLEAN NOT NULL DEFAULT true,
  has_completed_onboarding BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 2. CYCLE LOGS TABLE (Daily flow, symptoms, moods, vitals)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.cycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_period_day BOOLEAN NOT NULL DEFAULT false,
  flow TEXT CHECK (flow IN ('none', 'spotting', 'light', 'medium', 'heavy')),
  symptoms TEXT[] DEFAULT '{}',
  moods TEXT[] DEFAULT '{}',
  cervical_fluid TEXT CHECK (cervical_fluid IS NULL OR cervical_fluid IN ('dry', 'sticky', 'creamy', 'egg_white', 'watery')),
  energy TEXT CHECK (energy IS NULL OR energy IN ('high', 'balanced', 'sluggish', 'exhausted')),
  sleep_hours NUMERIC(3,1),
  sleep_quality TEXT CHECK (sleep_quality IS NULL OR sleep_quality IN ('restful', 'fair', 'restless')),
  water_glasses INTEGER DEFAULT 8 CHECK (water_glasses BETWEEN 0 AND 20),
  temperature NUMERIC(4,1),
  libido TEXT CHECK (libido IS NULL OR libido IN ('high', 'moderate', 'low')),
  sex_activity TEXT CHECK (sex_activity IS NULL OR sex_activity IN ('none', 'protected', 'unprotected', 'high_drive')),
  notes TEXT,
  pill_taken BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, date)
);

-- =====================================================================
-- 3. PAST CYCLES TABLE (Historical cycle records for clinical trends)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.past_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cycle_length INTEGER NOT NULL CHECK (cycle_length BETWEEN 15 AND 120),
  period_duration INTEGER NOT NULL CHECK (period_duration BETWEEN 1 AND 20),
  ovulation_date DATE NOT NULL,
  symptoms_summary TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, start_date)
);

-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation: users can ONLY query and write their own rows.
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_cycles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Cycle Logs Policies
DROP POLICY IF EXISTS "Users can view own cycle logs" ON public.cycle_logs;
CREATE POLICY "Users can view own cycle logs"
  ON public.cycle_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cycle logs" ON public.cycle_logs;
CREATE POLICY "Users can insert own cycle logs"
  ON public.cycle_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cycle logs" ON public.cycle_logs;
CREATE POLICY "Users can update own cycle logs"
  ON public.cycle_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cycle logs" ON public.cycle_logs;
CREATE POLICY "Users can delete own cycle logs"
  ON public.cycle_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Past Cycles Policies
DROP POLICY IF EXISTS "Users can view own past cycles" ON public.past_cycles;
CREATE POLICY "Users can view own past cycles"
  ON public.past_cycles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own past cycles" ON public.past_cycles;
CREATE POLICY "Users can insert own past cycles"
  ON public.past_cycles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own past cycles" ON public.past_cycles;
CREATE POLICY "Users can update own past cycles"
  ON public.past_cycles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own past cycles" ON public.past_cycles;
CREATE POLICY "Users can delete own past cycles"
  ON public.past_cycles FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================================
-- 5. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, is_anonymous)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'CycleCare Friend'),
    COALESCE((NEW.raw_user_meta_data->>'is_anonymous')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
