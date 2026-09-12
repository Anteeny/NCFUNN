-- ==============================================================================
-- NCF UNN ATTENDANCE TRACKER - AUTOMATED CRON SCHEDULES (pg_cron + pg_net)
-- ==============================================================================
-- Run this script in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- It automates:
--   1. Wednesday & Sunday 7:00 PM (WAT) - First Call Reminder to G12 & Dept Leaders
--   2. Wednesday & Sunday 11:00 PM (WAT) - Final Urgent Call for Missing Reports
--   3. Every Day 8:00 AM (WAT) - Daily Birthday Alerts to Admin (08106939820) & Leaders
-- ==============================================================================

-- 1. Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Wednesday & Sunday 7:00 PM WAT (18:00 UTC) - First Call Reminder
-- Cron Expression: '0 18 * * 0,3' (Sunday = 0, Wednesday = 3)
SELECT cron.schedule(
  'ncf-service-reminders-7pm',
  '0 18 * * 0,3',
  $$
  SELECT net.http_post(
    url := 'https://cjbedftdexzcsydwayig.supabase.co/functions/v1/send-reminders?mode=7pm',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 3. Wednesday & Sunday 11:00 PM WAT (22:00 UTC) - Urgent Final Call
-- Cron Expression: '0 22 * * 0,3' (Sunday = 0, Wednesday = 3)
SELECT cron.schedule(
  'ncf-service-reminders-11pm',
  '0 22 * * 0,3',
  $$
  SELECT net.http_post(
    url := 'https://cjbedftdexzcsydwayig.supabase.co/functions/v1/send-reminders?mode=11pm',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 4. Every Day at 8:00 AM WAT (07:00 UTC) - Daily Birthday Alerts
-- Cron Expression: '0 7 * * *' (Every Day at 07:00 UTC)
SELECT cron.schedule(
  'ncf-daily-birthday-alerts',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cjbedftdexzcsydwayig.supabase.co/functions/v1/send-reminders?action=birthdays',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Verification: List all active cron jobs
SELECT jobid, schedule, command, nodename, nodeport, database, username, active, jobname 
FROM cron.job;
