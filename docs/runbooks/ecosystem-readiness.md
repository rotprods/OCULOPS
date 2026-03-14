# Ecosystem Readiness

Generated: 2026-03-14T00:14:12.837Z
Version: 1.0.0
Overall state: RED
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
| control_tower | connected | control_plane_snapshot_ok | 2026-03-14T00:14:12.837Z | /control-tower | hard_block_routing |
| governance | connected | governance_metrics_ok | 2026-03-14T00:14:12.837Z | /control-tower | governor_runtime |
| orchestration | connected | pipeline_activity_ok | 2026-03-13T06:25:47.317Z | /automation | hard_block_routing |
| messaging | simulated | messaging_synthetic_only | 2026-03-13T07:02:29.976Z | /messaging | ag2_c6_synthetic |
| connector_proxy | offline | connectors_missing | — | /automation | hard_block_routing |
| automation | connected | automation_workflows_available | 2026-03-13T09:16:43.313Z | /automation | hard_block_routing |
| api_catalog | simulated | api_catalog_seed_or_uninstalled | 2026-03-13T06:24:30.159Z | /intelligence | hard_block_routing |
| n8n_catalog | connected | n8n_catalog_synced | 2026-03-13T07:52:09.127Z | /automation | hard_block_routing |
| marketplace | offline | marketplace_agents_missing | — | /marketplace | hard_block_routing |
| simulation | simulated | simulation_no_recent_runs | — | /simulation | ag2_c6_synthetic |
| readiness_observability | degraded | readiness_partial_warnings | 2026-03-14T00:14:12.837Z | /control-tower | — |

## Smoke Checks

| smoke_case_id | status | checked_at | evidence_count |
|---|---|---|---|
| hard_block_routing | pass | 2026-03-14T00:14:12.837Z | 34 |
| ag2_c6_synthetic | pass | 2026-03-14T00:14:12.837Z | 2 |
| governor_runtime | pass | 2026-03-14T00:14:12.837Z | 2 |

## Failures

- connector_proxy (offline) — No active connectors available. → /automation
- marketplace (offline) — No marketplace agents found. → /marketplace
- readiness_observability (degraded) — connector readiness failed → /control-tower?tab=readiness
