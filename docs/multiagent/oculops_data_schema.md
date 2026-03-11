# OCULOPS Data Schema

Updated: 2026-03-11

## Shared business entities

Current source-of-truth business tables remain:

- `companies`
- `contacts`
- `deals`
- `crm_activities`
- `conversations`
- `messages`
- `campaigns`
- `signals`
- `prospector_scans`
- `prospector_leads`
- `automation_workflows`
- `automation_runs`

## New orchestration entities

- `event_subscriptions`
- `event_deliveries`
- `event_dead_letters`
- `pipeline_templates`
- `pipeline_template_steps`
- `pipeline_runs`
- `pipeline_step_runs`
- `pipeline_run_state`
- `agent_tool_permissions`
- `memory_entries`

## Key schema decisions

### Event layer

`event_log` is the bus.
Delivery state is no longer implicit.

### Pipeline layer

Pipeline definitions and pipeline execution are separate concerns:

- template tables describe intent
- run tables describe execution state

### Memory layer

`memory_entries` is the canonical runtime memory facade.

Scopes:

- `task`
- `shared_ops`
- `long_term`

Suggested usage:

- `task`: short-lived step context
- `shared_ops`: handoff context between agents
- `long_term`: durable learnings and business intelligence

## Compatibility rule

Existing knowledge tables remain valid:

- `knowledge_entries`
- `learning_records`
- `agent_studies`

They should be treated as long-term stores or derived outputs behind the runtime memory facade, not as the only coordination layer.
