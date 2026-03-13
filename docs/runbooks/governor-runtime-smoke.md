# Governor Runtime Smoke

## Purpose
Validate governance runtime endpoints in production-like conditions without provider credentials.

## Command
```bash
node scripts/smoke-governor-runtime.mjs
```

## Expected Output
- `[smoke-governor] success`
- JSON summary with:
  - `governor_check.allowed: false` for high-risk request without approval
  - `governor_metrics` payload scoped to a real `org_id`
  - `governor_escalate.created: true` and `risk_case_id`

## What It Verifies
- `orchestration-engine` action `governor_check`
- `orchestration-engine` action `governor_metrics`
- `orchestration-engine` action `governor_escalate`

## Troubleshooting
- Missing env:
  - Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist in `.env` or `supabase/.env.deploy`.
- Org not found:
  - Ensure at least one row exists in `organizations`.
- Function errors:
  - Redeploy `orchestration-engine` and retry.
