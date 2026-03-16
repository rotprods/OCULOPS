# Terminal 2 - Authoritative Runtime Manifest

Audit window: 2026-03-15 18:23Z to 18:29Z
Corrected: 2026-03-15
Workspace: `/Users/rotech/AGENCY_OS`

## Runtime Summary

**FACT**
- `ecosystem.config.js` declares 18 PM2 app entries, but only 17 unique names because `readiness-sync` is defined twice.
- Live PM2 has 29 processes across 27 unique names.
- Docker exposes `ai-stack-agent-zero` on `50080`, `ai-stack-n8n` on `5678`, and `oculops-qdrant` on `6333-6334`.
- Live runtime ownership is split across three real roots:
  - `/Users/rotech/AGENCY_OS` for most executable paths
  - `/Users/rotech/OCULOPS-OS/AIOPS` as the live working directory for several PM2-managed scripts
  - `/Users/rotech/Downloads/rr` for out-of-tree executables such as `integration-hub` and `rr-planner`
- `/Users/rotech/AIOPS` is not a real path on this Mac. It appears only in stale PM2 environment metadata and must not be treated as runtime truth.

**INFERENCE**
- `AGENCY_OS` is the primary runtime code owner, but the live estate is still launched from a mixed operator workspace and one out-of-tree runtime tree.

**RISK**
- Other terminals can harden the wrong ownership map if they follow stale PM2 environment values or declaration files without checking executable paths, live process cwd, and HTTP behavior.

**REQUIRED ACTION**
- Use the live table below as the authoritative Group 2 manifest for this execution cycle.
- Distinguish executable owner, live process cwd, and stale PM2 environment metadata in all downstream planning.

## Canonical Runtime Nodes

| Node | Owner | Supervision | Exec or image | Live cwd or source | Port(s) | Live health path | Live result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `oculops-api-gateway` | Runtime ingress | PM2 | `MCP/oculops-mcp-server/api-gateway.js` | `/Users/rotech/AGENCY_OS/MCP/oculops-mcp-server` | `38793` | `GET http://127.0.0.1:38793/api/v1/health` | `200` | Intended token auth is not effective live on tested protected routes. |
| `agency-dashboard-api` | Observability and readiness | PM2 | `RUNNERS/dashboard/dashboard_api.py` | `/Users/rotech/OCULOPS-OS/AIOPS` | `38791` | `GET http://127.0.0.1:38791/health` | `200` | Exec lives in `AGENCY_OS`; live process cwd resolves to the operator workspace. |
| `integration-hub` | Integrations and job intake | PM2 | `/Users/rotech/Downloads/rr/dashboard/integration_hub.py` | `/Users/rotech/Downloads/rr/dashboard` | `38792` | `GET http://127.0.0.1:38792/api/integrations/health` | `200` | Executable is outside the canonical repo tree. |
| `n8n` | Primary automation runtime | PM2 | `SCRIPTS/n8n-start.sh` | `/Users/rotech/OCULOPS-OS/AIOPS` | `5680` | `GET http://127.0.0.1:5680/healthz` | `200` | Exec lives in `AGENCY_OS`; native `n8n` is the canonical workflow runtime. Docker `n8n` is a duplicate runtime. |
| `n8n-viz` | Workflow observability UI | PM2 | `SCRIPTS/n8n_viz/server.js` | `/Users/rotech/Downloads/rr` | `5679` | `GET http://localhost:5679/api/stats` | `200` | `127.0.0.1:5679` returns `404`; listener behavior differs across IPv4 and IPv6. |
| `op-chains-gateway` | Chain execution | PM2 | `AGENTS/langgraph-chains/chains_gateway.py` | `/Users/rotech/AGENCY_OS` | `38804` | `GET http://127.0.0.1:38804/chain/status` | `200` | No auth observed on direct chain port. |
| `op-voice-server` | Voice runtime | PM2 | `AGENTS/voice/voice_server.py` | `/Users/rotech/AGENCY_OS` | `38805` | `GET http://127.0.0.1:38805/voice/health` | `200` | Real health path is `/voice/health`; `GET /health` returns `404`. |
| `readiness-watcher` | Readiness producer | PM2 | `SCRIPTS/readiness_watcher.py` | `/Users/rotech/OCULOPS-OS/AIOPS` | file output | `/Users/rotech/AGENCY_OS/CONTEXT/ecosystem-readiness.latest.json` | updated `2026-03-15 19:25` local | Exec lives in `AGENCY_OS`; live process cwd resolves to the operator workspace. |
| `readiness-sync` | Public readiness publisher | PM2 x3 | `SCRIPTS/readiness_sync.sh` | `/Users/rotech/OCULOPS-OS/AIOPS` | none | `GET https://yxzdafptqtcvpsbqkmkm.supabase.co/storage/v1/object/public/oculops-runtime/ecosystem-readiness.latest.json` | `200` | Three live PM2 instances are publishing the same file. |
| `n8n-tunnel` | Public gateway tunnel | PM2 | `SCRIPTS/lt-runner.sh` | `/Users/rotech/OCULOPS-OS/AIOPS` | public URL | `GET https://oculopscortex.loca.lt/api/v1/health` | `503` | Exec lives in `AGENCY_OS`; script points to `38793`, not `5680`. Non-core. |
| `cf-quick-tunnel` | Undeclared public gateway tunnel | PM2 | `SCRIPTS/cf-quick-tunnel.sh` | `/Users/rotech/AGENCY_OS` | public URL | `/tmp/cf_tunnel_url.txt` resolved to a `trycloudflare.com` host | DNS failed | Not declared in `ecosystem.config.js`. Non-core. |
| `op-mcp-tunnel` | Undeclared public gateway tunnel | PM2 | `SCRIPTS/lt-mcp-runner.sh` | `/Users/rotech/OCULOPS-OS/AIOPS` | public URL | not approved for core use | not validated for closure | Exec lives in `AGENCY_OS`; script also points to `38793`, not a separate MCP server. Non-core. |
| `Agent Zero` | Browser agent runtime | Docker | `frdel/agent-zero-run:latest` | Docker | `50080` | `GET http://127.0.0.1:50080/` | `200` | Governed caller path is not proven in Group 2. |
| `Qdrant` | Vector memory | Docker | `qdrant/qdrant:latest` | Docker | `6333`, `6334` | `GET http://127.0.0.1:6333/collections` | `200` | Host-exposed on all interfaces. |
| `Docker n8n` | Duplicate automation runtime | Docker | `n8nio/n8n:latest` | Docker | `5678` | container health in `docker ps` | healthy | Duplicate runtime, not the active PM2 `n8n` lane. |
| `OMNICENTER` | Undeclared UI and websocket surface | PM2 | `OMNICENTER/app.py`, `OMNICENTER/ws_server.js`, `OMNICENTER/live_monitor.py` | `/Users/rotech/AGENCY_OS/OMNICENTER` | `40000`, `40001`, `40002` | `GET http://127.0.0.1:40000/`, `GET http://127.0.0.1:40001/`, `GET http://127.0.0.1:40002/` | `200`, `426`, `404` | Not declared in `ecosystem.config.js`; unsafe to treat as core. |

## Declared vs Live Drift

**FACT**
- `readiness-sync` is duplicated in `ecosystem.config.js` and triplicated in PM2.
- Live undeclared PM2 names include `cf-quick-tunnel`, `op-mcp-tunnel`, `op-telegram-bot`, `omnicenter`, `omnicenter-ws`, `omnicenter-monitor`, `model-router`, `herald-daemon`, `n8n-workflow-search`, and legacy `automejora_loop`.
- `integration-hub` is declared as `AGENCY_OS/RUNNERS/dashboard/integration_hub.py`, but live PM2 executes `/Users/rotech/Downloads/rr/dashboard/integration_hub.py`.
- `rr-planner` is declared as `AGENCY_OS/RUNNERS/agents/planner.js`, but live PM2 executes `/Users/rotech/Downloads/rr/agents/planner.js`.
- Several PM2 apps execute files in `AGENCY_OS` while their live process cwd resolves to `/Users/rotech/OCULOPS-OS/AIOPS`.
- PM2 environment metadata still contains `/Users/rotech/AIOPS`, but direct cwd inspection shows `/Users/rotech/OCULOPS-OS/AIOPS` for the affected live processes.

**INFERENCE**
- Runtime ownership must be derived from `pm_exec_path` plus live process cwd plus health checks, not from static config or stale PM2 environment variables alone.

**RISK**
- Terminal 1 can misclassify callers and Terminal 3 can misclassify exposure if they trust declaration files or stale PM2 environment values without live verification.

**REQUIRED ACTION**
- Treat `AGENCY_OS` as the canonical runtime code owner.
- Treat `/Users/rotech/OCULOPS-OS/AIOPS` as the current live launch workspace for the affected PM2 scripts until the runtime is relaunched from a single approved root.
- Treat `/Users/rotech/Downloads/rr` executables and undeclared PM2 names as non-core until they are explicitly adopted or removed.
