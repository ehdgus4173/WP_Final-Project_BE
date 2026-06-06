-- =====================================================================
-- supabase/setup_pg_cron.sql — Supabase-only. NOT applied by migrations
-- (pg_cron / pg_net are managed extensions that exist only on Supabase).
--
-- HOW TO APPLY (once, after the BE is deployed to Render):
--   1. Replace [BE_RENDER_URL] and [CRON_SECRET] below.
--   2. Supabase Dashboard → SQL Editor → paste this file → Run.
--   3. Verify with the SELECT at the bottom.
--
-- TIMEZONE: pg_cron runs in UTC. KST 06:00 = UTC 21:00 (previous day).
-- The generated issue is created as status='pending' and must be approved by
-- an admin (PATCH /api/admin/issues/:id) before it appears on the site.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Re-runnable: drop the job if it already exists.
DO $$
BEGIN
  PERFORM cron.unschedule('generate-daily-issue')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-issue');
END $$;

SELECT cron.schedule(
  'generate-daily-issue',
  '0 21 * * *',                                  -- UTC 21:00 = KST 06:00
  $$
  SELECT net.http_post(
    url := 'https://[BE_RENDER_URL]/api/cron/generate-issues',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer [CRON_SECRET]'
    ),
    body := jsonb_build_object('triggered_by', 'pg_cron'),
    timeout_milliseconds := 60000
  );
  $$
);

-- Sanity check — one row with jobname 'generate-daily-issue'.
SELECT jobid, schedule, jobname, active
  FROM cron.job
 WHERE jobname = 'generate-daily-issue';

-- Recent runs (check after 06:00 KST):
-- SELECT * FROM cron.job_run_details
--  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-daily-issue')
--  ORDER BY start_time DESC LIMIT 10;
