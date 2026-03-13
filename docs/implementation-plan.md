# OCULOPS — Agentic Platform Implementation Plan
> Updated: 2026-03-13
> Canonical intent: close the gap between a premium operator app and a real agentic operating platform.

---

## Objective

Turn OCULOPS into an operator-grade internal platform where one business objective can move through a full persisted loop:

1. Operator gives a directive in Copilot.
2. Copilot launches a pipeline run with a clear goal and correlation ID.
3. Agents execute against shared persisted entities.
4. High-risk actions pause behind approval.
5. Approved actions send through real provider channels.
6. Provider status and inbound replies write back into the same system.
7. The UI shows outcome, trace, and next recommended action.

This plan is aligned to:

- `CURRENT_TRUTH.md`
- `docs/CONTINUITY_STATUS_2026-03-09.md`
- `docs/OPERATIONS_ARCHITECTURE.md`
- `docs/OPERATIONS_DEPLOY_CHECKLIST.md`

---

## North-Star Outcome

The first fully closed loop must be:

`Copilot -> orchestration-engine -> pipeline_runs -> agent-cortex / atlas / hunter / strategist / outreach -> approval_requests -> messaging-dispatch -> gmail-inbound or whatsapp-webhook -> event_log -> UI feedback`

When this loop works reliably, OCULOPS stops being a premium dashboard with agent features and becomes a real agentic system.

---

## Success Definition

The implementation is successful when all of the following are true:

- An operator can launch a business outcome, not just a tool call, from [src/components/ui/CopilotPanel.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/ui/CopilotPanel.jsx).
- Every run writes durable rows to `pipeline_runs`, `pipeline_step_runs`, `event_log`, and `event_deliveries`.
- Outreach never sends directly from agent logic; risky actions move through `approval_requests`.
- A real outbound Gmail or WhatsApp send completes through `messaging-dispatch`.
- A delivery update or inbound reply lands through `gmail-inbound` or `whatsapp-webhook` and updates `messages`, `conversations`, and follow-up automation state.
- The same run can be inspected from Agents, Automation, Messaging, and CRM without context loss.
- The path is covered by authenticated smoke tests and at least one end-to-end automated test.

---

## Non-Goals For This Plan

- No global visual rebrand.
- No public SaaS packaging push.
- No Stripe, marketplace, or blockchain expansion on the critical path.
- No net-new feature families until the first agentic loop is closed and observable.

Those can return after the core execution path is stable.

---

## Workstreams

### Workstream A — Runtime Closure

Goal: restore confidence that the edge-runtime path is deployable and live.

Primary scope:

- Re-auth Supabase CLI and restore deploy capability.
- Finish blocked deploys:
  - `ai-advisor`
  - `messaging-dispatch`
  - `api-proxy`
- Verify operating functions are deployed and callable:
  - `agent-copilot`
  - `orchestration-engine`
  - `automation-runner`
  - `gmail-inbound`
  - `messaging-channel-oauth`
  - `whatsapp-webhook`
- Close missing env and secret coverage:
  - Google OAuth + Pub/Sub
  - WhatsApp Cloud API
  - `ALPHA_VANTAGE_KEY`
  - any provider keys required by `api-proxy`
- Close scheduler configuration for:
  - `market-data`
  - `social-signals`

Primary touchpoints:

- [CURRENT_TRUTH.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/CURRENT_TRUTH.md)
- [docs/OPERATIONS_DEPLOY_CHECKLIST.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/docs/OPERATIONS_DEPLOY_CHECKLIST.md)
- [supabase/functions/messaging-dispatch/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/messaging-dispatch/index.ts)
- [supabase/functions/api-proxy/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/api-proxy/index.ts)
- [supabase/functions/ai-advisor/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/ai-advisor/index.ts)

Exit criteria:

- All required edge functions deploy successfully.
- Secrets and provider credentials are present in the correct runtime.
- Scheduled jobs run on the intended cadence.
- Manual smoke checks reach live services instead of local/demo fallbacks.

### Workstream B — Control Plane Canonicalization

Goal: remove ambiguity in how agents, events, approvals, and pipeline state are represented.

Primary scope:

- Make the canonical agent registry the only execution truth:
  - `agent-atlas`
  - `agent-hunter`
  - `agent-strategist`
  - `agent-cortex`
  - `agent-outreach`
- Keep persona labels such as Vanta, Apex, Scout, Radar, and Pulse as UX language only, not persisted runtime identifiers.
- Standardize event naming and payload contracts for:
  - lead discovery
  - qualification
  - approval requested
  - message sent
  - message delivered
  - reply received
  - follow-up created
- Ensure `correlation_id` is carried from Copilot to pipeline runs, step runs, event log, and message artifacts.
- Make `approval_requests` the formal gate for high-risk actions instead of ad hoc UI-only caution.
- Review agent policy wiring so risky external actions remain approval-aware.

Primary touchpoints:

- [docs/AGENT_ROLES.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/docs/AGENT_ROLES.md)
- [supabase/functions/_shared/orchestration.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/orchestration.ts)
- [supabase/functions/_shared/policy-engine.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/policy-engine.ts)
- [supabase/functions/_shared/agent-registry.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/agent-registry.ts)
- [supabase/migrations/20260317113000_multiagent_orchestration_core.sql](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/migrations/20260317113000_multiagent_orchestration_core.sql)
- [supabase/migrations/20260312300000_agent_intelligence_v2.sql](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/migrations/20260312300000_agent_intelligence_v2.sql)

Exit criteria:

- One canonical agent naming model is used in code, docs, and database rows.
- All pipeline and event artifacts can be correlated to a single run.
- Approval is enforceable as data and policy, not just operator discipline.

### Workstream C — Closed Loop MVP

Goal: make one business objective execute end-to-end with durable state and operator feedback.

Primary scope:

- Upgrade Copilot from tool launcher to outcome launcher.
- Route business intents through `orchestration-engine` and reusable pipeline templates instead of isolated one-off calls where possible.
- Ensure pipeline templates for `lead_discovery` and `sales_outreach` are usable from Copilot.
- Make `agent-cortex` orchestrate the same persisted context used by Atlas, Hunter, Strategist, and Outreach.
- Make Outreach stage drafts first and request approval before live external send.
- Approve and execute sends through `messaging-dispatch`.
- Persist provider response and delivery state into `messages` and `conversations`.
- On inbound reply or delivery update, trigger `message_in` automation paths and log the result in `event_log`.

Primary touchpoints:

- [src/components/ui/CopilotPanel.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/ui/CopilotPanel.jsx)
- [src/components/modules/Agents.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Agents.jsx)
- [src/components/modules/Automation.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Automation.jsx)
- [src/components/modules/Messaging.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Messaging.jsx)
- [src/hooks/useAgents.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/hooks/useAgents.js)
- [src/hooks/useAutomation.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/hooks/useAutomation.js)
- [supabase/functions/agent-copilot/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/agent-copilot/index.ts)
- [supabase/functions/orchestration-engine/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/orchestration-engine/index.ts)
- [supabase/functions/agent-cortex/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/agent-cortex/index.ts)
- [supabase/functions/agent-outreach/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/agent-outreach/index.ts)
- [supabase/functions/messaging-dispatch/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/messaging-dispatch/index.ts)
- [supabase/functions/gmail-inbound/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/gmail-inbound/index.ts)
- [supabase/functions/whatsapp-webhook/index.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/whatsapp-webhook/index.ts)

Exit criteria:

- A Copilot command can launch a `pipeline_run`.
- The run produces `pipeline_step_runs` for each stage.
- Outreach creates a draft and a matching approval record when live send is gated.
- Approval triggers a real outbound provider send.
- A provider update or reply closes the loop back into the same conversation and run history.

### Workstream D — Trust, Replay, And Evaluation

Goal: make the system explainable enough to operate daily without guessing.

Primary scope:

- Expose per-run traceability:
  - goal
  - context
  - step inputs and outputs
  - approval checkpoints
  - provider responses
  - failure reasons
- Surface event delivery health and retry state.
- Define run success metrics:
  - scan completed
  - qualified leads created
  - outreach drafted
  - approval turnaround
  - sent status reached
  - reply received
- Add run-level and step-level failure taxonomy.
- Add operator views for:
  - pending approvals
  - stuck pipeline steps
  - failed deliveries
  - no-response conversations

Primary touchpoints:

- [src/components/modules/Agents.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Agents.jsx)
- [src/components/modules/CommandCenter.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/CommandCenter.jsx)
- [src/components/modules/Watchtower.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Watchtower.jsx)
- [src/hooks/useAgentState.js](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/hooks/useAgentState.js)
- [supabase/functions/_shared/orchestration.ts](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/functions/_shared/orchestration.ts)

Exit criteria:

- Every failed run can be diagnosed from stored state without re-running blind.
- Operators can see where the loop is blocked and why.
- Approval, delivery, and reply data are first-class operational surfaces.

### Workstream E — Premium UX On Proven Contracts

Goal: improve perceived intelligence and polish without destabilizing runtime behavior.

Primary scope:

- Redesign Prospector and Intelligence around the persisted model that already exists.
- Add strong agent presence to Copilot, Agents, Messaging, and Command Center.
- Make run detail and approval state visible as part of the product language.
- Improve operator ergonomics:
  - one-click inspect run
  - one-click approve / reject
  - one-click open conversation
  - one-click retry failed step

Primary touchpoints:

- [src/components/modules/ProspectorHub.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/ProspectorHub.jsx)
- [src/components/modules/Intelligence.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Intelligence.jsx)
- [src/components/modules/Messaging.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/modules/Messaging.jsx)
- [src/components/ui/CopilotPanel.jsx](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/src/components/ui/CopilotPanel.jsx)

Exit criteria:

- The premium experience sits on top of proven state contracts instead of masking runtime gaps.
- The UI clearly communicates agent intent, current status, and required operator action.

---

## Phase Plan

Companion execution doc:

- [docs/sprint-01-closed-loop-mvp.md](/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/docs/sprint-01-closed-loop-mvp.md)

### Phase 1 — Restore Runtime Closure

Estimated span: 3 to 5 days

Deliverables:

- Supabase deploy path restored
- blocked functions deployed
- env matrix completed
- schedulers configured
- updated deploy checklist with current reality

Gating dependencies:

- none

Must finish before:

- any major Copilot or orchestration changes

### Phase 2 — Canonicalize Control Plane

Estimated span: 2 to 4 days

Deliverables:

- canonical agent registry usage
- normalized event taxonomy
- correlation path verified
- approval path formalized

Gating dependencies:

- Phase 1

Must finish before:

- live-send loop work

### Phase 3 — Ship The First Closed Loop

Estimated span: 1 to 2 weeks

Deliverables:

- Copilot launches reusable pipeline runs
- pipeline templates execute with persisted context
- outreach drafts and approvals work
- messaging send and inbound/status sync work
- UI reflects the same run across modules

Gating dependencies:

- Phase 1
- Phase 2

This is the primary milestone.

### Phase 4 — Add Trust And Replay

Estimated span: 4 to 6 days

Deliverables:

- run and step diagnostics
- approval visibility
- event delivery visibility
- retry and stuck-run detection

Gating dependencies:

- Phase 3

### Phase 5 — Lock QA And Observability

Estimated span: 3 to 5 days

Deliverables:

- authenticated smoke checklist passes
- end-to-end test for the closed loop
- production monitoring for failed runs and failed sends

Gating dependencies:

- Phase 3

### Phase 6 — Premium Operator UX

Estimated span: 1 week

Deliverables:

- upgraded Prospector, Intelligence, Messaging, and Copilot surfaces
- approval and run detail embedded into the visual language
- no change to core data contracts unless required by a proven runtime issue

Gating dependencies:

- Phase 3
- Phase 4
- Phase 5

---

## Immediate Backlog

Execute these in order:

1. Restore Supabase CLI auth and verify remote deploy access.
2. Deploy and verify `ai-advisor`, `messaging-dispatch`, and `api-proxy`.
3. Audit production secrets and fill missing env coverage.
4. Close scheduler setup for `market-data` and `social-signals`.
5. Run authenticated smoke checks for Messaging, Automation, Agents, and Copilot.
6. Normalize canonical agent naming in docs and runtime surfaces.
7. Verify `correlation_id` survives Copilot -> orchestration -> event -> messaging paths.
8. Implement or finish the approval UI and approval execution path for outreach.
9. Complete the first live Copilot-driven `sales_outreach` or `lead_discovery` run.
10. Add run diagnostics, failure states, and operator retry controls.

---

## Required Smoke Path

This path is the minimum operational proof:

1. Open Copilot and issue a lead discovery or sales outreach goal.
2. Confirm a row is created in `pipeline_runs`.
3. Confirm step rows are created in `pipeline_step_runs`.
4. Confirm agent logs and task activity appear in Agents.
5. Confirm an outreach draft is created, not silently sent.
6. Confirm an `approval_requests` row is created for the risky send.
7. Approve the send and confirm `messaging-dispatch` writes provider metadata to `messages`.
8. Confirm delivery status or inbound reply updates the same conversation.
9. Confirm follow-up automation writes back into `automation_runs`, `event_log`, or CRM activity.
10. Confirm the operator can inspect the whole history without leaving the platform blind.

If this path fails, do not move to broader feature expansion.

---

## Test Strategy

### Manual

- Use the deploy checklist to run authenticated Gmail and WhatsApp smoke tests.
- Run one Copilot-initiated business objective per target loop.
- Verify state from four surfaces:
  - Copilot
  - Agents
  - Automation
  - Messaging

### Automated

- Add one end-to-end Playwright flow for the primary closed loop.
- Add focused integration coverage around:
  - `orchestration-engine`
  - `automation-runner`
  - `messaging-dispatch`
  - inbound webhook processing
- Add regression coverage for approval gating so no external send bypasses human review.

---

## Sequencing Rules

- Do not start a broad redesign before the first loop is closed.
- Do not add new monetization or marketplace work to the critical path.
- Do not introduce new agent names or conceptual layers without wiring them into the canonical registry.
- Do not let Copilot remain a decorative chat shell; it must drive real pipeline execution.

---

## Definition Of Done

OCULOPS can be called an agentic platform when:

- business goals launch durable multi-step runs
- agents operate on shared persisted state
- risky actions are approval-aware
- outbound messaging uses real providers
- inbound and delivery events return to the same memory graph
- operators can inspect, trust, and intervene in the loop

Until then, the correct priority is execution closure, not surface expansion.
