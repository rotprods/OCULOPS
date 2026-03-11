# OCULOPS Agent Registry

Updated: 2026-03-11

## Current runtime classification

| Agent | Status | Purpose | Main inputs | Main outputs | Current trigger |
| --- | --- | --- | --- | --- | --- |
| `agent-atlas` | ACTIVE | Scan geography and persist prospect zones | `query`, `location`, `lat`, `lng`, `radius` | `scan`, `leads`, `summary` | manual, `cortex`, ops UI |
| `agent-hunter` | ACTIVE | Qualify persisted leads and create shortlist | `scan_id`, `limit` | `qualified_count`, `shortlist`, briefs | `atlas`, `cortex`, manual |
| `agent-strategist` | PARTIAL | Compatibility alias to Hunter | proxied input | proxied output | compatibility route |
| `agent-cortex` | ACTIVE | Execute the current multi-step prospecting cycle | scan context, query, location | atlas + hunter + outreach aggregate | copilot, manual, cron-style |
| `agent-outreach` | ACTIVE | Stage, approve, send, and report outreach | `status`, `id`, `limit`, `niche` | queue items, send result, stats | hunter, copilot, manual |
| `agent-copilot` | ACTIVE | User-facing AI supervisor | `message`, `history` | response, tool results, navigation | Copilot UI |
| `agent-herald` | ACTIVE | Briefing and delivery sidecar | briefing action | briefing report | manual, periodic |
| `agent-studies` | ACTIVE | Publish agent studies/deliveries | study payload | persisted study, delivery result | `runAgentTask`, manual |
| `agent-oracle` | EXPERIMENTAL | Cross-entity analysis and insights | analysis action | snapshots, insights | copilot, reports |
| `agent-sentinel` | EXPERIMENTAL | Monitoring and anomaly detection | monitor action | alerts, analysis | copilot, cron-style |
| `agent-forge` | EXPERIMENTAL | Content generation | content prompt | generated content | copilot |
| `agent-scraper` | EXPERIMENTAL | Competitor website analysis | `url` | knowledge payload | copilot |
| `agent-proposal` | EXPERIMENTAL | Proposal generation | business + niche | proposal HTML | copilot |
| `agent-scribe` | PARTIAL | Oracle compatibility proxy | proxied input | proxied output | compatibility route |
| `agent-study-dispatch` | PARTIAL | Studies compatibility proxy | proxied input | proxied output | compatibility route |
| `agent-feedback` | MISSING | Removed runtime | n/a | `410` | deprecated |

## Runtime contract model

`agent_registry` now stores:

- `input_contract`
- `output_contract`
- `consumes_events`
- `emits_events`
- `tool_scopes`
- `memory_scopes`
- `run_mode`
- `orchestration_metadata`

## Canonical event mapping

- `atlas` consumes: `pipeline.step.ready`, `scan.requested`
- `atlas` emits: `scan.completed`, `lead.captured`
- `hunter` consumes: `lead.captured`, `pipeline.step.ready`
- `hunter` emits: `lead.qualified`, `brief.generated`
- `outreach` consumes: `lead.qualified`, `pipeline.step.ready`
- `outreach` emits: `outreach.staged`, `message.sent`
- `cortex` consumes: `pipeline.started`, `agent.error`, `pipeline.retry_requested`
- `cortex` emits: `pipeline.started`, `pipeline.completed`, `pipeline.failed`
- `copilot` consumes: `goal.requested`, `pipeline.failed`, `pipeline.completed`
- `copilot` emits: `goal.requested`, `pipeline.created`

## Operating note

The backend keeps canonical code names.
Legacy persona labels and aspirational role names can still exist in UI copy, but orchestration state must always resolve to these runtime identifiers.
