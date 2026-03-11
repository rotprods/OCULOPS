# Creative Factory — Current vs Target Gap Map
> OCULOPS | Creative Factory Design | 2026-03-11
> Brutal audit. No sugar-coating.

---

## Summary Verdict

The CreativeStudio module is a UI prototype with a broken backend. It has never successfully delivered a real generated asset end-to-end. The gap between where it is and where it needs to be is large across every layer: the response contract is wrong (mock returns `mediaUrl`, frontend reads `url`), there is no DB persistence, no agent connection, and the CSS references tokens that do not exist. The good news: the UI shell is structurally sound, and the backend design documented in `creative_jobs_schema.md` and `creative_backend_integrations.md` is solid — it just needs to be built.

---

## File-by-File Classification

---

### 1. `src/components/modules/CreativeStudio.jsx` — REFACTOR

**What it is:** 276-line React component. Two views: `deploy` (media generation) and `briefs` (brief library). BriefEditor modal with clipboard export.

**Why not KEEP:** The core generation flow is broken. The component reads `result?.url || result?.output` but both mock edge functions return `result.mediaUrl`. Every generation falls through to a hardcoded Unsplash fallback URL. No real asset has ever been displayed.

**Why not REBUILD:** The UI structure is correct. The two-view layout, gallery grid, BriefEditor modal, and filter pattern are all reusable. The component does not need to be thrown away — it needs to be rewired.

**Specific changes needed:**

| Issue | Location | Fix |
|-------|----------|-----|
| Wrong response key | `handleDeploy()` lines 90, 93 — reads `result?.url` | Change to `result?.output_url` to match `CreativeJobRow` schema |
| In-memory-only gallery | `gallery` state in `useState([])` | Replace with `useCreativeFactory()` hook — jobs come from DB via Supabase realtime |
| Hardcoded fallback URLs | Lines 90–91, 93–94 | Remove entirely. If URL is null, show error state. No Unsplash fallback. |
| No job ID tracking | `newAsset.id = crypto.randomUUID()` is frontend-generated | Use `job_id` returned from `creative-router` |
| No polling for async engines | `handleDeploy` awaits the function and treats all engines as sync | `useCreativeFactory.submitJob()` handles async poll via `startPolling()` |
| `modelTarget === 'veo3'` mismatch | Line 64, 88 | Selector sets `'veo3'` but backend expects `'veo'` — fix selector value |
| No Higgsfield engine | Model selector only has banana / veo3 | Add Higgsfield option (video_character_consistent) |
| Video rendered as `<img>` | Lines 212–214 — video type still uses `<img src>` | Use `<video>` tag for video output_type |
| BRIEF_TEMPLATES hardcoded | Lines 6–11, 4 items | Load from DB (`creative_briefs` table) with `useBriefs()` hook once table exists |
| BriefEditor clipboard-only | `exportBrief()` only writes to clipboard | Add "Create Job" action that submits a creative job from the brief fields |
| `useGenerativeMedia` import | Line 2 | Replace with `useCreativeFactory` import |

**Status of BriefEditor sub-component:** KEEP as-is. The modal pattern, section rendering, and clipboard export are correct. The only addition needed is a "Submit as Job" button.

---

### 2. `src/components/modules/CreativeStudio.css` — REFACTOR

**What it is:** 561-line CSS file. War room aesthetic, OLED black, gold accents. Well-structured with panel components, gallery grid, asset cards, brief library, and modal.

**Why not KEEP:** Uses at least 2 undefined tokens and references the old token vocabulary throughout.

**Why not REBUILD:** The visual design and layout logic are good. The file does not need to be rewritten — it needs targeted token fixes and a few structural additions for the new job status states.

**Broken token references (cause invisible or wrong styles):**

| Token used in CSS | Status | Fix |
|-------------------|--------|-----|
| `var(--glass-border-hover)` | **NOT DEFINED** anywhere in tokens.css | Replace with `var(--border-strong)` or add alias to tokens.css |
| `var(--transition-micro)` | **NOT DEFINED** anywhere in tokens.css | Replace with `var(--transition-fast)` (120ms, identical intent) |
| `var(--accent-primary)` | EXISTS in tokens.css v11 | Keep — valid |
| `var(--gradient-accent)` | EXISTS | Keep |
| `var(--glass-bg)`, `var(--glass-blur)`, `var(--glass-inner-glow)` | EXISTS | Keep |
| `var(--shadow-glow)` | EXISTS | Keep |
| `var(--surface-raised)` | EXISTS | Keep |
| `var(--border-subtle)` | EXISTS | Keep |
| `var(--text-tertiary)` | EXISTS (alias in backward-compat section) | Keep |
| `var(--border-default)` | **NOT DEFINED** — removed in v11 rebrand | Replace with `var(--border-subtle)` or `var(--border-strong)` depending on context |
| `var(--color-danger)` | EXISTS in tokens.css | Keep |
| `var(--font-editorial)` | EXISTS as alias → `var(--font-sans)` | Keep — renders correctly |
| `var(--text-inverse)` | EXISTS | Keep |
| `var(--text-primary)`, `var(--text-secondary)` | EXISTS in tokens.css v11 | Keep — these are NOT in the "deleted" list (CLAUDE.md is wrong about this; they exist) |

**Missing CSS for target state:**
- No styles for `status: 'queued'` (job in DB queue, not yet running)
- No styles for `status: 'waiting_external'` (async engine, polling active)
- No styles for progress bar on individual asset cards (0–100%)
- No engine badge on asset cards (shows which engine generated the asset)

**Additional structural gap:** `.cs-asset-preview` uses `aspect-ratio: 16/9` hardcoded. Generated images may be 1:1 or 9:16. The aspect ratio should come from `output_width` / `output_height` on the job record.

---

### 3. `src/hooks/useGenerativeMedia.js` — REBUILD

**What it is:** 56-line hook. Wraps `supabase.functions.invoke` for `banana-generate` and `veo-generate`. Tracks `isGeneratingImage`, `isGeneratingVFX`, and `error` in local state.

**Why REBUILD, not REFACTOR:** This hook is architecturally incompatible with the target system. The target uses `creative-router` (single entry point), `creative_jobs` DB persistence, and Supabase realtime for status updates. This hook speaks directly to two deprecated individual edge functions that are being replaced. Refactoring it would mean changing the function called, the request shape, the response handling, the state model (local gallery vs. DB-driven jobs), and the polling mechanism — at that point it's a rebuild, not a refactor.

The replacement is `useCreativeFactory.js` (designed in `creative_backend_integrations.md`). `useGenerativeMedia` should be deleted once the migration is complete.

**What NOT to lose when rebuilding:**
- The `useCallback` pattern on both generate functions — correct.
- The `import.meta.env.DEV` guard on console.error — correct.
- The `finally` block resetting loading state — correct.
- The `error` state exposed to consumers — correct. Replicate in `useCreativeFactory`.

---

### 4. `supabase/functions/banana-generate/index.ts` — REBUILD

**What it is:** 72-line Deno edge function. CORS handling, JWT presence check, mock path when keys missing, proxy to Banana Dev API.

**Why REBUILD, not REFACTOR:** Three separate architectural problems make this a rebuild:

1. **Wrong response contract.** Mock path returns `{ mediaUrl: "..." }`. Frontend reads `result?.url`. The mismatch means zero real-world testing was ever possible. The entire mock path is wrong.

2. **Sync-only, no job persistence.** The function returns the API result directly with no DB write. The target architecture requires every generation to create a `creative_jobs` row, emit events, and return a `job_id`. Grafting this onto the current function would require adding Supabase admin client, DB insert, event emission, and response normalization — the resulting function would share nothing with the current one except the import header.

3. **Old `serve()` pattern.** All newer functions in the project use `Deno.serve()`. The `serve()` from `https://deno.land/std@0.168.0/http/server.ts` is the legacy import pattern. Not a blocking bug but adds inconsistency and a stale std dependency.

**What to carry forward into the replacement (BananaAdapter):**
- The auth header presence check pattern.
- The `if (!BANANA_API_KEY || !BANANA_MODEL_KEY)` guard — but instead of mocking, throw `engine_unavailable`.
- The request body shape: `{ apiKey, modelKey, modelInputs: { prompt } }`.

---

### 5. `supabase/functions/veo-generate/index.ts` — REBUILD

**What it is:** 68-line Deno edge function. Same template as `banana-generate`.

**Why REBUILD:** Same reasons as banana-generate, plus a critical additional problem:

**Veo 3's real API is async.** The actual `POST /v3/generate` endpoint returns an operation name (e.g. `operations/abc123`) and an estimated completion time. You must poll `GET /operations/{name}` until `done: true`. The current function treats it as synchronous — `const veoRes = await veoReq.json()` followed by immediately returning the result. The moment a real `VEO_API_KEY` is added, this function will return a half-formed `{ name: "operations/...", done: false }` object, the frontend will try to read `.url` from it (undefined), and the generation will silently "succeed" with no output.

This is not a fixable edge case — it requires the entire async polling infrastructure. The function must be replaced by a VeoAdapter that submits the job, stores the operation name as `external_id`, and lets `creative-poller` handle status checks.

---

### 6. No `creative_jobs` DB table — MISSING (Block on Everything)

**What it is:** The table does not exist. Schema is designed in `creative_jobs_schema.md` but the migration (`20260320100000_creative_factory.sql`) has not been applied.

**Impact:** Everything in the target architecture is blocked until this table exists. `creative-router` cannot write job records. Realtime status updates to the UI are impossible. Asset library persistence is impossible. Agent FORGE cannot link output to jobs.

**What needs to happen:**
1. Apply migration `20260320100000_creative_factory.sql` (or create it if only a spec file exists).
2. Verify RLS policies: users see own jobs, service role has full access.
3. Enable realtime on the table.
4. Create the `creative_assets` table (linked to jobs, used by asset library).

---

## Priority Matrix — What to Do First

### Priority 1: Unblock Real API Usage (these ship together or not at all)

1. Fix the `mediaUrl` vs `url` response key mismatch in both edge functions and in `handleDeploy()`. This is a 5-minute fix that makes mock responses actually display in the gallery. It is the fastest possible signal that the pipeline works.

2. Apply the `creative_jobs` DB migration. Nothing real can persist without this table.

3. Replace `banana-generate` and `veo-generate` with a `BananaAdapter` inside the new `creative-router` function. Wire the response to return `{ job_id, status, output_url }`.

4. Fix `modelTarget === 'veo3'` → `'veo'` in the model selector.

### Priority 2: Enable Persistence

5. Build `useCreativeFactory.js` (designed in `creative_backend_integrations.md`). Subscribe to `creative_jobs` via Supabase realtime so asset cards update without polling.

6. Update `CreativeStudio.jsx` to consume `useCreativeFactory` instead of `useGenerativeMedia`. Replace the in-memory `gallery` state with `jobList` from the hook.

7. Remove the hardcoded Unsplash / GitHub fallback URLs from `handleDeploy`. Show an error state if `output_url` is null.

8. Build `creative-poller` with stale-job cleanup. Until this exists, Veo and Higgsfield jobs will hang in `waiting_external` forever.

### Priority 3: Enable Agent Integration

9. Connect `agent-forge` to `creative-router` (designed in `creative_backend_integrations.md` section 6). This makes FORGE output first-class assets in the library and unblocks campaign-to-asset linking.

10. Wire `correlation_id` from deals/campaigns to creative jobs so assets appear in the context of the campaign that generated them.

11. Build `creative-asset-writer` edge function triggered on `creative.job.completed` events.

### Priority 4: Improve UI Quality

12. Fix the 2 broken CSS tokens (`--glass-border-hover`, `--transition-micro`, `--border-default`).

13. Add `status: 'queued'` and `status: 'waiting_external'` visual states to asset cards, with a progress bar driven by `job.progress`.

14. Use `<video controls>` for video assets instead of `<img>`.

15. Fix the hardcoded `aspect-ratio: 16/9` in `.cs-asset-preview` — derive from `output_width / output_height`.

16. Load BRIEF_TEMPLATES from DB once `creative_briefs` table exists.

---

## Quick Wins — Under 30 Minutes Each

These can be done RIGHT NOW without any new infrastructure:

**Win 1 (~5 min): Fix the mock response mismatch**
In `banana-generate/index.ts` line 33, change `mediaUrl` → `url`.
In `veo-generate/index.ts` line 32, change `mediaUrl` → `url`.
In `CreativeStudio.jsx` lines 90 and 93, change `result?.url` → `result?.mediaUrl` (or pick one and align both sides). The mock will now display correctly.

**Win 2 (~5 min): Fix the broken CSS tokens**
In `CreativeStudio.css`:
- Replace all `var(--glass-border-hover)` → `var(--border-strong)` (3 occurrences: lines 307, 454, 569 of ProspectorHub too)
- Replace all `var(--transition-micro)` → `var(--transition-fast)` (2 occurrences: lines 412, 557)
- Replace `var(--border-default)` → `var(--border-subtle)` (line 24)
Card hover effects and filter button transitions are currently invisible — these 5 substitutions fix them.

**Win 3 (~10 min): Fix the `veo3` model target key**
In `CreativeStudio.jsx` line 64, change `'veo3'` → `'veo'`.
In line 88, change `modelTarget === 'banana'` check — also verify `'veo3'` comparison on line 159.
The selector currently sets a value that does not match the engine key the backend will expect.

**Win 4 (~10 min): Remove silent fallback URLs**
In `CreativeStudio.jsx` lines 90–91 and 93–94, remove the `|| 'https://images.unsplash.com/...'` and `|| 'https://raw.githubusercontent.com/...'` fallbacks. When `result?.url` is undefined, call `updateGalleryItem(newAsset.id, { status: 'error', error: 'No output returned' })` instead. This surfaces backend problems instead of hiding them behind stock photos.
