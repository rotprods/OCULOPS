# Terminal 3 - Exposure Path Recommendation

Status: closed for this audit cycle.

Evidence date: 2026-03-15

## Final exposure truth

**FACT**
- Three tunnel processes are active in PM2: `n8n-tunnel` (`lt-runner.sh`), `cf-quick-tunnel` (`cf-quick-tunnel.sh`), and `op-mcp-tunnel` (`lt-mcp-runner.sh`).
- All three live tunnel processes target the gateway on `:38793`, not native `n8n` directly.
- Local reachability is healthy for native `n8n :5680`, gateway `:38793`, and Docker `n8n :5678`.
- Public reachability is not healthy:
  - `https://oculopscortex.loca.lt/health` returned `503 Tunnel Unavailable`.
  - `https://oculopsmcp.loca.lt/api/v1/health` returned `408`.
  - The current `trycloudflare.com` hostname written to `/tmp/cf_tunnel_url.txt` failed DNS resolution during verification.
- Terminal 2's corrected manifest confirms the runtime owner split, the approved gateway owner on `:38793`, and the canonical readiness artifact at `/Users/rotech/AGENCY_OS/CONTEXT/ecosystem-readiness.latest.json` with API projection `http://127.0.0.1:38791/api/readiness`.
- `CONTEXT/ecosystem-readiness.latest.json` still reports `cloudflare_tunnel: online` because the readiness watcher checks PM2 process state, not public ingress health.
- `provider-runtime-smoke.latest.json` records `tunnel_url` as `http://127.0.0.1:38793`, so its pass condition does not prove public exposure.

**INFERENCE**
- Current public exposure claims are false green and cannot be treated as canonical.
- The gateway on `:38793` is the only justified ingress broker.
- Native `n8n :5680` is the canonical automation runtime. Docker `n8n :5678` is a non-core duplicate.

**RISK**
- Telegram, iOS, Supabase reroute, and any external caller can fail while local observability still reports `connected`.
- Localtunnel and Cloudflare quick tunnels create unstable webhook bases and ungoverned ingress drift.

**REQUIRED ACTION**
- Freeze public exposure as `NO-GO` for core execution until all of the following are true:
  - one named Cloudflare tunnel is adopted
  - owned DNS is attached
  - gateway auth is enforced on protected routes
  - public ingress health is included in readiness

## Canonical exposure path once public ingress is reopened

```text
Internet / external webhook caller / Telegram webhook / iOS Shortcut / Supabase reroute
  -> named Cloudflare tunnel with owned DNS
  -> oculops-api-gateway :38793
  -> one of:
     - /webhook/* -> native n8n :5680
     - /api/v1/*  -> gateway-owned API route
```

**FACT**
- `api-gateway.js` already implements the broker pattern by proxying `/webhook/*` to native `n8n :5680`.
- `OCULOPS_MAC_MINI_RUNTIME_MASTER.md` Phase 8 already points to the intended hardening target: authenticated `cloudflared tunnel run oculops-runtime` plus owned DNS `api.oculops.ai`.

**INFERENCE**
- A named Cloudflare tunnel in front of the gateway is the only exposure path that matches the repo's stated future state and avoids rotating webhook bases.

**RISK**
- Reopening public exposure before gateway auth and public ingress health checks are fixed will publish an ungoverned runtime surface.

**REQUIRED ACTION**
- Keep the gateway as the sole future public service.
- Do not expose raw `n8n`, Agent Zero, Qdrant, or dashboard ports to the internet.

## Exposure policy that should be retained now

**FACT**
- The gateway currently treats `/`, `/health`, `/api/v1/health`, `/api/v1/siri`, `/api/v1/voice/transcribe`, `/webhook/*`, and `/webhook-test/*` as public routes.
- Native `n8n :5680`, Docker `n8n :5678`, Agent Zero `:50080`, and Qdrant `:6333` are listening on host-facing interfaces.
- `n8n-start.sh` still sets `N8N_EDITOR_BASE_URL` to the public localtunnel URL even though the gateway only proxies webhook traffic, not the editor UI.

**INFERENCE**
- The public editor claim is misleading.
- The only justified external surface is the gateway broker, and even that surface is not yet safe for core internet exposure.

**RISK**
- If editor or raw service ports are later exposed without explicit policy, the system will publish admin and data surfaces that were never meant to be internet-facing.

**REQUIRED ACTION**
- Restrict non-gateway ports to LAN or loopback in the hardening phase.
- Remove any public editor assumptions from runtime config.

## Closure decision

**FACT**
- Group 3 is no longer blocked by missing runtime truth.
- The final audit-cycle position is:
  - canonical automation runtime: native `n8n :5680`
  - non-core duplicate automation runtime: Docker `n8n :5678`
  - canonical broker: `oculops-api-gateway :38793`
  - public ingress: `NO-GO`
  - deprecated from core: `n8n-tunnel`, `op-mcp-tunnel`, and `cf-quick-tunnel`

**REQUIRED ACTION**
- Carry this posture into the definitive implementation plan as a hard constraint, not a suggestion.
