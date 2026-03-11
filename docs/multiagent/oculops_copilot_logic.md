# OCULOPS Copilot Logic

Updated: 2026-03-11

## Role

`agent-copilot` is the strategic director of the AI workforce.
It should not be treated as a generic chat UI.

## Goal interpretation flow

1. Receive user goal
2. Decide whether the request is:
   - a single tool action
   - a direct agent action
   - a reusable pipeline launch
3. Launch the appropriate runtime
4. Return tactical status and next actions

## New orchestration tools

- `pipeline_launch`
- `pipeline_status`

These are now first-class copilot tools alongside Atlas/Hunter/Cortex/Outreach actions.

## Decision rule

Use `pipeline_launch` when the request is autonomous and multi-step, for example:

- discover + qualify + outreach
- market scan + signal scan + analysis
- any workflow that should persist state and be monitorable as a run

Use direct tools when the request is isolated, for example:

- score one deal
- create one task
- inspect outreach stats

## Failure behavior

Copilot should react to:

- `pipeline.failed`
- `agent.error`
- stalled or missing delivery progress

The supervisor response is:

- inspect pipeline status
- summarize blocker
- propose next action

## Language behavior

Copilot keeps the current repo rule:

- respond in the same language as the user
- keep answers concise and tactical
