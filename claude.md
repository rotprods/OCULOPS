# ANTIGRAVITY OS — Project Brain
> Vision: SaaS de marketing con IA #1 del mundo | Palantir + McKinsey + Goldman Sachs + Unidad 8200
> Actualizado: 2026-03-07 | Plan Maestro 10.3 activo

---

## Vision y Mision

**ANTIGRAVITY OS** es el SaaS de marketing con IA mas avanzado del mercado:
- 6 agentes IA que buscan clientes solos, llenan el CRM y gestionan campanas
- War room de inteligencia: dashboard en tiempo real, senales de mercado, prospecting automatico
- Filosofia visual: sala de mandos de un general — no startup bonita, sino terminal Bloomberg para marketing

**Operador**: Roberto Ortega (CEO fundador)
**Stack**: React 19 + Vite 7 + Electron 35 + Supabase + Zustand 5 + React Router 7
**Package manager**: npm
**Deploy**: Electron app (desktop) + web deploy (Vercel futuro)

---

## Estado del Plan Maestro (50 Intervenciones)

| Fase | Interv. | Estado |
|------|---------|--------|
| 1 — Foundation | 1-10 | INT.1 DONE, 2-10 PENDING |
| 2 — Core Product | 11-20 | PENDING |
| 3 — Intelligence | 21-30 | PENDING |
| 4 — Automation | 31-40 | PENDING |
| 5 — Scale | 41-50 | PENDING |

**Intervencion 1 DONE**: `docs/audit-2026.md` generado — ver para gap analysis completo.


---

## Design System — SPEC BLOQUEADA v10.3

> FUENTE DE VERDAD: `src/styles/tokens.css`
> NO usar valores hardcoded — siempre `var(--nombre-token)`

### Tokens de color (nuevos nombres canonicos)
```css
--color-primary:  #FFD700   /* Gold — Jake el Perro / Stellar */
--color-bg:       #000000   /* Negro puro OLED */
--color-bg-2:     #0D0D0D   /* Superficie elevada */
--color-bg-3:     #1A1A1A   /* Cards / panels */
--color-border:   #2A2A2A   /* Bordes sutiles */
--color-text:     #FFFFFF   /* Texto principal */
--color-text-2:   #A0A0A0   /* Texto secundario */
--color-danger:   #FF3B30   /* Errores */
--color-success:  #34C759   /* Exito */
--color-info:     #007AFF   /* Informacion */
```

### Tipografia
- `Inter` — sans-serif principal
- `JetBrains Mono` — monospace

### Filosofia visual
- Bold, alto contraste, minimal
- NO glassmorphism, NO gradients decorativos, NO purple
- Cards: `box-shadow: 0 0 0 1px var(--color-border)` como patron base
- Active states: borde izquierdo `3px solid var(--color-primary)`

---

## Estructura de Archivos Clave

```
src/
├── App.jsx                    # 23 modulos lazy-loaded + React Router 7
├── styles/
│   ├── tokens.css             # FUENTE DE VERDAD del design system
│   ├── global.css             # Clases globales (.card, .btn, .badge, .stat-card)
│   └── animations.css
├── components/
│   ├── layout/Layout.jsx      # Sidebar 220px/60px collapsed
│   ├── modules/               # 23 modulos (ver tabla abajo)
│   └── ui/                    # Componentes primitivos (pendiente crear)
├── hooks/                     # 25 hooks Supabase (useLeads, useDeals, etc.)
├── stores/
│   ├── useAppStore.js         # Sidebar + theme — unico store activo
│   └── [6 stores pendientes]  # Ver seccion State Management
└── lib/supabase.js            # Cliente Supabase + CRUD + Realtime
electron/
├── main.js
└── preload.js
supabase/
├── migrations/
│   ├── 001_initial_schema.sql  # 28 tablas base
│   └── [002 saas_schema pendiente]
└── functions/                  # 7 Edge Functions existentes
n8n/                            # 21 workflows JSON
docs/
└── audit-2026.md              # Gap analysis completo (leer antes de empezar)
CONTEXT.md                     # Perfil de agencia (ICP, servicios, precios)
```

---

## Modulos — Estado Actual

| Modulo | Lineas | Estado | Prioridad |
|--------|--------|--------|-----------|
| ControlTower.jsx | 311 | COMPLETO — rebrand pendiente | P0 |
| Agents.jsx | 280 | COMPLETO — reescritura plan | P0 |
| ProspectorHub.jsx | >300 | COMPLETO — refactor plan | P0 |
| HeraldAgent.jsx | 294 | COMPLETO — integrar briefing | P1 |
| GTM.jsx | 246 | COMPLETO — datos reales pendiente | P1 |
| StudyHub.jsx | >200 | COMPLETO — fuera de vision SaaS core | P2 |
| WorldMonitor.jsx | >200 | COMPLETO — fuera de vision SaaS core | P2 |
| CRM.jsx | 308 | PARCIAL — reescritura completa | P0 |
| Messaging.jsx | 188 | PARCIAL | P0 |
| Pipeline.jsx | 178 | PARCIAL — sin DnD | P0 |
| Intelligence.jsx | 166 | PARCIAL | P0 |
| Automation.jsx | 173 | PARCIAL | P1 |
| Execution.jsx | 126 | PARCIAL | P1 |
| Experiments.jsx | 108 | SHELL | P1 |
| Opportunities.jsx | 104 | SHELL | P1 |
| Knowledge.jsx | 103 | SHELL | P1 |
| Finance.jsx | 100 | SHELL | P1 |
| Decisions.jsx | 94 | SHELL | P2 |
| Niches.jsx | 91 | SHELL | P1 |
| Portfolio.jsx | ? | SHELL | P1 |
| Watchtower.jsx | ? | SHELL | P1 |
| Simulation.jsx | ? | SHELL | P2 |
| Placeholder.jsx | 52 | UTIL | — |

**Modulos FALTANTES a crear**:
- `Settings.jsx` — P0
- `CreativeStudio.jsx` — P0
- `Reports.jsx` — P1
- `Billing.jsx` — P1
- `Analytics.jsx` — P2

---

## State Management

### Stores existentes
- `useAppStore.js` — sidebar collapsed, theme, notificaciones UI

### Stores a crear (Intervencion 4)
```
src/stores/
├── useLeadStore.js      # leads[], filtros, seleccion
├── usePipelineStore.js  # deals[], etapas, forecast
├── useSignalStore.js    # signals[], filtros, no-leidas
├── useTaskStore.js      # tasks[], prioridades, asignados
├── useFinanceStore.js   # entries[], metricas, meses
├── useKnowledgeStore.js # entries[], busqueda
├── useAgentStore.js     # agents[], status, runs, health
└── index.js             # barrel export
```

**Patron Zustand**:
```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useLeadStore = create(
  persist(
    (set, get) => ({
      leads: [],
      filters: { status: 'all', source: 'all' },
      addLead: (lead) => set((s) => ({ leads: [...s.leads, { ...lead, id: crypto.randomUUID() }] })),
      updateLead: (id, updates) => set((s) => ({
        leads: s.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      })),
      removeLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
    }),
    { name: 'antigravity-leads', version: 1 }
  )
)
```

---

## Navigation Structure

Rutas principales (React Router 7):
```
/control-tower   → ControlTower (war room)
/crm             → CRM
/prospector      → ProspectorHub
/intelligence    → Intelligence
/pipeline        → Pipeline
/agents          → Agents
/automation      → Automation
/messaging       → Messaging
/knowledge       → Knowledge
/finance         → Finance
/settings        → Settings (crear)
/billing         → Billing (crear)
```

Sidebar: 220px expanded / 60px collapsed — estado en localStorage via useAppStore.

---

## Supabase Schema

### Migraciones actuales
- `001_initial_schema.sql` — 28 tablas base (contacts, leads, deals, signals, tasks...)
- `002_add_user_id_to_conversations.sql` + `002_personal_tool_rls.sql` — parches

### Pendiente crear (Intervencion 8)
```sql
-- 002_saas_schema.sql
organizations, organization_members
ai_agents, agent_runs
creative_assets
campaigns_v2
notifications
error_logs
audit_log
```

### Edge Functions existentes
api-proxy, daily-snapshot, google-maps-search, manychat-sync,
meta-business-discovery, tiktok-business-search, whatsapp-webhook

### Edge Functions a crear
- `herald-agent` — Intervencion 10
- `semantic-search` — Intervencion 18 (requiere pgvector)

---

## 7 Agentes IA del Sistema

| Agente | Funcion | Workflow n8n |
|--------|---------|--------------|
| ATLAS | Prospecting automatico | atlas-hunter-pipeline.json |
| HUNTER | Lead capture diario | hunter-daily-autopilot.json |
| ORACLE | Analytics y reportes | oracle-scribe-daily.json |
| FORGE | Generacion de contenido | forge-content-webhook.json |
| SENTINEL | Monitoreo competidores | competitor-monitor.json |
| SCRIBE | Reportes semanales | weekly-business-report.json |
| CORTEX | Orquestador maestro | cortex-orchestration.json |

---

## Reglas de Trabajo

- UI en **espanol**, codigo en **ingles**
- Usar `var(--color-*)` de tokens.css — NUNCA colores hardcoded
- Fuentes: usar `var(--font-mono)` y `var(--font-sans)` — NUNCA strings hardcoded
- Clases de global.css primero, CSS local solo para layout especifico del modulo
- NO glassmorphism — estilo bold/minimal (war room, no startup)
- Hooks en `src/hooks/` — hooks existentes conectados a Supabase, usarlos
- Zustand: selectores narrowos SIEMPRE — `useStore(s => s.field)` no destructuring
- Computaciones derivadas en componentes: envolver en `useMemo`/`useCallback`
- Handlers que pasan a librerias externas (dnd-kit, etc): `useCallback` obligatorio
- `ControlTower.jsx` + `Agents.jsx` son los modulos de referencia de calidad
- Al terminar cada intervencion: actualizar este claude.md

---

## Comandos

```bash
npm run dev          # Vite dev server (puerto 5173)
npm run electron     # Electron + Vite
npm run build        # Build produccion
npx supabase start   # Supabase local
npx supabase db push # Aplicar migraciones
```

### Problema conocido: build falla con Node.js v24 + rollup 4.44+

**Sintoma**: `ERR_INVALID_PACKAGE_CONFIG` en `node_modules/rollup/package.json`
**Causa**: rollup 4.44+ usa exports ESM que Node.js v24 valida de forma mas estricta
**Fix**: usar `NODE_OPTIONS=--no-experimental-require-module npm run build`
**Alternativa**: hacer downgrade a Node.js v22 LTS via nvm (`nvm use 22`)
**Nota**: `npm run dev` puede tener el mismo problema — mismo fix aplica

---

## Contexto de Negocio

- Agencia IA Espana — servicios 1500-5000€/mes
- ICP: PYMEs 10-200 empleados, sectores: e-commerce, clinicas, inmobiliarias, SaaS B2B
- Integraciones: n8n, WhatsApp Cloud API, OpenAI, Anthropic, Meta Ads, Google Maps
- Fase actual: pre-revenue → 0-20k€/mes objetivo
- Ver `CONTEXT.md` para perfil completo

---

## Errores y Problemas Conocidos

- `Prospector.jsx` duplicado eliminado — `ProspectorHub.jsx` es el activo
- Dos archivos de migracion con numero `002` — sin conflicto real (usan timestamps)
- DEV_MODE corregido — ahora requiere `VITE_DEV_MODE=true` explicito en .env
- **Node.js v24 + rollup 4.44+**: build falla con `ERR_INVALID_PACKAGE_CONFIG` — fix: `NODE_OPTIONS=--no-experimental-require-module npm run build`
- **Bash background loops**: evitar encadenar muchos comandos Bash con timeout corto — se van a background y el output queda vacio. Usar Read tool para leer archivos en vez de `cat/grep`
- **Zustand store selectors**: SIEMPRE usar selectores narrowos `useStore(s => s.field)` NO destructuring — evita re-renders por campos no usados. Ej: `usePipelineStore(s => s.showClosedLost)` NO `const { showClosedLost } = usePipelineStore()`
- **`var(--color-X)22` pattern**: valido en CSS moderno (hex 8 digitos con alpha) — no es un bug
- **`--accent-secondary` faltaba** en tokens.css — ya añadido como alias de `var(--color-info)`
- **badge-accent no existe** — usar `badge-info` o `badge-neutral`. No crear `badge-accent`
- **Hardcoded fonts**: NUNCA `'JetBrains Mono, monospace'` inline — usar `var(--font-mono)`

---

## Backlog de Mejoras

- Agregar `@dnd-kit/core` para drag-and-drop en Pipeline y Execution (Intervencion 15)
- Agregar pgvector extension en Supabase para Knowledge semantic search (Intervencion 18)
- Agregar `@tanstack/virtual` para virtualizacion de listas (Intervencion 45)
- Stripe integration para billing (Intervencion 44)
- StudyHub.jsx — evaluar si mantener o eliminar (fuera de vision SaaS core)
