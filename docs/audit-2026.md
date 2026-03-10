# OCULOPS OS — Audit 2026
## Gap Analysis: Estado Actual vs Vision SaaS
> Generado: 2026-03-07 | Intervencion 1 de 50

---

## RESUMEN EJECUTIVO

| Categoria | Estado | Gap |
|-----------|--------|-----|
| Modulos funcionales | 7/23 COMPLETOS, 6 PARCIALES, 10 SHELLS | -16 modulos sin funcionalidad real |
| Design system | Gold/#0B0D0F — requiere rebrand a #FFD700/#000000 + renaming de tokens | Tokens naming inconsistente con spec |
| State management | 1 store monolitico (useAppStore.js) | -6 stores especializados |
| n8n workflows | 21 archivos — estado funcional desconocido sin n8n conectado | Necesita auditoria con n8n live |
| Supabase schema | 2 migraciones, schema personal | Sin multi-tenancy, sin org management |
| Edge Functions | 7 funciones existentes | Faltan: herald-agent, semantic-search |
| Auth | Existe DEV_MODE + Supabase Auth | Sin proteccion de rutas por plan/org |
| SaaS features | Ninguna | Billing, onboarding, multi-tenant: 0% |

---

## MODULOS — TABLA DE ESTADO

| Modulo | Lineas | Funcionalidad | Datos | UX | Estado | Prioridad SaaS |
|--------|--------|--------------|-------|-----|--------|----------------|
| ControlTower.jsx | 311 | 8 | 8 | 8 | COMPLETO | P0 — rebrand |
| Agents.jsx | 280 | 7 | 6 | 7 | COMPLETO | P0 — reescritura |
| ProspectorHub.jsx | >300 | 7 | 7 | 7 | COMPLETO | P0 — refactor |
| StudyHub.jsx | >200 | 6 | 5 | 6 | COMPLETO | P2 — no en vision SaaS core |
| WorldMonitor.jsx | >200 | 6 | 5 | 6 | COMPLETO | P2 |
| GTM.jsx | 246 | 6 | 3 | 5 | COMPLETO | P1 |
| HeraldAgent.jsx | 294 | 6 | 5 | 6 | COMPLETO | P1 — integrar con briefing |
| CRM.jsx | 308 | 5 | 4 | 4 | PARCIAL | P0 — reescritura completa |
| Messaging.jsx | 188 | 4 | 3 | 4 | PARCIAL | P0 |
| Pipeline.jsx | 178 | 4 | 4 | 3 | PARCIAL | P0 |
| Automation.jsx | 173 | 4 | 2 | 4 | PARCIAL | P1 |
| Intelligence.jsx | 166 | 4 | 3 | 3 | PARCIAL | P0 |
| Execution.jsx | 126 | 3 | 3 | 3 | PARCIAL | P1 |
| Experiments.jsx | 108 | 2 | 2 | 2 | SHELL | P1 |
| Opportunities.jsx | 104 | 2 | 2 | 2 | SHELL | P1 |
| Knowledge.jsx | 103 | 2 | 2 | 2 | SHELL | P1 |
| Finance.jsx | 100 | 2 | 2 | 2 | SHELL | P1 |
| Niches.jsx | 91 | 2 | 2 | 2 | SHELL | P1 |
| Decisions.jsx | 94 | 2 | 2 | 2 | SHELL | P2 |
| Portfolio.jsx | ? | 1 | 1 | 1 | SHELL | P1 |
| Simulation.jsx | ? | 1 | 1 | 1 | SHELL | P2 |
| Watchtower.jsx | ? | 1 | 1 | 1 | SHELL | P1 |
| Placeholder.jsx | 52 | 0 | 0 | 0 | UTIL | — |
| Prospector.jsx | ? | ? | ? | ? | LEGACY? | Verificar duplicado |

**Scores: 0-10 | Estado: COMPLETO (7-10) / PARCIAL (4-6) / SHELL (0-3)**

### Modulos FALTANTES para vision SaaS (no existen)
| Modulo | Prioridad |
|--------|-----------|
| CreativeStudio.jsx | P0 — Intervencion 34 |
| Settings.jsx | P0 — Intervencion 42 |
| Billing.jsx | P1 — Intervencion 44 |
| Reports.jsx | P1 — Intervencion 39 |
| Analytics.jsx | P2 — Intervencion 48 |
| Login.jsx | P0 — ya existe Auth.jsx, verificar |

---

## DESIGN SYSTEM — GAPS

### Tokens actuales vs spec nueva

| Token actual | Valor actual | Token nuevo | Valor nuevo | Delta |
|-------------|-------------|-------------|-------------|-------|
| `--accent-primary` | `#FFD60A` | `--color-primary` | `#FFD700` | Naming + color subtil |
| `--bg-primary` | `#0B0D0F` | `--color-bg` | `#000000` | Naming + negro puro |
| `--bg-secondary` | `#111317` | `--color-bg-2` | `#0D0D0D` | Naming + mas oscuro |
| `--bg-card` | `#161920` | `--color-bg-3` | `#1A1A1A` | Naming + diferente |
| `--border-default` | `rgba(255,255,255,0.07)` | `--color-border` | `#2A2A2A` | Naming + solido |
| `--text-primary` | `#F5F5F7` | `--color-text` | `#FFFFFF` | Naming + blanco puro |
| `--text-secondary` | `#8E8E93` | `--color-text-2` | `#A0A0A0` | Naming + mas claro |
| `--danger` | `#FF453A` | `--color-danger` | `#FF3B30` | Naming + sutil |
| `--success` | `#34C759` | `--color-success` | `#34C759` | Solo naming |
| `--info` | `#5AC8FA` | `--color-info` | `#007AFF` | Naming + cambio a azul |

**Elementos a eliminar del design system actual**: glass effects (`--glass-*`), gradients mesh (`--gradient-mesh`), 3D perspective (`--perspective-card`), shadows ambient complejos. La vision SaaS es bold/minimal, no glassmorphism.

### Inconsistencias visuales detectadas
- `global.css` usa clases `.card`, `.btn`, `.badge`, `.stat-card` — verificar que referencian tokens nuevos
- `animations.css` probablemente usa colores hardcoded o tokens viejos
- CLAUDE.md del proyecto aun referencia colores viejos (`#0a0e17`, `--accent-cyan`, `--accent-purple`) — DESACTUALIZADO

---

## STATE MANAGEMENT — GAPS

### Stores existentes
- `useAppStore.js` — UNICO store: sidebar state, theme. Zustand + persist

### Stores necesarios (ninguno existe aun)
| Store | Datos que gestiona | Hook Supabase correspondiente |
|-------|-------------------|-------------------------------|
| `useLeadStore.js` | leads[], filtros, seleccion | useLeads.js |
| `usePipelineStore.js` | deals[], etapas, forecast | useDeals.js |
| `useSignalStore.js` | signals[], filtros urgencia | useSignals.js |
| `useTaskStore.js` | tasks[], prioridades, asignados | useTasks.js |
| `useFinanceStore.js` | entries[], metricas, meses | useFinance.js |
| `useKnowledgeStore.js` | entries[], busqueda | useKnowledge.js |
| `useAgentStore.js` | agents[], status, runs, health | useAgents.js |

---

## N8N WORKFLOWS — INVENTARIO

| Workflow | Prioridad SaaS |
|----------|----------------|
| atlas-hunter-pipeline.json | P0 — core prospecting |
| speed-to-lead.json | P0 — <60s response |
| chatbot-lead-qualifier.json | P1 — BANT automation |
| email-outreach-weekly.json | P0 — outreach |
| herald-daily-briefing.json | P1 — briefing diario |
| maps-lead-prospector.json | P0 — Google Maps |
| competitor-monitor.json | P1 — Watchtower |
| social-content-factory.json | P1 — content |
| ad-campaign-optimizer.json | P1 — Meta Ads |
| weekly-business-report.json | P1 — reporting |
| oracle-scribe-daily.json | P1 — analytics |
| forge-content-webhook.json | P1 — content |
| cortex-orchestration.json | P0 — orchestrator |
| hunter-daily-autopilot.json | P0 — lead capture |
| crm-deal-nurture.json | P1 — nurture |
| niche-discovery.json | P1 — Niches module |
| master-full-cycle.json | P0 — full automation |
| pipeline-health-alerts.json | P1 — Pipeline module |
| outreach-gmail-sender.json | P0 — email send |
| strategist-webhook.json | P1 — GTM module |
| weekly-email-report.json | P1 — reports |

**NOTA**: 21 workflows encontrados (plan estimaba 17). Necesita auditoria con n8n conectado para verificar cuales son funcionales vs templates.

---

## SUPABASE — ESTADO

### Migraciones
- `001_initial_schema.sql` — schema base (28 tablas segun CLAUDE.md)
- `002_add_user_id_to_conversations.sql` — parche
- `002_personal_tool_rls.sql` — RLS adicional

### Edge Functions existentes
| Funcion | Estado presumido |
|---------|-----------------|
| api-proxy | Funcional |
| daily-snapshot | Funcional |
| google-maps-search | Funcional |
| manychat-sync | Parcial |
| meta-business-discovery | Parcial |
| tiktok-business-search | Parcial |
| whatsapp-webhook | Parcial |

### Funciones FALTANTES para el plan
| Funcion | Intervencion |
|---------|-------------|
| herald-agent | 10 |
| semantic-search | 18 |
| linkedin-search | 33 |

### Schema gaps para vision SaaS
- Sin tabla `organizations` — multi-tenancy bloqueado
- Sin tabla `organization_members` — colaboradores bloqueados
- Sin tabla `ai_agents` + `agent_runs` — panel de agentes sin base de datos
- Sin tabla `creative_assets` — Creative Studio bloqueado
- Sin tabla `notifications` real — NotificationCenter sin persistencia
- Sin tabla `error_logs` — no hay audit trail
- Sin extension pgvector — Knowledge semantic search bloqueado
- RLS basado en `user_id` — necesita migrar a `org_id`

---

## HOOKS — ESTADO

25 hooks en `src/hooks/` — todos conectan con Supabase (buena base).

Hooks clave para los modulos prioritarios:
- `useLeads.js`, `useDeals.js`, `useContacts.js` — CRM + Pipeline
- `useSignals.js` — Intelligence
- `useTasks.js` — Execution
- `useFinance.js` — Finance
- `useKnowledge.js` — Knowledge
- `useAgents.js` — Agents module
- `useConversations.js` — Messaging
- `useAuth.js` — Auth (necesita signIn/signOut/OAuth completo)

---

## GAPS CRITICOS vs VISION SAAS

### P0 — Bloqueantes para el producto

1. **Design system tokens**: renaming completo + negro puro vs dark gray actual
2. **16 modulos shell/parciales**: el producto parece vacio al navegar
3. **Supabase schema**: sin org management, sin multi-tenancy, sin tablas IA
4. **CRM funcional**: modulo core del SaaS esta incompleto
5. **Auth flow**: DEV_MODE siempre activo — no hay login real en produccion

### P1 — Importantes para MVP

6. **7 stores especializados**: estado de agentes no centralizado
7. **Control Tower war room**: debe impactar en primer segundo
8. **Pipeline kanban**: sin drag-and-drop
9. **Notificaciones**: sin persistencia real en DB
10. **Settings module**: no existe — sin donde configurar API keys

### P2 — Post-MVP

11. **Billing / Stripe**: no existe
12. **Onboarding wizard**: no existe
13. **Mobile responsive**: no verificado
14. **Performance**: virtualizacion no implementada
15. **Creative Studio**: modulo completamente nuevo

---

## PLAN DE EJECUCION — ORDEN RECOMENDADO

Siguiendo el plan maestro de 50 intervenciones:

**FASE 1 — Foundation** (esta semana):
1. [DONE] Auditoria completa (este documento)
2. Rebrand design system — tokens.css + global.css
3. 7 stores Zustand especializados
4. Supabase migration 002_saas_schema.sql
5. UI component library (DataTable, KPICard, Badge, Modal, EmptyState)

**FASE 2 — Core** (semana 2):
6. Control Tower war room rediseno
7. CRM completo con AI scoring
8. Pipeline kanban con DnD
9. Agents panel con 7 agentes
10. Messaging Hub unificado

**FASE 3+**: Intelligence, Automation, Scale (ver plan maestro)

---

## ERRORES Y DEUDA TECNICA CONOCIDA

- `Prospector.jsx` parece duplicado de `ProspectorHub.jsx` — verificar y eliminar legacy
- CLAUDE.md del proyecto tiene informacion desactualizada (colores viejos, lista de modulos incorrecta)
- Dos archivos de migracion con numero `002` — posible conflicto de schema
- DEV_MODE hardcodeado como `true` — riesgo si se despliega sin `.env` correcto
- `StudyHub.jsx` no es parte de la vision SaaS — posible candidato a eliminar o P3
