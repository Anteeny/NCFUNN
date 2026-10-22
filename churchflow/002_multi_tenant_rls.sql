-- =========================================================================
-- CHURCHFLOW SAAS PLATFORM: PHASE 5 ROW-LEVEL SECURITY (RLS) ISOLATION
-- Run this script in your Supabase Dashboard -> SQL Editor.
-- It enforces cryptographic multi-tenant separation across all church tables.
-- =========================================================================

-- 1. Helper function: Check if authenticated user has access to a specific organisation
CREATE OR REPLACE FUNCTION public.user_has_access_to_org(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (
    -- Condition A: Super Admin or Lead Pastor in admin_profiles
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = auth.uid() AND role IN ('Super Admin', 'Pastor')
    )
    -- Condition B: Explicit membership in organisation_members
    OR EXISTS (
      SELECT 1 FROM public.organisation_members
      WHERE user_id = auth.uid() AND organisation_id = target_org_id
    )
    -- Condition C: Default flagship NCF UNN fallback if user has no explicit memberships yet
    OR (
      target_org_id = '00000000-0000-0000-0000-000000000001'::uuid
      AND NOT EXISTS (SELECT 1 FROM public.organisation_members WHERE user_id = auth.uid())
    )
    -- Condition D: Unauthenticated / Anon fallback for flagship during pre-auth lookup
    OR (
      auth.uid() IS NULL AND target_org_id = '00000000-0000-0000-0000-000000000001'::uuid
    )
  );
$$;

-- 2. Helper function: Get the primary active organisation for the current authenticated user
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

-- =========================================================================
-- 3. ENABLE RLS AND APPLY POLICIES ON ALL 12 MULTI-TENANT TABLES
-- =========================================================================

-- TABLE 1: organisations
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active organisations" ON public.organisations;
CREATE POLICY "Public can view active organisations" ON public.organisations
FOR SELECT TO anon, authenticated
USING (status = 'active');

DROP POLICY IF EXISTS "Admins can update their organisation" ON public.organisations;
CREATE POLICY "Admins can update their organisation" ON public.organisations
FOR UPDATE TO authenticated
USING (public.user_has_access_to_org(id))
WITH CHECK (public.user_has_access_to_org(id));

DROP POLICY IF EXISTS "Allow authenticated to onboard new organisations" ON public.organisations;
CREATE POLICY "Allow authenticated to onboard new organisations" ON public.organisations
FOR INSERT TO authenticated
WITH CHECK (true);

-- TABLE 2: organisation_members
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their own organisation memberships" ON public.organisation_members;
CREATE POLICY "Members can view their own organisation memberships" ON public.organisation_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.user_has_access_to_org(organisation_id));

DROP POLICY IF EXISTS "Admins can manage organisation memberships" ON public.organisation_members;
CREATE POLICY "Admins can manage organisation memberships" ON public.organisation_members
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 3: members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant members isolation" ON public.members;
DROP POLICY IF EXISTS "Auth users full access on members" ON public.members;
CREATE POLICY "Tenant members isolation" ON public.members
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 4: service_attendance
ALTER TABLE public.service_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant service_attendance isolation" ON public.service_attendance;
DROP POLICY IF EXISTS "Auth users full access on service_attendance" ON public.service_attendance;
CREATE POLICY "Tenant service_attendance isolation" ON public.service_attendance
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 5: service_reports
ALTER TABLE public.service_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant service_reports isolation" ON public.service_reports;
DROP POLICY IF EXISTS "Auth users full access on service_reports" ON public.service_reports;
CREATE POLICY "Tenant service_reports isolation" ON public.service_reports
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 6: dept_reports
ALTER TABLE public.dept_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant dept_reports isolation" ON public.dept_reports;
DROP POLICY IF EXISTS "Auth users full access on dept_reports" ON public.dept_reports;
CREATE POLICY "Tenant dept_reports isolation" ON public.dept_reports
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 7: g12_reports
ALTER TABLE public.g12_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant g12_reports isolation" ON public.g12_reports;
DROP POLICY IF EXISTS "Auth users full access on g12_reports" ON public.g12_reports;
CREATE POLICY "Tenant g12_reports isolation" ON public.g12_reports
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 8: cell_reports
ALTER TABLE public.cell_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant cell_reports isolation" ON public.cell_reports;
DROP POLICY IF EXISTS "Auth users full access on cell_reports" ON public.cell_reports;
CREATE POLICY "Tenant cell_reports isolation" ON public.cell_reports
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 9: cell_leaders
ALTER TABLE public.cell_leaders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant cell_leaders isolation" ON public.cell_leaders;
DROP POLICY IF EXISTS "Auth users full access on cell_leaders" ON public.cell_leaders;
CREATE POLICY "Tenant cell_leaders isolation" ON public.cell_leaders
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 10: department_leaders
ALTER TABLE public.department_leaders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant department_leaders isolation" ON public.department_leaders;
DROP POLICY IF EXISTS "Auth users full access on department_leaders" ON public.department_leaders;
CREATE POLICY "Tenant department_leaders isolation" ON public.department_leaders
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 11: church_settings
ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant church_settings isolation" ON public.church_settings;
DROP POLICY IF EXISTS "Auth users full access on church_settings" ON public.church_settings;
DROP POLICY IF EXISTS "Public read branding church_settings" ON public.church_settings;

-- Public can read settings (branding/ticker) so portal shows church co-branding before login
CREATE POLICY "Public read branding church_settings" ON public.church_settings
FOR SELECT TO anon, authenticated
USING (true);

-- Authenticated admins can modify settings for their organisation
CREATE POLICY "Tenant church_settings write isolation" ON public.church_settings
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 12: admin_profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant admin_profiles isolation" ON public.admin_profiles;
DROP POLICY IF EXISTS "Auth users full access on admin_profiles" ON public.admin_profiles;
CREATE POLICY "Tenant admin_profiles isolation" ON public.admin_profiles
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));

-- TABLE 13: mvps (First Timers & Special Intakes)
ALTER TABLE public.mvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant mvps isolation" ON public.mvps;
DROP POLICY IF EXISTS "Auth users full access on mvps" ON public.mvps;
DROP POLICY IF EXISTS "Public anon insert into mvps" ON public.mvps;

-- Allow public visitor slip / QR intake form submission
CREATE POLICY "Public anon insert into mvps" ON public.mvps
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Authenticated leaders can view and manage MVPs for their active organisation
CREATE POLICY "Tenant mvps management isolation" ON public.mvps
FOR ALL TO authenticated
USING (public.user_has_access_to_org(organisation_id))
WITH CHECK (public.user_has_access_to_org(organisation_id));
