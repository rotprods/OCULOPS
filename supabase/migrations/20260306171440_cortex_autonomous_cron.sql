
-- CORTEX autonomously orchestrates every 15 minutes
-- Uses pg_net to call the Edge Function via HTTP
SELECT cron.schedule(
  'cortex-orchestration-cycle',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/agent-cortex',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer {{SUPABASE_ANON_KEY}}'
    ),
    body := '{"action": "orchestrate"}'::jsonb
  );
  $$
);

-- SENTINEL health check every hour
SELECT cron.schedule(
  'sentinel-health-check',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/agent-sentinel',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer {{SUPABASE_ANON_KEY}}'
    ),
    body := '{"action": "health_check"}'::jsonb
  );
  $$
);

-- ORACLE daily market analysis at 8:00 AM
SELECT cron.schedule(
  'oracle-daily-scan',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/agent-oracle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer {{SUPABASE_ANON_KEY}}'
    ),
    body := '{"action": "daily_scan"}'::jsonb
  );
  $$
);

-- SCRIBE daily report at 9:00 PM
SELECT cron.schedule(
  'scribe-daily-report',
  '0 21 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/agent-scribe',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer {{SUPABASE_ANON_KEY}}'
    ),
    body := '{"action": "daily_report"}'::jsonb
  );
  $$
);
;
