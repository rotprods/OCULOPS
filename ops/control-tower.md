# Control Tower

Last updated: 2026-03-15T23:23:37.319Z
Branch: `HEAD` · SHA: `6222374`

## System Pulse

| Signal | Status | Evidence |
|---|---|---|
| Readiness overall | green | generated: 2026-03-15T16:10:45.921Z |
| Public API connectors live | 7/11 | missing keys: 4 |
| n8n runnable workflows | 39/200 | blocked credentials: 161 |
| n8n reconcile runnable | 166/198 | blocked: 29 |
| Git sync | ahead 0 / behind 0 | dirty files: 10 |

## Workstreams

| ID | Priority | Status | Owner | Area | Next action |
|---|---|---|---|---|---|
| WS-001 | P0 | active | codex-main | api-catalog | Activar los 4 conectores pendientes con credenciales reales |
| WS-002 | P0 | blocked | antigravity | automation | Esperando N8N_API_KEY y variables de Supabase para poder correr el audit/reconcile |
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

- n8n workflows bloqueados por credenciales: 161
- n8n reconcile con workflows bloqueados: 29
- Working tree con cambios locales: 10 archivo(s)

## Pending Local Changes

- `M  docs/OCULOPS_CONVERGENCE_MASTER.md`
- `UU ops/control-tower.md`
- `UU ops/control-tower.snapshot.json`
- `M  ops/workstreams.json`
- `A  reports/n8n-cloudflare-bridge.json`
- `M  supabase/functions/_shared/whatsapp.ts`
- `R  supabase/migrations/20260308102000_public_api_catalog_activation.sql -> supabase/migrations/20260310110500_public_api_catalog_activation.sql`
- `M  supabase/migrations/20260310140000_event_dispatcher_webhook.sql`
- `M  supabase/migrations/20260310150000_knowledge_pgvector.sql`
- `M  supabase/migrations/20260316160000_welcome_email_webhook.sql`

## GitHub Signals

- Not available in current context (GITHUB_TOKEN or GITHUB_REPOSITORY missing)

## Usage Rules

- Any coding agent must read this file before editing code.
- Update `ops/workstreams.json` when claiming or finishing a stream.
- Regenerate this dashboard with `npm run control-tower:update`.

