# Ecosystem Readiness

Generated: 2026-03-15T16:10:45.921Z
Version: 2.0.0
Overall state: GREEN
Window: 24h

## Governance

- Dispatch total: 4
- Blocked total: 0
- Approval pending: 0
- High-risk routed: 4
- Trace coverage: 100.00%

## Module States

| module | state | reason_code | last_success_at | route | smoke_case |
|---|---|---|---|---|---|
| control_tower | connected | governance_no_org_scope | 2026-03-15T16:10:45.921Z | /control-tower | hard_block_routing |
| governance | connected | governance_metrics_no_org_scope | 2026-03-15T16:10:45.921Z | /control-tower | governor_runtime |
| orchestration | connected | pipeline_activity_ok | 2026-03-15T15:33:07.144Z | /automation | hard_block_routing |
| messaging | simulated | messaging_synthetic_only | 2026-03-14T05:09:52.291Z | /messaging | ag2_c6_synthetic |
| connector_proxy | connected | connectors_live | 2026-03-15T15:31:05.548Z | /automation | hard_block_routing |
| automation | connected | automation_workflows_available | 2026-03-14T01:49:43.760Z | /automation | hard_block_routing |
| api_catalog | connected | api_catalog_live_connectors | 2026-03-14T01:49:21.167Z | /intelligence | hard_block_routing |
| n8n_catalog | connected | n8n_catalog_synced | 2026-03-14T01:50:18.613Z | /automation | hard_block_routing |
| marketplace | connected | marketplace_agents_active | 2026-03-11T16:24:17.968Z | /marketplace | hard_block_routing |
| simulation | simulated | simulation_guardrail_activity_synthetic | 2026-03-15T15:33:14.617Z | /simulation | ag2_c6_synthetic |
| variable_control_plane_v2 | connected | variable_orchestration_healthy | 2026-03-15T16:01:27.771Z | /control-tower | governor_runtime |

## Smoke Checks

| smoke_case_id | status | checked_at | evidence_count |
|---|---|---|---|
| hard_block_routing | pass | 2026-03-15T16:10:45.921Z | 12 |
| ag2_c6_synthetic | pass | 2026-03-15T16:10:45.921Z | 4 |
| governor_runtime | pass | 2026-03-15T16:10:45.921Z | 2 |

## Failures

- none
