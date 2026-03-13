-- ═══════════════════════════════════════════════════════════════════════════════
-- Agent Definitions — Dynamic agent registry for vault-imported agents
-- Allows any vault agent to run through the generic agent-runner edge function
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agent_definitions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_name     text UNIQUE NOT NULL,
  display_name  text NOT NULL,
  description   text,
  source        text DEFAULT 'vault',         -- 'vault' | 'custom' | 'builtin'
  vault_path    text,                          -- original vault file path
  namespace     text,                          -- vault namespace (engineering, research, etc.)

  -- Brain configuration
  system_prompt text NOT NULL,                 -- the core prompt injected into runBrain()
  goal_template text,                          -- default goal if none provided
  model         text DEFAULT 'gpt-4o-mini',
  max_rounds    int DEFAULT 4 CHECK (max_rounds BETWEEN 1 AND 10),
  timeout_ms    int DEFAULT 45000,

  -- Governance
  type          text DEFAULT 'domain' CHECK (type IN ('orchestrator','domain','execution','safety')),
  hierarchy_level int DEFAULT 2 CHECK (hierarchy_level BETWEEN 0 AND 3),
  allowed_skills  text[] DEFAULT ARRAY[
    'web_search','fetch_external_data','fetch_url',
    'recall_memory','store_memory','crm_query',
    'generate_content','audit_log_write','reasoning_trace_store','metrics_query'
  ],
  restricted_skills text[] DEFAULT ARRAY['rollback_action','send_notification'],
  requires_approval text[] DEFAULT ARRAY[]::text[],
  can_call_agents   text[] DEFAULT ARRAY[]::text[],
  max_spend_usd     numeric(6,2) DEFAULT 0.20,
  safe_mode         boolean DEFAULT false,

  -- State
  is_active     boolean DEFAULT true,
  total_runs    int DEFAULT 0,
  last_run_at   timestamptz,
  avg_duration_ms int DEFAULT 0,

  -- Meta
  tags          text[] DEFAULT ARRAY[]::text[],
  config        jsonb DEFAULT '{}'::jsonb,     -- extra config (per-agent overrides)
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_agent_definitions_active ON agent_definitions (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agent_definitions_namespace ON agent_definitions (namespace);
CREATE INDEX IF NOT EXISTS idx_agent_definitions_tags ON agent_definitions USING gin (tags);

-- RLS
ALTER TABLE agent_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_definitions_read_all" ON agent_definitions FOR SELECT USING (true);
CREATE POLICY "agent_definitions_admin_write" ON agent_definitions FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM organization_members om JOIN roles r ON om.role_id = r.id WHERE r.name IN ('owner','admin'))
);
