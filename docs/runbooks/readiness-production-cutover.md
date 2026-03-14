# Readiness Gate — Production Cutover Runbook

Date: 2026-03-14  
Scope: Move gate mode from `synthetic` to `production` with hardened policy in CI/CD.

## 1) Objective

Enable real enforcement in pipelines so critical modules are required as `connected` before deploy/release gates pass.

## 2) Prerequisites

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured in repo secrets.
- `ecosystem-readiness.latest.json` generation already working (`npm run readiness:generate`).
- Control-plane smoke baseline passing:
  - `hard_block_routing`
  - `ag2_c6_synthetic`
  - `governor_runtime`

## 3) GitHub Variables (recommended baseline)

Set these repository variables:

- `READINESS_GATE_MODE=production`
- `READINESS_ORG_ID=<org_uuid>`
- `READINESS_PRODUCTION_CRITICAL_MODULES=control_tower,governance,orchestration,messaging,connector_proxy`
- `READINESS_PRODUCTION_NON_CRITICAL_STATES=connected,degraded,planned`
- `READINESS_PRODUCTION_STRICT_ALL_CONNECTED=false`

Notes:
- Critical modules are always forced to `connected`.
- Non-critical modules are evaluated with `READINESS_PRODUCTION_NON_CRITICAL_STATES`.
- To force all modules to `connected`, set `READINESS_PRODUCTION_STRICT_ALL_CONNECTED=true`.

## 4) Local pre-cutover validation

```bash
npm run readiness:generate
READINESS_GATE_MODE=production npm run readiness:check
```

Optional strict rehearsal:

```bash
npm run readiness:check:production:strict
```

## 5) Configure GitHub Variables (CLI)

```bash
gh variable set READINESS_GATE_MODE --body "production"
gh variable set READINESS_ORG_ID --body "<org_uuid>"
gh variable set READINESS_PRODUCTION_CRITICAL_MODULES --body "control_tower,governance,orchestration,messaging,connector_proxy"
gh variable set READINESS_PRODUCTION_NON_CRITICAL_STATES --body "connected,degraded,planned"
gh variable set READINESS_PRODUCTION_STRICT_ALL_CONNECTED --body "false"
```

## 6) Post-cutover checks

1. Trigger CI on a branch push and confirm `Readiness gate` step runs in `production`.
2. Trigger Supabase deploy workflow and confirm post-deploy readiness gate runs in `production`.
3. Confirm failures are actionable and aligned with module `state_reason_code`.

## 7) Rollback (if needed)

Immediate rollback to synthetic mode:

```bash
gh variable set READINESS_GATE_MODE --body "synthetic"
gh variable set READINESS_PRODUCTION_STRICT_ALL_CONNECTED --body "false"
```

## 8) Exit criteria

- CI/deploy gates consume `READINESS_GATE_MODE=production`.
- Critical modules fail gate unless `connected`.
- No false green without corresponding readiness evidence.

