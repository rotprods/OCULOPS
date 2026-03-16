# Terminal 2 - Governance Enforcement Gap List

Audit window: 2026-03-15 18:23Z to 18:29Z

## Gap 1 - Gateway auth is ineffective in live runtime

**FACT**
- Source declares token middleware in `MCP/oculops-mcp-server/api-gateway.js:29-70`.
- Live calls to `GET /api/v1/readiness`, `GET /api/v1/pm2`, `GET /api/v1/registries`, `GET /api/v1/memory/health`, `GET /api/v1/governance/audit`, `GET /api/v1/chains/status`, and `GET /api/v1/analytics/flush` all returned `200` without `X-OCULOPS-TOKEN`.
- `GET /api/v1/pm2` also returned `200` with `X-OCULOPS-TOKEN: wrong-token`.

**INFERENCE**
- The live gateway is not enforcing caller authentication on the routes that are supposed to be protected.

**RISK**
- PM2 state, registries, memory health, governance audit data, and chain status are effectively public to any caller that reaches `38793` or a tunnel mapped to it.

**REQUIRED ACTION**
- Treat gateway auth as failed until revalidated after a code or process restart fix.

## Gap 2 - Governance exists as evaluation, not enforced execution

**FACT**
- The enforcement decorator is defined in `RUNNERS/dashboard/governance.py:147-161`.
- Repo search found no use of `@require_governance` outside `governance.py`.
- Dashboard runtime routes expose `validate`, `memory/store`, `memory/recall`, and other execution-adjacent endpoints directly in `RUNNERS/dashboard/dashboard_api.py:143-235`.

**INFERENCE**
- The runtime has a policy checker, but the main action routes are not consistently policy-gated in-path.

**RISK**
- A route can exist, mutate state, or call an external service without ever passing through a blocking governance decision.

**REQUIRED ACTION**
- Do not count validation-only endpoints as enforcement evidence. Re-audit any claimed gated action only after an execution path proves a `403` block on disallowed calls.

## Gap 3 - Unknown actions default to allow

**FACT**
- `RUNNERS/dashboard/governance.py:127-129` returns `ALLOWED (default supervised)` for any action not named in policy.

**INFERENCE**
- Governance is allow-by-default for undeclared actions.

**RISK**
- New or renamed actions can bypass explicit policy design simply by being absent from `policies.json`.

**REQUIRED ACTION**
- Reclassify unknown actions as deny-by-default before any production readiness claim.

## Gap 4 - Siri is public but has no second factor

**FACT**
- `MCP/oculops-mcp-server/api-gateway.js:33-39` comments that `/api/v1/siri` uses a separate shared secret.
- `MCP/oculops-mcp-server/api-gateway.js:337-396` implements the route, but no Siri-specific secret check exists.
- `POST /api/v1/siri` with `{"command":"status"}` returned `200` without a gateway token.

**INFERENCE**
- The Siri route is a public command surface with only obscurity as protection.

**RISK**
- Any reachable caller can trigger status, RAG, ClawBot, lead, content, or heal flows through the Siri endpoint.

**REQUIRED ACTION**
- Mark Siri as unsafe until it enforces an actual shared secret or caller identity check.

## Gap 5 - Dry-run validation pollutes the audit trail

**FACT**
- `validate_action()` calls `enforce()` in `RUNNERS/dashboard/governance.py:165-167`.
- `enforce()` logs every decision via `_log_decision()` in `RUNNERS/dashboard/governance.py:67-83` and `133-142`.

**INFERENCE**
- The audit log mixes policy lookups with real execution-path decisions.

**RISK**
- Governance audit entries cannot be treated as proof that an action actually reached an execution boundary.

**REQUIRED ACTION**
- Split dry-run validation logs from execution enforcement logs before claiming append-only operational governance evidence.

## Gap 6 - Dashboard API is unauthenticated and can write memory

**FACT**
- `RUNNERS/dashboard/dashboard_api.py:12-13` enables open CORS with no auth middleware.
- `RUNNERS/dashboard/dashboard_api.py:203-229` exposes direct memory store and recall routes.
- `POST http://127.0.0.1:38791/api/memory/store` returned `200` during the audit.

**INFERENCE**
- The dashboard API is an open internal write surface, not just a read-only observability layer.

**RISK**
- Any reachable caller can alter Qdrant-backed memory and influence downstream recall or analytics.

**REQUIRED ACTION**
- Downgrade dashboard API from "safe observability" to "unsafe internal write surface" until caller controls exist.

## Gap 7 - Hardcoded tokens and secrets are embedded in runtime code

**FACT**
- `RUNNERS/dashboard/dashboard_api.py:121-139` embeds an `n8n` API key.
- `RUNNERS/dashboard/integration_hub.py:20-24` embeds a Telegram bot token and OpenClaw token.
- `MCP/oculops-mcp-server/api-gateway.js:30` embeds a default gateway token fallback, and `:79-83` embeds a PostHog key.

**INFERENCE**
- Secret material is living in executable runtime code instead of a controlled secret boundary.

**RISK**
- Any code leak, file read, or accidental surface expansion exposes privileged tokens directly.

**REQUIRED ACTION**
- Treat secret placement as a governance defect, not just an ops hygiene issue.

## Gap 8 - Integration Hub exposes mutating and external-action routes with no auth

**FACT**
- `RUNNERS/dashboard/integration_hub.py:12` enables open CORS.
- `RUNNERS/dashboard/integration_hub.py:87-104` exposes Telegram send.
- `RUNNERS/dashboard/integration_hub.py:258-285` writes job files into `/Users/rotech/Downloads/rr/jobs/pending`.
- No auth middleware exists on the service.

**INFERENCE**
- The integration hub is a direct action surface, not a passive health endpoint.

**RISK**
- A caller that reaches `38792` can trigger outbound messages or enqueue work without a governance decision.

**REQUIRED ACTION**
- Keep `38792` out of approved core entry points and treat its write paths as unsafe.

## Gap 9 - Voice path in the gateway is broken and internally inconsistent

**FACT**
- `MCP/oculops-mcp-server/api-gateway.js:257-284` defines a local `voice/transcribe` route.
- `MCP/oculops-mcp-server/api-gateway.js:306-320` defines a second `voice/transcribe` route and a `voice/ask` proxy using `VOICE`, but no `VOICE` constant exists in the file.
- `POST /api/v1/voice/ask` returned `500` with `{"error":"VOICE is not defined"}`.

**INFERENCE**
- Voice ingress is not a single governed path; it is partly duplicated and partly broken.

**RISK**
- Runtime callers cannot rely on voice behavior, and broken proxy logic makes it harder to prove or enforce permissions consistently.

**REQUIRED ACTION**
- Remove duplicate handlers and validate the voice path end-to-end before it is used as a core surface.
