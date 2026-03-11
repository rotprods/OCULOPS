# Creative Factory — UI Component Map
> OCULOPS | Agent 4: UI/UX Designer + Frontend Engineer
> Authored: 2026-03-11 | Status: DESIGN SPEC — not yet implemented

---

## 0. Naming & Conventions

### File locations
```
src/components/modules/CreativeFactory.jsx          Root module component
src/components/modules/CreativeFactory.css          All module CSS (cf- prefix)
src/stores/useCreativeStore.js                      Zustand store
src/hooks/useCreativeJobs.js                        Supabase realtime hook
src/hooks/useCreativeAssets.js                      Supabase query + realtime hook
src/hooks/useCreativeBriefs.js                      Supabase CRUD hook
```

### CSS class prefix
All new classes use `cf-` prefix. The existing `CreativeStudio.css` uses `cs-` — the prefixes must never collide. During migration, both files coexist. After `CreativeStudio.jsx` is removed, `cf-` is the sole prefix.

### Design token rules
- Colors: ONLY `var(--color-primary)`, `var(--color-bg)`, `var(--color-bg-2)`, `var(--color-bg-3)`, `var(--color-border)`, `var(--color-text)`, `var(--color-text-2)`, `var(--color-text-3)`, `var(--color-danger)`, `var(--color-success)`, `var(--color-warning)`, `var(--glass-bg)`, `var(--glass-blur)`, `var(--border-subtle)`
- Fonts: `var(--font-sans)` and `var(--font-mono)` only — never hardcoded strings
- Spacing: `var(--space-N)` tokens from tokens.css
- Never use `--accent-primary` (removed from tokens.css v11, was gold — now maps to indigo/violet; gold is `--color-primary` in CLAUDE.md spec)

### Import pattern for CLAUDE.md token alignment
Per CLAUDE.md: canonical gold token is `--color-primary: #FFD400`. The tokens.css has `--accent-gold: #FFD700` and `--accent-primary: #7B8CFF` (now violet/indigo). All component active/selected states and gold accents must use `var(--color-primary)` (which maps to `var(--accent-primary)` via backward-compat alias in tokens.css — verify at implementation time by checking which alias is actually `#FFD400`).

---

## 1. Full Component Tree

```
CreativeFactory.jsx                    Root — owns activeView, mounts view components
│
├── [Header]                           Inline in root — title, subtitle, tab bar
│
├── FactoryFloor.jsx                   View: activeView === 'factory'
│   ├── RequestPanel.jsx               Left panel: form inputs
│   │   ├── AssetTypeSelector          Inline sub-component (3-button toggle)
│   │   ├── EngineSelector             Dropdown — filters by assetType
│   │   ├── PromptTextarea             Textarea with mono font + gold focus ring
│   │   ├── CampaignPicker             Dropdown — data from useDeals()
│   │   └── DeployButton               Disabled until prompt non-empty
│   │
│   └── JobQueuePanel.jsx              Right panel: live job list
│       ├── JobQueueHeader             Count badge, sort control
│       └── JobCard.jsx × N            One per job in store.jobs
│           ├── JobCardHeader          ID, type badge, status badge
│           ├── JobCardProgress        Animated progress bar (hidden when !generating)
│           ├── JobCardThumb           Thumbnail (visible when status=completed)
│           └── JobCardActions         Download, Repurpose buttons
│
├── AssetLibrary.jsx                   View: activeView === 'library'
│   ├── LibraryFilterBar               Filter chips, dropdowns, search
│   │   ├── TypeToggle                 Inline pill group: ALL / IMAGE / VIDEO / COPY
│   │   ├── CampaignDropdown           Select from useDeals()
│   │   ├── EngineDropdown             Engine list from adapter registry
│   │   ├── StatusToggle               READY / ALL / FAILED
│   │   ├── DateRangeDropdown          7D / 30D / 90D / ALL
│   │   └── SearchInput                Debounced 300ms
│   │
│   ├── LibraryEmptyState              When no assets match filters
│   └── AssetGrid                      CSS grid, auto-fill
│       └── AssetCard.jsx × N          One per asset
│           ├── AssetCardThumb         16:9 preview image/video/text block
│           ├── AssetCardMeta          Type badge, engine, campaign, date
│           └── AssetCardActions       Download (↓), Repurpose (↻), Overflow (⋯)
│               └── AssetCardOverflow  Copy URL, Delete options
│
├── RepurposeLab.jsx                   View: activeView === 'lab'
│   ├── LabSourcePanel.jsx             Left panel: source asset selector
│   │   ├── LabSourcePreview           Thumbnail + prompt if labSource set
│   │   ├── LabSourcePicker            Mini asset search grid (when no source)
│   │   ├── FormatCheckboxGroup        8 format checkboxes
│   │   └── GenerateVariantsButton     Disabled until source + ≥1 format selected
│   │
│   └── VariantQueuePanel.jsx          Right panel: variant job list
│       ├── VariantQueueHeader         Count + "Download All Ready" CTA
│       └── VariantCard.jsx × N        One per variantJob
│           ├── VariantCardFormat      Format label (e.g. TikTok 9:16)
│           ├── VariantCardStatus      Status badge + progress bar
│           └── VariantCardThumb       Thumbnail + download on READY
│
├── BriefDB.jsx                        View: activeView === 'briefs'
│   ├── BriefFilterBar                 Category toggle, campaign dropdown, search
│   ├── BriefEmptyState                When no briefs match filters
│   └── BriefGrid                      CSS grid, auto-fill
│       └── BriefCard.jsx × N          One per brief
│           ├── BriefCardHeader        Title, category badge
│           ├── BriefCardMeta          Campaign name, section count
│           ├── BriefCardTags          Tag pills
│           └── BriefCardActions       Edit, Clone, Delete
│
└── [Modals — portal-rendered, z-index var(--z-modal)]
    ├── AssetDetailModal.jsx           Triggered by: setSelectedAsset(asset)
    │   ├── AssetDetailPreview         img / video / pre element by type
    │   ├── AssetDetailMetaTable       Two-column metadata grid
    │   ├── AssetDetailPrompt          Full prompt text block
    │   └── AssetDetailActions         Download, Repurpose, Copy URL, Delete
    │
    └── BriefEditorModal.jsx           Triggered by: setActiveBrief(brief|{})
        ├── BriefEditorHeader          Title field, close/abort button
        ├── BriefEditorMeta            Category selector, campaign picker, tag input
        ├── BriefSectionList           Dynamic list of section rows
        │   └── BriefSectionRow × N    Label input + textarea + remove button
        ├── BriefAddSectionButton      Appends new section row
        ├── BriefAISuggestButton       Calls Copilot suggest_brief_content
        └── BriefEditorFooter          ABORT + SAVE TO DB buttons
```

---

## 2. Component Specifications

### 2.1 `CreativeFactory.jsx` — Root

**Props:** none (module root, loaded via React.lazy in App.jsx)

**State (from store):**
```js
const activeView = useCreativeStore(s => s.activeView)
const error = useCreativeStore(s => s.error)
const clearError = useCreativeStore(s => s.clearError)
const selectedAsset = useCreativeStore(s => s.selectedAsset)
const activeBrief = useCreativeStore(s => s.activeBrief)
```

**Renders:**
- Module header with title `CREATIVE FACTORY` and subtitle `MEDIA DEPLOYMENT // AI ASSET GENERATION & BRIEF LIBRARY`
- Tab bar with 4 buttons
- Conditional view component (FactoryFloor / AssetLibrary / RepurposeLab / BriefDB)
- Error banner (when `error !== null`)
- AssetDetailModal (when `selectedAsset !== null`)
- BriefEditorModal (when `activeBrief !== null`)

**No APIs called directly.** All data fetching delegated to view components and hooks.

---

### 2.2 `FactoryFloor.jsx`

**Props:** none

**State (from store):**
```js
const requestForm = useCreativeStore(s => s.requestForm)
const setRequestForm = useCreativeStore(s => s.setRequestForm)
const jobs = useCreativeStore(s => s.jobs)
```

**Local state:**
```js
const [deploying, setDeploying] = useState(false)
```

**Hooks:**
```js
const { } = useCreativeJobs()          // mounts realtime subscription, populates store.jobs
const { data: deals } = useDeals()     // for CampaignPicker options
```

**Key handler:**
```js
const handleDeploy = useCallback(async () => {
  if (!requestForm.prompt.trim() || deploying) return
  setDeploying(true)
  try {
    await supabase.functions.invoke('creative-request', {
      body: {
        type: requestForm.assetType,
        engine: requestForm.engine,
        prompt: requestForm.prompt,
        campaign_id: requestForm.campaignId,
        source: 'ui',
      }
    })
    resetRequestForm()
  } catch (err) {
    setError(err.message)
  }
  setDeploying(false)
}, [requestForm, deploying])
```

**Events emitted:** none (side effects via edge fn + realtime)

**CSS classes:**
```
.cf-factory-grid          display: grid; grid-template-columns: 360px 1fr; gap var(--space-4)
.cf-request-panel         panel container — border, bg, flex column
.cf-job-queue-panel       panel container — border, bg, flex column, overflow hidden
```

---

### 2.3 `RequestPanel.jsx`

**Props:**
```js
{
  form: { assetType, engine, prompt, campaignId },
  onFormChange: (patch) => void,
  onDeploy: () => void,
  deploying: boolean,
  deals: Deal[],
}
```

**No local state.** All state passed via props from FactoryFloor.

**Sub-component: AssetTypeSelector**
```js
// Inline — 3 buttons: IMAGE / VIDEO / COPY
// Active: background var(--color-primary), color #000, border var(--color-primary)
// Inactive: transparent bg, border var(--color-border), color var(--color-text-3)
// On click: onFormChange({ assetType: value, engine: defaultEngineForType(value) })
```

**Sub-component: EngineSelector**
```js
// <select> styled as a mono dropdown
// Options filtered from ADAPTER_REGISTRY by assetType
// Changing engine: onFormChange({ engine: value })
```

**Sub-component: CampaignPicker**
```js
// <select> styled as a mono dropdown
// Options: [{ value: null, label: '— No campaign —' }, ...deals.map(d => ({ value: d.id, label: d.name }))]
```

**CSS classes:**
```
.cf-panel-header          padding 14px 16px; border-bottom; mono 700; text-primary
.cf-panel-body            padding var(--space-5); flex column; gap var(--space-5); overflow-y auto
.cf-input-group           flex column; gap var(--space-3)
.cf-label                 font-size 9px; color text-3; text-transform uppercase; tracking wide; mono 700
.cf-type-selector         display flex; gap var(--space-2)
.cf-type-btn              flex 1; padding var(--space-3); border 1px; mono; font-size xs; cursor pointer
.cf-type-btn--active      bg var(--color-primary); color #000; border-color var(--color-primary); font-weight 700
.cf-engine-select         width 100%; padding var(--space-3) var(--space-4); bg transparent; border 1px solid var(--color-border); color text-primary; font-family mono; font-size xs
.cf-prompt-textarea       font-family mono; font-size sm; color var(--color-primary); bg rgba(0,0,0,0.3); border 1px solid var(--color-border); min-height 120px; padding var(--space-4); resize none; flex 1
.cf-prompt-textarea:focus border-color var(--color-primary); outline none; box-shadow inset 0 0 15px rgba(255,212,0,0.08)
.cf-campaign-select       same as cf-engine-select
.cf-deploy-btn            btn btn-primary pattern; full width; padding var(--space-4); mono; letter-spacing 0.1em; font-weight 700; font-size xs
.cf-deploy-btn--working   animation: cf-flash 2s infinite; pointer-events none
@keyframes cf-flash       0%,100% { opacity: 1 }  50% { opacity: 0.7 }
```

---

### 2.4 `JobQueuePanel.jsx`

**Props:**
```js
{
  jobs: CreativeJob[],
  onRepurpose: (job: CreativeJob) => void,
}
```

**No local state.**

**Derived:**
```js
const sortedJobs = useMemo(() =>
  [...jobs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
[jobs])
```

**CSS classes:**
```
.cf-queue-header          cf-panel-header + job count badge
.cf-queue-body            flex 1; overflow-y auto; padding var(--space-4); gap var(--space-3); flex column
.cf-queue-empty           full height flex center; mono xs; color text-3; letter-spacing wide
```

---

### 2.5 `JobCard.jsx`

**Props:**
```js
{
  job: CreativeJob,
  onRepurpose: (job: CreativeJob) => void,
}
```

**No local state.**

**Status → badge color map:**
```js
const statusColor = (status) => ({
  queued:       'var(--color-text-3)',
  processing:   'var(--color-warning)',
  polling:      'var(--color-warning)',
  completed:    'var(--color-success)',
  failed:       'var(--color-danger)',
  dead_lettered:'var(--color-danger)',
}[status] || 'var(--color-text-3)')
```

**Realtime update behavior:**
- `status` change triggers CSS class update on `.cf-job-card` (e.g. `.cf-job-card--completed`, `.cf-job-card--failed`)
- `progress` change animates `.cf-job-progress-bar` width via inline style
- `thumb_url` populated → `.cf-job-thumb` transitions from loader skeleton to `<img>`

**CSS classes:**
```
.cf-job-card              border 1px solid var(--color-border); bg var(--color-bg-2); display flex; flex-direction column
.cf-job-card--completed   border-left: 3px solid var(--color-success)
.cf-job-card--failed      border-left: 3px solid var(--color-danger); border-color var(--color-danger)
.cf-job-card-header       display flex; justify-content space-between; padding var(--space-2) var(--space-3); border-bottom 1px solid var(--color-border); font-family mono; font-size 10px; font-weight 700
.cf-job-id                color var(--color-text-3)
.cf-job-type-badge        padding 1px 5px; border 1px solid var(--color-border); font-size 9px; color text-2; mono
.cf-job-status-badge      font-size 9px; mono; font-weight 700; color based on status
.cf-job-progress-track    height 2px; bg var(--color-border); position relative; overflow hidden
.cf-job-progress-bar      height 100%; bg var(--color-primary); transition: width 400ms ease; box-shadow: 0 0 8px rgba(255,212,0,0.4)
.cf-job-thumb-area        aspect-ratio 16/9; bg #000; position relative; overflow hidden
.cf-job-thumb             width 100%; height 100%; object-fit cover; filter brightness(0.9); transition filter 200ms
.cf-job-thumb-skeleton    absolute inset-0; animation cf-pulse 1.5s infinite
.cf-job-footer            padding var(--space-2) var(--space-3); border-top 1px solid var(--color-border); font-family mono; font-size 10px; color text-2; white-space nowrap; overflow hidden; text-overflow ellipsis
.cf-job-actions           display flex; gap var(--space-2); padding var(--space-2) var(--space-3)
@keyframes cf-pulse       0%,100% { opacity: 0.4 }  50% { opacity: 0.7 }
```

---

### 2.6 `AssetLibrary.jsx`

**Props:** none

**State (from store):**
```js
const filters = useCreativeStore(s => s.assetFilters)
const setFilter = useCreativeStore(s => s.setAssetFilter)
const resetFilters = useCreativeStore(s => s.resetAssetFilters)
const setSelectedAsset = useCreativeStore(s => s.setSelectedAsset)
const setActiveView = useCreativeStore(s => s.setActiveView)
const setLabSource = useCreativeStore(s => s.setLabSource)
```

**Hooks:**
```js
const { assets, loading, total } = useCreativeAssets(filters)   // re-fetches on filter change
const { data: deals } = useDeals()                              // for campaign filter dropdown
```

**Key behaviors:**
- Search input: debounce 300ms before updating `filters.search`
- Filter changes other than search: immediate store update → hook re-fetches
- URL sync: `useEffect` reads/writes `URLSearchParams` from filters (no React Router sub-route — just `history.replaceState`)
- Repurpose action on card: `setLabSource(assetToLabSource(asset))` then `setActiveView('lab')`

**CSS classes:**
```
.cf-library-layout        display flex; flex-direction column; height 100%; overflow hidden
.cf-library-filters       flex-shrink 0; padding var(--space-4); border-bottom 1px solid var(--color-border); display flex; flex-wrap wrap; gap var(--space-2)
.cf-filter-group          display flex; gap 3px
.cf-filter-pill           padding 4px 8px; border 1px solid var(--color-border); mono; font-size 9px; font-weight 700; color text-3; bg transparent; cursor pointer; transition all 120ms
.cf-filter-pill:hover     bg rgba(255,255,255,0.05)
.cf-filter-pill--active   bg var(--color-primary); color #000; border-color var(--color-primary)
.cf-filter-select         padding 4px 8px; border 1px solid var(--color-border); mono; font-size 9px; bg transparent; color text-2; cursor pointer
.cf-search-input          padding 4px 10px; border 1px solid var(--color-border); mono; font-size 11px; bg transparent; color text-primary; min-width 180px
.cf-search-input:focus    border-color var(--color-primary); outline none
.cf-library-grid-wrapper  flex 1; overflow-y auto; padding var(--space-4)
.cf-asset-grid            display grid; grid-template-columns repeat(auto-fill, minmax(260px, 1fr)); gap var(--space-4)
.cf-library-count         mono; font-size 10px; color text-3; padding-bottom var(--space-3)
```

---

### 2.7 `AssetCard.jsx`

**Props:**
```js
{
  asset: CreativeAsset,
  onOpen: (asset: CreativeAsset) => void,       // opens AssetDetailModal
  onRepurpose: (asset: CreativeAsset) => void,  // sets labSource + nav to lab
  onDownload: (asset: CreativeAsset) => void,
}
```

**Local state:**
```js
const [overflowOpen, setOverflowOpen] = useState(false)
```

**Thumb rendering by type:**
```js
// type === 'copy': render truncated text preview in a <pre> block with overflow hidden
// type === 'video': render <img> for thumb_url (no autoplay in grid)
// type === 'image': render <img>
```

**CSS classes:**
```
.cf-asset-card            border 1px solid var(--color-border); bg var(--color-bg-2); display flex; flex-direction column; cursor pointer; transition all 200ms
.cf-asset-card:hover      border-color rgba(255,255,255,0.15); transform translateY(-2px); box-shadow 0 4px 16px rgba(0,0,0,0.5)
.cf-asset-card-thumb      aspect-ratio 16/9; bg #000; overflow hidden; position relative
.cf-asset-thumb-img       width 100%; height 100%; object-fit cover; filter brightness(0.9); transition filter 200ms
.cf-asset-card:hover .cf-asset-thumb-img  filter brightness(1)
.cf-asset-thumb-copy      padding var(--space-3); font-family mono; font-size 9px; color text-3; overflow hidden; height 100%; background rgba(255,255,255,0.02)
.cf-asset-card-meta       padding var(--space-3) var(--space-3) 0; display flex; flex-direction column; gap var(--space-1); flex 1
.cf-asset-type-badge      display inline-block; padding 1px 5px; border 1px solid var(--color-border); mono; font-size 9px; font-weight 700; color text-3
.cf-asset-engine          mono; font-size 10px; color text-3
.cf-asset-campaign        font-size 11px; color text-2; white-space nowrap; overflow hidden; text-overflow ellipsis
.cf-asset-date            mono; font-size 10px; color text-3
.cf-asset-card-actions    padding var(--space-2) var(--space-3); border-top 1px solid var(--color-border); display flex; align-items center; gap var(--space-2); margin-top auto
.cf-asset-action-btn      padding 3px 8px; border 1px solid var(--color-border); mono; font-size 9px; font-weight 700; color text-3; bg transparent; cursor pointer; transition all 120ms
.cf-asset-action-btn:hover  border-color text-2; color text-primary
.cf-asset-overflow-menu   position absolute; bottom calc(100% + 4px); right 0; bg var(--color-bg-3); border 1px solid var(--color-border); min-width 140px; z-index var(--z-dropdown)
.cf-asset-overflow-item   display block; width 100%; padding var(--space-2) var(--space-4); text-align left; mono; font-size 11px; color text-2; bg transparent; cursor pointer; transition bg 120ms
.cf-asset-overflow-item:hover  bg rgba(255,255,255,0.05)
.cf-asset-overflow-item--danger  color var(--color-danger)
```

---

### 2.8 `RepurposeLab.jsx`

**Props:** none

**State (from store):**
```js
const labSource = useCreativeStore(s => s.labSource)
const setLabSource = useCreativeStore(s => s.setLabSource)
const clearLabSource = useCreativeStore(s => s.clearLabSource)
const selectedFormats = useCreativeStore(s => s.selectedFormats)
const toggleFormat = useCreativeStore(s => s.toggleFormat)
const variantJobs = useCreativeStore(s => s.variantJobs)
const addVariantJob = useCreativeStore(s => s.addVariantJob)
```

**Local state:**
```js
const [generating, setGenerating] = useState(false)
```

**Key handler:**
```js
const handleGenerateVariants = useCallback(async () => {
  if (!labSource || selectedFormats.length === 0 || generating) return
  setGenerating(true)
  try {
    const { data } = await supabase.functions.invoke('creative-repurpose', {
      body: {
        asset_id: labSource.assetId,
        target_formats: selectedFormats,
        source: 'ui',
      }
    })
    // variant jobs appear via realtime subscription in useCreativeJobs()
  } catch (err) {
    setError(err.message)
  }
  setGenerating(false)
}, [labSource, selectedFormats, generating])
```

**CSS classes:**
```
.cf-lab-grid              display grid; grid-template-columns 400px 1fr; gap var(--space-4); height 100%
.cf-lab-source-panel      panel container (same as cf-request-panel)
.cf-lab-variant-panel     panel container (same as cf-job-queue-panel)
.cf-lab-source-thumb      aspect-ratio 16/9; bg #000; overflow hidden; margin-bottom var(--space-4)
.cf-lab-source-thumb img  width 100%; height 100%; object-fit cover
.cf-lab-source-empty      bg var(--color-bg-3); border 1px dashed var(--color-border); aspect-ratio 16/9; display flex; align-items center; justify-content center; cursor pointer
.cf-lab-source-empty:hover  border-color var(--color-text-3)
.cf-lab-prompt-excerpt    mono; font-size 10px; color text-3; margin-bottom var(--space-2); line-height 1.5; overflow hidden; -webkit-line-clamp 2; display -webkit-box; -webkit-box-orient vertical
.cf-lab-change-source     mono; font-size 9px; color var(--color-primary); bg transparent; border none; cursor pointer; text-decoration underline; padding 0
.cf-format-grid           display grid; grid-template-columns 1fr 1fr; gap var(--space-2); margin-top var(--space-4)
.cf-format-item           display flex; align-items center; gap var(--space-2); padding var(--space-2) var(--space-3); border 1px solid var(--color-border); cursor pointer; transition all 120ms
.cf-format-item--selected border-color var(--color-primary); bg rgba(255,212,0,0.05)
.cf-format-item--selected .cf-format-checkbox  bg var(--color-primary); border-color var(--color-primary)
.cf-format-checkbox       width 14px; height 14px; border 1px solid var(--color-border); flex-shrink 0
.cf-format-label          mono; font-size 10px; font-weight 600; color text-2
.cf-generate-btn          same pattern as cf-deploy-btn
.cf-variant-header        cf-panel-header + "Download All Ready" CTA when ≥1 ready
.cf-download-all-btn      padding 6px 12px; border 1px solid var(--color-success); color var(--color-success); mono; font-size 10px; font-weight 700; bg transparent; cursor pointer
```

---

### 2.9 `VariantCard.jsx`

**Props:**
```js
{
  variant: VariantJob,
  onDownload: (variant: VariantJob) => void,
}
```

**No local state.**

**CSS classes:**
```
.cf-variant-card          border 1px solid var(--color-border); bg var(--color-bg-2); display flex; align-items center; gap var(--space-3); padding var(--space-3)
.cf-variant-card--ready   border-left 3px solid var(--color-success)
.cf-variant-card--failed  border-left 3px solid var(--color-danger)
.cf-variant-format        mono; font-size 11px; font-weight 700; color text-primary; flex 1
.cf-variant-status        mono; font-size 9px; font-weight 700; color based on status
.cf-variant-progress      flex 1; height 1px; bg var(--color-border); position relative; overflow hidden
.cf-variant-progress-bar  height 100%; bg var(--color-primary); transition width 400ms ease
.cf-variant-thumb         width 48px; height 27px; object-fit cover; flex-shrink 0
.cf-variant-download-btn  padding 4px 8px; border 1px solid var(--color-success); color var(--color-success); mono; font-size 9px; font-weight 700; bg transparent; cursor pointer
```

---

### 2.10 `BriefDB.jsx`

**Props:** none

**State (from store):**
```js
const filter = useCreativeStore(s => s.briefFilter)
const setBriefFilter = useCreativeStore(s => s.setBriefFilter)
const setActiveBrief = useCreativeStore(s => s.setActiveBrief)
```

**Hooks:**
```js
const { briefs, loading, createBrief, updateBrief, deleteBrief, cloneBrief } = useCreativeBriefs(filter)
const { data: deals } = useDeals()
```

**Key behaviors:**
- Clone: `cloneBrief(brief.id)` → creates new record with `title = "Copy of ${brief.title}"`, opens editor with new brief
- Delete: inline confirmation pattern (no modal) — card shows `[Confirm delete?] [Yes] [No]` for 5s then resets

**CSS classes:**
```
.cf-briefs-layout         display flex; flex-direction column; height 100%; overflow hidden
.cf-briefs-filters        flex-shrink 0; padding var(--space-4); border-bottom 1px solid var(--color-border); display flex; flex-wrap wrap; gap var(--space-2); align-items center
.cf-briefs-grid-wrapper   flex 1; overflow-y auto; padding var(--space-4)
.cf-briefs-grid           display grid; grid-template-columns repeat(auto-fill, minmax(320px, 1fr)); gap var(--space-4)
```

---

### 2.11 `BriefCard.jsx`

**Props:**
```js
{
  brief: CreativeBrief,
  campaignName: string | null,
  onEdit: (brief: CreativeBrief) => void,
  onClone: (brief: CreativeBrief) => void,
  onDelete: (id: string) => void,
}
```

**Local state:**
```js
const [confirmDelete, setConfirmDelete] = useState(false)
```

**Confirm delete pattern:**
```js
// Click Delete → setConfirmDelete(true)
// Auto-reset after 5s via useEffect cleanup
// If confirmed → onDelete(brief.id), setConfirmDelete(false)
// If cancelled → setConfirmDelete(false)
```

**CSS classes:**
```
.cf-brief-card            border 1px solid var(--color-border); bg var(--color-bg-2); padding var(--space-4); position relative; transition all 200ms
.cf-brief-card::before    content ''; position absolute; top 0; left 0; width 2px; height 100%; bg transparent; transition bg 200ms
.cf-brief-card:hover::before  bg var(--color-primary)
.cf-brief-card:hover      border-color rgba(255,255,255,0.12); transform translateY(-1px)
.cf-brief-card-title      font-weight 700; font-size sm; color text-primary; margin-bottom var(--space-1)
.cf-brief-category        mono; font-size 9px; font-weight 700; color text-3; text-transform uppercase
.cf-brief-campaign        font-size 11px; color text-2; margin-top var(--space-1)
.cf-brief-tags            display flex; flex-wrap wrap; gap 4px; margin-top var(--space-3)
.cf-brief-tag             mono; font-size 9px; padding 2px 6px; bg rgba(255,255,255,0.04); border 1px solid var(--color-border); color text-3
.cf-brief-actions         display flex; gap var(--space-2); margin-top var(--space-3); padding-top var(--space-3); border-top 1px solid var(--color-border)
.cf-brief-action-btn      padding 4px 8px; border 1px solid var(--color-border); mono; font-size 9px; font-weight 700; color text-3; bg transparent; cursor pointer; transition all 120ms
.cf-brief-action-btn:hover  border-color text-2; color text-primary
.cf-brief-action-btn--danger  color var(--color-danger); border-color var(--color-danger)
.cf-brief-delete-confirm  display flex; gap var(--space-2); align-items center; mono; font-size 10px; color text-3
```

---

### 2.12 `AssetDetailModal.jsx`

**Props:**
```js
{
  asset: CreativeAsset,
  onClose: () => void,
  onRepurpose: (asset: CreativeAsset) => void,
  onDownload: (asset: CreativeAsset) => void,
  onDelete: (id: string) => void,
}
```

**Local state:**
```js
const [copiedUrl, setCopiedUrl] = useState(false)
const [confirmDelete, setConfirmDelete] = useState(false)
```

**ESC key handler:**
```js
useEffect(() => {
  const handler = (e) => { if (e.key === 'Escape') onClose() }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [onClose])
```

**Preview by type:**
```js
// image: <img src={asset.url} className="cf-modal-preview-img" />
// video: <video src={asset.url} controls className="cf-modal-preview-video" />
// copy: <pre className="cf-modal-preview-copy">{asset.metadata?.content}</pre>
```

**CSS classes:**
```
.cf-modal-overlay         position fixed; inset 0; bg rgba(0,0,0,0.85); display flex; align-items center; justify-content center; z-index var(--z-modal)
.cf-modal                 width 800px; max-height 85vh; overflow auto; bg var(--color-bg-2); border 1px solid var(--color-primary); display flex; flex-direction column
.cf-modal-header          position sticky; top 0; bg var(--color-bg-3); border-bottom 1px solid var(--color-border); padding 16px 24px; display flex; justify-content space-between; align-items center; z-index 1
.cf-modal-title           font-family var(--font-editorial); font-size 20px; color var(--color-primary); margin 0
.cf-modal-close           mono; font-size 11px; font-weight 700; color text-3; bg transparent; border 1px solid var(--color-border); padding 6px 10px; cursor pointer; transition all 120ms
.cf-modal-close:hover     color text-primary; border-color text-2
.cf-modal-preview         bg #000; overflow hidden
.cf-modal-preview-img     width 100%; display block; max-height 420px; object-fit contain
.cf-modal-preview-video   width 100%; display block; max-height 420px
.cf-modal-preview-copy    padding var(--space-5); font-family mono; font-size 11px; color text-2; white-space pre-wrap; line-height 1.6; max-height 280px; overflow-y auto; bg rgba(255,255,255,0.02)
.cf-modal-meta            display grid; grid-template-columns 1fr 1fr; gap 1px; bg var(--color-border); margin-top 1px
.cf-modal-meta-cell       bg var(--color-bg-2); padding 10px 16px
.cf-modal-meta-label      mono; font-size 9px; font-weight 700; color text-3; text-transform uppercase; margin-bottom 3px
.cf-modal-meta-value      font-size 12px; color text-primary
.cf-modal-prompt-block    padding 16px 24px; border-top 1px solid var(--color-border)
.cf-modal-prompt-label    mono; font-size 9px; font-weight 700; color text-3; text-transform uppercase; margin-bottom 8px
.cf-modal-prompt-text     font-size 12px; color text-2; line-height 1.6
.cf-modal-actions         position sticky; bottom 0; bg var(--color-bg-3); border-top 1px solid var(--color-border); padding 16px 24px; display flex; gap var(--space-3); justify-content flex-end
.cf-modal-action-btn      padding 8px 16px; border 1px solid var(--color-border); mono; font-size 11px; font-weight 700; color text-2; bg transparent; cursor pointer; transition all 120ms
.cf-modal-action-btn:hover  border-color text-primary; color text-primary
.cf-modal-action-btn--primary  bg var(--color-primary); color #000; border-color var(--color-primary)
.cf-modal-action-btn--primary:hover  bg #FFC400
.cf-modal-action-btn--danger  color var(--color-danger); border-color var(--color-danger)
```

---

### 2.13 `BriefEditorModal.jsx`

**Props:**
```js
{
  brief: CreativeBrief | {},         // {} for new brief
  deals: Deal[],
  onSave: (data: CreativeBrief) => Promise<void>,
  onClose: () => void,
}
```

**Local state:**
```js
const [form, setForm] = useState({
  title: brief.title || '',
  category: brief.category || 'Marketing',
  campaign_id: brief.campaign_id || null,
  tags: brief.tags || [],
  sections: brief.sections || [{ label: 'Objetivo', content: '' }],
})
const [tagInput, setTagInput] = useState('')
const [aiSuggesting, setAiSuggesting] = useState(false)
const [saving, setSaving] = useState(false)
```

**Section operations:**
```js
const addSection = () => setForm(f => ({ ...f, sections: [...f.sections, { label: '', content: '' }] }))
const removeSection = (i) => setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }))
const updateSection = (i, key, val) => setForm(f => ({
  ...f, sections: f.sections.map((s, idx) => idx === i ? { ...s, [key]: val } : s)
}))
```

**AI Suggest handler:**
```js
const handleAISuggest = async () => {
  setAiSuggesting(true)
  // Calls Copilot edge function with structured prompt
  // Streams section content one section at a time
  // Uses updateSection() as chunks arrive
  setAiSuggesting(false)
}
```

**Save handler:**
```js
const handleSave = async () => {
  if (!form.title.trim() || form.sections.length === 0) return
  setSaving(true)
  await onSave(form)
  setSaving(false)
}
```

**ESC closes modal** — same pattern as AssetDetailModal.

**CSS classes:**
```
(inherits cf-modal-overlay, cf-modal, cf-modal-header, cf-modal-actions patterns)
.cf-editor-body           padding 24px; display flex; flex-direction column; gap var(--space-5)
.cf-editor-row-2          display grid; grid-template-columns 1fr 1fr; gap var(--space-4)
.cf-editor-tags           display flex; flex-wrap wrap; gap var(--space-1); align-items center; margin-top var(--space-2)
.cf-editor-tag-pill       mono; font-size 9px; padding 2px 6px; bg rgba(255,255,255,0.05); border 1px solid var(--color-border); color text-3; display flex; align-items center; gap 4px
.cf-editor-tag-remove     bg transparent; border none; color text-3; cursor pointer; padding 0 2px; font-size 10px; line-height 1
.cf-editor-tag-input      bg transparent; border none; border-bottom 1px solid var(--color-border); mono; font-size 11px; color text-primary; padding 2px 4px; min-width 80px; outline none
.cf-sections-header       display flex; justify-content space-between; align-items center; margin-bottom var(--space-3)
.cf-sections-label        mono; font-size 9px; font-weight 700; color text-3; text-transform uppercase
.cf-ai-suggest-btn        padding 6px 12px; border 1px solid var(--color-primary); color var(--color-primary); mono; font-size 9px; font-weight 700; bg transparent; cursor pointer; transition all 120ms
.cf-ai-suggest-btn:hover  bg rgba(255,212,0,0.08)
.cf-ai-suggest-btn--active animation cf-flash 1.5s infinite; pointer-events none
.cf-section-row           border 1px solid var(--color-border); bg var(--color-bg-3); padding var(--space-3); display flex; flex-direction column; gap var(--space-2); position relative
.cf-section-label-input   bg transparent; border none; border-bottom 1px solid var(--color-border); mono; font-size 10px; font-weight 700; color text-3; text-transform uppercase; letter-spacing 0.05em; padding-bottom 4px; outline none; width 100%
.cf-section-label-input:focus  border-bottom-color var(--color-primary); color text-primary
.cf-section-textarea      bg rgba(0,0,0,0.3); border 1px solid var(--color-border); font-family mono; font-size 11px; color text-primary; padding var(--space-3); resize vertical; min-height 72px; transition border-color 120ms
.cf-section-textarea:focus  border-color var(--color-primary); outline none
.cf-section-remove        position absolute; top var(--space-2); right var(--space-2); bg transparent; border none; mono; font-size 11px; color text-3; cursor pointer; padding 2px 6px; transition color 120ms
.cf-section-remove:hover  color var(--color-danger)
.cf-add-section-btn       bg transparent; border 1px dashed var(--color-border); width 100%; padding var(--space-3); mono; font-size 10px; font-weight 700; color text-3; cursor pointer; transition all 120ms
.cf-add-section-btn:hover border-color text-2; color text-2; bg rgba(255,255,255,0.02)
.cf-save-btn              bg var(--color-primary); color #000; padding 8px 20px; border 1px solid var(--color-primary); mono; font-size 11px; font-weight 700; cursor pointer; transition all 120ms
.cf-save-btn:hover        bg #FFC400
.cf-save-btn:disabled     opacity 0.4; cursor not-allowed
.cf-abort-btn             bg transparent; border 1px solid var(--color-border); color text-3; padding 8px 16px; mono; font-size 11px; font-weight 700; cursor pointer; transition all 120ms
.cf-abort-btn:hover       border-color text-2; color text-primary
```

---

## 3. Hook Specifications

### `useCreativeJobs.js`

```js
// Manages creative_jobs + asset_variants realtime subscriptions
// Populates store.jobs via addJob / updateJob
// Populates store.variantJobs via addVariantJob / updateVariantJob
// Returns: { loading }

// Channel: 'cf-jobs-{org_id}'
// Subscribes to: creative_jobs INSERT + UPDATE
//                asset_variants INSERT + UPDATE
// On INSERT creative_jobs: addJob(newJob)
// On UPDATE creative_jobs: updateJob(newJob.id, newJob)
// On INSERT asset_variants: addVariantJob(newVariant)
// On UPDATE asset_variants: updateVariantJob(newVariant.id, newVariant)
```

### `useCreativeAssets.js`

```js
// Fetches creative_assets based on filter object
// Realtime subscription appends new READY assets to top of list
// Returns: { assets: CreativeAsset[], loading: boolean, total: number }
// Parameters: filters (from store.assetFilters)

// Initial fetch: .from('creative_assets').select('*, deals(name)').match(filterMatcher(filters)).order('created_at', { ascending: false })
// Realtime: on INSERT (status=ready), prepend to assets list
// Debounce: search filter change debounced 300ms before triggering re-fetch
```

### `useCreativeBriefs.js`

```js
// Full CRUD for creative_briefs
// Returns:
//   briefs: CreativeBrief[]
//   loading: boolean
//   createBrief: (data) => Promise<CreativeBrief>
//   updateBrief: (id, data) => Promise<void>
//   deleteBrief: (id) => Promise<void>
//   cloneBrief: (id) => Promise<CreativeBrief>

// Realtime subscription on INSERT/UPDATE/DELETE → full refetch (small table, safe)
// cloneBrief: fetches original, strips id/timestamps, sets title "Copy of ...", inserts
```

---

## 4. Module Navigation/Routing

The module uses a **single route** `/creative-factory`. No sub-routes.

Internal navigation is entirely driven by `useCreativeStore.activeView`. The four view components mount/unmount based on this value.

**App.jsx registration** (when CreativeStudio.jsx is replaced):
```js
// Replace existing:
// { path: '/creative', component: lazy(() => import('./components/modules/CreativeStudio')) }
// With:
{ path: '/creative-factory', component: lazy(() => import('./components/modules/CreativeFactory')) }
// Add redirect for backward compat:
{ path: '/creative', redirect: '/creative-factory' }
```

**Copilot navigate action path**: `'/creative-factory'` — update `navShortcuts` in `CopilotChat.jsx` to use new path when module is live.

---

## 5. CSS Architecture Summary

All CSS lives in `CreativeFactory.css`. Organization order:

```css
/* 1. Root container */
.cf-root { ... }
.cf-header { ... }
.cf-tab-bar { ... }
.cf-tab-btn { ... }
.cf-tab-btn--active { ... }
.cf-error-banner { ... }
.cf-content { ... }

/* 2. Shared panel primitives */
.cf-panel { ... }
.cf-panel-header { ... }
.cf-panel-body { ... }
.cf-label { ... }
.cf-input-group { ... }

/* 3. Factory Floor */
.cf-factory-grid { ... }
.cf-request-panel { ... }
.cf-type-selector { ... }
.cf-type-btn { ... }
.cf-type-btn--active { ... }
.cf-engine-select { ... }
.cf-prompt-textarea { ... }
.cf-campaign-select { ... }
.cf-deploy-btn { ... }
.cf-deploy-btn--working { ... }
.cf-job-queue-panel { ... }
.cf-queue-header { ... }
.cf-queue-body { ... }
.cf-queue-count { ... }
.cf-queue-empty { ... }
.cf-job-card { ... }
.cf-job-card--completed { ... }
.cf-job-card--failed { ... }
.cf-job-card-header { ... }
.cf-job-id { ... }
.cf-job-type-badge { ... }
.cf-job-status-badge { ... }
.cf-job-progress-track { ... }
.cf-job-progress-bar { ... }
.cf-job-thumb-area { ... }
.cf-job-thumb { ... }
.cf-job-thumb-skeleton { ... }
.cf-job-footer { ... }
.cf-job-actions { ... }

/* 4. Asset Library */
.cf-library-layout { ... }
.cf-library-filters { ... }
.cf-filter-group { ... }
.cf-filter-pill { ... }
.cf-filter-pill--active { ... }
.cf-filter-select { ... }
.cf-search-input { ... }
.cf-library-grid-wrapper { ... }
.cf-asset-grid { ... }
.cf-library-count { ... }
.cf-asset-card { ... }
.cf-asset-card-thumb { ... }
.cf-asset-thumb-img { ... }
.cf-asset-thumb-copy { ... }
.cf-asset-card-meta { ... }
.cf-asset-type-badge { ... }
.cf-asset-engine { ... }
.cf-asset-campaign { ... }
.cf-asset-date { ... }
.cf-asset-card-actions { ... }
.cf-asset-action-btn { ... }
.cf-asset-overflow-menu { ... }
.cf-asset-overflow-item { ... }
.cf-asset-overflow-item--danger { ... }

/* 5. Repurpose Lab */
.cf-lab-grid { ... }
.cf-lab-source-panel { ... }
.cf-lab-variant-panel { ... }
.cf-lab-source-thumb { ... }
.cf-lab-source-empty { ... }
.cf-lab-prompt-excerpt { ... }
.cf-lab-change-source { ... }
.cf-format-grid { ... }
.cf-format-item { ... }
.cf-format-item--selected { ... }
.cf-format-checkbox { ... }
.cf-format-label { ... }
.cf-generate-btn { ... }
.cf-variant-card { ... }
.cf-variant-card--ready { ... }
.cf-variant-card--failed { ... }
.cf-variant-format { ... }
.cf-variant-status { ... }
.cf-variant-progress { ... }
.cf-variant-progress-bar { ... }
.cf-variant-thumb { ... }
.cf-variant-download-btn { ... }
.cf-download-all-btn { ... }

/* 6. Brief DB */
.cf-briefs-layout { ... }
.cf-briefs-filters { ... }
.cf-briefs-grid-wrapper { ... }
.cf-briefs-grid { ... }
.cf-brief-card { ... }
.cf-brief-card::before { ... }
.cf-brief-card-title { ... }
.cf-brief-category { ... }
.cf-brief-campaign { ... }
.cf-brief-tags { ... }
.cf-brief-tag { ... }
.cf-brief-actions { ... }
.cf-brief-action-btn { ... }
.cf-brief-action-btn--danger { ... }
.cf-brief-delete-confirm { ... }

/* 7. Modals */
.cf-modal-overlay { ... }
.cf-modal { ... }
.cf-modal-header { ... }
.cf-modal-title { ... }
.cf-modal-close { ... }
.cf-modal-preview { ... }
.cf-modal-preview-img { ... }
.cf-modal-preview-video { ... }
.cf-modal-preview-copy { ... }
.cf-modal-meta { ... }
.cf-modal-meta-cell { ... }
.cf-modal-meta-label { ... }
.cf-modal-meta-value { ... }
.cf-modal-prompt-block { ... }
.cf-modal-prompt-label { ... }
.cf-modal-prompt-text { ... }
.cf-modal-actions { ... }
.cf-modal-action-btn { ... }
.cf-modal-action-btn--primary { ... }
.cf-modal-action-btn--danger { ... }
.cf-editor-body { ... }
.cf-editor-row-2 { ... }
.cf-editor-tags { ... }
.cf-editor-tag-pill { ... }
.cf-editor-tag-remove { ... }
.cf-editor-tag-input { ... }
.cf-sections-header { ... }
.cf-sections-label { ... }
.cf-ai-suggest-btn { ... }
.cf-ai-suggest-btn--active { ... }
.cf-section-row { ... }
.cf-section-label-input { ... }
.cf-section-textarea { ... }
.cf-section-remove { ... }
.cf-add-section-btn { ... }
.cf-save-btn { ... }
.cf-abort-btn { ... }

/* 8. Animations */
@keyframes cf-flash { ... }
@keyframes cf-pulse { ... }
@keyframes cf-view-in { ... }
@keyframes cf-view-out { ... }

/* 9. Responsive */
@media (max-width: 1023px) { ... }
@media (max-width: 767px) { ... }
```

---

## 6. Integration Checklist for Implementation

When implementing from this spec, verify these integration points in order:

- [ ] `useCreativeStore.js` created and all selectors use narrow access pattern `useStore(s => s.field)` per CLAUDE.md Zustand rules
- [ ] `useCreativeJobs.js` channel cleanup on unmount (mirrors `useAgents.js` pattern)
- [ ] `useCreativeAssets.js` search debounce 300ms exactly — not in store, in hook or component
- [ ] `useCreativeBriefs.js` cloneBrief strips `id` and `created_at` / `updated_at` before insert
- [ ] `creative-request` edge function exists before FactoryFloor deploy button is active (UI can render in degraded state — button disabled with tooltip if fn not deployed)
- [ ] `creative-repurpose` edge function exists before Repurpose Lab generate button is active
- [ ] `TOOL_LABELS` in `CopilotChat.jsx` extended with 5 new entries
- [ ] `agent-copilot` tool dispatch extended with 5 new cases
- [ ] `set_creative_lab_source` action handled in `CopilotChat.jsx` `handleSend` actions loop
- [ ] New route `/creative-factory` registered in `App.jsx` lazy-load table
- [ ] Copilot `navShortcuts` array includes `{ label: 'CREATIVE FACTORY', path: '/creative-factory', hint: 'Genera assets y gestiona briefs' }`
- [ ] All CSS uses `cf-` prefix exclusively — no `cs-` classes in new files
- [ ] No hardcoded color values — all `var(--color-*)` per CLAUDE.md
- [ ] No hardcoded font strings — all `var(--font-sans)` / `var(--font-mono)`
- [ ] Modals use ESC key handler with cleanup
- [ ] Delete operations use confirmation pattern (inline or modal) before DB write
