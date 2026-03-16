# Terminal 2 - Permission Model for Runtime Entry Points

Audit window: 2026-03-15 18:23Z to 18:29Z

## Approved Endpoints for This Execution Cycle

| Purpose | Endpoint | Bind scope | Observed auth | Return path | Status |
| --- | --- | --- | --- | --- | --- |
| Gateway liveness | `GET http://127.0.0.1:38793/api/v1/health` | `0.0.0.0` | none | gateway self-response | Approved read-only |
| Dashboard health | `GET http://127.0.0.1:38791/health` | `0.0.0.0` | none | dashboard self-response | Approved read-only |
| Canonical readiness | `GET http://127.0.0.1:38791/api/readiness` | `0.0.0.0` | none | dashboard -> `/Users/rotech/AGENCY_OS/CONTEXT/ecosystem-readiness.latest.json` | Approved read-only |
| Public readiness mirror | `GET https://yxzdafptqtcvpsbqkmkm.supabase.co/storage/v1/object/public/oculops-runtime/ecosystem-readiness.latest.json` | public object storage | none | Supabase mirror of the local readiness file | Approved derived copy |
| Voice health | `GET http://127.0.0.1:38805/voice/health` | `0.0.0.0` | none | voice server self-response | Diagnostic only |
| Chains health | `GET http://127.0.0.1:38804/chain/status` | `0.0.0.0` | none | chains gateway self-response | Diagnostic only |

## Effective Permission Model Observed Live

| Entry family | Ingress | Intended model in code or docs | Observed live behavior | Downstream | Return path | Classification |
| --- | --- | --- | --- | --- | --- | --- |
| Gateway protected routes | `38793` | Token-gated except public paths | `GET /api/v1/readiness`, `GET /api/v1/pm2`, `GET /api/v1/registries`, `GET /api/v1/memory/health`, `GET /api/v1/governance/audit`, `GET /api/v1/chains/status`, and `GET /api/v1/analytics/flush` all returned `200` with no token and with an invalid token | dashboard, chains, PM2, gateway internals | JSON response | Unsafe |
| Gateway Siri route | `POST /api/v1/siri` on `38793` | Comment says separate shared secret | `POST {"command":"status"}` returned `200` with no token or secondary secret | dashboard, chains, `openclaw`, RAG scripts | direct JSON result | Unsafe public command surface |
| Gateway webhooks | `/webhook/*` on `38793` | public passthrough by design | no gateway auth by design | native `n8n` on `5680` | proxied workflow response | Unsafe public workflow ingress |
| Gateway voice routes | `POST /api/v1/voice/transcribe`, `POST /api/v1/voice/ask` | token except public transcribe path | transcribe path is public and handled locally; `voice/ask` returns `500` because `VOICE` is undefined | local Whisper or missing voice proxy | JSON or `500` | Unsafe and broken |
| Dashboard API | `38791` | not documented as public | open CORS, no auth on readiness, registries, governance, memory, jobs, logs, and v2 metrics | local files, Qdrant, OpenClaw logs, Ollama, Qdrant | JSON response | Unsafe internal-open surface |
| Integration Hub | `38792` | internal integration surface | open CORS, no auth, hardcoded provider tokens in code, mutating job submission endpoint | Telegram API, Ollama, local job files, n8n-viz, PM2 | JSON response | Unsafe high risk |
| Chains gateway | `38804` | internal execution surface | no auth observed on direct port | chain runners | JSON response | Unsafe internal-open surface |
| Voice server | `38805` | internal execution surface | no auth observed on direct port | Whisper local exec and gateway clawbot path | JSON response | Unsafe internal-open surface |
| Agent Zero | `50080` | not in governed path | direct web UI available | browser agent container | HTML UI | Unsafe non-core ingress |
| Qdrant | `6333`, `6334` | data plane | host-exposed on all interfaces, no runtime auth observed in Group 2 | vector DB | JSON API | Unsafe data ingress |
| Docker n8n | `5678` | duplicate automation runtime | host-exposed container, not canonical in current runtime lane | duplicate n8n UI and APIs | web UI and API | Unsafe duplicate |
| OMNICENTER | `40000`, `40001`, `40002` | undeclared | direct UI and websocket surfaces live outside Group 2 core declaration | OMNICENTER apps | HTML, websocket handshake, `404` | Unsafe undeclared ingress |

## Read and Write Paths

| Entry point | Permission model | Return path |
| --- | --- | --- |
| `GET /api/v1/readiness` | Effectively public | gateway -> dashboard `/api/readiness` -> local readiness file -> JSON |
| `POST /api/v1/governance/validate` | Effectively public | gateway -> dashboard validate -> `governance.enforce()` dry-run -> audit log append -> JSON |
| `POST /api/v1/memory/store` | Effectively public at gateway and dashboard | caller -> dashboard memory service -> Qdrant ack JSON |
| `POST /api/v1/chain/:name` | Effectively public if caller can reach gateway or direct chains port | caller -> chains gateway -> chain result JSON |
| `POST /api/integrations/jobs` | No auth on `38792` | caller -> integration hub -> write job JSON into `/Users/rotech/Downloads/rr/jobs/pending` -> submission JSON |
| `POST /api/integrations/telegram/send` | No auth on `38792` | caller -> Telegram API -> upstream API result JSON |
| `POST /voice/ask` | No auth on `38805` | caller -> Whisper -> gateway clawbot call -> OpenClaw CLI -> response JSON |

## Assessment

**FACT**
- The effective runtime model is "trust the network path" rather than "trust the caller identity."
- Most major HTTP services bind on `0.0.0.0` or Docker host ports, not `127.0.0.1`.
- The gateway auth middleware defined in source is not enforcing access on tested protected routes.

**INFERENCE**
- The current runtime behaves as a mesh of open local services with convenience proxies, not as a governed control plane with durable caller boundaries.

**RISK**
- Any LAN, tunnel, or local caller that reaches these ports can read state and, in multiple cases, trigger writes or external actions.

**REQUIRED ACTION**
- For the remaining terminals, treat only the approved read-only endpoints above as sanctioned.
- Do not treat gateway protected routes, integration-hub routes, OMNICENTER ports, or public tunnels as approved entry points.
