-- ═══════════════════════════════════════════════════
-- ANTIGRAVITY OS — Remove cron jobs that target missing functions
-- ═══════════════════════════════════════════════════

DO $$
DECLARE
  job_record RECORD;
BEGIN
  FOR job_record IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN (
      'sentinel-health-check',
      'scribe-daily-report',
      'oracle-daily-scan'
    )
  LOOP
    PERFORM cron.unschedule(job_record.jobid);
  END LOOP;
EXCEPTION
  WHEN undefined_table OR undefined_function THEN
    NULL;
END $$;
