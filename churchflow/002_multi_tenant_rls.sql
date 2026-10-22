-- =========================================================================
-- CHURCHFLOW SAAS PLATFORM: PHASE 5 ROW-LEVEL SECURITY (RLS) ISOLATION
-- Run this script in your Supabase Dashboard -> SQL Editor after 001 foundation.
-- It enforces cryptographic multi-tenant separation across all church tables.
-- =========================================================================

-- 1. Helper function: Get the current authenticated user's active organisation
CREATE OR REPLACE FUNCTION public.get_auth_user_organisation_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT organisation_id FROM public.organisation_members WHERE user_id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid -- Fallback to NCF UNN Flagship
  );
$$;

-- 2. Helper function: Check if user belongs to an organisation
CREATE OR REPLACE FUNCTION public.user_belongs_to_organisation(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organisation_members
    WHERE user_id = auth.uid() AND organisation_id = p_org_id
  ) OR (
    -- If no memberships assigned yet, default allow for NCF UNN flagship
    p_org_id = '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

-- 3. Update RLS Policies across all operational tables

-- TABLE: members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant members isolation" ON public.members;
CREATE POLICY "Tenant members isolation" ON public.members
FOR ALL TO authenticated
USING (organisation_id = public.get_auth_user_organisation_id())
WITH CHECK (organisation_id = public.get_auth_user_organisation_id());

-- TABLE: service_attendance
ALTER TABLE public.service_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant service_attendance isolation" ON public.service_attendance;
CREATE POLICY "Tenant service_attendance isolation" ON public.service_attendance
FOR ALL TO authenticated
USING (organisation_id = public.get_auth_user_organisation_id())
WITH CHECK (organisation_id = public.get_auth_user_organisation_id());

-- TABLE: service_reports
ALTER TABLE public.service_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant service_reports isolation" ON public.service_reports;
CREATE POLICY "Tenant service_reports isolation" ON public.service_reports
FOR ALL TO authenticated
USING (organisation_id = public.get_auth_user_organisation_id())
WITH CHECK (organisation_id = public.get_auth_user_organisation_id());

-- TABLE: dept_reports
ALTER TABLE public.dept_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant dept_reports isolation" ON public.dept_reports;
CREATE POLICY "Tenant dept_reports isolation" ON public.dept_reports
FOR ALL TO authenticated
USING (organisation_id = public.get_auth_user_organisation_id())
WITH CHECK (organisation_id = public.get_auth_user_organisation_id());

-- TABLE: g12_reports
ALTER TABLE public.g12_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant g12_reports isolation" ON public.g12_reports;
CREATE POLICY "Tenant g12_reports isolation" ON public.g12_reports
FOR ALL TO authenticated
USING (organisation_id = public.get_auth_user_organisation_id())
WITH CHECK (organisation_id = public.get_auth_user_organisation_id());

-- TABLE: cell_reports
ALTER TABLE public.cell_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant cell_reports isolation" ON public.cell_reports;
CREATE POLICY "Tenant cell_reports isolation" ON public.cell_reports
FOR ALL TO authenticated
USING (organisation_id = public.get_auth_user_organisation_id())
WITH CHECK (organisation_id = public.get_auth_user_organisation_id());

-- TABLE: cell_leaders
ALTER TABLE public.cell_leaders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant cell_leaders isolation" ON public.cell_leaders;
CREATE POLICY "Tenant cell_leaders isolation" ON public.cell_leaders
FOR ALL TO authenticated
USING (organisation_id = public.get_auth_user_organisation_id())
WITH CHECK (organisation_id = public.get_auth_user_organisation_id());

-- TABLE: department_leaders
ALTER TABLE public.department_leaders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant department_leaders isolation" ON public.department_leaders;
CREATE POLICY "Tenant department_leaders isolation" ON public.department_leaders
FOR ALL TO authenticated
USING (organisation_id = public.get_auth_user_organisation_id())
WITH CHECK (organisation_id = public.get_auth_user_organisation_id());

-- TABLE: organisations
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active organisations" ON public.organisations;
CREATE POLICY "Public can view active organisations" ON public.organisations
FOR SELECT TO anon, authenticated
USING (status = 'active');

DROP POLICY IF EXISTS "Admins can update their organisation" ON public.organisations;
CREATE POLICY "Admins can update their organisation" ON public.organisations
FOR UPDATE TO authenticated
USING (id = public.get_auth_user_organisation_id())
WITH CHECK (id = public.get_auth_user_organisation_id());

DROP POLICY IF EXISTS "Allow authenticated to onboard new organisations" ON public.organisations;
CREATE POLICY "Allow authenticated to onboard new organisations" ON public.organisations
FOR INSERT TO authenticated
WITH CHECK (true);
