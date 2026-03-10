-- ═══════════════════════════════════════════════════
-- Agent API Permissions & Usage Logging
-- ═══════════════════════════════════════════════════

-- ── Add allowed_apis to agent_registry ──
ALTER TABLE agent_registry
  ADD COLUMN IF NOT EXISTS allowed_apis JSONB DEFAULT '[]'::jsonb;

-- ── API Usage Log ──
CREATE TABLE IF NOT EXISTS agent_api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_code_name TEXT NOT NULL,
  api_name TEXT NOT NULL,
  endpoint TEXT,
  method TEXT DEFAULT 'GET',
  status_code INT,
  duration_ms INT DEFAULT 0,
  request_summary JSONB DEFAULT '{}'::jsonb,
  response_summary JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_agent ON agent_api_logs(agent_code_name);
CREATE INDEX IF NOT EXISTS idx_api_logs_api ON agent_api_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON agent_api_logs(created_at DESC);

-- ── RLS ──
ALTER TABLE agent_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_agent_api_logs" ON agent_api_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_agent_api_logs" ON agent_api_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anon_select_agent_api_logs" ON agent_api_logs FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_agent_api_logs" ON agent_api_logs FOR INSERT TO anon WITH CHECK (true);

-- ── Realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE agent_api_logs;

-- ══════════════════════════════════
-- Seed allowed_apis per agent
-- ══════════════════════════════════

UPDATE agent_registry SET allowed_apis = '["github","linear","notion","slack","supabase","todoist"]'::jsonb
  WHERE code_name = 'cortex';

UPDATE agent_registry SET allowed_apis = '["brave-search","google-maps","apify","alphavantage","context7"]'::jsonb
  WHERE code_name = 'atlas';

UPDATE agent_registry SET allowed_apis = '["hubspot","brave-search","apify","resend","dropbox","google-maps"]'::jsonb
  WHERE code_name = 'hunter';

UPDATE agent_registry SET allowed_apis = '["supabase","postgres","stripe","hubspot","alphavantage","snowflake"]'::jsonb
  WHERE code_name = 'oracle';

UPDATE agent_registry SET allowed_apis = '["sentry","supabase","slack","vercel","cloudflare","docker"]'::jsonb
  WHERE code_name = 'sentinel';

UPDATE agent_registry SET allowed_apis = '["notion","figma","dropbox","resend","everart","spotify"]'::jsonb
  WHERE code_name = 'forge';

UPDATE agent_registry SET allowed_apis = '["supabase","alphavantage","hubspot","linear","airtable"]'::jsonb
  WHERE code_name = 'strategist';

UPDATE agent_registry SET allowed_apis = '["supabase","notion","slack","hubspot","stripe","google-tasks","todoist"]'::jsonb
  WHERE code_name = 'scribe';
