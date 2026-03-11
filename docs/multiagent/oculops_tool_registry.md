# OCULOPS Tool Registry

Updated: 2026-03-11

## Canonical registry

`tool_registry` is the shared catalog of executable capabilities.

Extended fields now include:

- `provider`
- `invocation_type`
- `risk_level`
- `requires_approval`
- `default_config`
- `rate_limit_per_minute`

## Permission layer

`agent_tool_permissions` controls:

- which agent can call which tool
- whether approval is required
- per-run call caps
- spend guardrails

## Seeded system tools

- `google-maps-search`
- `ai-qualifier`
- `automation-runner`
- `event-dispatcher`
- `messaging-dispatch`
- `send-email`
- `orchestration-engine`

## Seeded agent permissions

- `atlas` -> `google-maps-search`
- `hunter` -> `ai-qualifier`
- `hunter` -> `google-maps-search`
- `outreach` -> `send-email` with approval
- `outreach` -> `messaging-dispatch` with approval
- `cortex` -> `automation-runner`
- `cortex` -> `event-dispatcher`
- `copilot` -> `orchestration-engine`

## Invocation rule

Direct edge-function knowledge in agent prompts is allowed for compatibility, but the system direction is:

- resolve capability from `tool_registry`
- enforce guardrails through `agent_tool_permissions`
- record actual usage through existing API/agent logs
