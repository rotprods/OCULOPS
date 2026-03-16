# Terminal 4 - Governor Identity Recommendation

Generated: 2026-03-15

**FACT**
- `/Users/rotech/AGENCY_OS/CONFIG/CLAWBOT_MASTER_OPERATING_SYSTEM.md` describes `CloudBot / OCULOPS CEO Chatbot` as a Telegram plus n8n workflow governor surface.
- `/Users/rotech/AGENCY_OS/AGENTS/orchestrator/IDENTITY.md` defines `ClawBot` as the active OCULOPS master director persona.
- `/Users/rotech/AGENCY_OS/MCP/oculops-mcp-server/api-gateway.js` exposes a live `/api/v1/clawbot` endpoint and routes Siri `ask ...` commands into the OpenClaw orchestrator.
- `~/.openclaw/openclaw.json` proves that `OpenClaw` is the underlying agent runtime and CLI framework for `main`, `orchestrator`, `coder`, `qa`, and `architect`.
- `/Users/rotech/AGENCY_OS/CONFIG/workflow_registry.json` includes `OCULOPS CEO Chatbot v2 (Telegram ↔ AI)` as a workflow surface, not as a standalone agent runtime.

## Identity Decision

| Name | Current Reality | Recommendation |
| --- | --- | --- |
| `CloudBot` | Planning and workflow identity for the intended governor role | Keep as the canonical governor role name in docs and convergence planning. |
| `ClawBot` | Live persona, endpoint label, and orchestrator identity used by gateway, voice, and agent docs | Keep as the live runtime implementation label during convergence. |
| `OpenClaw` | Agent runtime, CLI, config, and sub-agent framework | Reserve strictly for the runtime/framework layer, not the governor role itself. |
| `OCULOPS CEO Chatbot v2` | n8n Telegram workflow surface | Treat as one channel implementation of the governor, not the governor identity. |

**INFERENCE**
- The evidence does not support collapsing `CloudBot`, `ClawBot`, and `OpenClaw` into one singular identity today.
- The cleanest convergence rule is a two-layer naming model:
  - role name: `CloudBot Governor`
  - active implementation label: `ClawBot`
  - framework/runtime label: `OpenClaw`
- If a single runtime label must be shown before convergence is complete, `ClawBot` is the safest executable label because the live codepaths already use it.

**RISK**
- If `OpenClaw` is treated as the governor, framework and authority become indistinguishable.
- If `CloudBot` is treated as already singular, terminals may overstate the maturity of the n8n Telegram workflow path.
- If `ClawBot` and `CloudBot` are used interchangeably without a rule, governance ownership, model policy, and caller paths will keep drifting.

**REQUIRED ACTION**
- Adopt this naming policy immediately for cross-terminal work:
  - `CloudBot Governor` = canonical role
  - `ClawBot` = live runtime persona and implementation label
  - `OpenClaw` = framework/runtime only
- Do not describe `CEO Chatbot v2` or Agent Zero as the governor.
- Only collapse to one public governor name after the Telegram workflow, `/api/v1/clawbot`, OpenClaw orchestrator, and memory/governance path are unified under one approved owner.
