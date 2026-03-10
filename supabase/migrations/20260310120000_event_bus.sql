-- ═══════════════════════════════════════════════════
-- ANTIGRAVITY OS — Event Bus (pg_notify)
-- Cross-cutting event log + realtime broadcast
-- ═══════════════════════════════════════════════════

-- Event log table
CREATE TABLE IF NOT EXISTS public.event_log (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text        NOT NULL,
    payload    jsonb       DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    user_id    uuid        REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_event_log_event_type ON public.event_log (event_type);
CREATE INDEX idx_event_log_created_at ON public.event_log (created_at);

-- Enable RLS
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own events + global (null user_id)
CREATE POLICY "Users read own events"
    ON public.event_log FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert events
CREATE POLICY "Users insert events"
    ON public.event_log FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Anon can insert (for edge functions / agents)
CREATE POLICY "Anon insert events"
    ON public.event_log FOR INSERT
    TO anon
    WITH CHECK (true);

-- Trigger function: broadcast via pg_notify on INSERT
CREATE OR REPLACE FUNCTION public.notify_event_bus()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('antigravity:events', row_to_json(NEW)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on event_log
CREATE TRIGGER event_log_notify
    AFTER INSERT ON public.event_log
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_event_bus();

-- Enable realtime for event_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_log;
