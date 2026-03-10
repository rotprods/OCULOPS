# ANTIGRAVITY OS — Continuity Status

Updated: March 9, 2026

This document reconstructs the current project state from the repo snapshot, verified docs, migrations, routes, hooks, stores, edge-function folders, and recent file timestamps.

## 1. Work already completed

### Step 1. Base migration completed

- The project was moved from a static structure into `Vite + React + Electron`.
- The dark design system was ported to the React app.
- Auth, layout shell, route structure, and module lazy-loading are already wired.
- The app entry now exposes the main operating surfaces from a single route registry.

### Step 2. Legacy module migration largely completed

- The original legacy module plan from `HANDOFF.md` was not left at placeholder level.
- The repo now contains real module files for:
  - `ControlTower`
  - `CRM`
  - `Pipeline`
  - `Execution`
  - `Intelligence`
  - `Markets`
  - `ProspectorHub`
  - `Watchtower`
  - `Niches`
  - `Opportunities`
  - `Agents`
  - `Automation`
  - `Messaging`
  - `Finance`
  - `Experiments`
  - `Decisions`
  - `Knowledge`
  - `StudyHub`
  - `HeraldAgent`
  - `WorldMonitor`
  - `GTM`
  - `Portfolio`
  - `Simulation`
  - `Settings`
  - `Reports`
  - `CreativeStudio`
  - `Analytics`
  - `Billing`

### Step 3. State/store layer created

- Zustand stores exist for:
  - app
  - leads
  - pipeline
  - signals
  - tasks
  - finance
  - knowledge
- The hooks layer is no longer minimal; the repo now has a broad domain hook surface for CRM, messaging, automation, markets, signals, prospector, agents, realtime, and API catalog flows.

### Step 4. Operations architecture was pushed beyond UI shells

- The repo now has an operations-oriented data model and deploy checklist.
- Prospector, CRM, Messaging, Automation, and agents were aligned around a shared persisted model.
- The migration set includes:
  - base schema
  - agent infrastructure
  - outreach/templates
  - daily briefing/reporting RPCs
  - market and social feeds
  - operational messaging + prospector bridge
  - automation runs realtime/anon
  - agent studies + delivery
  - public API catalog activation
  - agent API permissions

### Step 5. Supabase edge-function surface expanded heavily

- The repo now contains edge functions for:
  - `agent-atlas`
  - `agent-cortex`
  - `agent-hunter`
  - `agent-outreach`
  - `agent-strategist`
  - `agent-studies`
  - `agent-study-dispatch`
  - `ai-advisor`
  - `ai-qualifier`
  - `api-gateway`
  - `api-proxy`
  - `automation-runner`
  - `daily-snapshot`
  - `gmail-inbound`
  - `google-maps-search`
  - `manychat-sync`
  - `market-data`
  - `messaging-channel-oauth`
  - `messaging-dispatch`
  - `meta-business-discovery`
  - `public_api_harness`
  - `social-signals`
  - `tiktok-business-search`
  - `web-analyzer`
  - `whatsapp-webhook`

### Step 6. Market and social intelligence moved from plan to implementation

- According to `tareas pendientes.md`, the following was already completed:
  - Supabase project link was established.
  - `market-data` was deployed.
  - `social-signals` was deployed.
  - `google-maps-search`, `web-analyzer`, `ai-qualifier`, `meta-business-discovery`, `tiktok-business-search`, and `manychat-sync` were deployed.
  - `CRON_SECRET` was configured remotely.
  - Remote migration created `market_snapshots` and `social_signals`.
  - Remote smoke tests persisted real rows into both tables.
  - REST reads from both tables were confirmed.

### Step 7. Prospecting and operations workflows were connected

- The current recorded state says:
  - Airspace/Atlas can accept a manual location, move the plane there, scan live businesses, and sync them into CRM.
  - CRM already stores company, contact, deal, and activity.
  - Messaging sends through Gmail and WhatsApp when the channel is connected, while LinkedIn and Instagram remain draft-level operational paths.
  - Gmail inbound and WhatsApp webhook already create/update conversations, messages, activities, and statuses.
  - Automation persists workflows in Supabase, writes `automation_runs`, supports `Run now` / `Send live`, and can fire `atlas_import` and `message_in`.
  - Prospector persists scans and leads in `prospector_scans` and `prospector_leads`.

### Step 8. API network work started on March 8

- A public API catalog was generated into `public/public-api-catalog/`.
- The repo includes:
  - `scripts/sync-public-apis.mjs`
  - `scripts/deploy-public-apis.mjs`
  - `src/lib/publicApiCatalog.js`
  - `src/hooks/useApiCatalog.js`
  - `src/components/miniapps/MiniAppLauncher.jsx`
  - `src/components/miniapps/ApiIntelligenceCard.jsx`
  - tests for the catalog and launcher
- Two late migrations indicate the current active branch moved into API activation and agent permissioning:
  - `20260308102000_public_api_catalog_activation.sql`
  - `20260308180000_agent_api_permissions.sql`

## 2. Current real blockers

### Blocker 1. Supabase CLI auth expired during deployment work

- `tareas pendientes.md` records a `401 Unauthorized` from the CLI in the latest pass.
- Because of that, these were left pending for remote completion:
  - `ai-advisor`
  - `messaging-dispatch`
  - `api-proxy`

### Blocker 2. Markets is only partially live

- `ALPHA_VANTAGE_KEY` is still missing remotely.
- Current effective state:
  - crypto uses live CoinGecko
  - stocks/forex still fall back to demo data

### Blocker 3. Scheduler is not fully closed

- `CRON_SECRET` exists.
- The real scheduled execution for `market-data` and `social-signals` still needs to be configured.

### Blocker 4. Reddit intake is not stable

- The last recorded smoke test returned `HTTP 403` from Reddit.
- Social Signals is functioning via Hacker News, but Reddit is not reliable yet.

### Blocker 5. Final authenticated UI QA is still pending

- Manual verification is still needed for:
  - `Markets` showing live feed state
  - `Intelligence` showing persisted radar/social data
  - `Promote` moving a social signal into `signals`

### Blocker 6. Repo hygiene needs one cleanup pass

- There are untracked/generated files related to:
  - public API catalog outputs
  - `Analytics`, `Billing`, `CreativeStudio`, `Reports`, `Settings`
  - store exports
  - `api-gateway`
  - recent migrations
- There are also duplicate-looking files that must be reviewed before any commit:
  - `src/components/modules/Intelligence 2.jsx`
  - `src/hooks/useProspector 2.js`

## 3. Recommended next plan

### Phase A. Stabilize the working tree

1. Review and reconcile the untracked files created during the March 8 API-network pass.
2. Decide whether `Intelligence 2.jsx` and `useProspector 2.js` are accidental duplicates, backups, or the intended next revisions.
3. Remove ambiguity before any new feature work continues.

### Phase B. Finish the blocked remote deploys

1. Re-auth the Supabase CLI.
2. Redeploy:
   - `ai-advisor`
   - `messaging-dispatch`
   - `api-proxy`
3. If needed, immediately follow with:
   - `automation-runner`
   - `gmail-inbound`
   - `messaging-channel-oauth`
   - `whatsapp-webhook`

### Phase C. Close the live-data gap

1. Add `ALPHA_VANTAGE_KEY` in production.
2. Re-run `market-data` and verify stocks/forex switch from demo fallback to live mode.
3. Configure real schedules for:
   - `market-data` hourly
   - `social-signals` every 1 to 3 hours
4. Decide the Reddit strategy:
   - official OAuth
   - different ingestion path
   - or drop Reddit and keep HN as the default social source

### Phase D. Run end-to-end visual QA

1. Validate authenticated `Markets`.
2. Validate authenticated `Intelligence`.
3. Validate Prospector to CRM promotion.
4. Validate Messaging outbound and inbound state transitions.
5. Validate `Automation Zone` with a real run writing `automation_runs`.

### Phase E. Close production readiness

1. Confirm provider env coverage:
   - Google Maps
   - Gmail/Google OAuth
   - Meta/WhatsApp
   - Supabase deploy credentials
2. Validate migrations from a clean base.
3. Add or finish end-to-end tests for:
   - Airspace -> CRM import
   - Messaging send/inbound
   - Automation trigger/run
   - duplicate/upsert behavior

## 4. Immediate next move

If work resumes right now, the most defensible order is:

1. Clean the working tree ambiguity from the March 8 API pass.
2. Restore Supabase CLI auth and finish the blocked deploys.
3. Switch Markets from mixed mode to fully live.
4. Run the authenticated UI smoke checks.
