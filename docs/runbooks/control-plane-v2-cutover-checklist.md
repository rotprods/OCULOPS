# Control-Plane V2 Cutover Checklist

## Scope
- Blueprint: Oculops V2 10x Variable-Orchestrated Control Plane
- Runtime targets:
- `vpjcwheuqmwbpcufbbkj`
- `yxzdafptqtcvpsbqkmkm`

## Preflight
- [ ] V2 schema migrations applied on both projects
- [ ] `control-plane` function deployed on both projects
- [ ] Secrets enabled on both projects:
- `CONTROL_PLANE_V2_ENABLED=true`
- `VARIABLE_SIMULATION_REQUIRED_IN_PROD=true`

## Quality Gates
- [ ] Unit/runtime tests:
- `npm run test:control-plane:v2`
- [ ] V2 smoke acceptance:
- `npm run smoke:control-plane:v2`
- [ ] Readiness production gate:
- `npm run readiness:gate:production`

## Performance Gates
- [ ] Snapshot build benchmark (1,000 variables) p95 < 120ms
- [ ] Plan build benchmark (150 DAG nodes) p95 < 220ms
- [ ] Evidence artifact updated:
- `docs/runbooks/control-plane-v2-performance.latest.json`

## Operational Verification
- [ ] `variable_metrics` returns 200 on both projects
- [ ] `ecosystem_readiness` returns `variable_control_plane_v2=connected` on both projects
- [ ] V2 trace fields present in events:
- `snapshot_id`
- `plan_id`
- `violation_count`
- `constraint_status`
- `simulation_status`

## Release
- [ ] Commit includes V2 runtime + tests + migrations + runbook artifacts
- [ ] Post-cutover monitor window started (15-30m)
- [ ] Rollback instructions ready (disable V2 flags if needed)
