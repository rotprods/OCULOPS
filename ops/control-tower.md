# Control Tower

Last updated: 2026-03-16T01:18:06.977Z
Branch: `main` · SHA: `9887f1a`

## System Pulse

| Signal | Status | Evidence |
|---|---|---|
| Readiness overall | unknown | generated: n/a |
| Public API connectors live | 7/11 | missing keys: 4 |
| n8n runnable workflows | 1/27 | blocked credentials: 0 |
| n8n reconcile runnable | 166/198 | blocked: 29 |
| Git sync | ahead 0 / behind 0 | dirty files: 17 |

## Workstreams

| ID | Priority | Status | Owner | Area | Next action |
|---|---|---|---|---|---|
| WS-001 | P0 | active | codex-main | api-catalog | Activar los 4 conectores pendientes con credenciales reales |
| WS-002 | P0 | active | antigravity | automation | Execute Phase 1: DB Migrations and Edge Functions deployment |
| WS-003 | P0 | active | release-control | control-plane | Mantener smoke checks y readiness artifacts actualizados |
| WS-004 | P1 | active | codex-main | frontend | Cerrar backlog de adapters registration-required por olas |

## Agents And Terminals

| Agent | Terminal | Scope | Status |
|---|---|---|---|
| Codex Main | codex-desktop | Integracion full-stack, Supabase, deploy | active |
| n8n Runtime | mac-mini | Workflows, credenciales, reconciliacion live | blocked |
| Release Control | github-actions | CI/CD, snapshots de estado, guardrails | active |

## Blockers

- Public API connectors con credenciales pendientes: 4

## Warnings

- n8n reconcile con workflows bloqueados: 29
- Working tree con cambios locales: 17 archivo(s)

## Pending Local Changes

- `M docs/runbooks/control-plane-v2-performance.latest.json`
- ` D docs/runbooks/ecosystem-readiness.latest.json`
- ` M docs/runbooks/ecosystem-readiness.md`
- ` M ops/control-tower.md`
- ` M ops/control-tower.snapshot.json`
- ` M reports/n8n-workflow-audit.json`
- ` M reports/project-apis-n8n-bridge-smoke.latest.json`
- ` M scripts/check-ecosystem-readiness-gate.mjs`
- ` M scripts/generate-ecosystem-readiness.mjs`
- ` M scripts/update-control-tower.mjs`
- ` M src/components/modules/CommandCenter.jsx`
- ` M src/hooks/useConnectorProxy.js`
- ` M src/hooks/useConversations.js`
- ` M src/lib/controlPlane.js`
- ` M src/lib/runtimeClient.js`
- ` M supabase/functions/_shared/agent-brain-v2.ts`
- `?? supabase/functions/_shared/model-router.ts`

## GitHub Signals

- Not available in current context (GITHUB_TOKEN or GITHUB_REPOSITORY missing)

## Usage Rules

- Any coding agent must read this file before editing code.
- Update `ops/workstreams.json` when claiming or finishing a stream.
- Regenerate this dashboard with `npm run control-tower:update`.

