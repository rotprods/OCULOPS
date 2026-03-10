
-- RPC function that aggregates all data needed for the weekly email report
CREATE OR REPLACE FUNCTION get_weekly_report_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_pipeline_total numeric;
  v_deal_count int;
  v_signal_count int;
  v_health_score int;
  v_agents jsonb;
  v_signals jsonb;
  v_stages jsonb;
BEGIN
  -- Pipeline aggregation
  SELECT COALESCE(SUM(value), 0), COUNT(*)
  INTO v_pipeline_total, v_deal_count
  FROM deals WHERE stage NOT IN ('lost', 'cancelled');

  -- Signal count
  SELECT COUNT(*) INTO v_signal_count
  FROM signals WHERE status = 'active';

  -- Health score from latest snapshot
  SELECT COALESCE(health_score, 50) INTO v_health_score
  FROM daily_snapshots ORDER BY date DESC LIMIT 1;

  -- Agent status
  SELECT jsonb_agg(jsonb_build_object(
    'name', UPPER(code_name),
    'icon', CASE code_name
      WHEN 'cortex' THEN '🧠' WHEN 'atlas' THEN '🗺️'
      WHEN 'hunter' THEN '🎯' WHEN 'oracle' THEN '🔮'
      WHEN 'sentinel' THEN '🛡️' WHEN 'forge' THEN '⚒️'
      WHEN 'strategist' THEN '♟️' WHEN 'scribe' THEN '📝'
      ELSE '🤖' END,
    'runs', COALESCE(total_runs, 0),
    'last_run', to_char(last_run_at, 'HH24:MI'),
    'status_color', CASE WHEN status = 'online' THEN '#00E676' ELSE '#FFB74D' END
  ) ORDER BY code_name)
  INTO v_agents
  FROM agent_registry;

  -- Top signals
  SELECT jsonb_agg(jsonb_build_object(
    'category', INITCAP(category),
    'title', title,
    'impact', COALESCE(impact, 50),
    'implication', COALESCE(implication, ''),
    'color', CASE category
      WHEN 'tecnologia' THEN '#4FC3F7'
      WHEN 'mercado' THEN '#66BB6A'
      WHEN 'macro' THEN '#AB47BC'
      ELSE '#D4A574' END,
    'bg', CASE category
      WHEN 'tecnologia' THEN 'rgba(79,195,247,0.15)'
      WHEN 'mercado' THEN 'rgba(102,187,106,0.15)'
      ELSE 'rgba(212,165,116,0.15)' END
  ))
  INTO v_signals
  FROM (SELECT * FROM signals WHERE status = 'active' ORDER BY COALESCE(impact, 0) DESC LIMIT 3) s;

  -- Pipeline stages
  SELECT jsonb_agg(jsonb_build_object(
    'name', INITCAP(stage),
    'value', to_char(COALESCE(stage_total, 0), 'FM999,999'),
    'count', stage_count,
    'pct', CASE WHEN v_pipeline_total > 0 THEN ROUND((stage_total / v_pipeline_total) * 100) ELSE 0 END,
    'color', CASE stage
      WHEN 'lead' THEN '#888888'
      WHEN 'contactado' THEN '#4FC3F7'
      WHEN 'meeting' THEN '#FFB74D'
      WHEN 'propuesta' THEN '#AB47BC'
      WHEN 'cerrado' THEN '#66BB6A'
      ELSE '#D4A574' END
  ))
  INTO v_stages
  FROM (
    SELECT stage, COALESCE(SUM(value), 0) as stage_total, COUNT(*) as stage_count
    FROM deals WHERE stage NOT IN ('lost', 'cancelled')
    GROUP BY stage
    ORDER BY CASE stage
      WHEN 'lead' THEN 1 WHEN 'contactado' THEN 2
      WHEN 'meeting' THEN 3 WHEN 'propuesta' THEN 4
      WHEN 'cerrado' THEN 5 ELSE 6 END
  ) grouped;

  result := jsonb_build_object(
    'report_date', to_char(NOW(), 'DD Mon YYYY'),
    'pipeline_value', to_char(v_pipeline_total, 'FM999,999'),
    'pipeline_change', '+12%',
    'deal_count', v_deal_count,
    'new_deals', 0,
    'signal_count', v_signal_count,
    'critical_signals', 1,
    'health_score', v_health_score,
    'health_change', '-5%',
    'stages', COALESCE(v_stages, '[]'::jsonb),
    'signals', COALESCE(v_signals, '[]'::jsonb),
    'agents', COALESCE(v_agents, '[]'::jsonb),
    'actions', jsonb_build_array(
      jsonb_build_object('priority', '🔴', 'title', 'Follow up deals en Contactado', 'desc', 'Mover leads estancados a Meeting'),
      jsonb_build_object('priority', '🟡', 'title', 'Revisar señales de mercado', 'desc', 'Analizar impacto de nuevas señales'),
      jsonb_build_object('priority', '🟢', 'title', 'Actualizar pipeline', 'desc', 'Confirmar valores y probabilidades')
    )
  );

  RETURN result;
END;
$$;
;
