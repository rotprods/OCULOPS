# OCULOPS — Claude Code Handoff

> **Role**: You (Claude Code) are the **Execution Agent** for this project.
> **OCULOPS** (Google Deepmind Assistant) is the **Architecture Agent**.
> The human is **Roberto Ortega**, CEO and sole operator.

## Project Overview

OCULOPS is Roberto's personal command center for running his AI automation agency.
The project has been restructured from static HTML/CSS/JS into **Vite + React + Electron**.
Supabase is the backend (PostgreSQL + Realtime + Edge Functions).

## Current State (What's Already Done)

> ⚠️ **DO NOT re-do these steps. They are complete.**

- ✅ Vite + React project initialized (`npm install` done, build passes)
- ✅ Electron `main.js` + `preload.js` created in `electron/`
- ✅ Design system migrated to `src/styles/tokens.css` + `src/styles/global.css`
- ✅ `src/App.jsx` with 18 routes + React Router
- ✅ `src/components/layout/Layout.jsx` + `Layout.css` (sidebar + header)
- ✅ `src/components/modules/ControlTower.jsx` + CSS (dashboard)
- ✅ `src/components/modules/Placeholder.jsx` (temp placeholder)
- ✅ `src/lib/supabase.js` (Supabase client + CRUD helpers + Realtime)
- ✅ `src/hooks/useLeads.js` (example hook pattern)
- ✅ Database schema: `supabase/migrations/001_initial_schema.sql` (28 tables)
- ✅ 6 Edge Functions in `supabase/functions/`
- ✅ Legacy files backed up in `legacy/`

## YOUR Priority Tasks (execute in order)

### Task 1: Migrate Legacy Modules to React Components

Convert each `legacy/js/*.js` module to a React component in `src/components/modules/`.

**Files to migrate** (12 modules):

1. `legacy/js/execution.js` → `src/components/modules/Execution.jsx`
2. `legacy/js/intelligence.js` → `src/components/modules/Intelligence.jsx`
3. `legacy/js/gtm.js` → `src/components/modules/GTM.jsx`
4. `legacy/js/pipeline.js` → `src/components/modules/Pipeline.jsx`
5. `legacy/js/niches.js` → `src/components/modules/Niches.jsx`
6. `legacy/js/portfolio.js` → `src/components/modules/Portfolio.jsx`
7. `legacy/js/experiments.js` → `src/components/modules/Experiments.jsx`
8. `legacy/js/opportunities.js` → `src/components/modules/Opportunities.jsx`
9. `legacy/js/watchtower.js` → `src/components/modules/Watchtower.jsx`
10. `legacy/js/decision-ops.js` → `src/components/modules/Decisions.jsx`
11. `legacy/js/knowledge.js` → `src/components/modules/Knowledge.jsx`
12. `legacy/js/finance.js` → `src/components/modules/Finance.jsx`

**Rules:**

- Read the legacy JS to understand the data structures and rendering logic
- Convert to functional React components with hooks
- Use the design tokens from `src/styles/tokens.css` (same CSS variables)
- Use the component classes from `src/styles/global.css` (.card, .btn, .badge, etc.)
- Create a CSS file alongside each component (e.g., `Execution.css`)
- Wire up in `src/App.jsx` — replace the Placeholder imports with real components
- For now, use Zustand stores with localStorage (Supabase migration comes later)

### Task 2: Create Zustand Stores

Create stores in `src/stores/` for state management:

```
src/stores/
├── useAppStore.js      # Global app state (sidebar, theme, etc.)
├── useLeadStore.js     # Leads/contacts
├── usePipelineStore.js # Pipeline stages + deals
├── useSignalStore.js   # Market signals
├── useTaskStore.js     # Execution tasks
├── useFinanceStore.js  # Finance entries
└── useKnowledgeStore.js # Knowledge vault
```

Use this pattern (with localStorage persistence for now):

```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useLeadStore = create(
  persist(
    (set, get) => ({
      leads: [],
      addLead: (lead) => set((s) => ({ leads: [...s.leads, { ...lead, id: crypto.randomUUID() }] })),
      updateLead: (id, updates) => set((s) => ({
        leads: s.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      })),
      removeLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
    }),
    { name: 'oculops-leads' }
  )
)
```

### Task 3: Create React Hooks for Data Domains

Create hooks in `src/hooks/` that wrap the stores and will later support Supabase:

```
src/hooks/
├── useLeads.js       (already exists — update to use store)
├── usePipeline.js
├── useSignals.js
├── useTasks.js
├── useFinance.js
├── useKnowledge.js
├── useDecisions.js
├── useExperiments.js
└── useOpportunities.js
```

### Task 4: Build New Module UI Shells

Create placeholder UI shells for the 4 new modules (CRM, Messaging, Prospector, Automation):

```
src/components/crm/CRM.jsx            # Contacts + companies + deals
src/components/messaging/Messaging.jsx  # Unified inbox
src/components/prospector/Prospector.jsx # Lead detection
src/components/automation/Automation.jsx # Workflow builder
```

## Design System (MUST PRESERVE)

- Dark theme: `#0a0e17` background
- Accent: `#00d2d3` (cyan), Secondary: `#5f27cd` (purple)
- Fonts: Inter (sans), JetBrains Mono (mono)
- All CSS variables in `src/styles/tokens.css`
- Component classes in `src/styles/global.css`

## Important Context

- Roberto runs an AI automation agency in Spain
- Target market: Spanish & European SMBs
- Language: UI in Spanish, code in English
- This is a PERSONAL tool, not SaaS — single user
- Design must be PREMIUM dark mode — no generic looks
- Read `CONTEXT.md` for full agency profile
