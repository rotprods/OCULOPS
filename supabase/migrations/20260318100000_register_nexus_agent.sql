-- Register NEXUS Director Agent in agent_registry
-- NEXUS is the top-level orchestrator (hierarchy_level: 0)
-- that decomposes complex goals into multi-agent plans.

INSERT INTO agent_registry (
  name,
  code_name,
  role,
  description,
  status,
  total_runs,
  avg_duration_ms,
  config
) VALUES (
  'NEXUS Director',
  'nexus',
  'Director / Meta-Orchestrator',
  'Top-level director agent. Decomposes complex business objectives into multi-agent plans, delegates to domain agents (ATLAS, HUNTER, ORACLE, SENTINEL, FORGE, HERALD, OUTREACH, CORTEX), and consolidates results.',
  'online',
  0,
  0,
  jsonb_build_object(
    'type', 'orchestrator',
    'hierarchy_level', 0,
    'domain', 'orchestration',
    'max_rounds', 3,
    'timeout_ms', 60000,
    'escalation_path', 'copilot',
    'policy_set', jsonb_build_object(
      'can_write_crm', false,
      'can_send_external', false,
      'can_call_agents', jsonb_build_array('atlas', 'hunter', 'oracle', 'sentinel', 'forge', 'herald', 'outreach', 'cortex'),
      'can_delete', false,
      'max_spend_per_run_usd', 0.50,
      'confidence_threshold', 0.70,
      'safe_mode', false
    ),
    'kpis', jsonb_build_array('plan_success_rate', 'delegation_accuracy', 'consolidation_quality')
  )
) ON CONFLICT (code_name) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  config = EXCLUDED.config;
