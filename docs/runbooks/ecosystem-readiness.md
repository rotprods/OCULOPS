# Ecosystem Readiness

Generated: 2026-03-14T00:43:50.019Z
Version: 1.0.0
Overall state: GREEN
Window: 24h

## Governance

- Dispatch total: 12
- Blocked total: 0
- Approval pending: 0
- High-risk routed: 10
- Trace coverage: 100.00%

## Module States

| module | state | reason_code | last_success_at | route | smoke_case |
|---|---|---|---|---|---|
| control_tower | connected | control_plane_snapshot_ok | 2026-03-14T00:43:50.019Z | /control-tower | hard_block_routing |
| governance | connected | governance_metrics_ok | 2026-03-14T00:43:50.019Z | /control-tower | governor_runtime |
| orchestration | connected | pipeline_activity_ok | 2026-03-13T06:25:47.317Z | /automation | hard_block_routing |
| messaging | simulated | messaging_synthetic_only | 2026-03-13T07:02:29.976Z | /messaging | ag2_c6_synthetic |
| connector_proxy | connected | connectors_live | 2026-03-14T00:28:24.923Z | /automation | hard_block_routing |
| automation | connected | automation_workflows_available | 2026-03-13T09:16:43.313Z | /automation | hard_block_routing |
| api_catalog | connected | api_catalog_live_connectors | 2026-03-14T00:28:18.236Z | /intelligence | hard_block_routing |
| n8n_catalog | connected | n8n_catalog_synced | 2026-03-13T07:52:09.127Z | /automation | hard_block_routing |
| marketplace | connected | marketplace_agents_active | 2026-03-11T16:24:17.968Z | /marketplace | hard_block_routing |
| simulation | connected | simulation_runs_available | 2026-03-14T00:35:55.856Z | /simulation | ag2_c6_synthetic |

## Smoke Checks

| smoke_case_id | status | checked_at | evidence_count |
|---|---|---|---|
| hard_block_routing | pass | 2026-03-14T00:43:50.019Z | 34 |
| ag2_c6_synthetic | pass | 2026-03-14T00:43:50.019Z | 2 |
| governor_runtime | pass | 2026-03-14T00:43:50.019Z | 2 |

## Failures

- none
