
-- ═══════════════════════════════════════════════════
-- CORTEX — Multi-Agent AI Infrastructure
-- ═══════════════════════════════════════════════════

-- ── Agent Registry ──
CREATE TABLE IF NOT EXISTS agent_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code_name TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'offline',
  capabilities JSONB DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  model TEXT DEFAULT 'gpt-4o-mini',
  cycle_minutes INT DEFAULT 360,
  parent_agent TEXT,
  last_run_at TIMESTAMPTZ,
  total_runs INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  avg_duration_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Agent Tasks (Queue) ──
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agent_registry(id) ON DELETE CASCADE,
  agent_code_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'analyze',
  title TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'queued',
  priority TEXT DEFAULT 'normal',
  result JSONB,
  error TEXT,
  created_by TEXT DEFAULT 'user',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Agent Logs (Audit Trail) ──
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agent_registry(id) ON DELETE CASCADE,
  agent_code_name TEXT NOT NULL,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  input JSONB,
  output JSONB,
  tokens_used INT DEFAULT 0,
  duration_ms INT DEFAULT 0,
  model TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Agent Messages (Inter-Agent Communication) ──
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  type TEXT DEFAULT 'request',
  subject TEXT,
  content JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──
ALTER TABLE agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage agents
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['agent_registry','agent_tasks','agent_logs','agent_messages'])
  LOOP
    EXECUTE format('CREATE POLICY "auth_select_%s" ON %I FOR SELECT TO authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY "auth_insert_%s" ON %I FOR INSERT TO authenticated WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "auth_update_%s" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "auth_delete_%s" ON %I FOR DELETE TO authenticated USING (true)', t, t);
  END LOOP;
END
$$;

-- Also allow anon access for edge function invocations (service role bypasses RLS anyway)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['agent_registry','agent_tasks','agent_logs','agent_messages'])
  LOOP
    EXECUTE format('CREATE POLICY "anon_select_%s" ON %I FOR SELECT TO anon USING (true)', t, t);
    EXECUTE format('CREATE POLICY "anon_insert_%s" ON %I FOR INSERT TO anon WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "anon_update_%s" ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END
$$;

-- Enable realtime for agent tables
ALTER PUBLICATION supabase_realtime ADD TABLE agent_registry;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_messages;

-- ═══ SEED: Register all 8 agents ═══
INSERT INTO agent_registry (code_name, name, role, description, model, cycle_minutes, parent_agent, status, capabilities, config) VALUES
(
  'cortex',
  'CORTEX',
  'Head Orchestrator',
  'Agente principal. Orquesta el ciclo completo: delega tareas, recopila resultados, resuelve conflictos y genera síntesis diaria.',
  'gpt-4o',
  60,
  NULL,
  'online',
  '["orchestrate","delegate","synthesize","monitor","resolve_conflicts"]'::jsonb,
  '{"max_sub_tasks": 20, "synthesis_hour": 8, "alert_threshold": 3}'::jsonb
),
(
  'atlas',
  'ATLAS',
  'Market Intelligence',
  'Escanea mercados, competidores y tendencias. Alimenta la tabla de señales con inteligencia de mercado en tiempo real.',
  'gpt-4o-mini',
  360,
  'cortex',
  'online',
  '["market_scan","competitor_analysis","trend_detection","signal_generation"]'::jsonb,
  '{"regions": ["murcia","spain","europe"], "industries": ["marketing_digital","ai_agencies","saas"]}'::jsonb
),
(
  'hunter',
  'HUNTER',
  'Prospection Agent',
  'Encuentra leads, califica negocios, puntúa contactos. Motor de prospección autónomo 24/7.',
  'gpt-4o-mini',
  240,
  'cortex',
  'online',
  '["lead_scoring","business_qualification","outreach_drafting","contact_enrichment"]'::jsonb,
  '{"min_score": 40, "max_leads_per_cycle": 50, "auto_promote_threshold": 80}'::jsonb
),
(
  'oracle',
  'ORACLE',
  'Analytics Engine',
  'Analiza todos los datos del sistema, cruza métricas, detecta patrones y genera insights de negocio accionables.',
  'gpt-4o',
  720,
  'cortex',
  'online',
  '["cross_analysis","pattern_detection","insight_generation","study_update","forecast"]'::jsonb,
  '{"tables_to_scan": ["contacts","deals","campaigns","signals","finance_entries","daily_snapshots"]}'::jsonb
),
(
  'sentinel',
  'SENTINEL',
  'Watchtower Guardian',
  'Monitorea KPIs, detecta anomalías, identifica riesgos y lanza alertas preventivas automáticas.',
  'gpt-4o-mini',
  60,
  'cortex',
  'online',
  '["anomaly_detection","threshold_monitoring","risk_assessment","alert_generation"]'::jsonb,
  '{"kpi_thresholds": {"mrr_drop_pct": 10, "churn_spike": 5, "pipeline_low": 10000}, "check_interval_minutes": 60}'::jsonb
),
(
  'forge',
  'FORGE',
  'Content Creator',
  'Genera contenido de marketing: posts sociales, emails de outreach, copy para landing, propuestas comerciales.',
  'gpt-4o',
  0,
  'cortex',
  'online',
  '["social_post","email_draft","landing_copy","proposal_draft","ad_copy"]'::jsonb,
  '{"tone": "profesional", "brand_voice": "innovador_premium", "languages": ["es","en"]}'::jsonb
),
(
  'strategist',
  'STRATEGIST',
  'Decision Advisor',
  'Evalúa opciones estratégicas con datos. Analiza pros/contras, calcula ROI esperado y recomienda la mejor decisión.',
  'gpt-4o',
  0,
  'cortex',
  'online',
  '["option_evaluation","roi_calculation","risk_analysis","recommendation","scenario_modeling"]'::jsonb,
  '{"decision_framework": "weighted_matrix", "confidence_threshold": 0.7}'::jsonb
),
(
  'scribe',
  'SCRIBE',
  'Report Generator',
  'Genera snapshots diarios, reportes semanales, resúmenes ejecutivos y tracking de KPIs del negocio.',
  'gpt-4o-mini',
  1440,
  'cortex',
  'online',
  '["daily_snapshot","weekly_report","executive_summary","kpi_tracking","trend_report"]'::jsonb,
  '{"report_hour": 7, "snapshot_tables": ["contacts","deals","tasks","alerts","finance_entries","campaigns"]}'::jsonb
);
;
