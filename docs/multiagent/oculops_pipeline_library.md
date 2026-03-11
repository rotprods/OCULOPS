# OCULOPS Pipeline Library

Updated: 2026-03-11

## Runtime model

Reusable orchestration templates are stored in:

- `pipeline_templates`
- `pipeline_template_steps`

Runtime execution is stored in:

- `pipeline_runs`
- `pipeline_step_runs`
- `pipeline_run_state`

## System templates

### `lead_discovery`

Goal:
- scan a market
- qualify leads
- stage outreach

Steps:
1. `atlas_scan` -> `agent-atlas` `cycle`
2. `hunter_qualify` -> `agent-hunter` `cycle`
3. `outreach_stage` -> `agent-outreach` `cycle`

Primary success signal:
- `outreach.staged`

### `sales_outreach`

Goal:
- refresh lead quality
- stage outreach
- inspect outreach stats

Steps:
1. `hunter_refresh` -> `agent-hunter` `cycle`
2. `outreach_stage` -> `agent-outreach` `cycle`
3. `outreach_stats` -> `agent-outreach` `stats`

Primary success signal:
- `pipeline.completed`

### `marketing_intelligence`

Goal:
- capture market data
- capture social signals
- generate a strategic brief

Steps:
1. `market_scan` -> workflow trigger `market-data`
2. `social_scan` -> workflow trigger `social-signals`
3. `oracle_brief` -> `agent-oracle` `analyze`

Primary success signal:
- `pipeline.completed`

## Execution rules

- steps run in `step_number` order
- each step creates a durable `pipeline_step_run`
- each step emits `pipeline.step.started` and `pipeline.step.completed`
- failures emit `pipeline.failed` and `agent.error`
- every completed step writes to `memory_entries`

## Extension rule

Business automations remain in `automation_workflows`.
Cross-agent execution belongs in the pipeline runtime and must not be hidden inside a generic automation definition.
