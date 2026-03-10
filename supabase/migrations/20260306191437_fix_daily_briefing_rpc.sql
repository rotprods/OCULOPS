
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
BEGIN
  -- Pipeline total
  SELECT COALESCE(SUM(value), 0), COUNT(*)
  INTO v_pipeline_total, v_deal_count
  FROM deals WHERE stage != 'lost';

  -- Yesterday pipeline from daily_snapshots
  SELECT COALESCE(ds.pipeline_value, v_pipeline_total)
  INTO v_pipeline_yesterday
  FROM daily_snapshots ds
  WHERE ds.date = CURRENT_DATE - 1
  LIMIT 1;

  IF v_pipeline_yesterday IS NULL THEN
    v_pipeline_yesterday := v_pipeline_total;
  END IF;

  -- Signals
  SELECT COUNT(*) INTO v_signal_count FROM signals;
  SELECT COUNT(*) INTO v_critical_signal_count FROM signals WHERE impact >= 8;

  -- Agent status
  SELECT COUNT(*) FILTER (WHERE status = 'online'), COUNT(*)
  INTO v_agent_online_count, v_agent_total_count
  FROM agent_registry;

  -- Health score from snapshot
  SELECT COALESCE(ds.health_score, 85)
  INTO v_health_score
  FROM daily_snapshots ds
  WHERE ds.date = CURRENT_DATE
  LIMIT 1;

  IF v_health_score IS NULL THEN
    v_health_score := 85;
  END IF;

  -- Tasks due
  SELECT COUNT(*) INTO v_tasks_today_count
  FROM tasks
  WHERE status != 'done'
  AND (due_date IS NULL OR due_date <= CURRENT_DATE);

  -- Build result
  result := jsonb_build_object(
    'date', TO_CHAR(CURRENT_DATE, 'DD Mon YYYY'),
    'pipeline_total', v_pipeline_total,
    'pipeline_change_pct', CASE
      WHEN v_pipeline_yesterday > 0
      THEN ROUND(((v_pipeline_total - v_pipeline_yesterday) / v_pipeline_yesterday * 100)::numeric, 1)
      ELSE 0
    END,
    'deal_count', v_deal_count,
    'stale_deals', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', d.name,
        'stage', d.stage,
        'value', d.value,
        'days_stale', EXTRACT(DAY FROM NOW() - d.updated_at)::integer
      )), '[]'::jsonb)
      FROM deals d
      WHERE d.stage NOT IN ('won', 'lost')
      AND d.updated_at < NOW() - INTERVAL '3 days'
      LIMIT 5
    ),
    'signals', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', s2.title,
        'category', s2.category,
        'impact', s2.impact,
        'source', s2.source
      )), '[]'::jsonb)
      FROM (SELECT * FROM signals ORDER BY impact DESC LIMIT 3) s2
    ),
    'signal_count', v_signal_count,
    'critical_signals', v_critical_signal_count,
    'agents_online', v_agent_online_count,
    'agents_total', v_agent_total_count,
    'offline_agents', (
      SELECT COALESCE(jsonb_agg(ar.name), '[]'::jsonb)
      FROM agent_registry ar
      WHERE ar.status != 'online'
    ),
    'health_score', v_health_score,
    'tasks_today', v_tasks_today_count,
    'top_tasks', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', t2.title,
        'priority', t2.priority,
        'status', t2.status
      )), '[]'::jsonb)
      FROM (SELECT * FROM tasks WHERE status != 'done' ORDER BY
        CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
        LIMIT 3) t2
    )
  );

  RETURN result;
END;
$$;
;
