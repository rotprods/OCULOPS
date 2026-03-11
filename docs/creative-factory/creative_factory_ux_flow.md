# Creative Factory — UX Flow Document
> OCULOPS | Agent 4: UI/UX Designer + Frontend Engineer
> Authored: 2026-03-11 | Status: DESIGN SPEC — not yet implemented

---

## 0. Prerequisites: What Exists Today

`CreativeStudio.jsx` (276 lines) has two views:

- **MEDIA OPS** (`view='deploy'`): prompt → `useGenerativeMedia()` → in-memory `gallery` useState array. Gallery resets on every navigation away. Zero campaign association. Zero persistence.
- **BRIEF DB** (`view='briefs'`): 4 hardcoded `BRIEF_TEMPLATES` objects. `BriefEditor` modal copies text to clipboard only. No DB, no save, no campaign link.

The upgraded module replaces both views and adds two new ones, all backed by Supabase tables established in `creative_data_model.md`.

---

## 1. Module Identity

```
Route:      /creative-factory  (keep existing /creative route as alias or redirect)
File:       src/components/modules/CreativeFactory.jsx  (new — does NOT modify CreativeStudio.jsx)
CSS:        src/components/modules/CreativeFactory.css
CSS prefix: cf-   (new — cf- to distinguish from legacy cs- prefix)
Store:      src/stores/useCreativeStore.js  (new Zustand slice)
Hooks:
  src/hooks/useCreativeJobs.js
  src/hooks/useCreativeAssets.js
  src/hooks/useCreativeBriefs.js
```

**Note on the cs- prefix**: The existing `CreativeStudio.css` uses `cs-`. New components use `cf-` so there is no collision if `CreativeStudio.jsx` is kept in place during a phased migration. Once migration is complete, `CreativeStudio.jsx` can be removed and `cf-` becomes the sole prefix.

---

## 2. Four Views — Overview

| ID | Tab Label | What it does | Replaces |
|----|-----------|-------------|---------|
| `factory` | `[ FACTORY FLOOR ]` | Asset request form + live job queue | MEDIA OPS (deploy view) |
| `library` | `[ ASSET LIBRARY ]` | Searchable/filterable grid of persisted assets | In-memory gallery |
| `lab` | `[ REPURPOSE LAB ]` | Format variant generation from existing assets | New |
| `briefs` | `[ BRIEF DB ]` | DB-backed briefs linked to campaigns | BRIEF DB (hardcoded) |

---

## 3. User Journey Maps

### 3.1 Generate an Asset (Factory Floor)

```
User navigates to /creative-factory
        │
        ▼
CreativeFactory mounts → useCreativeJobs() starts Supabase realtime subscription
activeView = 'factory' → FactoryFloor view renders
        │
        ▼
Left panel (RequestPanel) shows:
  - Asset Type selector (IMAGE / VIDEO / COPY)
  - Engine selector (filtered by type — see adapter registry)
  - Prompt textarea
  - Campaign link dropdown (useDeals() data)
  - [ DEPLOY JOB ] button (disabled if prompt empty)
        │
User fills form → clicks [ DEPLOY JOB ]
        │
        ▼
handleDeployJob() in FactoryFloor:
  1. Calls edge fn: creative-request (new) — validates + inserts creative_requests row
  2. creative-request fn inserts creative_jobs row with status='queued'
  3. creative-request fn fires event: creative.job_queued
  4. Returns: { request_id, job_id }
        │
        ▼
Right panel (JobQueuePanel) receives INSERT via Supabase realtime:
  - New JobCard appears at top with status badge [QUEUED]
  - After engine picks up: badge transitions [QUEUED] → [PROCESSING]
  - Progress bar animates (progress 0→100 driven by UPDATE events)
  - On completion: thumb_url appears, badge → [READY]
  - On failure: badge → [FAILED], error text shown, [ RETRY ] button
        │
        ▼
User clicks [ REPURPOSE ] on a READY job card
        │
        ▼
useCreativeStore.setLabSource({ jobId, assetId, url, thumbUrl, prompt })
useCreativeStore.setActiveView('lab')
→ View transitions to Repurpose Lab with source pre-filled
```

### 3.2 Browse Asset Library

```
User clicks [ ASSET LIBRARY ] tab
        │
        ▼
activeView = 'library' → AssetLibrary view renders
useCreativeAssets() fetches from creative_assets with default filters:
  { type: 'all', campaign_id: null, engine: null, status: 'ready', date_range: '30d', search: '' }
        │
        ▼
Grid renders with AssetCards (4-col on wide screen)
Each card shows: thumbnail, type badge, engine badge, campaign name (or —), date, action row
        │
User applies filters via filter bar:
  TYPE toggle: [ALL] [IMAGE] [VIDEO] [COPY]
  CAMPAIGN dropdown: fetched from useDeals()
  ENGINE dropdown: all engines from adapter registry
  STATUS toggle: [READY] [ALL] [FAILED]
  DATE range: [7D] [30D] [90D] [ALL]
  SEARCH: full-text search on prompt + metadata
        │
        ▼
Filter state updates useCreativeStore.assetFilters
useCreativeAssets() re-fetches (debounced 300ms on search, immediate on other filters)
URL search params update (no full reload) for shareable/bookmarkable state
        │
User clicks an asset card
        │
        ▼
useCreativeStore.setSelectedAsset(asset)
AssetDetailModal opens (overlay — no view change):
  - Full-size preview (img or video element or pre-formatted text block)
  - Metadata table: type, engine, status, created_at, job_id, campaign
  - Prompt display (full, not truncated)
  - Action buttons: [ DOWNLOAD ] [ REPURPOSE ] [ COPY URL ] [ DELETE ]
        │
  ├─ DOWNLOAD: signed URL from Supabase Storage → browser download
  ├─ REPURPOSE: setLabSource → setActiveView('lab') → modal closes
  ├─ COPY URL: navigator.clipboard.writeText(asset.url)
  └─ DELETE: confirmation required → soft-delete (status='archived') in creative_assets
```

### 3.3 Repurpose an Asset (Repurpose Lab)

```
User arrives in Lab via:
  Option A: [ REPURPOSE ] on JobCard (Factory Floor) — labSource pre-filled
  Option B: [ REPURPOSE ] in AssetDetailModal (Asset Library) — labSource pre-filled
  Option C: Direct tab click — blank source, user must select
        │
        ▼
RepurposeLab renders:
  Left panel (LabSourcePanel):
    - If labSource set: shows thumbnail, prompt excerpt, "Change source" link
    - If no source: shows library picker (search + small asset grid) OR URL input
        │
  User selects target formats (multi-select checkboxes):
    [ TikTok 9:16 ]    [ Reels 9:16 ]      [ LinkedIn 1:1 ]
    [ Email banner ]   [ Blog header 16:9 ] [ Twitter card 2:1 ]
    [ YouTube thumb ]  [ Stories 9:16 ]
        │
  User clicks [ GENERATE VARIANTS ]
        │
        ▼
handleGenerateVariants():
  For each selected format:
    - Calls edge fn: creative-repurpose with { source_asset_id, format }
    - Returns { variant_job_id }
    - Inserts into useCreativeStore.variantJobs[]
        │
        ▼
Right panel (VariantQueuePanel):
  - One VariantCard per format, each with independent status
  - Realtime subscription on variant_jobs (filtered by parent asset_id)
  - Status progression: QUEUED → PROCESSING → READY / FAILED
  - On READY: thumbnail visible, [ DOWNLOAD ] button active
        │
All formats complete → "DOWNLOAD ALL READY" CTA appears
User can download individually or as a zip (zip generation handled by edge fn: creative-pack)
```

### 3.4 Brief Creation and Management (Brief DB)

```
User clicks [ BRIEF DB ] tab
        │
        ▼
activeView = 'briefs' → BriefDB view renders
useCreativeBriefs() fetches from creative_briefs table
        │
        ▼
Filter bar shows:
  CATEGORY: [ALL] [Marketing] [Ventas] [Producto] [Contenido]
  CAMPAIGN: [All ▼] — fetched from useDeals()
  SEARCH: full-text on title + section content
        │
User sees BriefCard grid: title, category badge, campaign name (or —), tag chips, actions
        │
        ▼
User clicks [ + NEW BRIEF ] button (top right of panel header)
        │
        ▼
BriefEditorModal opens (full-screen overlay, no view change):
  - Title input
  - Category selector (Marketing / Ventas / Producto / Contenido / Otro)
  - Campaign link dropdown (optional, fetches from useDeals())
  - Tag input (comma-separated or tag pills)
  - Section builder:
      - Default section "Objetivo" pre-filled
      - [ + ADD SECTION ] button adds label + textarea row
      - [ × ] removes a section (minimum 1 required)
  - Each section: label input + content textarea
  - [ AI SUGGEST ] button:
      - Calls Copilot: "Fill this brief for [title] in [category]"
      - Streams AI-generated content into each section textarea
      - User can accept or override each section individually
  - Footer: [ ABORT ] [ SAVE TO DB ]
        │
User edits → [ SAVE TO DB ]
        │
        ▼
useCreativeBriefs.createBrief(form) → inserts to creative_briefs
Modal closes → new card appears in grid (via realtime INSERT)
        │
Existing brief card actions:
  [ Edit ]   → opens BriefEditorModal pre-filled (update path)
  [ Clone ]  → duplicates record with title "Copy of …", opens editor
  [ Delete ] → confirmation chip inline on card → soft-delete
```

---

## 4. ASCII Wireframe Diagrams

### 4.1 Module Header + Tab Bar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREATIVE FACTORY                                                              │
│ MEDIA DEPLOYMENT // AI ASSET GENERATION & BRIEF LIBRARY             mono 10px│
├─────────────────────────────────────────────────────────────────────────────┤
│ [ FACTORY FLOOR ]  [ ASSET LIBRARY ]  [ REPURPOSE LAB ]  [ BRIEF DB ]        │
│  active tab: gold bg, black text     inactive: transparent, text-tertiary     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Factory Floor — Full Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [ FACTORY FLOOR ] ─────────────────────────────────────────────────────────────  │
│                                                                                   │
│ ┌─────────────────────────────────┐  ┌──────────────────────────────────────┐    │
│ │ /// REQUEST PARAMETERS          │  │ /// JOB QUEUE  ·  3 active           │    │
│ │                                 │  │                                       │    │
│ │  ASSET TYPE                     │  │ ┌───────────────────────────────────┐ │    │
│ │  ┌────────┐ ┌────────┐ ┌──────┐ │  │ │ a3f2  IMAGE  BANANA     [READY]  │ │    │
│ │  │ IMAGE  │ │ VIDEO  │ │ COPY │ │  │ │ Clinica Dental Q1                │ │    │
│ │  └────────┘ └────────┘ └──────┘ │  │ │ ████████████████████ 100%        │ │    │
│ │   active = gold border+bg       │  │ │ [thumb 80×45]  [Download][Repurp] │ │    │
│ │                                 │  │ └───────────────────────────────────┘ │    │
│ │  ENGINE                         │  │                                       │    │
│ │  ┌─────────────────────────┐    │  │ ┌───────────────────────────────────┐ │    │
│ │  │ NANO BANANA (IMAGE) ▼   │    │  │ │ b7c1  VIDEO  VEO3   [PROCESSING] │ │    │
│ │  └─────────────────────────┘    │  │ │ —                                │ │    │
│ │                                 │  │ │ ░░░░░░░░░░░░░░░░ 47%              │ │    │
│ │  NEURAL PROMPT SEQUENCE         │  │ └───────────────────────────────────┘ │    │
│ │  ┌─────────────────────────┐    │  │                                       │    │
│ │  │                         │    │  │ ┌───────────────────────────────────┐ │    │
│ │  │  Execute creative       │    │  │ │ c9d4  COPY   GPT-4O    [QUEUED]  │ │    │
│ │  │  directive...           │    │  │ │ Meta Ads Spring                  │ │    │
│ │  │                         │    │  │ │ WAITING IN QUEUE...              │ │    │
│ │  └─────────────────────────┘    │  │ └───────────────────────────────────┘ │    │
│ │                                 │  │                                       │    │
│ │  CAMPAIGN LINK (optional)       │  │ ┌───────────────────────────────────┐ │    │
│ │  ┌─────────────────────────┐    │  │ │ d1e5  IMAGE  DALLE3    [FAILED]  │ │    │
│ │  │ Select campaign...   ▼  │    │  │ │ —                                │ │    │
│ │  └─────────────────────────┘    │  │ │ ERR: rate limit exceeded         │ │    │
│ │                                 │  │ │ [Retry]                          │ │    │
│ │  [ DEPLOY JOB ]  ←gold, full-w  │  │ └───────────────────────────────────┘ │    │
│ └─────────────────────────────────┘  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘
  Left panel: 360px fixed      Right panel: flex-1, overflow-y scroll
```

### 4.3 Asset Library — Full Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ /// ASSET LIBRARY  ·  142 assets                              [ + REQUEST NEW ]  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ TYPE [ALL][IMAGE][VIDEO][COPY]  CAMPAIGN [All ▼]  ENGINE [All ▼]  STATUS [READY]│
│ DATE [30D ▼]                                  SEARCH [ __________________ ]      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│ │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │          │
│ │ │  thumb   │ │  │ │  thumb   │ │  │ │  thumb   │ │  │ │ [COPY]   │ │          │
│ │ │  16:9    │ │  │ │  16:9    │ │  │ │  16:9    │ │  │ │  text    │ │          │
│ │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │ preview   │ │          │
│ │ IMAGE        │  │ VIDEO        │  │ IMAGE        │  └──────────────┘          │
│ │ Banana v2    │  │ Veo 3        │  │ DALL-E 3     │  COPY / GPT-4o             │
│ │ Clinica Q1   │  │ Meta Ads     │  │ —            │  LinkedIn                  │
│ │ 14 Mar 26    │  │ 12 Mar 26    │  │ 11 Mar 26    │  10 Mar 26                 │
│ │ [↓] [↻] [⋯] │  │ [↓] [↻] [⋯] │  │ [↓] [↻] [⋯] │  [↓] [↻] [⋯]             │
│ └──────────────┘  └──────────────┘  └──────────────┘                            │
│                                                                                   │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│ │   (more)     │  │   (more)     │  │   (more)     │  │   (more)     │          │
│ └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────────────────────┘
  Grid: repeat(auto-fill, minmax(260px, 1fr)), gap var(--space-4)
  Icons: ↓ = download, ↻ = repurpose, ⋯ = overflow menu (copy URL / delete)
```

### 4.4 Repurpose Lab — Full Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [ REPURPOSE LAB ]                                                                 │
│                                                                                   │
│ ┌────────────────────────────────────────┐  ┌──────────────────────────────────┐ │
│ │ /// SOURCE                             │  │ /// VARIANT QUEUE  ·  6 jobs      │ │
│ │                                        │  │                                   │ │
│ │  ┌──────────────────────────────────┐  │  │ ┌─────────────────────────────┐   │ │
│ │  │                                  │  │  │ │ TikTok 9:16    [PROCESSING] │   │ │
│ │  │   [source thumbnail 16:9]        │  │  │ │ ░░░░░░░░░░░ 62%             │   │ │
│ │  │                                  │  │  │ └─────────────────────────────┘   │ │
│ │  └──────────────────────────────────┘  │  │ ┌─────────────────────────────┐   │ │
│ │  Minimalist clinic exterior...         │  │ │ Reels 9:16     [READY]      │   │ │
│ │  [Change source]                       │  │ │ [thumb]     [ DOWNLOAD ]    │   │ │
│ │                                        │  │ └─────────────────────────────┘   │ │
│ │ /// TARGET FORMATS                     │  │ ┌─────────────────────────────┐   │ │
│ │  [x] TikTok 9:16                       │  │ │ LinkedIn 1:1   [QUEUED]     │   │ │
│ │  [x] Reels 9:16                        │  │ └─────────────────────────────┘   │ │
│ │  [ ] LinkedIn 1:1                      │  │ ┌─────────────────────────────┐   │ │
│ │  [ ] Email banner 600×200              │  │ │ Email banner   [QUEUED]     │   │ │
│ │  [x] Blog header 1200×630              │  │ └─────────────────────────────┘   │ │
│ │  [ ] Twitter card 2:1                  │  │ ┌─────────────────────────────┐   │ │
│ │  [ ] YouTube thumb 16:9               │  │ │ Blog header    [QUEUED]     │   │ │
│ │  [ ] Stories 9:16                      │  │ └─────────────────────────────┘   │ │
│ │                                        │  │                                   │ │
│ │  [ GENERATE VARIANTS ]                 │  │ ──────────────────────────────    │ │
│ └────────────────────────────────────────┘  │ [ DOWNLOAD ALL READY (1) ]        │ │
│                                             └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
  Left panel: 400px fixed    Right panel: flex-1
```

### 4.5 Brief DB — Full Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ /// BRIEF DB  ·  12 briefs                                    [ + NEW BRIEF ]    │
├──────────────────────────────────────────────────────────────────────────────────┤
│ CAT [ALL][MARKETING][VENTAS][PRODUCTO][CONTENIDO]  CAMPAIGN [All ▼]              │
│ SEARCH [ _________________________ ]                                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│ ┌────────────────────────────────┐  ┌────────────────────────────────┐           │
│ │ Setup Chatbot IA               │  │ Campana Meta Ads               │           │
│ │ [PRODUCTO]          3 sections │  │ [MARKETING]         2 sections │           │
│ │ Clinica Dental Q1              │  │ — (no campaign)                │           │
│ │ ·ia ·automatizacion ·whatsapp  │  │ ·Meta ·Facebook ·paid          │           │
│ │                    ─────────── │  │                    ─────────── │           │
│ │ [Edit]  [Clone]  [Delete]      │  │ [Edit]  [Clone]  [Delete]      │           │
│ └────────────────────────────────┘  └────────────────────────────────┘           │
│                                                                                   │
│ ┌────────────────────────────────┐  ┌────────────────────────────────┐           │
│ │ Brief de Prospecting           │  │ Estrategia de Contenido        │           │
│ │ [VENTAS]            2 sections │  │ [CONTENIDO]         3 sections │           │
│ │ — (no campaign)                │  │ LinkedIn Q2 2026               │           │
│ │ ·prospecting ·outreach ·B2B    │  │ ·contenido ·LinkedIn ·RRSS     │           │
│ │                    ─────────── │  │                    ─────────── │           │
│ │ [Edit]  [Clone]  [Delete]      │  │ [Edit]  [Clone]  [Delete]      │           │
│ └────────────────────────────────┘  └────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────────────────────┘
  Grid: repeat(auto-fill, minmax(320px, 1fr)), gap var(--space-4)
```

### 4.6 Asset Detail Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ASSET: a3f2c1d8                                              [ CLOSE × ] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │      [ Full-size image / <video> / <pre> text preview ]          │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
├────────────────────────────┬────────────────────────────────────────────┤
│ TYPE      IMAGE            │ ENGINE    Nano Banana                       │
│ STATUS    READY            │ CREATED   14 Mar 2026 · 09:12               │
│ CAMPAIGN  Clinica Dental Q1│ JOB ID    job_f4a2…                         │
├────────────────────────────┴────────────────────────────────────────────┤
│ PROMPT                                                                   │
│ Minimalist clinic exterior, golden hour, aerial view, photorealistic,   │
│ 16:9, no people                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│   [ DOWNLOAD ]    [ REPURPOSE → LAB ]    [ COPY URL ]    [ DELETE ]      │
└──────────────────────────────────────────────────────────────────────────┘
  Width: 800px, max-height: 85vh, overlay rgba(0,0,0,0.85)
  border: 1px solid var(--color-primary)  (gold — matches existing cs-modal pattern)
```

### 4.7 Brief Editor Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NEW BRIEF                                                    [ ABORT × ] │
├─────────────────────────────────────────────────────────────────────────┤
│ TITLE                                                                    │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Setup Chatbot IA                                                    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ CATEGORY              CAMPAIGN LINK (optional)                           │
│ [ Marketing ▼ ]       [ Clinica Dental Q1 ▼ ]                            │
│                                                                          │
│ TAGS   [ ia ] [ automatizacion ] [ whatsapp ]  [ + add tag ]             │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ SECTIONS                                                    [ AI SUGGEST ]│
├──────────────────────────────────────────────────────────────────────────┤
│ OBJETIVO                                                        [ × ]    │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Automatizar la atención al cliente 24/7 en WhatsApp...             │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ AUDIENCIA OBJETIVO                                              [ × ]    │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ [ + ADD SECTION ]                                                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                          [ ABORT ]    [ SAVE TO DB ]     │
└──────────────────────────────────────────────────────────────────────────┘
  Width: 700px, max-height: 90vh, overflow-y: auto
  [ AI SUGGEST ] calls Copilot tool: suggest_brief_content
  Streaming response populates sections one by one with fade-in animation
```

---

## 5. View Transition Design

All view transitions are state-driven via `useCreativeStore.activeView`. No React Router sub-routes are used inside the module — the module stays at `/creative-factory`.

```
Tab button click
        │
        ▼
setActiveView(newView)
        │
        ▼ (CSS class applied)
Current view: opacity 0, transform translateY(4px) — 150ms ease-out
New view mounts hidden: opacity 0
        │
        ▼ (after 150ms)
Current view unmounts
New view: opacity 1, transform translateY(0) — 200ms ease-in
```

CSS implementation:
```css
.cf-view-enter {
  animation: cf-view-in 200ms var(--ease-out) forwards;
}
.cf-view-exit {
  animation: cf-view-out 150ms var(--ease-in) forwards;
}
@keyframes cf-view-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cf-view-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
```

**Context-passing between views:**

| Trigger | Method | Target |
|---------|--------|--------|
| JobCard [ REPURPOSE ] | `setLabSource(jobData)` then `setActiveView('lab')` | Repurpose Lab, source pre-filled |
| AssetDetailModal [ REPURPOSE → LAB ] | `setLabSource(assetData)` then `setActiveView('lab')` | Repurpose Lab, source pre-filled |
| [ + REQUEST NEW ] in Asset Library header | `setActiveView('factory')` | Factory Floor |
| Copilot `generate_creative` tool | store dispatch from Copilot action handler | Factory Floor, form pre-filled |
| Copilot `repurpose_asset` tool | `setLabSource` + `setActiveView('lab')` | Repurpose Lab |
| Copilot `navigate` action | handled by existing CopilotChat navigate action loop | Module-level routing |

---

## 6. Zustand Store — Complete Shape

**File:** `src/stores/useCreativeStore.js`

```js
// Implementation target — Zustand create() with immer middleware optional
// Use narrow selectors at all call sites: useCreativeStore(s => s.activeView)

{
  // ── View routing ──
  activeView: 'factory',           // 'factory' | 'library' | 'lab' | 'briefs'
  setActiveView: (view) => void,

  // ── Request form (Factory Floor) ──
  requestForm: {
    assetType: 'image',            // 'image' | 'video' | 'copy'
    engine: 'banana',              // adapter registry key
    prompt: '',
    campaignId: null,              // FK to deals table, or null
  },
  setRequestForm: (patch) => void, // merges patch into requestForm
  resetRequestForm: () => void,

  // ── Jobs (Factory Floor + Realtime) ──
  jobs: [],                        // Array<CreativeJob> — driven by useCreativeJobs hook
  addJob: (job) => void,
  updateJob: (id, patch) => void,  // partial update by job id
  removeJob: (id) => void,

  // ── Asset Library filters ──
  assetFilters: {
    type: 'all',                   // 'all' | 'image' | 'video' | 'copy'
    campaignId: null,              // string | null
    engine: null,                  // string | null
    status: 'ready',               // 'ready' | 'all' | 'error'
    dateRange: '30d',              // '7d' | '30d' | '90d' | 'all'
    search: '',                    // debounced full-text
  },
  setAssetFilter: (key, value) => void,
  resetAssetFilters: () => void,

  // ── Asset detail modal ──
  selectedAsset: null,             // CreativeAsset | null
  setSelectedAsset: (asset) => void,
  clearSelectedAsset: () => void,

  // ── Repurpose Lab ──
  labSource: null,                 // LabSource | null
  setLabSource: (source) => void,
  clearLabSource: () => void,
  selectedFormats: [],             // Array<string>  e.g. ['tiktok_9_16', 'reels_9_16']
  toggleFormat: (format) => void,
  clearFormats: () => void,
  variantJobs: [],                 // Array<VariantJob>
  addVariantJob: (job) => void,
  updateVariantJob: (id, patch) => void,
  clearVariantJobs: () => void,

  // ── Brief DB filters ──
  briefFilter: {
    category: 'all',
    campaignId: null,
    search: '',
  },
  setBriefFilter: (key, value) => void,
  resetBriefFilter: () => void,

  // ── Brief editor modal ──
  activeBrief: null,               // CreativeBrief (partial/full) | null
  setActiveBrief: (brief) => void, // null to close modal
  isBriefSaving: false,
  setBriefSaving: (val) => void,

  // ── Global error banner ──
  error: null,                     // string | null
  setError: (msg) => void,
  clearError: () => void,
}
```

**Type reference** (document-level, for implementer):
```
LabSource {
  assetId: string | null     -- set when coming from library
  jobId: string | null       -- set when coming from factory floor
  url: string
  thumbUrl: string | null
  prompt: string
}

CreativeJob {                 -- matches creative_jobs table
  id: string
  request_id: string
  type: 'image' | 'video' | 'copy'
  engine: string
  prompt: string
  campaign_id: string | null
  status: 'queued' | 'processing' | 'polling' | 'completed' | 'failed' | 'dead_lettered'
  progress: number           -- 0-100
  url: string | null
  thumb_url: string | null
  error: string | null
  created_at: string
}

CreativeAsset {               -- matches creative_assets table
  id: string
  job_id: string
  type: 'image' | 'video' | 'copy'
  engine: string
  prompt: string
  campaign_id: string | null
  url: string
  thumb_url: string | null
  status: 'ready' | 'error' | 'archived'
  metadata: object
  created_at: string
}

CreativeBrief {               -- matches creative_briefs table
  id: string
  title: string
  category: string
  campaign_id: string | null
  tags: string[]
  sections: Array<{ label: string; content: string }>
  created_at: string
  updated_at: string
}

VariantJob {                  -- matches asset_variants table
  id: string
  parent_asset_id: string
  format: string             -- 'tiktok_9_16' | 'reels_9_16' | 'linkedin_1_1' | etc.
  status: 'queued' | 'processing' | 'ready' | 'failed'
  url: string | null
  created_at: string
}
```

---

## 7. Realtime Subscription Points

Each hook subscribes to its table via `supabase.channel()` and updates the Zustand store. Pattern mirrors `useContacts.js` and `useAgents.js`.

| Hook | Table | Events | Store update |
|------|-------|--------|-------------|
| `useCreativeJobs` | `creative_jobs` | INSERT, UPDATE | `addJob`, `updateJob` |
| `useCreativeAssets` | `creative_assets` | INSERT, UPDATE, DELETE | refetch or append/update/remove |
| `useCreativeBriefs` | `creative_briefs` | INSERT, UPDATE, DELETE | refetch on any change |
| `useCreativeJobs` | `asset_variants` | INSERT, UPDATE | `addVariantJob`, `updateVariantJob` |

Subscription key pattern: `cf-jobs-{orgId}`, `cf-assets-{orgId}`, `cf-briefs-{orgId}`, `cf-variants-{jobId}`.

Cleanup: each hook returns unsubscribe function called in `useEffect` cleanup.

---

## 8. Responsive Behavior

| Viewport | Factory Floor | Asset Library | Repurpose Lab |
|----------|--------------|--------------|--------------|
| ≥ 1280px | 360px panel + flex-1 queue | 4-col grid | 400px panel + flex-1 queue |
| 1024–1279px | 320px panel + flex-1 queue | 3-col grid | 360px panel + flex-1 queue |
| 768–1023px | Stacked (request above queue) | 2-col grid | Stacked (source above variants) |
| < 768px | Single column, full-width inputs | 1-col grid | Single column |

Tab bar at < 768px: `display: flex; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;`

Modals at < 768px: `position: fixed; inset: 0; border-radius: 0; max-height: 100vh;`
