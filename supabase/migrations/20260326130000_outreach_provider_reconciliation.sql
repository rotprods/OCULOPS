-- ═══════════════════════════════════════════════════
-- OCULOPS — Outreach provider reconciliation layer
-- Persist provider ids/status + run-safe outbound/inbound linkage
-- ═══════════════════════════════════════════════════

ALTER TABLE public.outreach_queue
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS provider_error text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.outreach_queue
SET
  metadata = COALESCE(metadata, '{}'::jsonb),
  updated_at = COALESCE(updated_at, created_at, now());

CREATE INDEX IF NOT EXISTS idx_outreach_queue_conversation_id ON public.outreach_queue(conversation_id);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_message_id ON public.outreach_queue(message_id);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_provider_message_id ON public.outreach_queue(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_queue_provider_status ON public.outreach_queue(provider_status) WHERE provider_status IS NOT NULL;

DO $$
BEGIN
  IF to_regproc('public.set_row_updated_at') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_outreach_queue_updated_at ON public.outreach_queue';
    EXECUTE 'CREATE TRIGGER set_outreach_queue_updated_at
      BEFORE UPDATE ON public.outreach_queue
      FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at()';
  END IF;
END $$;

