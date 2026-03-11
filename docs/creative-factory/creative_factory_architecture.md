# Creative Factory — Architecture Design
> OCULOPS | Agent 1: Creative Factory Architect
> Generated: 2026-03-11 | Status: DESIGN PROPOSAL — NOT YET IMPLEMENTED

---

## 1. Current Architecture (as-is)

```
┌─────────────────────────────────────────────────────────────────────┐
│  /creative  →  CreativeStudio.jsx  (276 lines, 1 file)              │
│                                                                     │
│  ┌──────────────────┐          ┌──────────────────────┐            │
│  │  MEDIA OPS       │          │  BRIEF DB            │            │
│  │  view='deploy'   │          │  view='briefs'       │            │
│  └────────┬─────────┘          └──────────┬───────────┘            │
│           │                               │                         │
│           ▼                               ▼                         │
│  useGenerativeMedia()           BRIEF_TEMPLATES[]                   │
│  (local state hook)             (hardcoded JS constant, 4 items)    │
│           │                               │                         │
│     ┌─────┴──────┐                BriefEditor modal                 │
│     │generateImg │                (clipboard-only export)           │
│     │generateVid │                                                   │
│     └──────┬─────┘                                                   │
│            │                                                         │
│   supabase.functions.invoke()                                        │
│     ├── 'banana-generate'  →  Nano Banana API  (mocked if no key)   │
│     └── 'veo-generate'     →  Veo 3 API        (mocked if no key)   │
│                                                                     │
│  gallery: useState([])  ←── IN-MEMORY ONLY. Resets every nav.      │
│                                                                     │
│  Integrations: ZERO                                                 │
│    campaigns: not connected                                         │
│    CRM:       not connected                                         │
│    agents:    not connected                                         │
│    copilot:   not connected                                         │
│    event bus: not connected                                         │
└─────────────────────────────────────────────────────────────────────┘

Adjacent systems (exist but disconnected from CreativeStudio)
─────────────────────────────────────────────────────────────
  agent-forge/index.ts
    → GPT-4o text generation (5 content types)
    → writes output to knowledge_entries table
    → runs agent-brain-v2 enrichment pass
    → NEVER called from any UI component

  HIGGSFIELD_API_KEY_ID + HIGGSFIELD_API_SECRET
    → set in Supabase secrets
    → zero edge functions reference them
    → completely orphaned

  campaigns table
    → fully operational with useCampaigns hook + realtime
    → has target_audience, goals JSONB, budget fields
    → zero link to creative assets
```

---

## 2. Target Architecture — Creative Factory (6 Layers)

```
╔═════════════════════════════════════════════════════════════════════╗
║  LAYER 1 — REQUEST (UI)                                             ║
║                                                                     ║
║  CreativeStudio.jsx  (rebuilt, 4 panels)                           ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ║
║  │  MEDIA OPS  │ │  FORGE OPS  │ │  BRIEF DB   │ │  ASSET      │ ║
║  │  img/video  │ │  copy/text  │ │  templates  │ │  VAULT      │ ║
║  │  generation │ │  via FORGE  │ │  from DB    │ │  persisted  │ ║
║  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ ║
╚═════════╪══════════════╪══════════════╪══════════════╪════════════╝
          │              │              │              │
╔═════════╪══════════════╪══════════════╪══════════════╪════════════╗
║  LAYER 2 — ROUTER (hooks)                                          ║
║          ▼              ▼              ▼              ▼            ║
║  useCreativeAssets  useForgeContent  useBriefs  useCreativeAssets  ║
║  (new)              (new)            (new)      (shared)           ║
╚═════════╪══════════════╪══════════════╪══════════════╪════════════╝
          │              │              │              │
╔═════════╪══════════════╪══════════════╪══════════════╪════════════╗
║  LAYER 3 — ADAPTERS (edge functions)                               ║
║          ▼              ▼              ▼              ▼            ║
║  creative-generate   agent-forge   Supabase DB   Supabase DB      ║
║  (new, unified)      (extend)      direct CRUD   direct CRUD      ║
║          │              │                                          ║
║   ┌──────┴──────┐       └──── knowledge_entries (existing)        ║
║   │  adapters   │             creative_assets   (new)             ║
║   ├─ banana     │                                                  ║
║   ├─ veo3       │                                                  ║
║   └─ higgsfield │  ← credentials exist, needs wrapper function    ║
║      (new fn)   │                                                  ║
╚═════════════════════════════════════════════════════════════════════╝
          │
╔═════════▼═══════════════════════════════════════════════════════════╗
║  LAYER 4 — JOBS (async queue)                                       ║
║                                                                     ║
║  creative_jobs table                                                ║
║    status: queued → processing → ready | failed                    ║
║    Supabase Realtime subscription → UI auto-refreshes              ║
║                                                                     ║
║  Job types                                                          ║
║    image_generate  → creative-generate fn → banana/higgsfield      ║
║    video_generate  → creative-generate fn → veo3/higgsfield        ║
║    copy_generate   → agent-forge fn                                ║
║    brief_compile   → deterministic, no AI needed                   ║
╚═════════════════════════════════════════════════════════════════════╝
          │
╔═════════▼═══════════════════════════════════════════════════════════╗
║  LAYER 5 — ASSETS (persistence)                                     ║
║                                                                     ║
║  creative_assets  (NEW TABLE)                                       ║
║    id UUID PK                                                       ║
║    org_id UUID FK → organizations                                   ║
║    type TEXT  -- image | video | copy | brief                      ║
║    prompt TEXT                                                      ║
║    url TEXT                                                         ║
║    thumbnail_url TEXT                                               ║
║    status TEXT  -- queued | processing | ready | failed            ║
║    model_used TEXT  -- banana | veo3 | higgsfield | gpt-4o         ║
║    campaign_id UUID FK → campaigns  (nullable)                     ║
║    deal_id UUID FK → deals  (nullable)                             ║
║    tags TEXT[]                                                      ║
║    metadata JSONB                                                   ║
║    tokens_used INT                                                  ║
║    cost_usd NUMERIC                                                 ║
║    created_by UUID FK → profiles                                    ║
║    created_at TIMESTAMPTZ DEFAULT NOW()                             ║
║                                                                     ║
║  content_briefs  (NEW TABLE)                                        ║
║    id UUID PK                                                       ║
║    org_id UUID FK → organizations                                   ║
║    title TEXT NOT NULL                                              ║
║    category TEXT                                                    ║
║    sections JSONB  -- [{label, value, placeholder}]                ║
║    tags TEXT[]                                                      ║
║    campaign_id UUID FK → campaigns  (nullable)                     ║
║    contact_id UUID FK → contacts    (nullable)                     ║
║    status TEXT DEFAULT 'draft'  -- draft | approved | archived     ║
║    created_by UUID FK → profiles                                    ║
║    created_at TIMESTAMPTZ DEFAULT NOW()                             ║
║    updated_at TIMESTAMPTZ DEFAULT NOW()                             ║
║                                                                     ║
║  creative_jobs  (NEW TABLE)                                         ║
║    id UUID PK                                                       ║
║    org_id UUID FK → organizations                                   ║
║    type TEXT  -- image_generate | video_generate | copy_generate   ║
║    status TEXT DEFAULT 'queued'                                     ║
║    prompt TEXT                                                      ║
║    model TEXT                                                       ║
║    asset_id UUID FK → creative_assets  (nullable, set on complete) ║
║    error TEXT                                                       ║
║    started_at TIMESTAMPTZ                                           ║
║    completed_at TIMESTAMPTZ                                         ║
║    created_at TIMESTAMPTZ DEFAULT NOW()                             ║
║                                                                     ║
║  Existing tables reused                                             ║
║    knowledge_entries  — FORGE text output continues landing here   ║
║    campaigns          — campaign_id FK anchor already has          ║
║                         target_audience + goals JSONB fields       ║
╚═════════════════════════════════════════════════════════════════════╝
          │
╔═════════▼═══════════════════════════════════════════════════════════╗
║  LAYER 6 — FEEDBACK                                                 ║
║                                                                     ║
║  Event Bus (event_log table)                                        ║
║    INSERT event_type='creative.asset_ready'                        ║
║      payload: { asset_id, type, campaign_id, model_used }          ║
║    INSERT event_type='creative.job_failed'                         ║
║      payload: { job_id, error, prompt }                            ║
║    INSERT event_type='creative.brief_approved'                     ║
║      payload: { brief_id, campaign_id }                            ║
║      → triggers FORGE to generate matching copy variants           ║
║                                                                     ║
║  Copilot integration                                                ║
║    New tool: get_creative_assets(campaign_id?, type?, limit?)      ║
║    New tool: generate_asset(prompt, type, campaign_id?)            ║
║    copilot_context: last asset_id stored for session continuity    ║
║                                                                     ║
║  FORGE feedback loop                                                ║
║    agent-forge → knowledge_entries (existing)                      ║
║    agent-forge → creative_assets   (new mirror, type=copy)         ║
║    brain-v2 enrichment: runs after generation, validates content   ║
╚═════════════════════════════════════════════════════════════════════╝
```

---

## 3. Component Map

### 3a. Frontend Components

| Component | File | Purpose |
|---|---|---|
| `CreativeStudio` | `modules/CreativeStudio.jsx` | Main container, 4-panel tab layout |
| `MediaOpsPanel` | sub-component | Image/video generation console |
| `ForgePanel` | sub-component | Text/copy generation via FORGE agent |
| `BriefPanel` | sub-component | Full CRUD brief management from DB |
| `AssetVaultPanel` | sub-component | Persisted gallery, download, campaign link |
| `AssetCard` | shared sub-component | Renders one asset (image/video/copy/brief) |
| `BriefEditorModal` | modal sub-component | Replace clipboard-only BriefEditor, save to DB |
| `LinkToCampaignModal` | modal sub-component | Attach asset to existing campaign |
| `CreativeStudio.css` | `modules/CreativeStudio.css` | Full rebuild required (token violations) |

### 3b. Hooks

| Hook | File | Status | Tables touched |
|---|---|---|---|
| `useGenerativeMedia` | `hooks/useGenerativeMedia.js` | REFACTOR | Delegates to creative-generate fn, job pattern |
| `useCreativeAssets` | `hooks/useCreativeAssets.js` | NEW | `creative_assets`, `creative_jobs` with realtime |
| `useBriefs` | `hooks/useBriefs.js` | NEW | `content_briefs` with realtime |
| `useForgeContent` | `hooks/useForgeContent.js` | NEW | Invokes `agent-forge`, reads `knowledge_entries` |
| `useCampaigns` | `hooks/useCampaigns.js` | KEEP | Provides campaign list for FK linking |

### 3c. Edge Functions

| Function | Path | Status | Change |
|---|---|---|---|
| `banana-generate` | `functions/banana-generate/` | REFACTOR | Accept `job_id`, write status back to `creative_jobs` |
| `veo-generate` | `functions/veo-generate/` | REFACTOR | Accept `job_id`, write status back to `creative_jobs` |
| `creative-generate` | `functions/creative-generate/` | NEW | Unified router: reads `model` param, delegates to adapters, writes to `creative_assets` |
| `higgsfield-generate` | `functions/higgsfield-generate/` | NEW | Higgsfield video API wrapper (keys already in Supabase secrets) |
| `agent-forge` | `functions/agent-forge/` | EXTEND | Add `campaign_id` param, mirror output to `creative_assets` (type=copy) |

### 3d. Database Tables

| Table | Status | Rationale |
|---|---|---|
| `creative_assets` | NEW — required | Core persistence, zero equivalent exists |
| `content_briefs` | NEW — required | Replaces hardcoded `BRIEF_TEMPLATES` constant |
| `creative_jobs` | NEW — required | Async job queue for realtime UI updates |
| `campaigns` | KEEP — extend | Add as FK target in `creative_assets` and `content_briefs` |
| `knowledge_entries` | KEEP — reuse | FORGE text already lands here; mirror copy assets here too |
| `campaign_metrics` | KEEP | Unrelated to creative layer; no change needed |

---

## 4. Integration Points

### Campaigns
- `creative_assets.campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL`
- `content_briefs.campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL`
- AssetVaultPanel renders a "Attach to Campaign" action on each asset card
- Brief sections auto-populate from `campaign.target_audience` and `campaign.goals` when `campaign_id` is set
- FORGE `action='generate'` accepts `campaign_id` → injects campaign context into prompt

### CRM (Contacts / Deals)
- `content_briefs.contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL`
- `creative_assets.deal_id UUID REFERENCES deals(id) ON DELETE SET NULL`
- ForgePanel: `email_outreach` content type pre-fills recipient name/company from selected contact
- `proposal` content type maps to deal stage — deal title injected into FORGE prompt

### Agents
- **FORGE**: `useForgeContent` calls `supabase.functions.invoke('agent-forge', { body: { action, content_type, campaign_id, topic, audience, tone } })`
- FORGE result mirrored to `creative_assets` (type=copy) in addition to existing `knowledge_entries` write
- **COPILOT**: `get_creative_assets` tool reads `creative_assets` by campaign or type
- **ORACLE**: references `creative_assets` count/spend in campaign analytics
- **SENTINEL**: competitor creative signals (stored via signals table) surfaced as prompt suggestions in MediaOpsPanel

### Copilot
- New Copilot tool registered: `get_creative_assets(campaign_id?, type?, limit?)` — SELECT on `creative_assets`
- New Copilot tool registered: `generate_asset(prompt, type, campaign_id?)` — invokes `creative-generate`
- Last generated `asset_id` written to `copilot_context` for in-conversation reference

### Event Bus
- `creative.asset_ready` emitted when `creative_jobs.status` transitions to `ready` (DB trigger on `creative_jobs`)
- `creative.job_failed` emitted on `failed` transition
- `creative.brief_approved` emitted when `content_briefs.status` updates to `approved`
- All events follow existing `event_log` pattern from `20260310120000_event_bus.sql`

---

## 5. Technology Decisions

### State Management
- No Zustand store added for this module — all state is server state (Supabase)
- `useCreativeAssets` and `useBriefs` follow the exact `useCampaigns.js` pattern verbatim: `fetchAll`, `insertRow`, `updateRow`, `deleteRow`, `subscribeDebouncedToTable`
- `useForgeContent` follows `useAgents.js` pattern: invoke + loading/error state, no realtime needed

### Async Job Pattern
- Client INSERTs to `creative_jobs` (status=queued) → receives job_id
- `creative-generate` edge function picks up job, updates status to `processing`, then `ready|failed`
- Supabase Realtime subscription on `creative_jobs WHERE id = job_id` → UI re-renders on status change
- Gallery item shows loader bar until realtime fires `ready` — same visual as current in-memory pattern but backed by DB

### CSS / Design System
- `CreativeStudio.css` must be fully rewritten — it currently uses at minimum 8 deprecated token names and 4 `backdrop-filter` glassmorphism rules
- Target token set: `var(--color-bg)`, `var(--color-bg-2)`, `var(--color-bg-3)`, `var(--color-border)`, `var(--color-accent)`, `var(--color-text-1)`, `var(--color-text-2)`, `var(--color-text-3)`, `var(--color-danger)`, `var(--color-success)`
- Modal pattern: `background: rgba(0,0,0,0.85)` overlay, `var(--color-bg-2)` panel, `var(--color-border)` border — matching `CRM.jsx` reference implementation
- No `backdrop-filter`, no `box-shadow: 0 0 ... rgba(255,215,0)` glow effects

### Edge Function Design
- `creative-generate` is a thin router only — it reads the `model` field and delegates:
  - `model: 'banana'` → calls `banana-generate` logic inline or via sub-invoke
  - `model: 'veo3'` → calls `veo-generate` logic
  - `model: 'higgsfield'` → calls `higgsfield-generate` function
- All adapters receive `job_id` and write final status back to `creative_jobs` and `creative_assets` using service role key
- Error handling: any adapter failure sets `creative_jobs.status = 'failed'` with error message, emits `creative.job_failed` event
