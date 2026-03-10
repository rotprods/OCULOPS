# Codex Operating Guide

Updated: 2026-03-10

## Role

- Codex is the execution and stabilization agent for OCULOPS OS.
- Default assumption: OCULOPS OS is Roberto's internal operating system first.
- Do not expand scope to public multi-tenant SaaS unless Roberto explicitly asks for it.

## Source Priority

Use documents in this order when they conflict:

1. `CURRENT_TRUTH.md`
2. `docs/CONTINUITY_STATUS_2026-03-09.md`
3. `docs/OPERATIONS_ARCHITECTURE.md`
4. `docs/OPERATIONS_DEPLOY_CHECKLIST.md`
5. `docs/AGENT_ROLES.md`
6. `docs/MASTER_API_REGISTRY.md`
7. `claude.md`, `HANDOFF.md`, `docs/CLAUDE_EXECUTION_BRIEF.md`, `docs/audit*`
8. `OCULOPS_OS_MASTER_SNAPSHOT*.md` as archive only, never as live operational truth

## Product Boundaries

- One Supabase-backed source of truth for prospecting, CRM, messaging, automation, and agent state.
- Frontend stack: React + Vite + Electron.
- Backend stack: Supabase Auth + Postgres + Realtime + Edge Functions.
- Frontend must not own provider secrets or call Gmail, Meta, or similar providers directly.
- Edge Functions own provider credentials, outbound calls, and inbound webhooks.

## Canonical Agent Model

- Canonical business/control-plane agents:
  - `agent-atlas`
  - `agent-hunter`
  - `agent-strategist`
  - `agent-cortex`
  - `agent-outreach`
- `Vanta`, `Apex`, `Scout`, `Radar`, `Pulse`, `Vault`, and `Forge` are role labels and workflow concepts, not the canonical persisted registry names.

## Working Rules

- Prioritize stabilization before net-new surface area.
- Fix root-cause issues before cosmetic expansion.
- Prefer editing existing modules over creating parallel replacements.
- Reconcile duplicate files before broad feature work.
- Never add secrets to source, docs, or UI.
- Remove hardcoded provider tokens or anon fallback values when touched.
- Preserve route topology and persisted data contracts unless a migration is intentional.
- Preserve hooks/API behavior during visual redesigns.
- Validate changes with:
  - `npm run build`
  - `npm run lint`
  - `npm test`

## Current P0 Focus

- Re-auth Supabase CLI and finish blocked deploys:
  - `ai-advisor`
  - `messaging-dispatch`
  - `api-proxy`
- Close missing env coverage:
  - `ALPHA_VANTAGE_KEY`
  - Google Maps and Gmail OAuth vars
  - Meta / WhatsApp vars
  - `N8N_WEBHOOK_URL`
  - TikTok and ManyChat vars
- Configure real schedules for `market-data` and `social-signals`.
- Run authenticated end-to-end QA across:
  - Markets
  - Intelligence
  - Prospector to CRM
  - Messaging
  - Automation
- Remove repo ambiguity:
  - keep `package.json` and docs aligned with real tooling
  - keep `electron/*.cjs` as the only live Electron entrypoints

## Visual Rules

- The app should feel like a premium dark business OS, not generic SaaS UI.
- Keep the current token system as the implementation source of truth until a scoped redesign is approved.
- For Prospector and Intelligence redesign work:
  - preserve IA
  - preserve routing
  - preserve hooks and API contracts
  - upgrade panels, controls, and tables into stronger reusable primitives

## Non-Goals For Default Work

- No broad rebrand of the whole app without explicit scope.
- No speculative multi-tenant architecture work.
- No new documentation sprawl unless requested.
- No placeholder modules that duplicate existing modules.
