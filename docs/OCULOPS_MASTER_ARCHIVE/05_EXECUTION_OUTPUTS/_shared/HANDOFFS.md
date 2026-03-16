# Cross-Terminal Handoffs

Use this file for the current shared truth only. Resolved and superseded blocker language has been removed.

## Current Group Status

- Group 1: `closed`
- Group 2: `closed for audit cycle`
- Group 3: `closed for audit cycle`
- Group 4: `closed for audit cycle`

## Shared Truth

- From: Terminal 2
- To: Terminals 1, 3, and 4
- Topic: Approved runtime endpoints
- Status: Complete
- Needed:
  Use only these approved endpoints for the current audit cycle:
  `GET http://127.0.0.1:38793/api/v1/health`
  `GET http://127.0.0.1:38791/health`
  `GET http://127.0.0.1:38791/api/readiness`
  `GET https://yxzdafptqtcvpsbqkmkm.supabase.co/storage/v1/object/public/oculops-runtime/ecosystem-readiness.latest.json`
- Evidence:
  `38793/api/v1/health` returned `200`
  `38791/health` returned `200`
  `38791/api/readiness` returned `200`
  the public Supabase readiness mirror returned `200`

- From: Terminal 2
- To: Terminals 1, 3, and 4
- Topic: Canonical readiness artifact
- Status: Complete
- Needed:
  Treat `/Users/rotech/AGENCY_OS/CONTEXT/ecosystem-readiness.latest.json` as the canonical machine-readable readiness artifact for this audit cycle.
  Treat `http://127.0.0.1:38791/api/readiness` as its canonical API projection.
  Treat the Supabase public JSON as a derived mirror only.
- Evidence:
  `readiness_watcher.py` writes the file every 30 seconds
  `dashboard_api.py` serves `/api/readiness` directly from that file
  `DOCS/runbooks/ecosystem-readiness.latest.json` is older and uses a different schema

- From: Terminal 2
- To: Terminals 1, 3, and 4
- Topic: Runtime owner statement
- Status: Complete
- Needed:
  Treat `/Users/rotech/AGENCY_OS` as the canonical runtime code owner.
  Treat `/Users/rotech/OCULOPS-OS/AIOPS` as the current live launch workspace for several PM2-managed scripts.
  Treat `/Users/rotech/Downloads/rr` as out-of-tree runtime code that remains non-core until migrated or removed.
  Do not use `/Users/rotech/AIOPS` as a real path; it is stale PM2 environment metadata only.
- Evidence:
  `pm_exec_path` for `agency-dashboard-api`, `n8n`, `readiness-watcher`, `readiness-sync`, `n8n-tunnel`, and `op-mcp-tunnel` points into `AGENCY_OS`
  `lsof -a -d cwd -p <pid>` resolves their live cwd to `/Users/rotech/OCULOPS-OS/AIOPS`
  `integration-hub` and `rr-planner` execute from `/Users/rotech/Downloads/rr`

- From: Terminal 2
- To: Terminals 1, 3, and 4
- Topic: Unsafe or undeclared runtime entry points
- Status: Caution
- Needed:
  Do not treat these surfaces as canonical or safe:
  all tested protected gateway routes on `38793` are effectively unauthenticated
  `POST /api/v1/siri` is public and returned `200` with no token
  `38792` integration hub is open and contains mutating routes
  `40000`, `40001`, `40002` OMNICENTER surfaces are live but undeclared
  Docker `n8n` on `5678` is a duplicate runtime
  `127.0.0.1:5679` is not a reliable `n8n-viz` path
  `https://oculopscortex.loca.lt/api/v1/health` returned `503`
  the active `trycloudflare.com` hostname from `cf-quick-tunnel` did not resolve
- Evidence:
  `GET /api/v1/pm2` and `GET /api/v1/readiness` returned `200` with no token and with an invalid token
  `GET http://127.0.0.1:40000/` returned `200`
  `GET http://127.0.0.1:40001/` returned `426`
  `GET http://127.0.0.1:40002/` returned `404`

- From: Terminal 3
- To: Terminals 1 and 4
- Topic: Canonical automation and exposure posture
- Status: Complete
- Needed:
  Treat native `n8n :5680` as the canonical automation runtime.
  Treat Docker `n8n :5678` as a non-core duplicate.
  Treat `oculops-api-gateway :38793` as the only justified broker.
  Treat public exposure as `NO-GO` until a named Cloudflare tunnel, owned DNS, enforced gateway auth, and public ingress health checks are all in place.
  Treat `n8n-tunnel`, `op-mcp-tunnel`, and `cf-quick-tunnel` as deprecated from core.
- Evidence:
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-3/01_workflow_ownership_map.md`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-3/02_automation_topology_recommendation.md`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-3/03_exposure_path_recommendation.md`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-3/04_deprecation_list.md`

- From: Terminal 3
- To: Terminal 1 and Terminal 4
- Topic: Retained workflow families
- Status: Complete
- Needed:
  Reconcile caller-facing workflow surfaces against these retained workflow IDs:
  `sqoGbS1A2ZuXhEef` (`/webhook/oculops-ceo-chatbot`)
  `3y32B5al3bPTZKqn` (`/webhook/new-lead`)
  `CB8JopOIksKPKXha` (`/webhook/chatbot-message`)
  `wtXUruwMNBF4A1vh` (`/webhook/chatbot-lead-qualifier`)
  `xIYFU3pt241wSWYq` (`/webhook/forge-content`)
  `RUB8DncnqQxt8x21` (`/webhook/strategist-evaluate`)
  `DvMticDPNkvjLOdm` (`/webhook/architect-os-handoff`)
  No active workflow names match `CORTEX` or `ATLAS` in the registry.
- Evidence:
  Native `n8n :5680` behind gateway `:38793` is the real workflow target
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-3/01_workflow_ownership_map.md`

- From: Terminal 1
- To: Terminals 2, 3, and 4
- Topic: Product-runtime reconciliation
- Status: Complete
- Needed:
  Terminal 1 deliverables now treat `/Users/rotech/AGENCY_OS/CONTEXT/ecosystem-readiness.latest.json` and `http://127.0.0.1:38791/api/readiness` as canonical readiness.
  `http://127.0.0.1:38793/api/v1/health` is gateway liveness only.
  Native `n8n :5680` behind `:38793` is the real workflow runtime.
  Docker `n8n :5678` is a duplicate.
  Direct browser runtime probes, direct `launch_n8n` webhook posts, and direct privileged agent or provider callers remain governor reroute targets.
- Evidence:
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-1/01_control_plane_truth_map.md`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-1/02_direct_call_inventory.md`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-1/03_governor_reroute_list.md`

- From: Terminal 1
- To: Terminal 4
- Topic: Product caller inventory
- Status: Complete
- Needed:
  Use these current callers as the governor migration set:
  `agent-cortex` from GTM
  `agent-herald` from Herald UI
  `agent-runner` from Agent Vault and Marketplace
  `agent-outreach` from approvals and outreach queue
  `agent-copilot` from Copilot
  `agent-forge` from Creative and Generative Media
  `agent-studies` from studies
  `messaging-dispatch` from Messaging UI
  `api-proxy` from connector execution
- Evidence:
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-1/01_control_plane_truth_map.md`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-1/02_direct_call_inventory.md`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-1/03_governor_reroute_list.md`

- From: Terminal 4
- To: Terminals 1, 2, and 3
- Topic: Governor identity recommendation
- Status: Complete
- Needed:
  Treat `CloudBot Governor` as the canonical role name.
  Treat `ClawBot` as the live runtime implementation label.
  Treat `OpenClaw` as the runtime framework only.
  Do not collapse the three into one identity in core claims yet.
- Evidence:
  `/Users/rotech/AGENCY_OS/CONFIG/CLAWBOT_MASTER_OPERATING_SYSTEM.md`
  `/Users/rotech/AGENCY_OS/AGENTS/orchestrator/IDENTITY.md`
  `/Users/rotech/AGENCY_OS/MCP/oculops-mcp-server/api-gateway.js`
  `~/.openclaw/openclaw.json`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-4/04_governor_identity_recommendation.md`

- From: Terminal 4
- To: Terminals 1, 2, and 3
- Topic: Registry truth classification
- Status: Complete
- Needed:
  Treat `03_REGISTRIES/synthetic/*` as synthetic only.
  No file in `03_REGISTRIES` is canonical on 2026-03-15.
  The generated family mirrors `/Users/rotech/AGENCY_OS/CONFIG/*.json` but currently conflicts with live runtime truth in agent, service, memory, workflow, tool, and dashboard-action scope.
- Evidence:
  hash parity between workspace and upstream registry families
  live `GET http://127.0.0.1:38793/api/v1/pm2`
  live `GET http://127.0.0.1:38791/api/memory/health`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-4/01_registry_truth_map.md`

- From: Terminal 4
- To: Terminals 1, 2, and 3
- Topic: Workforce and model-routing posture
- Status: Complete
- Needed:
  Treat the current routing posture as `hybrid with local-first preference`.
  Treat OpenClaw or ClawBot workforce as `partial`.
  Treat Agent Zero as `non-core` until a governed caller path exists.
- Evidence:
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-4/02_model_routing_truth_map.md`
  `/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/terminal-4/03_workforce_status.md`
