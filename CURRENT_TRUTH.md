# CURRENT TRUTH

Updated: 2026-03-10

## What ANTIGRAVITY OS Is

- ANTIGRAVITY OS is Roberto Ortega's internal operating system for running an AI automation agency focused on Spanish and European SMBs.
- The current execution phase is operator-grade internal platform, not public SaaS.
- The long-term ambition can be larger, but product and engineering decisions should optimize for Roberto-first operations now.

## Canonical Source Order

When docs conflict, trust them in this order:

1. `CURRENT_TRUTH.md`
2. `docs/CONTINUITY_STATUS_2026-03-09.md`
3. `docs/OPERATIONS_ARCHITECTURE.md`
4. `docs/OPERATIONS_DEPLOY_CHECKLIST.md`
5. `docs/AGENT_ROLES.md`
6. `docs/MASTER_API_REGISTRY.md`
7. Older planning and audit docs

`ANTIGRAVITY_OS_MASTER_SNAPSHOT.md` and `ANTIGRAVITY_OS_MASTER_SNAPSHOT_CURATED.md` are archive/recovery documents. They are not safe operational docs and must not be treated as live source of truth.

## What Is Already True

- The React/Vite migration is done.
- The app already has a broad module surface, route shell, hooks layer, stores layer, and Supabase integration.
- The intended system model is one persisted execution layer for prospecting, CRM, messaging, automation, and agents.
- Major live or partially live surfaces already exist for:
  - market data
  - social signals
  - Google Maps search
  - web analysis
  - AI lead qualification
  - Meta business discovery
  - TikTok business search
  - ManyChat sync

## Verified Local State

Verified locally on 2026-03-10:

- `npm run build` passes
- `npm run lint` passes
- `npm test` passes

Important note:

- the project currently has no meaningful app test suite
- `npm test` passes because it is configured to allow zero test files

## Canonical Architecture

- Supabase is the shared memory and source of truth.
- Frontend must call Edge Functions, not third-party provider APIs directly.
- Gmail is OAuth + Pub/Sub driven.
- WhatsApp is token + webhook driven.
- Prospecting, CRM, messaging, automation, and agent activity should all write into shared persisted entities.

## Canonical Agent Names

The canonical business/control-plane agents are:

- `agent-atlas`
- `agent-hunter`
- `agent-strategist`
- `agent-cortex`
- `agent-outreach`

Role labels like `Vanta`, `Apex`, `Scout`, `Radar`, `Pulse`, `Vault`, and `Forge` are useful operating concepts, but they are not the canonical persisted agent registry names.

## Main Current Blockers

- Supabase CLI auth needs to be restored.
- Blocked deploys still need completion:
  - `ai-advisor`
  - `messaging-dispatch`
  - `api-proxy`
- `ALPHA_VANTAGE_KEY` is still missing for fully live markets.
- Real scheduling for `market-data` and `social-signals` is not closed.
- Reddit ingestion is still unstable.
- Final authenticated UI smoke tests are still pending.

## Repo Reality

- The repo still contains ambiguity and hygiene debt.
- Old dead script references and duplicate shadow files were removed on 2026-03-10.
- Some older docs still describe work as pending even though the platform has already advanced past that stage.

## Security Truth

- Secrets must live only in local env, Vercel env, or Supabase secrets.
- Raw secrets must never be copied into normal working docs.
- `.env.backup`, unauthenticated server functions, missing ownership fields, unvalidated file writes, and unsigned provider webhooks are real production risks until explicitly closed.

## Visual Truth

- The app already has a usable token/design foundation.
- The current UI weakness is not lack of structure; it is weak component polish.
- Prospector and Intelligence should be redesigned by preserving IA, hooks, and data contracts while upgrading visual primitives and agent presence.
- Do not run a global visual rebrand without explicit scope.

## Current Working Order

1. Re-auth Supabase CLI.
2. Finish blocked deploys.
3. Fill missing env coverage.
4. Close scheduler and live-data gaps.
5. Run authenticated end-to-end smoke checks.
6. Remove repo ambiguity and duplicate files.
7. Fix remaining Electron and security debt.
8. Only then push into deeper UI redesign or new feature expansion.
