# OCULOPS Dashboard Intelligence

Updated: 2026-03-11

## Goal

The UI should show a live AI workforce, not a static list of modules.

## Current-compatible surfaces

No global IA rewrite is required.
The orchestration layer should feed existing modules:

- `Agents`
- `Pipeline`
- `ControlTower`
- `Watchtower`
- `Copilot`

## New runtime feeds

The frontend can now subscribe to:

- `pipeline_runs`
- `pipeline_step_runs`
- `event_log`
- `event_deliveries`
- `memory_entries`

## Operator-facing modules

### Active agents

Source:
- `agent_registry`
- `agent_tasks`

### Running pipelines

Source:
- `pipeline_runs`
- `pipeline_step_runs`
- `pipeline_run_state`

### Recent events

Source:
- `event_log`

### Delivery health

Source:
- `event_deliveries`
- `event_dead_letters`

### AI recommendations

Source:
- `pipeline.failed`
- `agent.error`
- `memory_entries`
- copilot status summaries

## Hook support

`useAgents` now exposes orchestration-aware state:

- `pipelineRuns`
- `pipelineStepRuns`
- `eventDeliveries`
- `recentEvents`
- `launchPipeline()`
- `getPipelineStatus()`
