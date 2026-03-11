# Creative Factory — Next Steps
> Agent: code-reviewer (Agent 6) | Date: 2026-03-11
> The 3 most impactful immediate next actions, ranked and fully specified.
> Each action is self-contained, independently deployable, and verified against actual file contents.

---

## Ranking Criteria

Each action scored on:
1. **Value delivered to user** — does it make the module meaningfully more usable?
2. **Unblocks downstream work** — does completing it unlock the most other tasks?
3. **Lowest risk** — can it fail safely? Is it reversible? Does it require no new dependencies?

---

## ACTION 1 — Apply the creative factory migration

**Rank score:** 10/10 value · 10/10 unblocks · 7/10 risk (DB change is not easily reversed)

**Why this first:**
Every Phase 4–9 task depends on the 9 DB tables from Agent 5's migration. Without them, `useCreativeAssets`, `useBriefs`, the job engine, Copilot tools, event triggers, and the full gallery rebuild are all blocked. This single action unlocks 25+ tasks from the registry. It also has the highest leverage-to-effort ratio of any action in the backlog — running one command unblocks weeks of parallel work.

**Pre-condition check (do this before running the migration):**
```bash
# Confirm no partial tables exist yet
supabase db diff --linked | grep "creative_"
# Expected output: no tables found (all will be new)

# Confirm migration file exists and matches spec
ls supabase/migrations/ | grep "20260320100000"
# If missing: file must be created from Agent 5's creative_data_model.md before proceeding
```

**Exact file to create (if not already present):**
`/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/migrations/20260320100000_creative_factory.sql`

The complete SQL is in `docs/creative-factory/creative_data_model.md` under the "Migration File" section. That file contains the full DDL for all 9 tables, indexes, RLS policies, updated_at triggers, and realtime subscriptions.

**Exact command to run:**
```bash
cd "/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS"
npx supabase db push --linked
```

**Verification:**
```bash
# Confirm all 9 tables created
supabase db diff --linked
# Should show no diff if migration applied cleanly

# In Supabase Studio (https://supabase.com/dashboard/project/yxzdafptqtcvpsbqkmkm/database/tables):
# Confirm presence of: creative_briefs, creative_requests, creative_jobs, creative_assets,
# asset_variants, engine_runs, asset_performance, campaign_assets, creative_feedback_signals
```

**Estimated lines of new SQL:** ~350 (migration file, already written by Agent 5)
**Risk mitigation:** If migration fails mid-way, run `supabase db reset --linked` to revert. All existing 46 tables are unaffected (new tables only, no modifications to existing schema).

**Unlocks:** TASK-CF-013, and consequently: CF-014, CF-015, CF-016, CF-017, CF-018, CF-020, CF-021, CF-022, CF-023, CF-024, CF-025, CF-026, CF-029, CF-030, CF-034, CF-035, CF-036.

---

## ACTION 2 — Fix the video `<img>` bug and CSS token violations (two independent changes, zero dependencies)

**Rank score:** 9/10 value · 6/10 unblocks · 10/10 risk (pure UI, fully reversible, no DB)

**Why this second:**
These are the two bugs that make the module look broken TODAY with zero infrastructure dependencies. They can be fixed and deployed in under 30 minutes. The video bug (BUG-001) means VEO 3 generates are visually indistinguishable from broken image assets. The CSS token violations (BUG-008) mean the module may render incorrectly on any machine that has completed the token rebrand — which per CLAUDE.md is already done. Both fixes are isolated to two files with zero risk of side effects.

**Fix A — Video rendering (BUG-001):**

**File:** `src/components/modules/CreativeStudio.jsx`

**Change at line 212–214** — replace:
```jsx
asset.type === 'video'
  ? <img src={asset.url} alt="Video preview" className="cs-asset-media" />
  : <img src={asset.url} alt="Generated asset" className="cs-asset-media" />
```
**With:**
```jsx
asset.type === 'video'
  ? <video src={asset.url} controls preload="metadata" className="cs-asset-media" />
  : <img src={asset.url} alt="Generated asset" className="cs-asset-media" />
```

**Estimated lines changed:** 3 lines

**Fix B — CSS token violations (BUG-008):**

**File:** `src/components/modules/CreativeStudio.css`

Apply these replacements globally (use replace_all or sed):

| Find (deleted token) | Replace with (canonical token) |
|---|---|
| `var(--accent-primary)` | `var(--color-primary)` |
| `var(--text-primary)` | `var(--color-text)` |
| `var(--text-secondary)` | `var(--color-text-2)` |
| `var(--border-default)` | `var(--color-border)` |
| `var(--surface-raised)` | `var(--color-bg-3)` |
| `var(--gradient-accent)` | `var(--color-primary)` |
| `var(--shadow-glow)` | `0 0 0 1px var(--color-border)` |
| `var(--shadow-md)` | `0 0 0 1px var(--color-border)` |
| `var(--glass-inner-glow)` | (remove the entire property line) |

Also remove all `backdrop-filter` and `-webkit-backdrop-filter` lines (3 occurrences at approx L47-48, L133-134, L509-510). These violate the "NO glassmorphism" rule.

**Estimated lines changed in CSS:** ~35–40 replacements across 560 lines

**Verification for both fixes:**
```bash
# Start dev server
npm run dev

# Navigate to /creative
# Verify: model selector active state shows gold border (color-primary token working)
# Verify: panel borders render as 1px dark lines (color-border token working)
# Select VEO 3 model, verify: asset cards for video type would render <video> element
# Run token check:
grep -n -- '--accent-primary\|--text-primary\|--text-secondary\|--border-default\|--surface-raised\|--gradient-accent\|--shadow-glow\|--shadow-md\|--glass-inner-glow' src/components/modules/CreativeStudio.css
# Expected output: zero matches
```

**Unlocks:** TASK-CF-027 (done), TASK-CF-028 (done), TASK-CF-040 (validation passes), unblocks TASK-CF-029 partially (CSS must be clean before full gallery rebuild).

---

## ACTION 3 — Fix the mock response key mismatch and add explicit error for unconfigured keys

**Rank score:** 9/10 value · 8/10 unblocks · 9/10 risk (edge function change, deploy to Supabase)

**Why this third:**
Currently, every generation attempt silently falls through to hardcoded Unsplash/GitHub URLs (BUG-003 + BUG-004). The module has never successfully returned an AI-generated asset — not even in the mock path. Fixing this means that either:
- (Keys configured) Real generation succeeds and the URL is correctly read
- (Keys not configured) The user sees a clear, honest error instead of a fake success

This is the minimum change needed to make the generation flow tell the truth. It also unblocks the response-shape assumptions in every downstream task that reads from the result object. Without this fix, even after ACTION 1 (DB migration), the job-engine refactor would still produce gallery items with wrong URLs.

**IMPORTANT — deploy ONLY after rate limiting is also in place (TASK-CF-010). If deploying to production where real keys could be set at any time, implement rate limiting in the same deployment.**

**File 1:** `supabase/functions/banana-generate/index.ts`

**Change 1 — Replace silent mock (lines 29–39) with explicit 503 error:**
```typescript
// REMOVE this entire block:
if (!BANANA_API_KEY || !BANANA_MODEL_KEY) {
  console.warn('BANANA_API_KEY or BANANA_MODEL_KEY is not set. Mocking response for testing.')
  return new Response(JSON.stringify({
    status: 'success',
    mediaUrl: 'https://storage.googleapis.com/oculops-mock/mock-image-banana.png',
    message: 'Mocked successful Nano Banana response due to missing API key.'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

// REPLACE with:
if (!BANANA_API_KEY || !BANANA_MODEL_KEY) {
  return new Response(JSON.stringify({
    error: 'API_KEY_NOT_CONFIGURED',
    message: 'Image generation is not yet activated. Please contact your administrator.'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 503,
  })
}
```

**Change 2 — Normalize real API response (lines 58–64):**
Replace the raw `bananaRes` passthrough with a normalized response:
```typescript
// Extract URL from Banana API response (actual key TBD — check Banana API docs)
// Common keys: modelOutputs[0], output[0], generated_image_url
const outputUrl = bananaRes?.modelOutputs?.[0] || bananaRes?.output?.[0] || bananaRes?.url || null

return new Response(JSON.stringify({
  url: outputUrl,
  type: 'image',
  engine: 'banana',
  mocked: false,
  raw: bananaRes  // keep raw for debugging during initial activation
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  status: outputUrl ? 200 : 500,
})
```

**File 2:** `supabase/functions/veo-generate/index.ts`

Apply identical changes:

**Change 1 — Replace silent mock (lines 28–38):**
```typescript
if (!VEO_API_KEY) {
  return new Response(JSON.stringify({
    error: 'API_KEY_NOT_CONFIGURED',
    message: 'Video generation is not yet activated. Please contact your administrator.'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 503,
  })
}
```

**Change 2 — Normalize real API response:**
```typescript
const outputUrl = veoRes?.url || veoRes?.video_url || veoRes?.output || null

return new Response(JSON.stringify({
  url: outputUrl,
  type: 'video',
  engine: 'veo3',
  mocked: false,
  raw: veoRes
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  status: outputUrl ? 200 : 500,
})
```

**File 3:** `src/components/modules/CreativeStudio.jsx`

**Change — Remove hardcoded fallback URLs (lines 88–93):**
```jsx
// REPLACE:
const result = await generateImage(newAsset.prompt)
updateGalleryItem(newAsset.id, { status: 'ready', url: result?.url || result?.output || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80' })

// WITH:
const result = await generateImage(newAsset.prompt)
if (!result?.url) throw new Error('No output URL returned by generation engine.')
updateGalleryItem(newAsset.id, { status: 'ready', url: result.url })

// REPLACE:
const result = await generateVideo(newAsset.prompt)
updateGalleryItem(newAsset.id, { status: 'ready', url: result?.url || result?.output || 'https://raw.githubusercontent.com/intel-isl/MiDaS/master/teaser.gif' })

// WITH:
const result = await generateVideo(newAsset.prompt)
if (!result?.url) throw new Error('No output URL returned by generation engine.')
updateGalleryItem(newAsset.id, { status: 'ready', url: result.url })
```

**Also update error banner message mapping** (line 130) to map `API_KEY_NOT_CONFIGURED` to a friendly string:
```jsx
// REPLACE:
<span className="mono cs-error-text">SYS_ERR: {error}</span>

// WITH:
<span className="mono cs-error-text">
  {error === 'API_KEY_NOT_CONFIGURED'
    ? 'Generation not yet activated. Contact your administrator.'
    : error?.includes('No output URL')
    ? 'Generation completed but no asset URL was returned. Check edge function logs.'
    : 'Generation failed. Please try again.'}
</span>
```

**Estimated lines changed:**
- banana-generate/index.ts: ~20 lines changed (mock removal + normalization)
- veo-generate/index.ts: ~20 lines changed (same)
- CreativeStudio.jsx: ~10 lines changed

**Deploy commands:**
```bash
cd "/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS"
supabase functions deploy banana-generate
supabase functions deploy veo-generate
```

**Verification:**
```bash
# With keys NOT set (503 path):
curl -s -X POST \
  https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/banana-generate \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' | jq .
# Expected: {"error":"API_KEY_NOT_CONFIGURED","message":"Image generation is not yet activated..."}

# In UI: submit a prompt → error banner shows friendly message (not raw error)
# Verify: gallery item shows [ERROR] status, NOT [READY] with Unsplash photo
```

**Unlocks:** TASK-CF-005, CF-006, CF-009 (partially), sets correct response shape contract for CF-012 (creative-generate router), CF-014 (hook refactor).

---

## Health Score — Creative Factory Module (Current State)

| Dimension | Score | Rationale |
|---|---|---|
| **Functionality** | 2/10 | UI renders and toggles work. Generation flow exists but is entirely non-functional end-to-end (BUG-003: all results are hardcoded URLs). Brief library is a static constant. Nothing persists. Video does not play. |
| **Data persistence** | 0/10 | Zero. Gallery is in-memory only. Briefs are hardcoded. No DB tables exist for creative domain. Navigation resets all state. |
| **Agent integration** | 1/10 | FORGE agent exists and generates content, but is never called from any UI component. Higgsfield keys are orphaned. No Copilot tools. No event bus emissions. agent-forge output does not mirror to creative_assets. |
| **Copilot awareness** | 0/10 | Copilot has no tools for creative assets. Cannot query what assets exist. Cannot trigger generation. Cannot reference last generated asset. CreativeStudio is completely invisible to the Copilot layer. |
| **UI quality** | 4/10 | Visual design is coherent and matches the war-room aesthetic intention. CSS structure is clean. However: uses 10+ deleted design tokens, has glassmorphism violations, renders video as img, provides no toast feedback, shows raw error messages. The layout works; the polish is broken. |
| **Overall** | **1.4/10** | The module is a UI shell with a broken generation pipeline, no persistence, no agent connections, and no Copilot awareness. It accurately represents a "Phase 0" state: the scaffolding exists, the product does not. All critical infrastructure is designed (Agents 1–5) but not applied. The three actions above will raise the overall score to approximately 4/10 by fixing the most damaging bugs without requiring new infrastructure. Full completion of the task registry brings the module to production-ready. |

---

## Accelerated Path to Minimum Viable Module

If time is constrained, these 5 tasks in sequence produce a working Creative Studio with real persistence in the shortest path:

1. **ACTION 3** — Fix mock mismatch (today, 1 hour) → generation tells the truth
2. **ACTION 1** — Apply migration (today, 30 min) → DB tables exist
3. **TASK-CF-015** — Create useCreativeAssets hook (1 day) → gallery persists
4. **ACTION 2** — Fix video + CSS (today, 1 hour) → module looks correct
5. **TASK-CF-029** — Wire gallery to Supabase (1 day) → assets survive refresh

After these 5 steps: a user can generate an image/video (or see an honest error), the asset persists in DB, the gallery survives navigation and refresh, and the CSS renders correctly. That is a real, functional creative module — not production-grade, but not a lie either.

Estimated total effort: 2–3 focused development days.
