-- Update autonomous schedules to run daily at 8:00 AM

SELECT cron.schedule(
  'cortex-orchestration-cycle',
  '0 8 * * *',
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

SELECT cron.schedule(
  'sentinel-health-check',
  '0 8 * * *',
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

SELECT cron.schedule(
  'scribe-daily-report',
  '0 8 * * *',
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
