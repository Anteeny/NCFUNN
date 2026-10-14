-- ==============================================================================
-- NCF UNN - MEMBERS TABLE SCHEMA REFACTORING MIGRATION (v4 - PLAIN SQL)
-- ==============================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
--
-- Safe to re-run at any point. Uses IF NOT EXISTS / IF EXISTS everywhere.
-- ==============================================================================

-- STEP 1: Add columns for all question fields & address casing compatibility
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS membership_level TEXT,
  ADD COLUMN IF NOT EXISTS zone TEXT DEFAULT 'HQ',
  ADD COLUMN IF NOT EXISTS dc_trainings TEXT,
  ADD COLUMN IF NOT EXISTS "School_Address" TEXT,
  ADD COLUMN IF NOT EXISTS "Home_Address" TEXT,
  ADD COLUMN IF NOT EXISTS school_address TEXT,
  ADD COLUMN IF NOT EXISTS home_address TEXT;

-- STEP 2: Fill in 'membership_level' for any rows that are still blank.
-- Detects Pastors by name/department; everyone else defaults to Committed Member.
UPDATE public.members
SET membership_level = CASE
    WHEN LOWER(member_name) LIKE '%pastor%'
      OR LOWER(COALESCE(department, '')) LIKE '%pastor%' THEN 'Pastor'
    ELSE 'Committed Member'
END
WHERE membership_level IS NULL OR TRIM(membership_level) = '';

-- STEP 3: Backfill 'zone' from School_Address / Home_Address keywords.
UPDATE public.members
SET zone = CASE
    WHEN LOWER(COALESCE("School_Address", school_address, '') || ' ' || COALESCE("Home_Address", home_address, '')) LIKE '%odenigwe%'   THEN 'Odenigwe'
    WHEN LOWER(COALESCE("School_Address", school_address, '') || ' ' || COALESCE("Home_Address", home_address, '')) LIKE '%odim%'       THEN 'Odim'
    WHEN LOWER(COALESCE("School_Address", school_address, '') || ' ' || COALESCE("Home_Address", home_address, '')) LIKE '%hilltop%'    THEN 'Hilltop'
    WHEN LOWER(COALESCE("School_Address", school_address, '') || ' ' || COALESCE("Home_Address", home_address, '')) LIKE '%franco%'     THEN 'Franco'
    WHEN LOWER(COALESCE("School_Address", school_address, '') || ' ' || COALESCE("Home_Address", home_address, '')) LIKE '%jsq%'        THEN 'JSQ'
    WHEN LOWER(COALESCE("School_Address", school_address, '') || ' ' || COALESCE("Home_Address", home_address, '')) LIKE '%greenhouse%' THEN 'Greenhouse'
    ELSE 'HQ'
END
WHERE zone IS NULL OR TRIM(zone) = '' OR zone = 'HQ';

-- STEP 4: Synchronize address columns across both naming formats so neither ever fails
UPDATE public.members
SET school_address = COALESCE(school_address, "School_Address"),
    home_address = COALESCE(home_address, "Home_Address"),
    "School_Address" = COALESCE("School_Address", school_address),
    "Home_Address" = COALESCE("Home_Address", home_address);

-- STEP 5: Drop legacy columns (IF EXISTS = no error if already gone)
ALTER TABLE public.members DROP COLUMN IF EXISTS growth_stage;
ALTER TABLE public.members DROP COLUMN IF EXISTS leader_type;
ALTER TABLE public.members DROP COLUMN IF EXISTS is_mvp;
ALTER TABLE public.members DROP COLUMN IF EXISTS needs_followup;

-- STEP 6: Refresh Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';

-- STEP 7: Verify – sample result
SELECT id, member_name, membership_level, zone, dc_trainings, "School_Address", "Home_Address"
FROM public.members
LIMIT 10;
