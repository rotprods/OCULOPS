# OCULOPS Execution Plan

Updated: 2026-03-11

## Phase 1 — Core schema

Delivered in migration:

- orchestration metadata in `event_log`
- event subscription and delivery tracking
- canonical runtime memory
- pipeline runtime tables
- tool permission table
- agent registry contract fields

File:
- `supabase/migrations/20260317113000_multiagent_orchestration_core.sql`

## Phase 2 — Shared runtime

Delivered in shared runtime:

- event emission helper
- memory write helper
- pipeline creation and execution
- event subscription delivery

File:
- `supabase/functions/_shared/orchestration.ts`

## Phase 3 — Engine + dispatcher

Delivered in edge functions:

- `orchestration-engine` for `create_run`, `execute_run`, `get_run`, `list`
- `event-dispatcher` extended with subscription delivery tracking
- `runAgentTask` extended with `agent.started`, `agent.completed`, `agent.error`

Files:

- `supabase/functions/orchestration-engine/index.ts`
- `supabase/functions/event-dispatcher/index.ts`
- `supabase/functions/_shared/agents.ts`

## Phase 4 — Copilot and frontend support

Delivered:

- copilot tools for `pipeline_launch` and `pipeline_status`
- frontend hook support for pipeline/event state
- frontend event emitter supports orchestration metadata

Files:

- `supabase/functions/agent-copilot/index.ts`
- `src/hooks/useAgents.js`
- `src/lib/eventBus.js`

## Verification checklist

- apply the new migration
- verify `orchestration-engine` can create and complete `lead_discovery`
- verify `event-dispatcher` writes `event_deliveries`
- verify `agent.started` and `agent.completed` enter `event_log`
- verify `useAgents` reads new runtime tables without UI regressions
- run `npm run lint`
- run `npm test`
- run `npm run build`
