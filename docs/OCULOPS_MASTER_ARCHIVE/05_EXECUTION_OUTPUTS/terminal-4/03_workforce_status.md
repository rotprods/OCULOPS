# Terminal 4 - Workforce Status

Generated: 2026-03-15
Refreshed after Terminal 2 closure: 2026-03-15

**FACT**
- `GET http://127.0.0.1:38793/api/v1/pm2` returned 29 PM2 processes on 2026-03-15, including `openclaw-planner`, `rr-planner`, `op-learning-loop`, `op-telegram-bot`, `oculops-api-gateway`, `op-chains-gateway`, and multiple duplicate support processes.
- `GET http://127.0.0.1:38791/api/status` returned live OpenClaw session status for `main`, `orchestrator`, `coder`, and `qa`.
- `docker ps` and `curl http://127.0.0.1:50080/` confirmed that `ai-stack-agent-zero` is running and reachable on 2026-03-15.
- `/Users/rotech/AGENCY_OS/CONFIG/CLAWBOT_MASTER_OPERATING_SYSTEM.md` still marks Agent Zero integration as future (`/agent` not added yet).
- Terminal 2 has now published the formal runtime manifest and permission model. Those outputs confirm that protected gateway routes are effectively unauthenticated, several undeclared runtime surfaces are live, and runtime ownership is still split across `AGENCY_OS`, `/Users/rotech/OCULOPS-OS/AIOPS`, and out-of-tree `/Users/rotech/Downloads/rr`.

## Workforce Classification

| Workforce Surface | Live Evidence | Status | Notes |
| --- | --- | --- | --- |
| OpenClaw agent set (`main`, `orchestrator`, `coder`, `qa`, `architect`) | `~/.openclaw/openclaw.json`, dashboard `/api/status` | `partial` | Real multi-agent runtime exists, but the governor identity is split and most non-coder agents are still cloud-routed. |
| `openclaw-planner` | PM2 online, `openclaw_planner.py` dispatch loop | `partial` | It is the clearest active dispatcher, but it calls `openclaw` directly and is not fronted by a proven governed control-plane caller path. |
| `rr-planner` | PM2 online | `experimental` | Live process, but it is sourced from `/Users/rotech/Downloads/rr` and no audited core caller path or role boundary is proven in this pass. |
| `automejora-loop` / `automejora_loop` | PM2 online under duplicate naming | `experimental` | Self-improvement behavior is running, but naming duplication and governance boundaries are unresolved. |
| `op-learning-loop` | PM2 online | `experimental` | Real learning loop, but still peripheral to proven core execution. |
| `n8n` `OCULOPS CEO Chatbot v2` workflow | Present in workflow registry and CloudBot OS doc | `partial` | Real governor-adjacent channel surface, but it is separate from the ClawBot or OpenClaw runtime. |
| `op-telegram-bot` | PM2 online | `experimental` | Messaging surface is alive, but it is not the approved singular governor entry point. |
| Agent Zero runtime | Docker up, HTTP 200 on `:50080` | `non-core` | Running and reachable, but there is still no machine-proven governed caller path that makes it safe to include in core claims. |

**INFERENCE**
- The workforce is real and operating, but it is split across at least three different control shapes:
  - OpenClaw agents and planner
  - workflow-based Telegram or CloudBot-adjacent surfaces
  - direct Agent Zero runtime access
- The system has enough live workforce infrastructure to execute work today, but not enough caller-path discipline to present it as one converged workforce model.

**RISK**
- Direct or duplicate entry points can bypass governance or create contradictory audit trails.
- Agent Zero's presence as a live browser or runtime surface creates a false impression that it is already part of the governed core path.
- Duplicate PM2 names and overlapping workforce processes make ownership and restart behavior harder to reason about.

**REQUIRED ACTION**
- Mark Agent Zero `non-core` until a governed caller path and permission model are enforced, not just documented.
- Choose one approved workforce entry path for core claims:
  - gateway-mediated ClawBot or OpenClaw
  - workflow-mediated CloudBot
  - or a newly unified governor surface
- Dedupe PM2 process naming and remove ambiguous parallel workforce daemons before the definitive plan begins.
- Use Terminal 1's caller inventory plus Terminal 2's runtime boundary to decide which workforce surfaces are allowed to graduate from `partial` or `experimental` toward `core`.
