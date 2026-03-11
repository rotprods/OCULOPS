# OCULOPS Multi-Agent Architecture

Updated: 2026-03-11

## Current system reality

OCULOPS already has a shared operating core on `Supabase + Edge Functions + Realtime`.
The live baseline is:

- Active core agents: `atlas`, `hunter`, `cortex`, `outreach`
- Active sidecars: `copilot`, `herald`, `agent-studies`
- Experimental or restored agents: `oracle`, `sentinel`, `forge`, `scraper`, `proposal`
- Shared persisted entities already exist for prospecting, CRM, messaging, automation, signals, and agent logs
- `event_log` exists and already broadcasts through `pg_notify`

The main limitation was architectural:

- orchestration depended on hardcoded sequential flows
- events were observable but not delivery-tracked
- pipelines were defined conceptually but not executed as first-class runs
- memory existed in fragments (`knowledge_entries`, `agent_studies`, `learning_records`) without a canonical runtime facade
- copilot could launch tools, but not supervise pipeline runs as a control plane

## Target operating layers

### 1. Master copilot layer

- `agent-copilot` interprets user intent
- chooses a pipeline template
- launches a `pipeline_run`
- supervises progress and failures

### 2. Agent layer

Canonical runtime names remain:

- `agent-atlas`
- `agent-hunter`
- `agent-cortex`
- `agent-outreach`
- `agent-herald`
- `agent-oracle`
- `agent-sentinel`
- `agent-forge`

`agent_registry` now stores input/output contracts, event subscriptions, tool scopes, memory scopes, and run mode.

### 3. Event communication layer

`event_log` is the canonical bus.
New support tables:

- `event_subscriptions`
- `event_deliveries`
- `event_dead_letters`

`event-dispatcher` now fans out to:

- n8n/webhooks
- `automation_workflows`
- agent subscriptions
- pipeline subscriptions

### 4. Pipeline execution layer

New runtime entities:

- `pipeline_templates`
- `pipeline_template_steps`
- `pipeline_runs`
- `pipeline_step_runs`
- `pipeline_run_state`

`orchestration-engine` creates and executes runs from templates instead of relying on a fixed `cortex` sequence.

### 5. Memory layer

New canonical runtime memory:

- `memory_entries`

Scopes:

- `task`
- `shared_ops`
- `long_term`

This does not replace existing knowledge tables; it normalizes runtime write/read behavior across agents.

### 6. Tool layer

`tool_registry` is extended with:

- provider
- invocation type
- risk level
- approval requirement

`agent_tool_permissions` now maps which agents can use which tools and under which safety mode.

## Implementation principle

This upgrade is incremental, not a rewrite.
The new orchestration runtime sits on top of the current OCULOPS execution surfaces and reuses existing agent functions whenever possible.
