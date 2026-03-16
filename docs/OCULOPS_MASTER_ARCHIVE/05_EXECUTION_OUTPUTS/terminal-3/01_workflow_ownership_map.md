# Terminal 3 - Workflow Ownership Map

Evidence date: 2026-03-15

## Runtime split

- FACT: Native `n8n` is running under PM2 on `127.0.0.1:5680` from `/Users/rotech/AGENCY_OS/SCRIPTS/n8n-start.sh`.
- FACT: Docker `n8n` is also running on `127.0.0.1:5678` as container `ai-stack-n8n`, sourced from `/Users/rotech/Downloads/N8N_AIRDROP_PACK/n8n-workflows/ai-stack/docker-compose.yml`.
- FACT: Repo-synced bridge artifacts point workflow ingress to native `n8n`, not Docker `n8n`: `bridge-config.json` maps `n8n` to `http://127.0.0.1:5680`, `api-gateway.js` proxies `/webhook/*` to `http://127.0.0.1:5680`, and `webhook_bridge_map.json` publishes 44 workflow URLs on the `oculopscortex.loca.lt` base.
- FACT: `workflow_registry.json` reports 44 active workflows. Ownership buckets are `community_connected` 29, `UNCLASSIFIED` 7, `outreach` 2, `comms` 1, `runtime` 1, `analytics` 1, `strategy` 1, `leads` 1, and `content` 1.
- INFERENCE: Native `n8n` is the real operational owner of current OCULOPS automation. Docker `n8n` is a parallel runtime with a different data path and should not be treated as the same role.
- RISK: Keeping both runtimes "live" creates split workflow state, split credentials, duplicate operators, and unclear rollback ownership.
- REQUIRED ACTION: Mark native `n8n` as canonical automation runtime and downgrade Docker `n8n` to `sandbox`, `import-lab`, or `deprecated`.

## Core family resolution

| Workflow family | Real workflow IDs / paths | Primary callers | Authoritative runtime path | Ownership resolution | Status |
| --- | --- | --- | --- | --- | --- |
| CEO chatbot / CloudBot | `sqoGbS1A2ZuXhEef` -> `/webhook/oculops-ceo-chatbot` | Telegram Bot API, CEO chat commands | Public webhook -> gateway `:38793` -> native `n8n :5680` -> Telegram reply | Governor-facing comms workflow owned by native `n8n`; this is the only proved CEO chat surface | `core` |
| HERALD daily briefing | `7M4zdp8uLummz94x` | Native scheduler at 8AM | Native schedule trigger -> native `n8n` -> readiness / dashboard deps -> Telegram | Comms-owned scheduled reporting path | `core` |
| HUNTER daily prospection | `WgIwuiakZVaPI9if` | Native scheduler | Native schedule trigger -> native `n8n` -> lead tooling / data stores | Leads-owned recurring acquisition path | `core` |
| Speed-to-lead intake | `3y32B5al3bPTZKqn` -> `/webhook/new-lead` | External lead form / inbound webhook | Public webhook -> gateway `:38793` -> native `n8n :5680` | Leads-owned public intake path | `core` |
| Lead qualification / CRM handoff | `CB8JopOIksKPKXha` -> `/webhook/chatbot-message`; `wtXUruwMNBF4A1vh` -> `/webhook/chatbot-lead-qualifier` | Public chat lead intake | Public webhook -> gateway `:38793` -> native `n8n :5680` -> CRM / Supabase | Leads-owned conversion path | `partial-core` |
| FORGE content generation | `xIYFU3pt241wSWYq` -> `/webhook/forge-content`; support `ELGOvY3rtObeDa7E` | Public webhook, schedule | Public webhook or native schedule -> native `n8n` -> model / publish deps | Content-owned generation path | `partial-core` |
| ORACLE / SCRIBE analytics | `QyZBUfHQzmbrYUlu` | Native scheduler at 8AM | Native schedule trigger -> native `n8n` -> report sinks | Analytics-owned scheduled reporting path | `partial-core` |
| STRATEGIST evaluation | `RUB8DncnqQxt8x21` -> `/webhook/strategist-evaluate` | Control-plane or public webhook caller | Public webhook -> gateway `:38793` -> native `n8n :5680` | Strategy-owned webhook path exists but caller map is still incomplete | `partial-core` |
| ARCHITECT handoff | `DvMticDPNkvjLOdm` -> `/webhook/architect-os-handoff` | Runtime or cross-agent handoff caller | Public webhook -> gateway `:38793` -> native `n8n :5680` | Runtime support flow, not a primary business slice | `supporting` |
| Outreach sender | `TfwnxlnwP8WBJcGx`; support `JugOdYlpgRqXhcRO` | Native scheduler, approval-dependent outbound sends | Native schedule trigger -> native `n8n` -> Gmail | Outreach-owned but credential- and approval-dependent | `blocked` |

## Publicly active but not resolved into core

- FACT: 29 of 44 active workflows are tagged `community_connected`, not a named OCULOPS department.
- FACT: Several of those imported workflows have live public trigger surfaces through the same published webhook base.
- FACT: 7 of 44 active workflows remain `UNCLASSIFIED`.
- INFERENCE: The current workflow estate mixes production families with community examples in one active runtime.
- RISK: Public webhook surface is wider than the claimed OCULOPS operating model and includes workflows without a named business owner.
- REQUIRED ACTION: Deactivate or quarantine all `community_connected` and `UNCLASSIFIED` workflows unless they are explicitly retained in the canonical topology.

## Ownership gaps that remain open

- FACT: No active workflow names in `workflow_registry.json` match `CORTEX` or `ATLAS`.
- FACT: `CLAWBOT_MASTER_OPERATING_SYSTEM.md` still claims `/cortex` is implemented and `/atlas` is pending as sub-workflows.
- INFERENCE: Current governor docs overstate workflow ownership for orchestration families that are not machine-proven in the active registry.
- RISK: Terminal 1 may inherit direct callers for workflow families that do not have an authoritative runtime target.
- REQUIRED ACTION: Terminal 1 should reconcile all control-plane callers against the retained workflow IDs above before closing Group 1.
