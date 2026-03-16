# Terminal 2 - Readiness Recommendation

Audit window: 2026-03-15 18:23Z to 18:29Z

## Recommendation

**FACT**
- `GET http://127.0.0.1:38793/api/v1/health` returned `200`.
- `GET http://127.0.0.1:38791/health` returned `200`.
- `GET http://127.0.0.1:38791/api/readiness` returned `200` and matched the live local file.
- The public Supabase mirror of readiness also returned `200`.
- Public tunnel health did not validate cleanly: `https://oculopscortex.loca.lt/api/v1/health` returned `503`, and the active `trycloudflare.com` hostname in `/tmp/cf_tunnel_url.txt` did not resolve.

**INFERENCE**
- The runtime is live enough for the other terminals to continue their audits, but not trustworthy enough to claim public or production readiness.

**RISK**
- A false-green readiness claim would hide broken public ingress, ineffective gateway auth, and probe logic that marks services healthy when only the socket is open.

**REQUIRED ACTION**
- Status for external or production readiness: `NO-GO`.
- Status for internal cross-terminal audit work using approved local endpoints: `GO`.

## Canonical Readiness Artifact Recommendation

**FACT**
- `SCRIPTS/readiness_watcher.py` writes `/Users/rotech/AGENCY_OS/CONTEXT/ecosystem-readiness.latest.json` every 30 seconds.
- `RUNNERS/dashboard/dashboard_api.py` serves `/api/readiness` directly from that file.
- `SCRIPTS/readiness_sync.sh` republishes the same file to Supabase.
- `DOCS/runbooks/ecosystem-readiness.latest.json` exists with a different schema and an older timestamp (`2026-03-15T00:54:08Z`).

**INFERENCE**
- The local file in `CONTEXT/` is the only machine-generated artifact that the live runtime actually depends on.

**RISK**
- Keeping both `CONTEXT/ecosystem-readiness.latest.json` and `DOCS/runbooks/ecosystem-readiness.latest.json` in active claims creates competing truths.

**REQUIRED ACTION**
- Canonical machine-readable readiness artifact: `/Users/rotech/AGENCY_OS/CONTEXT/ecosystem-readiness.latest.json`
- Canonical API projection: `GET http://127.0.0.1:38791/api/readiness`
- Canonical public derived copy: `https://yxzdafptqtcvpsbqkmkm.supabase.co/storage/v1/object/public/oculops-runtime/ecosystem-readiness.latest.json`
- Deprecate `DOCS/runbooks/ecosystem-readiness.latest.json` as a live readiness source.

## False-Green Findings

**FACT**
- `voice_server` is marked online by `readiness_watcher.py` using a raw TCP check, but `GET http://127.0.0.1:38805/health` returns `404`; the real health route is `/voice/health`.
- `cloudflare_tunnel` in the readiness file is actually a PM2 check for `n8n-tunnel`, which is a LocalTunnel process.
- `n8n-viz` is absent from the live readiness file, even though other docs and the validation matrix treat it as part of the runtime.
- `n8n-viz` works on `http://localhost:5679/` and `http://localhost:5679/api/stats`, but `http://127.0.0.1:5679/` and `http://127.0.0.1:5679/api/stats` return `404`.
- `CONFIG/node_registry.json` still says readiness is "7/7 services monitored" and lists an invalid `integration-hub` health path of `http://127.0.0.1:38792/health`.

**INFERENCE**
- Current readiness is operationally useful as a heartbeat, but not strong enough to serve as a release gate without probe fixes.

**RISK**
- Other terminals could inherit the wrong endpoint assumptions, especially around tunnels, `n8n-viz`, and voice health.

**REQUIRED ACTION**
- Do not use the current readiness file as a sole release gate.
- Pair it with live HTTP checks on approved endpoints until the probe set is corrected.

## Proceed / Hold Guidance for the Other Terminals

**FACT**
- Local approved endpoints are stable enough for dependency handoff.
- Public ingress and tunnel surfaces are unstable or unsafe.

**INFERENCE**
- The other terminals can proceed if they pin to local endpoints and treat tunnel-based or undeclared surfaces as non-core.

**RISK**
- If another lane assumes `loca.lt`, `trycloudflare.com`, `127.0.0.1:5679`, or OMNICENTER is canonical, it will encode the wrong topology.

**REQUIRED ACTION**
- Proceed with Terminal 1, 3, and 4 using only the shared approved endpoints in `_shared/HANDOFFS.md`.
