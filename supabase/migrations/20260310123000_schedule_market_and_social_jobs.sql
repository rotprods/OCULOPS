-- ═══════════════════════════════════════════════════
-- OCULOPS OS — Schedule live market and social sync jobs
-- ═══════════════════════════════════════════════════

DO $$
DECLARE
  job_record RECORD;
BEGIN
  FOR job_record IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN (
      'market-data-hourly',
      'social-signals-every-2h'
    )
  LOOP
    PERFORM cron.unschedule(job_record.jobid);
  END LOOP;
EXCEPTION
  WHEN undefined_table OR undefined_function THEN
    NULL;
END $$;

SELECT cron.schedule(
  'market-data-hourly',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/market-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer {{CRON_SECRET}}'
    ),
    body := '{"persist": true}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'social-signals-every-2h',
  '17 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/social-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer {{CRON_SECRET}}'
    ),
    body := '{"persist": true}'::jsonb
  );
  $$
);
