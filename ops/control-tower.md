# Control Tower

Last updated: 2026-03-16T01:18:19.291Z
Branch: `main` · SHA: `dc427d0`

## System Pulse

| Signal | Status | Evidence |
|---|---|---|
| Readiness overall | unknown | generated: n/a |
| Public API connectors live | 7/11 | missing keys: 4 |
| n8n runnable workflows | 1/27 | blocked credentials: 0 |
| n8n reconcile runnable | 166/198 | blocked: 29 |
| Git sync | ahead 1 / behind 1 | dirty files: 2 |

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
- Repo behind origin/main por 1 commit(s)

## Warnings

- n8n reconcile con workflows bloqueados: 29
- Working tree con cambios locales: 2 archivo(s)

## Pending Local Changes

- `UU ops/control-tower.md`
- `UU ops/control-tower.snapshot.json`

## GitHub Signals

- Not available in current context (GITHUB_TOKEN or GITHUB_REPOSITORY missing)

## Usage Rules

- Any coding agent must read this file before editing code.
- Update `ops/workstreams.json` when claiming or finishing a stream.
- Regenerate this dashboard with `npm run control-tower:update`.

