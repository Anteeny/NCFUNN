-- =========================================================================
-- CHURCHFLOW & NCF UNN: PRODUCTION ROW LEVEL SECURITY (RLS) & SETTINGS MIGRATION
-- Run this script once in your Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Create church_settings table (for shared branding, ticker, zones across all admins)
CREATE TABLE IF NOT EXISTS public.church_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text
);

-- 2. Create admin_profiles table (for authorized portal operators & roles)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'Super Admin',
  status text NOT NULL DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT now()
);

-- Automatically create an admin profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.admin_profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Super Admin'),
    'Active'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- =========================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL PLATFORM TABLES
-- This closes public unauthenticated read/write access to sensitive data.
-- =========================================================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dept_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.g12_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. POLICIES: AUTHENTICATED OFFICERS (FULL ACCESS)
-- Authenticated users (logged into the ChurchFlow portal) have full read/write access.
-- =========================================================================

-- members
DROP POLICY IF EXISTS "Auth users full access on members" ON public.members;
CREATE POLICY "Auth users full access on members" ON public.members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- service_attendance
DROP POLICY IF EXISTS "Auth users full access on service_attendance" ON public.service_attendance;
CREATE POLICY "Auth users full access on service_attendance" ON public.service_attendance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- service_reports
DROP POLICY IF EXISTS "Auth users full access on service_reports" ON public.service_reports;
CREATE POLICY "Auth users full access on service_reports" ON public.service_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- dept_reports
DROP POLICY IF EXISTS "Auth users full access on dept_reports" ON public.dept_reports;
CREATE POLICY "Auth users full access on dept_reports" ON public.dept_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- g12_reports
DROP POLICY IF EXISTS "Auth users full access on g12_reports" ON public.g12_reports;
CREATE POLICY "Auth users full access on g12_reports" ON public.g12_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cell_reports
DROP POLICY IF EXISTS "Auth users full access on cell_reports" ON public.cell_reports;
CREATE POLICY "Auth users full access on cell_reports" ON public.cell_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- cell_leaders
DROP POLICY IF EXISTS "Auth users full access on cell_leaders" ON public.cell_leaders;
CREATE POLICY "Auth users full access on cell_leaders" ON public.cell_leaders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- department_leaders
DROP POLICY IF EXISTS "Auth users full access on department_leaders" ON public.department_leaders;
CREATE POLICY "Auth users full access on department_leaders" ON public.department_leaders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- church_settings
DROP POLICY IF EXISTS "Auth users full access on church_settings" ON public.church_settings;
CREATE POLICY "Auth users full access on church_settings" ON public.church_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- admin_profiles
DROP POLICY IF EXISTS "Auth users full access on admin_profiles" ON public.admin_profiles;
CREATE POLICY "Auth users full access on admin_profiles" ON public.admin_profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- mvps (authenticated full management)
DROP POLICY IF EXISTS "Auth users full access on mvps" ON public.mvps;
CREATE POLICY "Auth users full access on mvps" ON public.mvps
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================================
-- 5. POLICIES: PUBLIC / ANONYMOUS INTAKE ACCESS
-- Permitted only for visitor slips and self-intake forms.
-- =========================================================================

-- Anyone with the link or QR code can insert their first-timer / MVP registration slip
DROP POLICY IF EXISTS "Public anon insert into mvps" ON public.mvps;
CREATE POLICY "Public anon insert into mvps" ON public.mvps
  FOR INSERT TO anon WITH CHECK (true);

-- Public reading of church_settings is allowed so the login page can display the church logo & title
DROP POLICY IF EXISTS "Public read branding church_settings" ON public.church_settings;
CREATE POLICY "Public read branding church_settings" ON public.church_settings
  FOR SELECT TO anon USING (true);
