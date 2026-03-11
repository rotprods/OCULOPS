-- ═══════════════════════════════════════════════════
-- OCULOPS v2 — Multi-Agent Orchestration Core
-- Event deliveries, pipeline runtime, memory facade, tool permissions
-- ═══════════════════════════════════════════════════

-- ── 1. Extend event_log for orchestration metadata ─────────────────────────
ALTER TABLE public.event_log
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source_agent text,
  ADD COLUMN IF NOT EXISTS pipeline_run_id uuid,
  ADD COLUMN IF NOT EXISTS step_run_id uuid,
  ADD COLUMN IF NOT EXISTS correlation_id uuid,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'emitted'
    CHECK (status IN ('emitted', 'processing', 'delivered', 'failed', 'dead_lettered')),
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_event_log_org_id ON public.event_log(org_id);
CREATE INDEX IF NOT EXISTS idx_event_log_source_agent ON public.event_log(source_agent);
CREATE INDEX IF NOT EXISTS idx_event_log_pipeline_run_id ON public.event_log(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_event_log_correlation_id ON public.event_log(correlation_id);

-- ── 2. Extend agent_registry with orchestration contracts ──────────────────
ALTER TABLE public.agent_registry
  ADD COLUMN IF NOT EXISTS input_contract jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS output_contract jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS consumes_events jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS emits_events jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tool_scopes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS memory_scopes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS run_mode text DEFAULT 'manual'
    CHECK (run_mode IN ('manual', 'scheduled', 'event_driven', 'hybrid')),
  ADD COLUMN IF NOT EXISTS orchestration_metadata jsonb DEFAULT '{}'::jsonb;

-- ── 3. Extend tool_registry for standardized invocation metadata ───────────
ALTER TABLE public.tool_registry
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS invocation_type text DEFAULT 'edge_function'
    CHECK (invocation_type IN ('edge_function', 'webhook', 'api_proxy', 'internal_rpc')),
  ADD COLUMN IF NOT EXISTS risk_level int DEFAULT 1 CHECK (risk_level BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rate_limit_per_minute int;

-- ── 4. Event subscriptions + delivery tracking ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  event_pattern text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('agent', 'workflow', 'webhook', 'pipeline')),
  target_ref text NOT NULL,
  delivery_mode text NOT NULL DEFAULT 'async' CHECK (delivery_mode IN ('async', 'sync')),
  retry_limit int NOT NULL DEFAULT 3,
  timeout_ms int NOT NULL DEFAULT 30000,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_subscriptions_org_id ON public.event_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_event_subscriptions_pattern ON public.event_subscriptions(event_pattern);
CREATE INDEX IF NOT EXISTS idx_event_subscriptions_target ON public.event_subscriptions(target_type, target_ref);

CREATE TABLE IF NOT EXISTS public.event_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.event_subscriptions(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.event_log(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_ref text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed', 'skipped', 'dead_lettered')),
  attempt_count int NOT NULL DEFAULT 0,
  latency_ms int,
  last_error text,
  payload jsonb DEFAULT '{}'::jsonb,
  delivered_at timestamptz,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_deliveries_event_id ON public.event_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_event_deliveries_org_id ON public.event_deliveries(org_id);
CREATE INDEX IF NOT EXISTS idx_event_deliveries_status ON public.event_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_event_deliveries_target ON public.event_deliveries(target_type, target_ref);

CREATE TABLE IF NOT EXISTS public.event_dead_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES public.event_deliveries(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.event_log(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  reason text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_dead_letters_event_id ON public.event_dead_letters(event_id);
CREATE INDEX IF NOT EXISTS idx_event_dead_letters_org_id ON public.event_dead_letters(org_id);
CREATE INDEX IF NOT EXISTS idx_event_dead_letters_resolved_at ON public.event_dead_letters(resolved_at);

-- ── 5. Memory facade ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_code_name text,
  scope text NOT NULL CHECK (scope IN ('task', 'shared_ops', 'long_term')),
  namespace text NOT NULL,
  entity_type text,
  entity_id uuid,
  pipeline_run_id uuid,
  step_run_id uuid,
  correlation_id uuid,
  summary text,
  content_json jsonb DEFAULT '{}'::jsonb,
  importance int DEFAULT 50 CHECK (importance BETWEEN 0 AND 100),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_entries_org_id ON public.memory_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_scope ON public.memory_entries(scope);
CREATE INDEX IF NOT EXISTS idx_memory_entries_namespace ON public.memory_entries(namespace);
CREATE INDEX IF NOT EXISTS idx_memory_entries_pipeline_run_id ON public.memory_entries(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_correlation_id ON public.memory_entries(correlation_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_created_at ON public.memory_entries(created_at DESC);

-- ── 6. Agent ↔ tool permissions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_tool_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_code_name text NOT NULL,
  tool_code_name text NOT NULL,
  permission_level text NOT NULL DEFAULT 'allow'
    CHECK (permission_level IN ('allow', 'approval', 'deny')),
  daily_budget_usd numeric DEFAULT 0,
  max_calls_per_run int,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, agent_code_name, tool_code_name)
);

CREATE INDEX IF NOT EXISTS idx_agent_tool_permissions_agent ON public.agent_tool_permissions(agent_code_name);
CREATE INDEX IF NOT EXISTS idx_agent_tool_permissions_tool ON public.agent_tool_permissions(tool_code_name);

-- ── 7. Pipeline runtime tables ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  code_name text NOT NULL,
  pipeline_type text NOT NULL DEFAULT 'operational',
  description text,
  goal_prompt text,
  default_context jsonb DEFAULT '{}'::jsonb,
  success_criteria jsonb DEFAULT '{}'::jsonb,
  retry_policy jsonb DEFAULT '{"mode":"step","max_attempts":1}'::jsonb,
  is_active boolean DEFAULT true,
  is_system boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, code_name)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_templates_org_id ON public.pipeline_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_templates_code_name ON public.pipeline_templates(code_name);

CREATE TABLE IF NOT EXISTS public.pipeline_template_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.pipeline_templates(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  step_key text NOT NULL,
  step_type text NOT NULL CHECK (step_type IN ('agent', 'workflow', 'event', 'task')),
  agent_code_name text,
  action text,
  input_mapping jsonb DEFAULT '{}'::jsonb,
  emits_event text,
  success_condition jsonb DEFAULT '{}'::jsonb,
  retry_limit int DEFAULT 1,
  timeout_ms int DEFAULT 30000,
  is_blocking boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, step_number),
  UNIQUE (template_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_template_steps_template_id ON public.pipeline_template_steps(template_id, step_number);
CREATE INDEX IF NOT EXISTS idx_pipeline_template_steps_agent_code_name ON public.pipeline_template_steps(agent_code_name);

CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.pipeline_templates(id) ON DELETE RESTRICT,
  initiated_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'copilot',
  goal text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  current_step_number int NOT NULL DEFAULT 0,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  context jsonb DEFAULT '{}'::jsonb,
  result jsonb DEFAULT '{}'::jsonb,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_org_id ON public.pipeline_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_template_id ON public.pipeline_runs(template_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON public.pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_correlation_id ON public.pipeline_runs(correlation_id);

CREATE TABLE IF NOT EXISTS public.pipeline_step_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id uuid NOT NULL REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  template_step_id uuid REFERENCES public.pipeline_template_steps(id) ON DELETE SET NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  step_key text NOT NULL,
  agent_code_name text,
  action text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'skipped', 'waiting')),
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb DEFAULT '{}'::jsonb,
  error text,
  attempt_count int NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_step_runs_pipeline_run_id ON public.pipeline_step_runs(pipeline_run_id, step_number);
CREATE INDEX IF NOT EXISTS idx_pipeline_step_runs_status ON public.pipeline_step_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_step_runs_agent_code_name ON public.pipeline_step_runs(agent_code_name);

CREATE TABLE IF NOT EXISTS public.pipeline_run_state (
  pipeline_run_id uuid PRIMARY KEY REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  current_agent text,
  waiting_for_event text,
  last_event_id uuid REFERENCES public.event_log(id) ON DELETE SET NULL,
  retry_cursor jsonb DEFAULT '{}'::jsonb,
  metrics jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_run_state_org_id ON public.pipeline_run_state(org_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_run_state_waiting_for_event ON public.pipeline_run_state(waiting_for_event);

-- ── 8. RLS ──────────────────────────────────────────────────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'event_subscriptions',
    'event_deliveries',
    'event_dead_letters',
    'memory_entries',
    'agent_tool_permissions',
    'pipeline_templates',
    'pipeline_template_steps',
    'pipeline_runs',
    'pipeline_step_runs',
    'pipeline_run_state'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "org_select_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "org_insert_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "org_update_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "org_delete_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "anon_agent_%s" ON public.%I', tbl, tbl);

    EXECUTE format(
      'CREATE POLICY "org_select_%s" ON public.%I FOR SELECT TO authenticated USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_update_%s" ON public.%I FOR UPDATE TO authenticated USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL) WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_delete_%s" ON public.%I FOR DELETE TO authenticated USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "anon_agent_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- event_log org-aware policy refresh
DROP POLICY IF EXISTS "Users read own events" ON public.event_log;
DROP POLICY IF EXISTS "Users insert events" ON public.event_log;
DROP POLICY IF EXISTS "Anon insert events" ON public.event_log;
DROP POLICY IF EXISTS "org_select_event_log" ON public.event_log;
DROP POLICY IF EXISTS "org_insert_event_log" ON public.event_log;
DROP POLICY IF EXISTS "anon_insert_event_log" ON public.event_log;

CREATE POLICY "org_select_event_log" ON public.event_log
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR org_id IN (SELECT user_org_ids())
    OR org_id IS NULL
  );

CREATE POLICY "org_insert_event_log" ON public.event_log
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL
    OR org_id IN (SELECT user_org_ids())
    OR org_id IS NULL
  );

CREATE POLICY "anon_insert_event_log" ON public.event_log
  FOR INSERT TO anon
  WITH CHECK (true);

-- ── 9. Updated_at + org triggers ───────────────────────────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'event_subscriptions',
    'event_deliveries',
    'memory_entries',
    'agent_tool_permissions',
    'pipeline_templates',
    'pipeline_template_steps',
    'pipeline_runs',
    'pipeline_step_runs'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'event_subscriptions',
    'event_deliveries',
    'event_dead_letters',
    'memory_entries',
    'agent_tool_permissions',
    'pipeline_templates',
    'pipeline_template_steps',
    'pipeline_runs',
    'pipeline_step_runs',
    'pipeline_run_state'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS auto_set_org_id ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER auto_set_org_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_default_org_id()',
      tbl
    );
  END LOOP;
END $$;

-- ── 10. Seed canonical agent contracts ─────────────────────────────────────
UPDATE public.agent_registry
SET
  run_mode = CASE
    WHEN code_name IN ('cortex', 'copilot', 'atlas', 'hunter', 'outreach', 'herald') THEN 'hybrid'
    WHEN code_name IN ('oracle', 'sentinel', 'forge') THEN 'scheduled'
    ELSE COALESCE(run_mode, 'manual')
  END,
  consumes_events = CASE code_name
    WHEN 'atlas' THEN '["pipeline.step.ready","scan.requested"]'::jsonb
    WHEN 'hunter' THEN '["lead.captured","pipeline.step.ready"]'::jsonb
    WHEN 'outreach' THEN '["lead.qualified","pipeline.step.ready"]'::jsonb
    WHEN 'cortex' THEN '["pipeline.started","agent.error","pipeline.retry_requested"]'::jsonb
    WHEN 'copilot' THEN '["goal.requested","pipeline.failed","pipeline.completed"]'::jsonb
    ELSE consumes_events
  END,
  emits_events = CASE code_name
    WHEN 'atlas' THEN '["scan.completed","lead.captured"]'::jsonb
    WHEN 'hunter' THEN '["lead.qualified","brief.generated"]'::jsonb
    WHEN 'outreach' THEN '["outreach.staged","message.sent"]'::jsonb
    WHEN 'cortex' THEN '["pipeline.started","pipeline.completed","pipeline.failed"]'::jsonb
    WHEN 'copilot' THEN '["goal.requested","pipeline.created"]'::jsonb
    ELSE emits_events
  END,
  tool_scopes = CASE code_name
    WHEN 'atlas' THEN '["google-maps-search","meta-business-discovery","tiktok-business-search"]'::jsonb
    WHEN 'hunter' THEN '["ai-qualifier","web-analyzer","social-signals"]'::jsonb
    WHEN 'outreach' THEN '["send-email","messaging-dispatch"]'::jsonb
    WHEN 'cortex' THEN '["automation-runner","event-dispatcher"]'::jsonb
    WHEN 'copilot' THEN '["orchestration-engine","agent-cortex","agent-outreach"]'::jsonb
    ELSE tool_scopes
  END,
  memory_scopes = CASE code_name
    WHEN 'atlas' THEN '["shared_ops"]'::jsonb
    WHEN 'hunter' THEN '["task","shared_ops"]'::jsonb
    WHEN 'outreach' THEN '["task","shared_ops","long_term"]'::jsonb
    WHEN 'cortex' THEN '["task","shared_ops"]'::jsonb
    WHEN 'copilot' THEN '["shared_ops","long_term"]'::jsonb
    ELSE memory_scopes
  END
WHERE code_name IN ('atlas', 'hunter', 'outreach', 'cortex', 'copilot', 'herald', 'oracle', 'sentinel', 'forge');

-- ── 11. Seed system tools ──────────────────────────────────────────────────
INSERT INTO public.tool_registry (
  org_id,
  name,
  code_name,
  category,
  description,
  endpoint_url,
  provider,
  invocation_type,
  risk_level,
  requires_approval,
  default_config,
  metadata
)
SELECT
  NULL,
  seed.name,
  seed.code_name,
  seed.category,
  seed.description,
  seed.endpoint_url,
  seed.provider,
  seed.invocation_type,
  seed.risk_level,
  seed.requires_approval,
  seed.default_config,
  seed.metadata
FROM (
  VALUES
    ('Google Maps Search', 'google-maps-search', 'prospecting', 'Discover businesses by geo query.', 'supabase://functions/google-maps-search', 'google', 'edge_function', 1, false, '{}'::jsonb, '{"managed_by":"system"}'::jsonb),
    ('AI Qualifier', 'ai-qualifier', 'intelligence', 'Score and qualify prospects.', 'supabase://functions/ai-qualifier', 'openai', 'edge_function', 1, false, '{}'::jsonb, '{"managed_by":"system"}'::jsonb),
    ('Automation Runner', 'automation-runner', 'orchestration', 'Executes workflow actions and trigger-based automations.', 'supabase://functions/automation-runner', 'supabase', 'edge_function', 2, false, '{}'::jsonb, '{"managed_by":"system"}'::jsonb),
    ('Event Dispatcher', 'event-dispatcher', 'orchestration', 'Routes events to subscribers and n8n/webhooks.', 'supabase://functions/event-dispatcher', 'supabase', 'edge_function', 2, false, '{}'::jsonb, '{"managed_by":"system"}'::jsonb),
    ('Messaging Dispatch', 'messaging-dispatch', 'messaging', 'Sends Gmail/WhatsApp outbound messages.', 'supabase://functions/messaging-dispatch', 'gmail_meta', 'edge_function', 3, true, '{}'::jsonb, '{"managed_by":"system"}'::jsonb),
    ('Send Email', 'send-email', 'messaging', 'Resend cold outreach and transactional mail.', 'supabase://functions/send-email', 'resend', 'edge_function', 3, true, '{}'::jsonb, '{"managed_by":"system"}'::jsonb),
    ('Orchestration Engine', 'orchestration-engine', 'orchestration', 'Creates and executes multi-agent pipeline runs.', 'supabase://functions/orchestration-engine', 'supabase', 'edge_function', 2, false, '{}'::jsonb, '{"managed_by":"system"}'::jsonb)
) AS seed(name, code_name, category, description, endpoint_url, provider, invocation_type, risk_level, requires_approval, default_config, metadata)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.tool_registry existing
  WHERE existing.org_id IS NULL
    AND existing.code_name = seed.code_name
);

-- ── 12. Seed agent tool permissions ────────────────────────────────────────
INSERT INTO public.agent_tool_permissions (
  org_id,
  agent_code_name,
  tool_code_name,
  permission_level,
  max_calls_per_run,
  metadata
)
SELECT NULL, seed.agent_code_name, seed.tool_code_name, seed.permission_level, seed.max_calls_per_run, seed.metadata
FROM (
  VALUES
    ('atlas', 'google-maps-search', 'allow', 3, '{"managed_by":"system"}'::jsonb),
    ('hunter', 'ai-qualifier', 'allow', 20, '{"managed_by":"system"}'::jsonb),
    ('hunter', 'google-maps-search', 'allow', 2, '{"managed_by":"system"}'::jsonb),
    ('outreach', 'send-email', 'approval', 20, '{"managed_by":"system"}'::jsonb),
    ('outreach', 'messaging-dispatch', 'approval', 20, '{"managed_by":"system"}'::jsonb),
    ('cortex', 'automation-runner', 'allow', 10, '{"managed_by":"system"}'::jsonb),
    ('cortex', 'event-dispatcher', 'allow', 20, '{"managed_by":"system"}'::jsonb),
    ('copilot', 'orchestration-engine', 'allow', 10, '{"managed_by":"system"}'::jsonb)
) AS seed(agent_code_name, tool_code_name, permission_level, max_calls_per_run, metadata)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.agent_tool_permissions existing
  WHERE existing.org_id IS NULL
    AND existing.agent_code_name = seed.agent_code_name
    AND existing.tool_code_name = seed.tool_code_name
);

-- ── 13. Seed pipeline templates ────────────────────────────────────────────
INSERT INTO public.pipeline_templates (
  org_id,
  name,
  code_name,
  pipeline_type,
  description,
  goal_prompt,
  default_context,
  success_criteria,
  retry_policy,
  is_active,
  is_system
)
SELECT
  NULL,
  seed.name,
  seed.code_name,
  seed.pipeline_type,
  seed.description,
  seed.goal_prompt,
  seed.default_context,
  seed.success_criteria,
  seed.retry_policy,
  true,
  true
FROM (
  VALUES
    (
      'Lead Discovery Pipeline',
      'lead_discovery',
      'sales',
      'Discover businesses, qualify them, and stage outreach from a single run.',
      'Find and qualify companies, then prepare outreach-ready opportunities.',
      '{"limit":12}'::jsonb,
      '{"required_events":["pipeline.completed"],"completion":"shortlist_or_staged_outreach"}'::jsonb,
      '{"mode":"step","max_attempts":1}'::jsonb
    ),
    (
      'Sales Outreach Pipeline',
      'sales_outreach',
      'sales',
      'Turn qualified leads into approved/sent outreach actions.',
      'Move qualified leads into outreach with approval-aware delivery.',
      '{"limit":20}'::jsonb,
      '{"required_events":["outreach.staged","message.sent"],"completion":"outreach_progress"}'::jsonb,
      '{"mode":"step","max_attempts":1}'::jsonb
    ),
    (
      'Marketing Intelligence Pipeline',
      'marketing_intelligence',
      'marketing',
      'Collect market signals, analyze them, and generate an executable brief.',
      'Scan the market, detect signals, and build an actionable campaign brief.',
      '{}'::jsonb,
      '{"required_events":["pipeline.completed"],"completion":"intelligence_snapshot"}'::jsonb,
      '{"mode":"step","max_attempts":1}'::jsonb
    )
) AS seed(name, code_name, pipeline_type, description, goal_prompt, default_context, success_criteria, retry_policy)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.pipeline_templates existing
  WHERE existing.org_id IS NULL
    AND existing.code_name = seed.code_name
);

INSERT INTO public.pipeline_template_steps (
  template_id,
  org_id,
  step_number,
  step_key,
  step_type,
  agent_code_name,
  action,
  input_mapping,
  emits_event,
  success_condition,
  retry_limit,
  timeout_ms,
  is_blocking,
  metadata
)
SELECT
  template.id,
  NULL,
  seed.step_number,
  seed.step_key,
  seed.step_type,
  seed.agent_code_name,
  seed.action,
  seed.input_mapping,
  seed.emits_event,
  seed.success_condition,
  seed.retry_limit,
  seed.timeout_ms,
  seed.is_blocking,
  seed.metadata
FROM public.pipeline_templates template
JOIN (
  VALUES
    ('lead_discovery', 1, 'atlas_scan', 'agent', 'atlas', 'cycle', '{"maxResults":20}'::jsonb, 'scan.completed', '{"requires":"scan_id"}'::jsonb, 1, 120000, true, '{}'::jsonb),
    ('lead_discovery', 2, 'hunter_qualify', 'agent', 'hunter', 'cycle', '{"limit":15}'::jsonb, 'lead.qualified', '{"requires":"qualified_count"}'::jsonb, 1, 120000, true, '{}'::jsonb),
    ('lead_discovery', 3, 'outreach_stage', 'agent', 'outreach', 'cycle', '{"limit":12}'::jsonb, 'outreach.staged', '{"requires":"staged_count"}'::jsonb, 1, 120000, true, '{}'::jsonb),
    ('sales_outreach', 1, 'hunter_refresh', 'agent', 'hunter', 'cycle', '{"limit":20}'::jsonb, 'lead.qualified', '{"requires":"shortlist"}'::jsonb, 1, 120000, true, '{}'::jsonb),
    ('sales_outreach', 2, 'outreach_stage', 'agent', 'outreach', 'cycle', '{"limit":20}'::jsonb, 'outreach.staged', '{"requires":"staged_count"}'::jsonb, 1, 120000, true, '{}'::jsonb),
    ('sales_outreach', 3, 'outreach_stats', 'agent', 'outreach', 'stats', '{}'::jsonb, 'pipeline.completed', '{"requires":"stats"}'::jsonb, 1, 60000, true, '{}'::jsonb),
    ('marketing_intelligence', 1, 'market_scan', 'workflow', NULL, 'market-data', '{"persist":true}'::jsonb, 'signal.detected', '{"requires":"snapshots"}'::jsonb, 1, 120000, true, '{}'::jsonb),
    ('marketing_intelligence', 2, 'social_scan', 'workflow', NULL, 'social-signals', '{"persist":true}'::jsonb, 'signal.detected', '{"requires":"signals"}'::jsonb, 1, 120000, true, '{}'::jsonb),
    ('marketing_intelligence', 3, 'oracle_brief', 'agent', 'oracle', 'analyze', '{}'::jsonb, 'pipeline.completed', '{"requires":"insights"}'::jsonb, 1, 120000, true, '{}'::jsonb)
) AS seed(template_code_name, step_number, step_key, step_type, agent_code_name, action, input_mapping, emits_event, success_condition, retry_limit, timeout_ms, is_blocking, metadata)
  ON template.code_name = seed.template_code_name
WHERE NOT EXISTS (
  SELECT 1
  FROM public.pipeline_template_steps existing
  WHERE existing.template_id = template.id
    AND existing.step_number = seed.step_number
);

-- ── 14. Seed event subscriptions ───────────────────────────────────────────
INSERT INTO public.event_subscriptions (
  org_id,
  name,
  event_pattern,
  target_type,
  target_ref,
  delivery_mode,
  retry_limit,
  config
)
SELECT
  NULL,
  seed.name,
  seed.event_pattern,
  seed.target_type,
  seed.target_ref,
  seed.delivery_mode,
  seed.retry_limit,
  seed.config
FROM (
  VALUES
    ('Lead captured → Hunter queue', 'lead.captured', 'agent', 'hunter', 'async', 3, '{"action":"cycle"}'::jsonb),
    ('Lead qualified → Outreach queue', 'lead.qualified', 'agent', 'outreach', 'async', 3, '{"action":"cycle"}'::jsonb),
    ('Deal stage change → Automation runner', 'deal.stage_changed', 'workflow', 'deal.stage_changed', 'async', 3, '{}'::jsonb),
    ('Pipeline failed → Copilot queue', 'pipeline.failed', 'agent', 'copilot', 'async', 3, '{"action":"cycle"}'::jsonb),
    ('Goal requested → Lead discovery pipeline', 'goal.requested', 'pipeline', 'lead_discovery', 'async', 1, '{"auto_execute":true}'::jsonb)
) AS seed(name, event_pattern, target_type, target_ref, delivery_mode, retry_limit, config)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.event_subscriptions existing
  WHERE existing.org_id IS NULL
    AND existing.event_pattern = seed.event_pattern
    AND existing.target_type = seed.target_type
    AND existing.target_ref = seed.target_ref
);

-- ── 15. Realtime publication ───────────────────────────────────────────────
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.event_deliveries; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.event_dead_letters; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_entries; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_runs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_step_runs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_run_state; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
