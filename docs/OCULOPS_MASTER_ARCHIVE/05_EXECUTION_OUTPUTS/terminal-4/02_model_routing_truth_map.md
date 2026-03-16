# Terminal 4 - Model Routing Truth Map

Generated: 2026-03-15

**FACT**
- `ollama list` on 2026-03-15 returned `nomic-embed-text:latest`, `qwen3:4b`, `deepseek-coder-v2:latest`, and `qwen3:8b`.
- `~/.openclaw/openclaw.json` binds `main`, `orchestrator`, `qa`, and `architect` to Google Gemini models, while `coder` is bound to local Ollama `deepseek-coder-v2`.
- `tail /Users/rotech/AGENCY_OS/LOGS/model_router.jsonl` showed both local T1 `qwen3:4b` and cloud T3 `gemini-2.0-flash` decisions on 2026-03-14 and 2026-03-15.
- `GET http://127.0.0.1:38791/api/memory/health` reported live local Qdrant memory with `all-MiniLM-L6-v2`.

## Routing Classification

| Surface | Evidence | Routing Class | Notes |
| --- | --- | --- | --- |
| `AGENCY_OS/RUNNERS/dashboard/memory_service.py` | Local embeddings via `all-MiniLM-L6-v2`, local Qdrant on `:6333` | `local-first` | Real memory store and recall path is fully local. |
| `AGENCY_OS/MCP/oculops-mcp-server/model-router.js` plus `/api/v1/ollama/generate` | Defaults to `qwen3:4b`, `qwen3:8b`, `deepseek-coder-v2`, escalates to Gemini, and can force `gpt-4o` | `hybrid` | This is the clearest live router and it is not uniformly local-first. |
| OpenClaw `main` agent | `~/.openclaw/openclaw.json` | `cloud-routed` | Bound to `google/gemini-2.0-flash`. |
| OpenClaw `orchestrator` agent | `~/.openclaw/openclaw.json` | `cloud-routed` | Bound to `google/gemini-2.0-flash`; this is the active ClawBot runtime persona. |
| OpenClaw `coder` agent | `~/.openclaw/openclaw.json` | `local-first` | Bound to `ollama/deepseek-coder-v2`. |
| OpenClaw `qa` agent | `~/.openclaw/openclaw.json` | `cloud-routed` | Bound to `google/gemini-2.0-flash`. |
| OpenClaw `architect` agent | `~/.openclaw/openclaw.json` | `cloud-routed` | Bound to `google/gemini-2.0-flash`. |
| `AGENCY_OS/AGENTS/langgraph-chains/lead_pipeline.py` | Local `qwen3` stages plus Gemini gate and outreach | `hybrid` | Scan, qualify, enrich, and score are local; CEO gate and outreach drafting are cloud. |
| `AGENCY_OS/AGENTS/langgraph-chains/content_pipeline.py` | Gemini market analysis plus local planner, writer, QA | `hybrid` | Local draft path exists, but planning still starts in cloud. |
| `AGENCY_OS/AGENTS/langgraph-chains/self_heal_pipeline.py` | Local monitor/test plus local DeepSeek diagnosis, Gemini fallback for complex issues | `local-first` | Local is primary, cloud is explicit fallback. |
| Agent Zero runtime | Live container and HTTP 200 on `:50080`, but no audited in-repo model pin | `missing` | Docs imply GPT-4o in places, but the effective provider config is not machine-proven in the audited repos. |
| `OCULOPS-OS` Supabase functions and checked-in n8n workflow JSON | `gpt-4o` and `gpt-4o-mini` hard-coded in multiple functions and workflow files | `cloud-routed` | The control plane still contains many direct cloud-model paths. |

**INFERENCE**
- OCULOPS has a real local model substrate, but the current operating posture is `hybrid`, not uniform `local-first`.
- The governor/persona layer remains mostly cloud-routed because the active OpenClaw director stack is Gemini-first.
- The strongest local-first surfaces today are memory, self-heal, and the local portions of the LangGraph chains.

**RISK**
- Any claim that the system already enforces local-first model policy end to end would be false.
- Because the active governor surface is still Gemini-first, governance and identity claims can drift away from the local-runtime story.
- Agent Zero remains especially risky because its runtime is live but its inference policy is not pinned in an audited, governed path.

**REQUIRED ACTION**
- Approve one explicit policy label for the current system: `hybrid with local-first preference`, not `local-first enforced`.
- Decide whether the target governor should stay Gemini-backed or be moved to a local Ollama model for core claims.
- Audit and reroute the `OCULOPS-OS` cloud-first Supabase and n8n model calls if the definitive plan expects runtime convergence.
- Pin Agent Zero's provider and approval path before it is allowed into core execution claims.
