-- ═══════════════════════════════════════════════════
-- OCULOPS OS — Sync missing agents and briefing RPC
-- ═══════════════════════════════════════════════════

INSERT INTO agent_registry (
  code_name,
  name,
  role,
  description,
  model,
  cycle_minutes,
  parent_agent,
  status,
  capabilities,
  config,
  allowed_apis
)
VALUES
(
  'outreach',
  'OUTREACH',
  'Outbound Orchestrator',
  'Prepara drafts y secuencias de outreach desde leads ya calificados.',
  'gpt-4o-mini',
  240,
  'cortex',
  'online',
  '["draft_sequences","stage_outreach","channel_routing","lead_follow_up"]'::jsonb,
  '{"max_batch_size": 30, "default_channel": "email"}'::jsonb,
  '["resend","whatsapp","manychat","telegram","notion","google-maps","openai","anthropic"]'::jsonb
),
(
  'herald',
  'HERALD',
  'Executive Briefing Broadcaster',
  'Compila el briefing operativo y lo transmite a Telegram.',
  'gpt-4o-mini',
  1440,
  'cortex',
  'online',
  '["daily_briefing","telegram_dispatch","ops_summary"]'::jsonb,
  '{"dispatch_hour": 8, "channel": "telegram"}'::jsonb,
  '["telegram","resend","slack","notion","openai","anthropic"]'::jsonb
)
ON CONFLICT (code_name)
DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  description = EXCLUDED.description,
  model = EXCLUDED.model,
  cycle_minutes = EXCLUDED.cycle_minutes,
  parent_agent = EXCLUDED.parent_agent,
  status = EXCLUDED.status,
  capabilities = EXCLUDED.capabilities,
  config = EXCLUDED.config,
  allowed_apis = COALESCE(agent_registry.allowed_apis, EXCLUDED.allowed_apis, '[]'::jsonb);

CREATE OR REPLACE FUNCTION get_daily_briefing_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_pipeline_total numeric;
  v_pipeline_yesterday numeric;
  v_deal_count integer;
  v_signal_count integer;
  v_critical_signal_count integer;
  v_agent_online_count integer;
  v_agent_total_count integer;
  v_health_score integer;
  v_tasks_today_count integer;
  v_stale_deals jsonb;
  v_signals jsonb;
  v_offline_agents jsonb;
  v_top_tasks jsonb;
BEGIN
  SELECT COALESCE(SUM(value), 0), COUNT(*)
  INTO v_pipeline_total, v_deal_count
  FROM deals
  WHERE stage NOT IN ('closed_lost', 'lost');

  SELECT COALESCE(ds.pipeline_total, ds.pipeline_value, v_pipeline_total)
  INTO v_pipeline_yesterday
  FROM daily_snapshots ds
  WHERE COALESCE(ds.snapshot_date, ds.date) = CURRENT_DATE - 1
  ORDER BY ds.created_at DESC
  LIMIT 1;

  IF v_pipeline_yesterday IS NULL THEN
    v_pipeline_yesterday := v_pipeline_total;
  END IF;

  SELECT COUNT(*) INTO v_signal_count FROM signals;
  SELECT COUNT(*) INTO v_critical_signal_count FROM signals WHERE impact >= 8;

  SELECT COUNT(*) FILTER (WHERE status = 'online'), COUNT(*)
  INTO v_agent_online_count, v_agent_total_count
  FROM agent_registry;

  SELECT COALESCE(ds.health_score, 85)
  INTO v_health_score
  FROM daily_snapshots ds
  WHERE COALESCE(ds.snapshot_date, ds.date) = CURRENT_DATE
  ORDER BY ds.created_at DESC
  LIMIT 1;

  IF v_health_score IS NULL THEN
    v_health_score := 85;
  END IF;

  SELECT COUNT(*) INTO v_tasks_today_count
  FROM tasks
  WHERE status != 'done'
    AND (due_date IS NULL OR due_date <= CURRENT_DATE);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'title', d.title,
    'stage', d.stage,
    'value', d.value,
    'days_stale', EXTRACT(DAY FROM NOW() - d.updated_at)::integer
  )), '[]'::jsonb)
  INTO v_stale_deals
  FROM deals d
  WHERE d.stage NOT IN ('closed_won', 'closed_lost', 'won', 'lost')
    AND d.updated_at < NOW() - INTERVAL '3 days';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'title', s.title,
    'category', s.category,
    'impact', s.impact,
    'source', s.source
  )), '[]'::jsonb)
  INTO v_signals
  FROM (
    SELECT *
    FROM signals
    ORDER BY impact DESC, created_at DESC
    LIMIT 3
  ) s;

  SELECT COALESCE(jsonb_agg(ar.name), '[]'::jsonb)
  INTO v_offline_agents
  FROM agent_registry ar
  WHERE ar.status != 'online';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'title', t.title,
    'priority', t.priority,
    'status', t.status
  )), '[]'::jsonb)
  INTO v_top_tasks
  FROM (
    SELECT *
    FROM tasks
    WHERE status != 'done'
    ORDER BY CASE priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END, created_at DESC
    LIMIT 3
  ) t;

  result := jsonb_build_object(
    'date', TO_CHAR(CURRENT_DATE, 'DD Mon YYYY'),
    'pipeline_total', v_pipeline_total,
    'pipeline_change_pct', CASE
      WHEN v_pipeline_yesterday > 0
        THEN ROUND(((v_pipeline_total - v_pipeline_yesterday) / v_pipeline_yesterday * 100)::numeric, 1)
      ELSE 0
    END,
    'deal_count', v_deal_count,
    'stale_deals', v_stale_deals,
    'signals', v_signals,
    'signal_count', v_signal_count,
    'critical_signals', v_critical_signal_count,
    'agents_online', v_agent_online_count,
    'agents_total', v_agent_total_count,
    'offline_agents', v_offline_agents,
    'health_score', v_health_score,
    'tasks_today', v_tasks_today_count,
    'top_tasks', v_top_tasks
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_daily_briefing_data() TO anon, authenticated, service_role;
