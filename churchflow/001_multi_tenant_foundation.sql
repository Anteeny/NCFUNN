-- ==============================================================================
-- CHURCHFLOW MULTI-TENANT ARCHITECTURE FOUNDATION (PHASE 1)
-- Canonical Reference: CHURCHFLOW_ALGORITHM_FRAMEWORK.md (Section 0 & Phase 0)
-- 
-- 1. Creates `organisations` table as the single canonical tenant root.
-- 2. Creates `organisation_members` table for RBAC staff memberships.
-- 3. Seeds the flagship organisation: NCF UNN (ID: 00000000-0000-0000-0000-000000000001).
-- 4. Idempotently attaches `organisation_id` to all existing operational tables.
-- 5. Atomically backfills all existing records to NCF UNN without data loss or downtime.
-- 6. Adds high-performance indexes on `organisation_id`.
-- ==============================================================================

-- 1. Ensure UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Canonical `organisations` Table
CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  timezone TEXT DEFAULT 'Africa/Lagos',
  base_currency TEXT DEFAULT 'NGN',
  branding JSONB DEFAULT '{
    "logoType": "image",
    "logoUrl": "/images.png",
    "logoEmoji": "🕊️",
    "portalTitle": "ChurchFlow Portal",
    "portalSubtitle": "Ministry & Attendance Operating System"
  }'::jsonb,
  terminology JSONB DEFAULT '{
    "groupSingular": "Connect Group",
    "groupPlural": "Connect Groups",
    "territoryLabel": "Campus Zone",
    "discipleshipModel": "G12",
    "departmentLabel": "Department",
    "serviceSingular": "Service"
  }'::jsonb,
  meeting_schedules JSONB DEFAULT '{
    "services": [
      { "name": "Sunday Service", "days": ["Sunday"], "time": "08:00" },
      { "name": "Midweek Service", "days": ["Wednesday"], "time": "17:00" }
    ],
    "connectGroups": {
      "day": "Saturday",
      "window": "19:00 - 22:00"
    }
  }'::jsonb,
  enabled_modules JSONB DEFAULT '{
    "attendance": true,
    "members": true,
    "connect": true,
    "departments": true,
    "g12": true,
    "reports": true,
    "finance": false,
    "foundation_school": false,
    "soul_winning": true
  }'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'onboarding')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on organisations (public can read basic workspace info for login co-branding)
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'organisations' AND policyname = 'Public can resolve organisation by slug or domain'
  ) THEN
    CREATE POLICY "Public can resolve organisation by slug or domain"
    ON organisations FOR SELECT TO anon, authenticated
    USING (status = 'active');
  END IF;
END $$;

-- 3. Create `organisation_members` Table (User Role & Permissions per Church Workspace)
CREATE TABLE IF NOT EXISTS organisation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Viewer' CHECK (role IN ('Owner', 'Super Admin', 'Pastor', 'Editor', 'Viewer')),
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organisation_id, user_id)
);

ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'organisation_members' AND policyname = 'Members can view their own organisation memberships'
  ) THEN
    CREATE POLICY "Members can view their own organisation memberships"
    ON organisation_members FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- 4. Seed Flagship Organisation #1: NCF UNN (Deterministic UUID)
INSERT INTO organisations (
  id,
  name,
  slug,
  custom_domain,
  timezone,
  base_currency,
  branding,
  terminology,
  meeting_schedules,
  enabled_modules,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'NCF UNN',
  'ncfunn',
  'ncfunn.site',
  'Africa/Lagos',
  'NGN',
  '{
    "logoType": "image",
    "logoUrl": "/images.png",
    "logoEmoji": "🕊️",
    "portalTitle": "NCF UNN Admin Portal",
    "portalSubtitle": "ChurchFlow Ministry & Attendance System",
    "contactEmail": "admin@ncfunn.org"
  }'::jsonb,
  '{
    "groupSingular": "Connect Group",
    "groupPlural": "Connect Groups",
    "territoryLabel": "Campus Zone",
    "discipleshipModel": "G12",
    "departmentLabel": "Department",
    "serviceSingular": "Service"
  }'::jsonb,
  '{
    "services": [
      { "name": "Sunday Celebration Service", "days": ["Sunday"], "time": "08:00", "venue": "Fellowship Center / Freedom Square" },
      { "name": "Midweek Communion Service", "days": ["Wednesday"], "time": "17:00", "venue": "Fellowship Center / Freedom Square" }
    ],
    "connectGroups": {
      "day": "Saturday",
      "window": "19:00 - 22:00"
    }
  }'::jsonb,
  '{
    "attendance": true,
    "members": true,
    "connect": true,
    "departments": true,
    "g12": true,
    "reports": true,
    "finance": false,
    "foundation_school": false,
    "soul_winning": true
  }'::jsonb,
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  custom_domain = EXCLUDED.custom_domain,
  branding = EXCLUDED.branding,
  terminology = EXCLUDED.terminology,
  meeting_schedules = EXCLUDED.meeting_schedules,
  updated_at = NOW();

-- Also register demo workspace for staging validation
INSERT INTO organisations (
  id,
  name,
  slug,
  custom_domain,
  timezone,
  base_currency,
  branding,
  terminology,
  meeting_schedules,
  enabled_modules,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Grace City Church',
  'gracecity',
  'gracecity.churchflow.site',
  'Africa/Lagos',
  'NGN',
  '{
    "logoType": "emoji",
    "logoEmoji": "🔥",
    "portalTitle": "Grace City Leadership Portal",
    "portalSubtitle": "ChurchFlow Cloud Platform",
    "contactEmail": "hello@gracecity.org"
  }'::jsonb,
  '{
    "groupSingular": "Life Group",
    "groupPlural": "Life Groups",
    "territoryLabel": "District",
    "discipleshipModel": "Discipleship Circles",
    "departmentLabel": "Ministry Unit",
    "serviceSingular": "Gathering"
  }'::jsonb,
  '{
    "services": [
      { "name": "Sunday Celebration", "days": ["Sunday"], "time": "09:00", "venue": "Grace Sanctuary" }
    ],
    "connectGroups": {
      "day": "Friday",
      "window": "18:00 - 20:00"
    }
  }'::jsonb,
  '{
    "attendance": true,
    "members": true,
    "connect": true,
    "departments": true,
    "g12": true,
    "reports": true,
    "finance": true,
    "foundation_school": false,
    "soul_winning": true
  }'::jsonb,
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- 5. Safely Add `organisation_id` Column Across All Operational Tables
DO $$ 
DECLARE
  flagship_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- members
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'organisation_id') THEN
      ALTER TABLE members ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE members SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_members_org ON members(organisation_id);
  END IF;

  -- cell_leaders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cell_leaders') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cell_leaders' AND column_name = 'organisation_id') THEN
      ALTER TABLE cell_leaders ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE cell_leaders SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_cell_leaders_org ON cell_leaders(organisation_id);
  END IF;

  -- department_leaders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_leaders') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'department_leaders' AND column_name = 'organisation_id') THEN
      ALTER TABLE department_leaders ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE department_leaders SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_dept_leaders_org ON department_leaders(organisation_id);
  END IF;

  -- dept_reports
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dept_reports') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dept_reports' AND column_name = 'organisation_id') THEN
      ALTER TABLE dept_reports ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE dept_reports SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_dept_reports_org ON dept_reports(organisation_id);
  END IF;

  -- g12_reports
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'g12_reports') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'g12_reports' AND column_name = 'organisation_id') THEN
      ALTER TABLE g12_reports ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE g12_reports SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_g12_reports_org ON g12_reports(organisation_id);
  END IF;

  -- service_reports
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_reports') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_reports' AND column_name = 'organisation_id') THEN
      ALTER TABLE service_reports ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE service_reports SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_service_reports_org ON service_reports(organisation_id);
  END IF;

  -- cell_reports
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cell_reports') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cell_reports' AND column_name = 'organisation_id') THEN
      ALTER TABLE cell_reports ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE cell_reports SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_cell_reports_org ON cell_reports(organisation_id);
  END IF;

  -- service_attendance
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_attendance') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_attendance' AND column_name = 'organisation_id') THEN
      ALTER TABLE service_attendance ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE service_attendance SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_service_attendance_org ON service_attendance(organisation_id);
  END IF;

  -- mvps
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mvps') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mvps' AND column_name = 'organisation_id') THEN
      ALTER TABLE mvps ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE mvps SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_mvps_org ON mvps(organisation_id);
  END IF;

  -- church_settings (if created by previous migration)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'church_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'church_settings' AND column_name = 'organisation_id') THEN
      ALTER TABLE church_settings ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE church_settings SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_church_settings_org ON church_settings(organisation_id);
  END IF;

  -- admin_profiles (if created by previous migration)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_profiles' AND column_name = 'organisation_id') THEN
      ALTER TABLE admin_profiles ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE;
    END IF;
    UPDATE admin_profiles SET organisation_id = flagship_id WHERE organisation_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_admin_profiles_org ON admin_profiles(organisation_id);
  END IF;

END $$;

-- 6. Helper Database Functions for Instant Domain / Slug Resolution
CREATE OR REPLACE FUNCTION get_organisation_by_slug(p_slug TEXT)
RETURNS SETOF organisations
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM organisations WHERE slug = LOWER(p_slug) AND status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_organisation_by_domain(p_domain TEXT)
RETURNS SETOF organisations
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM organisations WHERE custom_domain = LOWER(p_domain) AND status = 'active' LIMIT 1;
$$;

-- Verification query: check that NCF UNN is seeded and counts match
SELECT 
  id, 
  name, 
  slug, 
  custom_domain, 
  status 
FROM organisations;
