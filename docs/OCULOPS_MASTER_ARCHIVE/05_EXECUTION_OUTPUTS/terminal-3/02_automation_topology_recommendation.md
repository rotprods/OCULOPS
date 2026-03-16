# Terminal 3 - Automation Topology Recommendation

Evidence date: 2026-03-15

## Decision

- FACT: Native `n8n` on `:5680` is the only runtime used by the repo-synced webhook bridge, gateway proxy, readiness checks, and workflow registry.
- FACT: `api-gateway.js` is the ingress broker. Public `/webhook/*` calls land on `oculops-api-gateway :38793` and are proxied to native `n8n :5680`.
- FACT: Docker `n8n` on `:5678` is healthy but is backed by a separate data directory outside the canonical repo tree and carries its own `WEBHOOK_URL=http://localhost:5678`.
- INFERENCE: The real automation topology is already `gateway -> native n8n`, even though Docker `n8n` remains online.
- RISK: Treating native and Docker `n8n` as interchangeable would split workflow DBs, credentials, webhook registration, and operator intent.
- REQUIRED ACTION: Canonicalize native `n8n` as the automation runtime and downgrade Docker `n8n` to non-core.

## Recommended canonical topology

```text
External caller / control-plane / Telegram / Supabase reroute
  -> canonical public ingress
  -> oculops-api-gateway :38793
  -> /webhook/* proxy
  -> native n8n :5680
  -> workflow family
  -> Supabase / Telegram / Ollama / Gmail / readiness / Qdrant

Internal schedule triggers
  -> native n8n :5680
  -> HERALD / HUNTER / ORACLE / outreach families
```

- FACT: Native workflow state is the one inspected by `n8n-viz`, which reads `~/.n8n/database.sqlite`.
- FACT: `bridge-config.json`, `webhook_bridge_map.json`, and the validation suite all target native `n8n` on `:5680`.
- FACT: The Docker container is sourced from the N8N air-drop pack and not from `/Users/rotech/AGENCY_OS`.
- INFERENCE: Docker `n8n` is best interpreted as an import lab or legacy ai-stack surface, not the production workflow owner.
- RISK: Operators can edit the wrong UI because docs still point at both `:5678` and `:5680`.
- REQUIRED ACTION: Remove Docker `n8n` from core runbooks and stop publishing `:5678` as the OCULOPS workflow editor.

## Role assignment

| Component | Canonical role | Notes |
| --- | --- | --- |
| `oculops-api-gateway :38793` | Public ingress broker | Sole external broker for API routes and workflow webhooks |
| Native `n8n :5680` | Canonical workflow engine | Owns webhook bridge, scheduler, active workflow registry, and native DB |
| `n8n-viz :5679` | Derived observability | Reads native workflow DB only |
| Docker `n8n :5678` | Non-core sandbox | Separate external ai-stack runtime; do not treat as production owner |
| `webhook_bridge_map.json` | Canonical published workflow map | Must be reduced to retained core families only |

## Required convergence moves

- FACT: 44 workflows are active, but only a minority map to the named OCULOPS vertical slices.
- INFERENCE: Topology convergence requires both runtime convergence and workflow-scope reduction.
- RISK: If all 44 remain active, topology will stay technically centered on native `n8n` but operationally ambiguous.
- REQUIRED ACTION: Keep only retained workflow families active in the canonical runtime.
- REQUIRED ACTION: Stop or firewall Docker `n8n`, or move it to an isolated no-host-port sandbox.
- REQUIRED ACTION: Update all operator docs so `:5680` is the only workflow editor in core claims.
- REQUIRED ACTION: Remove any remaining automation claim that routes directly to Docker `n8n`.
