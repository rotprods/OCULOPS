-- ═══════════════════════════════════════════════════
-- OCULOPS — Event Dispatcher Webhook
-- Auto-dispatch event_log inserts to n8n via edge function
-- Uses pg_net for async HTTP calls from Postgres
-- ═══════════════════════════════════════════════════

-- Enable pg_net extension (async HTTP from Postgres)
-- CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: POST to event-dispatcher edge function on event_log INSERT
CREATE OR REPLACE FUNCTION public.dispatch_event_to_n8n()
RETURNS trigger AS $$
DECLARE
  supabase_url text := current_setting('app.settings.supabase_url', true);
  service_key  text := current_setting('app.settings.service_role_key', true);
  edge_url     text;
BEGIN
  -- Build the edge function URL
  edge_url := COALESCE(supabase_url, '') || '/functions/v1/event-dispatcher';

  -- Skip if no supabase_url configured
  IF supabase_url IS NULL OR supabase_url = '' THEN
    RETURN NEW;
  END IF;

  -- Async HTTP POST via pg_net (non-blocking, fire-and-forget)
  PERFORM net.http_post(
    url     := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_key, '')
    ),
    body    := jsonb_build_object(
      'event_type', NEW.event_type,
      'payload',    NEW.payload,
      'id',         NEW.id,
      'created_at', NEW.created_at,
      'user_id',    NEW.user_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (fires AFTER INSERT so the row is committed)
DROP TRIGGER IF EXISTS event_log_dispatch ON public.event_log;
CREATE TRIGGER event_log_dispatch
    AFTER INSERT ON public.event_log
    FOR EACH ROW
    EXECUTE FUNCTION public.dispatch_event_to_n8n();
