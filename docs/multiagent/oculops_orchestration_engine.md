# OCULOPS Orchestration Engine

Updated: 2026-03-11

## Function

`orchestration-engine` is the new runtime control surface for pipeline execution.

## Supported actions

- `create_run`
- `execute_run`
- `get_run`
- `list`

## Execution flow

1. Resolve `pipeline_template`
2. Create `pipeline_run`
3. Create `pipeline_run_state`
4. Emit `pipeline.created`
5. Execute steps in order
6. Persist `pipeline_step_runs`
7. Write step outputs into `memory_entries`
8. Emit step and pipeline events

## Step types

- `agent`
- `workflow`
- `event`
- `task`

Current v1 implementation executes agent and workflow steps directly and emits events for observability and downstream subscriptions.

## State model

`pipeline_run_state` stores:

- `current_agent`
- `waiting_for_event`
- `last_event_id`
- `retry_cursor`
- `metrics`

This keeps runtime state visible without needing to reconstruct it from raw logs only.

## Failure model

On step failure:

- the step run is marked `failed`
- the pipeline run is marked `failed`
- `agent.error` and `pipeline.failed` are emitted
- the event system can route that failure to copilot, automation, or dead-letter review
