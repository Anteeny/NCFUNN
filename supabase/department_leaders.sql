-- ==============================================================================
-- NCF UNN - DEPARTMENT LEADERS TABLE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- It creates:
--   1. department_leaders table
--   2. Full RLS policies for read & write (SELECT, INSERT, UPDATE, DELETE) for anon
--   3. Seeds the active NCF departments with their current leaders
-- ==============================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.department_leaders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_name TEXT UNIQUE NOT NULL,
  leader_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.department_leaders ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Allow Read and Write for anon and authenticated users
CREATE POLICY "Allow public select on department_leaders"
  ON public.department_leaders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert on department_leaders"
  ON public.department_leaders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update on department_leaders"
  ON public.department_leaders
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on department_leaders"
  ON public.department_leaders
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 4. Seed Current Departmental Leaders from NCF Community Database
INSERT INTO public.department_leaders (department_name, leader_name, phone)
VALUES
  ('Administration', 'Emmanuella Okonkwo', '07019319034'),
  ('Ushering', 'Kosisochukwu Mbamalu', '08119513436'),
  ('MVP', 'Janefrancis Igwilo', '07046716901'),
  ('NCF Angels', 'Kosisochukwu Onyibor', '07072136541'),
  ('Temple tenders', 'Ifeyinwa Umeadi', '09130530238'),
  ('Technical Unit', 'Udochukwu Aneke', '08104697634'),
  ('Finances', 'Faithfulness Onu', '08140286257'),
  ('Media Unit', 'Nelson Okeke', '08124498675'),
  ('Intercessory', 'Godreigns Anyachebelu', '09161975291')
ON CONFLICT (department_name) 
DO UPDATE SET
  leader_name = EXCLUDED.leader_name,
  phone = EXCLUDED.phone;

-- Verify entries
SELECT * FROM public.department_leaders ORDER BY department_name ASC;
