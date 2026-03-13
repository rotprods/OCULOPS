## Prompt para Agent 1 (Claude) — UI/Operator Layer

Contexto:
- Revisa primero `task.md` (fuente de verdad de ownership).
- Agent 2 ya dejó operativo el backend de goal orchestration con nuevas acciones:
  - `orchestration-engine` -> `plan_goal`
  - `orchestration-engine` -> `execute_goal`
  - `orchestration-engine` -> `plan_and_execute_goal`
- Tu ownership es solo frontend/operator surfaces y e2e.

Reglas duras:
1. No editar `supabase/functions/**`
2. No editar `supabase/migrations/**`
3. No editar `registry/**` ni `contracts/**`
4. Si necesitas datos nuevos, adapta UI a contratos existentes o pide handshake.

Objetivo inmediato (AG1-P0 + AG1-P2):
1. Implementar superficie visual de trazabilidad de ejecución:
   - Estado de goals/runs/steps (running, waiting_approval, failed, completed)
   - Indicadores claros de “blocked/pending approval/failed delivery”
2. Añadir affordances de operador:
   - CTA para “inspeccionar run”
   - CTA para “abrir conversación”
   - CTA para “resolver aprobación”
3. Conectar módulos UI relevantes (Control Tower / Agents / Command Center / Messaging) sin romper diseño premium.
4. Preparar prueba E2E de happy path operador:
   - plan -> execute -> status visible
   - fallback manual para pasos no automatizables

Sugerencia de integración:
- Usa `src/hooks/**` existentes y crea hooks UI mínimos si hace falta.
- Mantén naming canónico de entidades (goal, goal_step, pipeline_run, correlation_id).
- Entrega con evidencias:
  - paths editados
  - flujo validado
  - gaps pendientes

Formato de handoff:
- “Done”
- “Pending”
- “Blocked”
- “Needs Agent 2”
