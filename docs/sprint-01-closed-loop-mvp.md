# OCULOPS — Sprint 01: Closed Loop MVP
> Updated: 2026-03-13
> Purpose: convert the platform plan into the first execution sprint.

---

## Sprint Goal

Ship the first operator-verifiable agentic loop:

`Copilot -> orchestration-engine -> pipeline run -> approval gate -> messaging send -> delivery or inbound update -> UI trace`

This sprint is successful if one real business objective can be launched from Copilot, routed through the orchestration layer, paused for approval where required, sent through a real provider, and traced back across the UI without blind spots.

---

## Sprint Length

Target: 10 working days

Recommended sequencing:

- Days 1 to 2: runtime closure
- Days 3 to 4: control-plane cleanup
- Days 5 to 7: Copilot + approval + messaging loop
- Days 8 to 10: smoke path, E2E coverage, bugfixes

---

## Sprint Definition Of Done

- Supabase deploy access is working again.
- `ai-advisor`, `messaging-dispatch`, and `api-proxy` are deployed and callable.
- `correlation_id` is visible through the run path.
- Copilot launches a reusable pipeline run, not just an isolated tool call.
- Outreach creates a draft and approval record before live send.
- Approval can trigger a real outbound Gmail or WhatsApp send.
- Delivery or inbound webhook updates land in persisted conversation state.
- The run can be inspected from Copilot, Agents, Automation, and Messaging.
- One authenticated Playwright flow covers the primary happy path.

---

## Out Of Scope

- Global redesign work
- Stripe / billing
- Marketplace
- Blockchain
- Large analytics rebuild
- New feature families not required to close the loop

---

## Ticket Board

### S1-01 — Restore Runtime Access

Outcome:

- restore remote Supabase deploy capability and confirm runtime access for the core edge-function path

Why this is first:

- every other ticket is blocked if deploy and secrets are not trustworthy

Dependencies:

- none

Primary repo touchpoints:

- [CURRENT_TRUTH.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/CURRENT_TRUTH.md)
- [docs/OPERATIONS_DEPLOY_CHECKLIST.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/docs/OPERATIONS_DEPLOY_CHECKLIST.md)
- [missings.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/missings.md)
- [supabase/config.toml](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/config.toml)

Execution tasks:

- re-auth Supabase CLI
- verify project link and deploy permissions
- audit remote secrets against required runtime functions
- update the deploy checklist if current runtime requirements have drifted

Acceptance criteria:

- `supabase functions deploy` works for at least one nontrivial function
- the project is linked to the intended remote
- missing secrets are explicitly listed with owner and target runtime

### S1-02 — Unblock Critical Edge Functions

Outcome:

- production runtime path is restored for the functions currently called out as blockers

Dependencies:

- S1-01

Primary repo touchpoints:

- [supabase/functions/ai-advisor/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/ai-advisor/index.ts)
- [supabase/functions/messaging-dispatch/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/messaging-dispatch/index.ts)
- [supabase/functions/api-proxy/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/api-proxy/index.ts)
- [supabase/functions/_shared/channels.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/channels.ts)
- [supabase/functions/_shared/http.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/http.ts)

Execution tasks:

- deploy blocked functions
- fix any deploy-time env or import errors
- verify live invocation from the runtime, not just local code presence
- record exact payloads and expected responses for smoke calls

Acceptance criteria:

- all three functions deploy successfully
- each function returns a successful response from the target environment
- no unresolved secret names or missing env references remain in these functions

### S1-03 — Close Scheduler And Live Data Gaps

Outcome:

- scheduled runtime jobs are real, stable, and no longer assumed

Dependencies:

- S1-01

Primary repo touchpoints:

- [CURRENT_TRUTH.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/CURRENT_TRUTH.md)
- [docs/OPERATIONS_DEPLOY_CHECKLIST.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/docs/OPERATIONS_DEPLOY_CHECKLIST.md)
- [supabase/migrations/20260310050000_update_cron_schedules_8am.sql](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/migrations/20260310050000_update_cron_schedules_8am.sql)
- [supabase/functions/market-data/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/market-data/index.ts)
- [supabase/functions/social-signals/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/social-signals/index.ts)

Execution tasks:

- configure real schedules for `market-data` and `social-signals`
- fill `ALPHA_VANTAGE_KEY` gap if still missing
- verify social ingestion path and decide whether Reddit remains in scope for this sprint

Acceptance criteria:

- scheduled executions are visible and timestamped
- the market feed uses live provider data where expected
- social-signals has a stable operating mode even if Reddit is deferred

### S1-04 — Canonicalize Agent And Event Contracts

Outcome:

- agent names, event types, and run correlation are consistent across docs, backend, and UI

Dependencies:

- S1-01

Primary repo touchpoints:

- [docs/AGENT_ROLES.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/docs/AGENT_ROLES.md)
- [CURRENT_TRUTH.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/CURRENT_TRUTH.md)
- [src/components/modules/Agents.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Agents.jsx)
- [src/data/agentAutomationPacks.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/data/agentAutomationPacks.js)
- [supabase/functions/_shared/agent-registry.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/agent-registry.ts)
- [supabase/functions/_shared/orchestration.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/orchestration.ts)

Execution tasks:

- remove naming drift between canonical runtime agents and persona labels
- verify event names used in pipeline, approval, and messaging flows
- verify `correlation_id` is created, persisted, and queryable end-to-end
- document the contract for the closed loop

Acceptance criteria:

- one canonical runtime naming model is used in code and docs
- the core loop uses consistent event names
- a single run can be located via `correlation_id` across its artifacts

### S1-05 — Upgrade Copilot To Outcome Launch

Outcome:

- Copilot becomes the entry point for business outcomes, not just a decorative chat shell

Dependencies:

- S1-02
- S1-04

Primary repo touchpoints:

- [src/components/ui/CopilotPanel.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/ui/CopilotPanel.jsx)
- [src/hooks/useEdgeFunction.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/hooks/useEdgeFunction.js)
- [supabase/functions/agent-copilot/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/agent-copilot/index.ts)
- [supabase/functions/orchestration-engine/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/orchestration-engine/index.ts)

Execution tasks:

- tune Copilot intent routing so goal-driven prompts prefer `pipeline_launch`
- ensure Copilot can launch `lead_discovery` and `sales_outreach` templates
- surface pipeline run IDs and current status in the Copilot response
- ensure the Copilot UI preserves enough recent run context for follow-up commands

Acceptance criteria:

- at least one Copilot prompt creates a `pipeline_run`
- the response shows run status or a direct path to inspect it
- the launched run uses a reusable template instead of ad hoc isolated tool calls

### S1-06 — Add Approval Inbox And Action Path

Outcome:

- risky sends are visible and actionable from the product, not only from backend tables

Dependencies:

- S1-04
- S1-05

Primary repo touchpoints:

- [src/components/modules/Agents.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Agents.jsx)
- [src/components/modules/Messaging.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Messaging.jsx)
- [src/components/modules/CommandCenter.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/CommandCenter.jsx)
- [src/hooks](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/hooks)
- [supabase/functions/agent-outreach/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/agent-outreach/index.ts)
- [supabase/functions/_shared/policy-engine.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/policy-engine.ts)
- [supabase/migrations/20260312300000_agent_intelligence_v2.sql](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/migrations/20260312300000_agent_intelligence_v2.sql)

Execution tasks:

- add a frontend read path for `approval_requests`
- add approve and reject actions for outreach-related approvals
- display approval context:
  - target contact
  - channel
  - message preview
  - related run or correlation ID
- ensure approval resolution can trigger the next step in the send path

Likely new files:

- `src/hooks/useApprovals.js`
- `src/components/ui/ApprovalInbox.jsx`

Acceptance criteria:

- pending approval requests are visible in the app
- an operator can approve or reject without leaving the platform
- approval resolution updates the related run or message state

### S1-07 — Complete Messaging Closed Loop

Outcome:

- draft, send, delivery update, and inbound reply all write back into the same operational state

Dependencies:

- S1-02
- S1-06

Primary repo touchpoints:

- [src/components/modules/Messaging.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Messaging.jsx)
- [src/hooks/useConversations.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/hooks/useConversations.js)
- [src/hooks/useMessagingChannels.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/hooks/useMessagingChannels.js)
- [supabase/functions/messaging-dispatch/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/messaging-dispatch/index.ts)
- [supabase/functions/gmail-inbound/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/gmail-inbound/index.ts)
- [supabase/functions/whatsapp-webhook/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/whatsapp-webhook/index.ts)
- [supabase/functions/_shared/automation.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/automation.ts)

Execution tasks:

- verify send path persists provider IDs and status changes
- ensure inbound Gmail and WhatsApp updates map back to existing conversations
- ensure `message_in` automation triggers fire after persistence
- surface send status and reply state clearly in Messaging

Acceptance criteria:

- one approved send becomes a real outbound provider message
- one delivery update or inbound reply writes back to `messages` and `conversations`
- the related activity is visible in UI state without manual refresh hacks

### S1-08 — Expose Run Diagnostics Across UI

Outcome:

- operators can inspect the status of the closed loop without querying the database manually

Dependencies:

- S1-05
- S1-07

Primary repo touchpoints:

- [src/hooks/useAgents.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/hooks/useAgents.js)
- [src/hooks/useAgentState.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/hooks/useAgentState.js)
- [src/components/modules/Agents.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Agents.jsx)
- [src/components/modules/Automation.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Automation.jsx)
- [src/components/modules/CommandCenter.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/CommandCenter.jsx)

Execution tasks:

- show current pipeline runs, step state, pending deliveries, and failed steps in one or more operator surfaces
- add a quick path from run to related approval and conversation
- add visible failure states for stuck or failed runs

Acceptance criteria:

- an operator can answer “what happened to this run?” from the UI
- failed or stuck states are visible, not inferred

### S1-09 — Authenticate The Happy Path

Outcome:

- the sprint closes with proof, not assumption

Dependencies:

- S1-02
- S1-05
- S1-06
- S1-07

Primary repo touchpoints:

- [tests/e2e/auth.setup.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/tests/e2e/auth.setup.js)
- [tests/e2e/dashboard.spec.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/tests/e2e/dashboard.spec.js)
- [tests/e2e/navigation.spec.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/tests/e2e/navigation.spec.js)
- [playwright.config.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/playwright.config.js)
- [docs/OPERATIONS_DEPLOY_CHECKLIST.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/docs/OPERATIONS_DEPLOY_CHECKLIST.md)

Likely new files:

- `tests/e2e/closed-loop.spec.js`

Execution tasks:

- add one authenticated Playwright happy-path test for the closed loop
- add manual smoke notes for any provider steps that cannot be fully automated
- record exact demo steps and expected state transitions

Acceptance criteria:

- one automated happy-path test exists
- one manual smoke checklist exists for provider-specific verification
- the team can demo the loop on demand

---

## Dependency Map

Execution order:

1. S1-01
2. S1-02 and S1-03
3. S1-04
4. S1-05
5. S1-06
6. S1-07
7. S1-08
8. S1-09

Critical path:

`S1-01 -> S1-02 -> S1-04 -> S1-05 -> S1-06 -> S1-07 -> S1-09`

---

## Sprint Demo Checklist

The sprint review should prove all of the following in sequence:

1. Launch a business goal from Copilot.
2. Show the created pipeline run and its step rows.
3. Show the generated outreach draft.
4. Show the pending approval request.
5. Approve the request from the app.
6. Show the provider-backed send result.
7. Show the delivery update or inbound reply.
8. Show the same history in Agents, Automation, and Messaging.

If the demo cannot do this, Sprint 01 is not complete.

---

## Risks

- Supabase auth or runtime secrets may still block deploy verification.
- Gmail and WhatsApp flows may not be equally automatable in tests.
- Approval UX may require new hooks and UI primitives that are not yet present.
- Old naming drift can cause hidden inconsistencies in logs and dashboards.

---

## Deferred To Sprint 02

- deeper premium redesign for Prospector and Intelligence
- run replay tooling beyond the minimum diagnostics needed for Sprint 01
- broader analytics and reporting rebuild
- marketplace and billing work
- noncritical content factory expansion
