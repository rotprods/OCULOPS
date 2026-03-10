
CREATE OR REPLACE FUNCTION get_daily_briefing_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  pipeline_total numeric;
  pipeline_yesterday numeric;
  deal_count integer;
  signal_count integer;
  critical_signal_count integer;
  agent_online_count integer;
  agent_total_count integer;
  health_score integer;
  tasks_today_count integer;
BEGIN
  -- Pipeline total
  SELECT COALESCE(SUM(value), 0), COUNT(*)
  INTO pipeline_total, deal_count
  FROM deals WHERE stage != 'lost';

  -- Yesterday's pipeline (from daily_snapshots)
  SELECT COALESCE((snapshot_data->>'pipeline_value')::numeric, pipeline_total)
  INTO pipeline_yesterday
  FROM daily_snapshots
  WHERE date = CURRENT_DATE - INTERVAL '1 day'
  LIMIT 1;

  IF pipeline_yesterday IS NULL THEN
    pipeline_yesterday := pipeline_total;
  END IF;

  -- Signals
  SELECT COUNT(*) INTO signal_count FROM signals;
  SELECT COUNT(*) INTO critical_signal_count FROM signals WHERE impact >= 8;

  -- Agent status
  SELECT COUNT(*) FILTER (WHERE status = 'online'), COUNT(*)
  INTO agent_online_count, agent_total_count
  FROM agent_registry;

  -- Health score
  SELECT COALESCE((snapshot_data->>'health_score')::integer, 85)
  INTO health_score
  FROM daily_snapshots
  WHERE date = CURRENT_DATE
  LIMIT 1;

  IF health_score IS NULL THEN
    health_score := 85;
  END IF;

  -- Tasks due today
  SELECT COUNT(*) INTO tasks_today_count
  FROM tasks
  WHERE status != 'done'
  AND (due_date IS NULL OR due_date <= CURRENT_DATE);

  -- Stale deals (no update in 3+ days)
  -- Build result
  result := jsonb_build_object(
    'date', TO_CHAR(CURRENT_DATE, 'DD Mon YYYY'),
    'pipeline_total', pipeline_total,
    'pipeline_change_pct', CASE
      WHEN pipeline_yesterday > 0
      THEN ROUND(((pipeline_total - pipeline_yesterday) / pipeline_yesterday * 100)::numeric, 1)
      ELSE 0
    END,
    'deal_count', deal_count,
    'stale_deals', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', name,
        'stage', stage,
        'value', value,
        'days_stale', EXTRACT(DAY FROM NOW() - updated_at)::integer
      )), '[]'::jsonb)
      FROM deals
      WHERE stage NOT IN ('won', 'lost')
      AND updated_at < NOW() - INTERVAL '3 days'
      LIMIT 5
    ),
    'signals', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', title,
        'category', category,
        'impact', impact,
        'source', source
      ) ORDER BY impact DESC), '[]'::jsonb)
      FROM (SELECT * FROM signals ORDER BY impact DESC LIMIT 3) s
    ),
    'signal_count', signal_count,
    'critical_signals', critical_signal_count,
    'agents_online', agent_online_count,
    'agents_total', agent_total_count,
    'offline_agents', (
      SELECT COALESCE(jsonb_agg(name), '[]'::jsonb)
      FROM agent_registry
      WHERE status != 'online'
    ),
    'health_score', health_score,
    'tasks_today', tasks_today_count,
    'top_tasks', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', title,
        'priority', priority,
        'status', status
      )), '[]'::jsonb)
      FROM (SELECT * FROM tasks WHERE status != 'done' ORDER BY
        CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
        LIMIT 3) t
    )
  );

  RETURN result;
END;
$$;
;
