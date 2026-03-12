-- MasterIntelligence daily autonomous self-improvement cron
-- Runs at 07:00 UTC — triggers agent-copilot with EVOLVER mandate
-- agent-copilot will: evolver_run → evolver_status → evolver_apply (if shadow)

SELECT cron.unschedule('masterintelligence-daily-improve') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'masterintelligence-daily-improve'
);

SELECT cron.schedule(
  'masterintelligence-daily-improve',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/agent-copilot',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body := '{
      "messages": [{
        "role": "user",
        "content": "AUTONOMOUS DAILY IMPROVEMENT CYCLE: 1) Run evolver_run to trigger one agent improvement cycle. 2) Check evolver_status to see the result. 3) If any experiments are in shadow status (improved but not applied), evaluate the mutation and apply it with evolver_apply if the reasoning looks sound. 4) Report what was done. This is your daily mandate as MasterIntelligence — execute without asking for confirmation."
      }],
      "source": "cron_daily_improve"
    }'::jsonb
  ) AS request_id;
  $$
);
