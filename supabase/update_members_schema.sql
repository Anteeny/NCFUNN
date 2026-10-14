-- ==============================================================================
-- NCF UNN - MEMBERS TABLE SCHEMA REFACTORING MIGRATION (v3 - PLAIN SQL)
-- ==============================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
--
-- Safe to re-run at any point. Uses IF NOT EXISTS / IF EXISTS everywhere.
-- growth_stage, is_mvp, leader_type are assumed already dropped or non-existent.
-- ==============================================================================

-- STEP 1: Add 'zone', 'membership_level', and 'dc_trainings' columns (safe if already exist)
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS membership_level TEXT,
  ADD COLUMN IF NOT EXISTS zone TEXT DEFAULT 'HQ',
  ADD COLUMN IF NOT EXISTS dc_trainings TEXT;

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
    WHEN LOWER(COALESCE("School_Address", '') || ' ' || COALESCE("Home_Address", '')) LIKE '%odenigwe%'   THEN 'Odenigwe'
    WHEN LOWER(COALESCE("School_Address", '') || ' ' || COALESCE("Home_Address", '')) LIKE '%odim%'       THEN 'Odim'
    WHEN LOWER(COALESCE("School_Address", '') || ' ' || COALESCE("Home_Address", '')) LIKE '%hilltop%'    THEN 'Hilltop'
    WHEN LOWER(COALESCE("School_Address", '') || ' ' || COALESCE("Home_Address", '')) LIKE '%franco%'     THEN 'Franco'
    WHEN LOWER(COALESCE("School_Address", '') || ' ' || COALESCE("Home_Address", '')) LIKE '%jsq%'        THEN 'JSQ'
    WHEN LOWER(COALESCE("School_Address", '') || ' ' || COALESCE("Home_Address", '')) LIKE '%greenhouse%' THEN 'Greenhouse'
    ELSE 'HQ'
END
WHERE zone IS NULL OR TRIM(zone) = '' OR zone = 'HQ';

-- STEP 4: Drop legacy columns (IF EXISTS = no error if already gone)
ALTER TABLE public.members DROP COLUMN IF EXISTS growth_stage;
ALTER TABLE public.members DROP COLUMN IF EXISTS leader_type;
ALTER TABLE public.members DROP COLUMN IF EXISTS is_mvp;
ALTER TABLE public.members DROP COLUMN IF EXISTS needs_followup;

-- STEP 5: Verify – see the final data sample
SELECT id, member_name, membership_level, zone, department, g12_leader
FROM public.members
LIMIT 10;
