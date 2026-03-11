# OCULOPS Event System

Updated: 2026-03-11

## Canonical event envelope

Every runtime event is persisted in `event_log` with:

- `event_type`
- `payload`
- `user_id`
- `org_id`
- `source_agent`
- `pipeline_run_id`
- `step_run_id`
- `correlation_id`
- `status`
- `metadata`

## Event delivery tables

- `event_subscriptions`: who listens to which event pattern
- `event_deliveries`: every delivery attempt and status
- `event_dead_letters`: terminal failures for manual inspection

## Pattern matching

Supported matching modes:

- exact event names
- prefix wildcards such as `agent.*`

## Dispatcher behavior

`event-dispatcher` now does four things for every incoming event:

1. Route to explicit n8n/webhook mappings
2. Trigger `automation_workflows` by `trigger_key`
3. Resolve matching `event_subscriptions`
4. Persist delivery success/failure into `event_deliveries`

## Supported subscription targets

- `agent`
- `workflow`
- `webhook`
- `pipeline`

## Seeded subscriptions

- `lead.captured` -> queue `hunter`
- `lead.qualified` -> queue `outreach`
- `deal.stage_changed` -> trigger automation workflow
- `pipeline.failed` -> queue `copilot`
- `goal.requested` -> launch `lead_discovery`

## Core event families

- `goal.requested`
- `pipeline.created`
- `pipeline.started`
- `pipeline.step.started`
- `pipeline.step.completed`
- `pipeline.completed`
- `pipeline.failed`
- `agent.started`
- `agent.completed`
- `agent.error`
- `scan.completed`
- `lead.captured`
- `lead.qualified`
- `outreach.staged`
- `message.sent`

## UI usage

Realtime should subscribe to:

- `event_log`
- `event_deliveries`
- `event_dead_letters`

The dashboard can now show both event creation and delivery health instead of only raw event inserts.
