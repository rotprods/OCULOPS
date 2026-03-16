# Governor Reroute List

Updated: 2026-03-15
Owner: Terminal 1

## P0

### 1. Messaging UI live send

**FACT**
- The Messaging module stages a draft and then calls `messaging-dispatch` directly from the frontend (`/Users/rotech/OCULOPS-OS/src/components/modules/Messaging.jsx:176-186`; `/Users/rotech/OCULOPS-OS/src/hooks/useConversations.js:117-139`).
- `messaging-dispatch` defaults missing metadata to `risk=high` and `source=manual`, then blocks high-risk legacy calls that lack control-plane + tool-bus evidence (`/Users/rotech/OCULOPS-OS/supabase/functions/messaging-dispatch/index.ts:37-65,352-396`).

**INFERENCE**
- The governor-safe path already exists, but the main operator-facing send button is not using it.

**RISK**
- The canonical Messaging UI can fail or drift into fallback deep-links instead of governed sends.

**REQUIRED ACTION**
- Replace the direct UI call with `control-plane` `tool_dispatch` -> `messaging-dispatch`, or route the live-send action through `agent-outreach`.

### 2. Browser runtime health probes

**FACT**
- `useReadiness` probes `http://127.0.0.1:38791/health` from browser code (`/Users/rotech/OCULOPS-OS/src/hooks/useReadiness.js:12-18`).
- `CommandCenter` probes runtime services from browser code using localhost defaults (`/Users/rotech/OCULOPS-OS/src/components/modules/CommandCenter.jsx:143-159`; `/Users/rotech/OCULOPS-OS/src/data/n8nAirdropIntel.js:56-80`).
- Terminal 2 approved `http://127.0.0.1:38793/api/v1/health`, `http://127.0.0.1:38791/health`, `http://127.0.0.1:38791/api/readiness`, and the public readiness mirror, while marking Docker `n8n :5678` and `127.0.0.1:5679` as non-canonical (`/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/_shared/HANDOFFS.md:64-97`).
- Terminal 3 confirmed native `n8n :5680` behind gateway `:38793` as the real workflow target (`/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/_shared/HANDOFFS.md:112-117`).

**INFERENCE**
- Product readiness still depends on workstation-local reachability rather than a single control-plane truth source.

**RISK**
- Remote sessions, Vercel sessions, and operator sessions can disagree on runtime truth.

**REQUIRED ACTION**
- Replace browser localhost probes with an edge-backed readiness view sourced from `http://127.0.0.1:38791/api/readiness` or the approved mirror. Keep `http://127.0.0.1:38793/api/v1/health` as gateway liveness only, and remove `5678` / `5679` assumptions from the product surface.

## P1

### 3. TouchDesigner command execution

**FACT**
- `td-command` invokes `agent-${codeName}` directly with the service role key (`/Users/rotech/OCULOPS-OS/supabase/functions/td-command/index.ts:81-99`).

**INFERENCE**
- TouchDesigner command execution bypasses the governor envelope even though the runtime bridge is part of the intended control plane.

**RISK**
- Runtime-originated commands can skip the same policy and trace model expected for product-originated actions.

**REQUIRED ACTION**
- Route `td-command` through `control-plane` or a governor-owned agent launcher. Dependency: Terminal 2 runtime entrypoint confirmation and Terminal 4 governor identity.

### 4. GTM and Herald direct agent entrypoints

**FACT**
- GTM calls `agent-cortex` directly using the anon key (`/Users/rotech/OCULOPS-OS/src/components/modules/GTM.jsx:115-126`).
- Herald UI calls `agent-herald` directly and that agent can send Telegram and query external feeds (`/Users/rotech/OCULOPS-OS/src/components/modules/HeraldAgent.jsx:43-51`; `/Users/rotech/OCULOPS-OS/supabase/functions/agent-herald/index.ts:114-179`).

**INFERENCE**
- Two privileged operator actions still skip a single governor-owned launcher.

**RISK**
- Privileged agent actions stay scattered across direct edges, making policy and audit inconsistent.

**REQUIRED ACTION**
- Reroute both surfaces through a governor-owned agent launcher. Dependency: Terminal 4 governor identity recommendation.

### 5. UI connector execution

**FACT**
- The connector UI calls `api-proxy` directly (`/Users/rotech/OCULOPS-OS/src/hooks/useConnectorProxy.js:57-87`).
- `api-proxy` only requires tool-bus evidence for calls that arrive as explicitly high risk (`/Users/rotech/OCULOPS-OS/supabase/functions/api-proxy/index.ts:72-97,502-537`).

**INFERENCE**
- Read-only connector calls are fine, but the product has no guarantee that write-capable connector execution enters through the governor.

**RISK**
- Sensitive connector execution can bypass policy simply because the caller never labeled it as high risk.

**REQUIRED ACTION**
- Route all write-capable or credential-sensitive connector calls through `control-plane`. Keep direct `api-proxy` only for low-risk read and health actions.

## P2

### 6. Direct n8n workflow launch

**FACT**
- `launch_n8n` posts directly to the resolved webhook target inside automation execution (`/Users/rotech/OCULOPS-OS/supabase/functions/_shared/automation.ts:896-940`).
- Terminal 3 confirmed native `n8n :5680` behind gateway `:38793` as the real workflow target and published the retained caller-facing workflow surfaces (`/Users/rotech/OCULOPS_MASTER/05_EXECUTION_OUTPUTS/_shared/HANDOFFS.md:112-117`).

**INFERENCE**
- Workflow execution still keeps a parallel direct runtime path outside the governor envelope.

**RISK**
- Workflow triggers can drift from the same control-plane trace, naming, and runtime normalization expected for privileged sends.

**REQUIRED ACTION**
- Keep Terminal 3's retained workflow surfaces as the current truth and plan a governor-owned workflow launcher if `launch_n8n` remains part of the privileged control plane.

### 7. Consolidate agent launch surfaces

**FACT**
- The product directly launches `agent-runner`, `agent-copilot`, `agent-studies`, `agent-forge`, `agent-outreach`, `agent-cortex`, and `agent-herald` from multiple UI surfaces (`/Users/rotech/OCULOPS-OS/src/hooks/useAgentVault.js:103-123`; `/Users/rotech/OCULOPS-OS/src/components/ui/CopilotPanel.jsx:24-63`; `/Users/rotech/OCULOPS-OS/src/hooks/useAgentStudies.js:13-31`; `/Users/rotech/OCULOPS-OS/src/hooks/useGenerativeMedia.js:10-66`; `/Users/rotech/OCULOPS-OS/src/hooks/useOutreachQueue.js:51-67`; `/Users/rotech/OCULOPS-OS/src/components/modules/GTM.jsx:115-126`; `/Users/rotech/OCULOPS-OS/src/components/modules/HeraldAgent.jsx:43-51`).

**INFERENCE**
- The repo has a partial governor and a partial agent-launch fabric, but not a singular default launcher.

**RISK**
- Identity, approval, and model-routing rules can differ by which UI button was used.

**REQUIRED ACTION**
- Collapse product-surface agent launches to one governor-owned launcher after Terminal 4 defines the canonical governor identity.

### 8. Model-provider routing

**FACT**
- General-purpose edges and shared agent libraries still call OpenAI directly (`/Users/rotech/OCULOPS-OS/supabase/functions/ai-advisor/index.ts:191-205`; `/Users/rotech/OCULOPS-OS/supabase/functions/knowledge-embed/index.ts:27-40`; `/Users/rotech/OCULOPS-OS/supabase/functions/_shared/agent-brain-v2.ts:65,194`).

**INFERENCE**
- Uniform model policy enforcement is still unresolved inside the product-side control plane.

**RISK**
- Local-first, provider selection, cost control, and audit behavior can drift between edges.

**REQUIRED ACTION**
- Hand off to Terminal 4 for a single model/governor routing policy and a migration plan for direct model callers.

## P3

### 9. Deep-link provider fallbacks

**FACT**
- Messaging and automation can open Gmail, WhatsApp, LinkedIn, and Instagram URLs directly from browser state (`/Users/rotech/OCULOPS-OS/src/lib/outreach.js:36-112`; `/Users/rotech/OCULOPS-OS/src/components/modules/Messaging.jsx:157-170`; `/Users/rotech/OCULOPS-OS/src/components/modules/Automation.jsx:159-163`).

**INFERENCE**
- These are operator convenience paths, not governed provider execution.

**RISK**
- They blur the line between manual fallback and canonical outbound execution.

**REQUIRED ACTION**
- Keep them only as explicit manual fallback or remove them from core workflow surfaces; do not treat them as part of the governor path.
