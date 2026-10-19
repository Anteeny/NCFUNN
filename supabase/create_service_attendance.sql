-- ==============================================================================
-- NCFUNN Service Attendance & Gate Tracker Schema
-- Table: public.service_attendance
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.service_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_type TEXT NOT NULL DEFAULT 'Sunday Service',
    zone TEXT DEFAULT 'HQ',
    department TEXT,
    checked_in_at TIMESTAMPTZ DEFAULT now(),
    marked_by TEXT DEFAULT 'Gate Usher',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (member_id, service_date, service_type)
);

-- Indexes for lightning fast lookups during service check-ins
CREATE INDEX IF NOT EXISTS idx_serv_att_date_type ON public.service_attendance (service_date, service_type);
CREATE INDEX IF NOT EXISTS idx_serv_att_member ON public.service_attendance (member_id);
CREATE INDEX IF NOT EXISTS idx_serv_att_zone ON public.service_attendance (zone);
CREATE INDEX IF NOT EXISTS idx_serv_att_created ON public.service_attendance (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.service_attendance ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies for Anon & Ushers
DROP POLICY IF EXISTS "Allow anon read service attendance" ON public.service_attendance;
CREATE POLICY "Allow anon read service attendance"
ON public.service_attendance FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert service attendance" ON public.service_attendance;
CREATE POLICY "Allow anon insert service attendance"
ON public.service_attendance FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update service attendance" ON public.service_attendance;
CREATE POLICY "Allow anon update service attendance"
ON public.service_attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete service attendance" ON public.service_attendance;
CREATE POLICY "Allow anon delete service attendance"
ON public.service_attendance FOR DELETE TO anon, authenticated USING (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
