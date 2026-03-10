-- ═══════════════════════════════════════════════════
-- Agent studies, delivery targets, and Telegram output routing
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agent_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agent_registry(id) ON DELETE SET NULL,
  agent_code_name TEXT NOT NULL,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'agent_run',
  study_type TEXT DEFAULT 'study',
  title TEXT NOT NULL,
  summary TEXT,
  content_markdown TEXT,
  content_json JSONB DEFAULT '{}'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[],
  delivery_status TEXT DEFAULT 'pending',
  telegram_sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_delivery_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_code_name TEXT,
  type TEXT NOT NULL DEFAULT 'telegram',
  label TEXT NOT NULL,
  chat_id TEXT,
  thread_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  notify_manual BOOLEAN DEFAULT TRUE,
  notify_automated BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_delivery_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_studies_agent_created
  ON agent_studies(agent_code_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_studies_user_created
  ON agent_studies(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_delivery_targets_scope
  ON agent_delivery_targets(user_id, type, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_delivery_targets_telegram_scope
  ON agent_delivery_targets(user_id, COALESCE(agent_code_name, '*'), type, COALESCE(chat_id, '*'));

CREATE TRIGGER set_agent_studies_updated_at
  BEFORE UPDATE ON agent_studies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

CREATE TRIGGER set_agent_delivery_targets_updated_at
  BEFORE UPDATE ON agent_delivery_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE agent_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_delivery_targets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_studies' AND policyname = 'auth_select_agent_studies'
  ) THEN
    CREATE POLICY auth_select_agent_studies ON agent_studies FOR SELECT TO authenticated USING (true);
    CREATE POLICY auth_insert_agent_studies ON agent_studies FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY auth_update_agent_studies ON agent_studies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY auth_delete_agent_studies ON agent_studies FOR DELETE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_studies' AND policyname = 'anon_select_agent_studies'
  ) THEN
    CREATE POLICY anon_select_agent_studies ON agent_studies FOR SELECT TO anon USING (true);
    CREATE POLICY anon_insert_agent_studies ON agent_studies FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY anon_update_agent_studies ON agent_studies FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_delivery_targets' AND policyname = 'auth_select_agent_delivery_targets'
  ) THEN
    CREATE POLICY auth_select_agent_delivery_targets ON agent_delivery_targets FOR SELECT TO authenticated USING (true);
    CREATE POLICY auth_insert_agent_delivery_targets ON agent_delivery_targets FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY auth_update_agent_delivery_targets ON agent_delivery_targets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY auth_delete_agent_delivery_targets ON agent_delivery_targets FOR DELETE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_delivery_targets' AND policyname = 'anon_select_agent_delivery_targets'
  ) THEN
    CREATE POLICY anon_select_agent_delivery_targets ON agent_delivery_targets FOR SELECT TO anon USING (true);
    CREATE POLICY anon_insert_agent_delivery_targets ON agent_delivery_targets FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY anon_update_agent_delivery_targets ON agent_delivery_targets FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE agent_studies;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE agent_delivery_targets;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
