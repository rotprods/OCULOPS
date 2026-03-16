# Terminal 3 - Deprecation List

Evidence date: 2026-03-15

## 1. Localtunnel core path

- FACT: `n8n-tunnel` publishes `https://oculopscortex.loca.lt` through `lt-runner.sh`.
- FACT: Public validation returned `503 Tunnel Unavailable`.
- FACT: PM2 logs show repeated `connection refused` errors and rotating alternate subdomains.
- INFERENCE: Localtunnel is not stable enough for core webhook ownership.
- RISK: Telegram and public webhook registrations will drift away from runtime truth.
- REQUIRED ACTION: Deprecate localtunnel from core claims and remove it after a named Cloudflare tunnel is live.

## 2. Cloudflare quick tunnel

- FACT: `cf-quick-tunnel` is running `cloudflared tunnel --url http://localhost:38793 --no-autoupdate`.
- FACT: The currently written `trycloudflare.com` hostname failed DNS resolution during verification.
- FACT: PM2 logs show repeated `control stream encountered a failure while serving`.
- INFERENCE: Quick tunnels are useful for ad-hoc debugging, not for canonical external exposure.
- RISK: The repo can claim a Cloudflare path exists while callers still cannot resolve it.
- REQUIRED ACTION: Deprecate quick tunnels from core and replace them with one authenticated named tunnel.

## 3. Secondary MCP localtunnel

- FACT: `op-mcp-tunnel` publishes `https://oculopsmcp.loca.lt` to the same gateway on `:38793`.
- FACT: Public validation returned `408`.
- INFERENCE: This is a duplicate public ingress path to the same service plane.
- RISK: Duplicate domains make caller ownership, auth policy, and incident response harder.
- REQUIRED ACTION: Deprecate `oculopsmcp.loca.lt` unless a separately authenticated MCP exposure path is intentionally designed and approved.

## 4. Docker n8n as a live host-facing runtime

- FACT: `ai-stack-n8n` is healthy on host port `:5678`.
- FACT: Its compose project and data directory live outside the canonical repo tree.
- FACT: Repo docs simultaneously call Docker `n8n` `online`, `created`, and `obsolete`.
- INFERENCE: Docker `n8n` is a duplicate workflow engine, not a second canonical owner.
- RISK: Operators can edit the wrong runtime and misread which workflows are authoritative.
- REQUIRED ACTION: Deprecate Docker `n8n` from live host-facing core claims; stop it or isolate it behind a sandbox-only path.

## 5. Public n8n editor claim

- FACT: `n8n-start.sh` sets `N8N_EDITOR_BASE_URL` to the public localtunnel URL.
- FACT: The gateway only proxies `/webhook/*`, not the editor UI.
- INFERENCE: The repo still carries a public-editor assumption that is not aligned with the real ingress broker.
- RISK: Future operators may unintentionally expose admin surfaces while trying to "fix" the broken public editor path.
- REQUIRED ACTION: Deprecate the public editor claim and keep the editor LAN-only or VPN-only.

## 6. Auto-mutating tunnel sync

- FACT: `tunnel_sync.sh` rewrites `n8n-start.sh`, restarts `n8n`, reactivates a chatbot workflow, and updates Supabase secrets.
- FACT: This script is built around volatile localtunnel and quick-tunnel URLs.
- INFERENCE: It is compensating for non-canonical ingress rather than stabilizing it.
- RISK: Runtime configuration, webhook registration, and cloud secrets all change as a side effect of tunnel churn.
- REQUIRED ACTION: Deprecate tunnel-driven config mutation once a static named domain exists.

## 7. False-green tunnel validation

- FACT: `ecosystem-readiness.latest.json` marks tunnel health from PM2 state, not public response.
- FACT: `provider-runtime-smoke.latest.json` proves only `127.0.0.1:38793`, not internet reachability.
- INFERENCE: Current validation accepts local broker health as if it were external exposure truth.
- RISK: Exposure incidents can remain invisible to dashboards and readiness gates.
- REQUIRED ACTION: Deprecate PM2-only tunnel health and replace it with a public ingress probe routed through the canonical domain.

## 8. Active imported workflows without named ownership

- FACT: 29 active workflows are tagged `community_connected` and 7 are `UNCLASSIFIED`.
- FACT: Many of them are still published on the same public webhook base.
- INFERENCE: The active runtime contains a workflow library plus production flows in one exposed estate.
- RISK: Unknown or non-core workflows can receive traffic through the same ingress path as retained business workflows.
- REQUIRED ACTION: Deprecate all imported or unclassified active workflows from the canonical estate unless they receive a named owner, caller, and retention decision.
