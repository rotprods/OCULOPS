# Terminal 4 - Registry Truth Map

Generated: 2026-03-15
Refreshed after Terminal 2 closure: 2026-03-15

**FACT**
- `03_REGISTRIES/generated/*.json` is byte-identical to `/Users/rotech/AGENCY_OS/CONFIG/*_registry.json`.
- `03_REGISTRIES/synthetic/*.json` is byte-identical to `/Users/rotech/AGENCY_OS/CONFIG/registries/*.json`.
- Terminal 2 has now published formal runtime files in `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-2`, including the corrected runtime manifest and permission model.
- Live fallback evidence used here on 2026-03-15:
  - `GET http://127.0.0.1:38793/api/v1/pm2` returned 29 PM2 processes.
  - `docker ps` returned live `ai-stack-agent-zero`, `ai-stack-n8n`, and `oculops-qdrant`.
  - `GET http://127.0.0.1:38791/api/memory/health` and `GET http://127.0.0.1:6333/collections` returned 7 Qdrant collections, not 3.
  - Terminal 2 confirms runtime ownership is split across `AGENCY_OS`, `/Users/rotech/OCULOPS-OS/AIOPS`, and out-of-tree `/Users/rotech/Downloads/rr`.

## Registry Classification

| Registry | Mirror Source | Class | Evidence |
| --- | --- | --- | --- |
| `03_REGISTRIES/generated/agent_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/agent_registry.json` | `conflicting` | Treats PM2 and Docker processes as agents, omits the actual OpenClaw agent identities, and freezes the estate at 14 entries while live PM2 exposes 29 processes. |
| `03_REGISTRIES/generated/credential_scope_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/credential_scope_registry.json` | `conflicting` | Lists only 3 n8n credentials and does not cover the active provider, gateway, channel, or OpenClaw credential surfaces visible elsewhere in runtime docs and config. |
| `03_REGISTRIES/generated/dashboard_action_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/dashboard_action_registry.json` | `conflicting` | Advertises `/api/workflows` and `/api/executions`, but those routes are not implemented in `dashboard_api.py`; it is a view index, not a real action caller registry. |
| `03_REGISTRIES/generated/memory_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/memory_registry.json` | `conflicting` | Claims semantic memory is Qdrant with 3 collections, but live memory health reports 7 collections and the real service exposes `episodic`, `market`, `procedural`, and `user` layers too. |
| `03_REGISTRIES/generated/node_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/node_registry.json` | `conflicting` | Useful topology map, but still claims a smaller localtunnel-centered estate while live PM2 shows 29 processes plus `cf-quick-tunnel`, `op-telegram-bot`, and `omnicenter*` surfaces. |
| `03_REGISTRIES/generated/plugin_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/plugin_registry.json` | `generated` | This is a generated plugin or MCP inventory. It is not yet an approved canonical governance registry, but it is not directly contradicted by the audited runtime in this pass. |
| `03_REGISTRIES/generated/service_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/service_registry.json` | `conflicting` | Only 7 services are listed and the file omits live gateway, dashboard, Qdrant, Agent Zero, chains, voice, and duplicate tunnel or readiness services. |
| `03_REGISTRIES/generated/tool_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/tool_registry.json` | `conflicting` | It is a raw 418-item n8n node catalog, not a governed OCULOPS tool bus registry, and it mixes node types with operational tool claims. |
| `03_REGISTRIES/generated/workflow_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/workflow_registry.json` | `conflicting` | It mixes 2,075 community and imported workflows with 44 active flows, so it cannot serve as the authoritative operational workflow ownership registry. |
| `03_REGISTRIES/synthetic/agent_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/registries/agent_registry.json` | `synthetic` | Two-row illustrative design artifact that declares `CloudBot Director` core and `Agent Zero Worker` supervised beneath it without runtime proof. |
| `03_REGISTRIES/synthetic/dashboard_action_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/registries/dashboard_action_registry.json` | `synthetic` | Two sample actions only; useful as a design target, not as current action truth. |
| `03_REGISTRIES/synthetic/service_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/registries/service_registry.json` | `synthetic` | Four-row illustrative service pack that does not represent the live runtime estate. |
| `03_REGISTRIES/synthetic/tool_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/registries/tool_registry.json` | `synthetic` | Two sample governed tools; design intent only. |
| `03_REGISTRIES/synthetic/workflow_registry.json` | `/Users/rotech/AGENCY_OS/CONFIG/registries/workflow_registry.json` | `synthetic` | Two sample workflows; design intent only. |

**INFERENCE**
- No file in `03_REGISTRIES` qualifies as `canonical` on 2026-03-15.
- The closest working source is `/Users/rotech/AGENCY_OS/CONFIG/*.json`, but that pack is still a generated snapshot set with multiple runtime conflicts.
- The `synthetic` family is useful for target-shape planning, but it must not be treated as operating truth.

**RISK**
- If other terminals treat `generated` as authoritative, they will undercount services, memory layers, and workforce surfaces.
- If other terminals treat `synthetic` as authoritative, they will invent a governed CloudBot or Agent Zero relationship that is not yet proven.
- Even with Terminal 2's formal manifest published, any premature canonical claim would still harden the wrong pack because the current registries do not encode audited runtime truth.

**REQUIRED ACTION**
- Approve that the current canonical registry pack is `none` until a corrected pack is regenerated from live PM2, Docker, Qdrant, dashboard, gateway, and control-plane inventories.
- Mark `03_REGISTRIES/synthetic/*` as design-only and non-operational in downstream planning.
- Rebuild `agent`, `service`, `workflow`, `tool`, `memory`, and `dashboard_action` registries from audited runtime truth before the definitive implementation plan starts.
