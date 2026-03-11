# Creative Factory — Validation Report
> Agent: code-reviewer (Agent 6) | Date: 2026-03-11
> Scope: Full audit of CreativeStudio.jsx, useGenerativeMedia.js, banana-generate, veo-generate, App.jsx routing, CSS token compliance, and integration coherence against architecture docs produced by Agents 1–5.

---

## 1. Current State Audit

### CONFIRMED WORKING
These items have working code with no external dependency required.

| Item | File | Evidence |
|------|------|----------|
| View toggle (Media Ops / Brief DB) | CreativeStudio.jsx L59, L117 | Pure React `useState`, no async path |
| Model selector (Banana / Veo3) | CreativeStudio.jsx L64, L148 | Pure UI state toggle, no side effects |
| Brief category filter | CreativeStudio.jsx L69–71 | In-memory filter on hardcoded array — works but is fake data |
| BriefEditor modal open/close | CreativeStudio.jsx L268 | Pure React state, no external call |
| BriefEditor clipboard export | CreativeStudio.jsx L17–22 | `navigator.clipboard.writeText` — works in HTTPS context |
| Loading animation (cs-loader-bar) | CreativeStudio.css L365–384 | CSS keyframe only, no JS |
| Error banner conditional render | CreativeStudio.jsx L127–132 | Renders when `error` is truthy — logic is correct |
| App.jsx routing | App.jsx L59, L208 | CreativeStudio lazy-loaded at `/creative`, wrapped in ErrorBoundary |
| useGenerativeMedia hook structure | useGenerativeMedia.js | Correct async/error/finally pattern per each function |

### PARTIAL (code exists but incomplete)

| Item | What exists | What is missing |
|------|-------------|-----------------|
| Media generation flow | Hook invokes edge functions, updates local state | No job_id, no DB row, no Supabase Storage upload, no campaign_id, no timeout/abort |
| Gallery rendering | Renders correctly from local state array | Lost on every page navigation or refresh; no persistence |
| Brief templates | 4 templates rendered and filterable | No DB table, no create/edit/delete, no save, no search beyond category filter |
| Error handling | Error state propagated from hook to banner | Raw `err.message` displayed (info leakage); no user-friendly mapping; no timeout error path |
| Video asset type branch | `asset.type === 'video'` branch exists at L212 | Uses `<img>` tag for video — content will not play |
| Edge function auth check | Both functions check `authHeader` exists (L18-19) | JWT is never verified against Supabase — presence check only |

### FAKE (UI-only, no real backend)

| Item | Appearance | Reality |
|------|-----------|---------|
| "ACTIVE ASSET STREAM" gallery | Looks like a live asset feed | 100% in-memory `useState([])`. Resets on every navigation. |
| Banana image generation result | Returns a URL, shows in gallery | When `BANANA_API_KEY` is missing: returns mock payload with key `mediaUrl`. Frontend reads `result?.url \|\| result?.output`. Neither key matches `mediaUrl`. Falls through to hardcoded Unsplash URL at L90. Both paths broken. |
| Veo3 video generation result | Returns a URL, shows in gallery | Same double-broken mock: mock key `mediaUrl` not read by frontend. Falls through to hardcoded GitHub GIF at L93. |
| Brief DB | Filter panel implies a database | No DB table. Hardcoded JS constant `BRIEF_TEMPLATES` (4 items, L6–11). |
| Higgsfield integration | Keys set in Supabase secrets | Zero edge functions reference `HIGGSFIELD_API_KEY_ID` or `HIGGSFIELD_API_SECRET`. Not wired anywhere. |

### BROKEN (confirmed bugs with reproduction path)

| Bug ID | Description | File:Line | Severity |
|--------|-------------|-----------|----------|
| BUG-001 | Video assets rendered with `<img>` tag — video URLs will not play | CreativeStudio.jsx L213 | HIGH |
| BUG-002 | Gallery resets on every page navigation — all generated work is lost | CreativeStudio.jsx L65 (`useState([])`) | HIGH |
| BUG-003 | Mock response key mismatch: functions return `mediaUrl`, frontend reads `result?.url \|\| result?.output`. All generation falls through to hardcoded fallback URLs regardless of mock or real path. | banana-generate L34 + veo-generate L32 vs CreativeStudio.jsx L90-93 | HIGH |
| BUG-004 | Silent mock: user receives fake "success" with no indication generation used a placeholder instead of real AI | banana-generate L31-39, veo-generate L29-38 | HIGH |
| BUG-005 | Raw `err.message` from Supabase/API rendered directly in UI — internal error details exposed | CreativeStudio.jsx L130 | MEDIUM |
| BUG-006 | No request timeout or AbortController — UI can hang indefinitely if edge function stalls | useGenerativeMedia.js L9-27, L29-47 | MEDIUM |
| BUG-007 | Hardcoded fallback URLs (Unsplash, GitHub raw) used as production image/video content | CreativeStudio.jsx L90-93 | MEDIUM |
| BUG-008 | CreativeStudio.css uses at least 10 deleted CSS tokens. Design system CLAUDE.md marks these as `ELIMINADOS`. Styles may resolve to `undefined` / render incorrectly. | CreativeStudio.css (pervasive) | MEDIUM |
| BUG-009 | No prompt `maxLength` — prompt field accepts unbounded input, sent verbatim to API | CreativeStudio.jsx L166-171, banana-generate L51, veo-generate L48 | MEDIUM |
| BUG-010 | No rate limiting on either edge function — real API activation without this is a cost explosion risk | banana-generate/index.ts, veo-generate/index.ts | MEDIUM |
| BUG-011 | Generation is synchronous/blocking from the frontend's perspective — one in-flight at a time, but no enforcement. Multiple rapid clicks on INITIATE GENERATION before `isWorking` updates can queue duplicate calls. | CreativeStudio.jsx L73-98, useGenerativeMedia.js | LOW |

### MISSING ENTIRELY

| Missing item | Impact |
|---|---|
| `generated_assets` / `creative_assets` DB table | Core persistence — all work lost on refresh |
| `creative_briefs` / `content_briefs` DB table | Brief library is fake without this |
| `creative_jobs` DB table | Async job tracking, realtime status updates |
| `supabase/migrations/20260320100000_creative_factory.sql` | Migration designed by Agent 5 but not applied |
| `useCreativeAssets` hook | Gallery persistence from Supabase |
| `useBriefs` hook | DB-backed brief CRUD |
| `useForgeContent` hook | FORGE agent integration |
| `higgsfield-generate` edge function | Keys exist in secrets but function file does not exist |
| `creative-generate` unified edge function | Designed in architecture doc, does not exist |
| Campaign_id association on assets | No link to campaigns table |
| Supabase Storage bucket for creative media | No bucket provisioned |
| Rate limiting on edge functions | Required before any real key activation |
| Input sanitization on prompt | Required before any real key activation |
| Copilot tools: `get_creative_assets`, `generate_asset` | Agent integration designed, not implemented |
| Event bus emissions for creative events | `creative.asset_ready`, `creative.job_failed` not wired |
| `react-hot-toast` feedback on generation success | All other modules use it; CreativeStudio does not |
| `asset_variants`, `engine_runs`, `asset_performance`, `campaign_assets`, `creative_feedback_signals` tables | Designed in data model, not applied |

---

## 2. Integration Coherence Check

### Frontend ↔ Backend Contract

**banana-generate:**
- Frontend sends: `{ prompt, modelInputs }` (useGenerativeMedia.js L33)
- Edge function reads: `{ prompt, modelInputs }` (banana-generate L23) — REQUEST match
- Mock response returns: `{ status, mediaUrl, message }` (banana-generate L32-38)
- Real response returns: raw Banana API payload (shape unknown without live test)
- Frontend reads: `result?.url || result?.output` (CreativeStudio.jsx L90)
- VERDICT: **BROKEN**. Neither mock key (`mediaUrl`) nor any likely real key matches what the frontend reads. The Unsplash fallback URL is always used. Mock is doubly broken.

**veo-generate:**
- Frontend sends: `{ prompt, options }` (useGenerativeMedia.js L14) — REQUEST match
- Mock response returns: `{ status, mediaUrl, message }` (veo-generate L31-37)
- Frontend reads: `result?.url || result?.output` (CreativeStudio.jsx L92-93)
- VERDICT: **BROKEN**. Same mismatch. GitHub GIF fallback always used.

### Hooks: Available vs. Used vs. Needed

| Hook | Exists | Used in CreativeStudio | Should be used |
|------|--------|----------------------|----------------|
| `useGenerativeMedia` | YES | YES | YES — requires refactor |
| `useCampaigns` | YES | NO | YES — campaign_id association |
| `useEventBus` | YES | NO | YES — emit `creative.asset_ready` |
| `useCreativeAssets` | NO | NO | NEEDS CREATION |
| `useBriefs` | NO | NO | NEEDS CREATION |
| `useForgeContent` | NO | NO | NEEDS CREATION |
| `useEdgeFunction` | YES | NO | Optional — abstraction layer |

### Supabase Tables: Required vs. Existing

| Table | Required for | Exists in DB |
|---|---|---|
| `creative_assets` | Asset persistence | **MISSING** — no migration applied |
| `creative_briefs` / `content_briefs` | Brief library | **MISSING** — no migration applied |
| `creative_jobs` | Job tracking + realtime | **MISSING** — no migration applied |
| `asset_variants` | Variant tracking | **MISSING** |
| `engine_runs` | Cost/debug logging | **MISSING** |
| `asset_performance` | Performance feedback | **MISSING** |
| `campaign_assets` | Campaign↔asset link | **MISSING** |
| `creative_feedback_signals` | Learning loop | **MISSING** |
| `campaigns` | FK target for assets | EXISTS (operational) |
| `contacts` | FK target for briefs | EXISTS (operational) |
| `deals` | FK target for assets | EXISTS (operational) |
| `knowledge_entries` | FORGE output landing | EXISTS (operational) |
| `event_log` | Creative events | EXISTS (operational) |

Migration `20260320100000_creative_factory.sql` is designed in full by Agent 5 but has NOT been applied. The current production DB has none of the 9 required creative tables.

### Edge Functions: Referenced vs. Deployed

| Function | Referenced in frontend | File exists locally | Architecture doc requirement |
|---|---|---|---|
| `banana-generate` | YES | YES | REFACTOR — accept job_id, write to creative_jobs |
| `veo-generate` | YES | YES | REFACTOR — accept job_id, write to creative_jobs |
| `creative-generate` | NO | NO | NEW — unified router function |
| `higgsfield-generate` | NO | NO | NEW — keys orphaned in secrets |
| `agent-forge` | NO (not called from UI) | YES | EXTEND — add campaign_id param |

**Remote deploy status** of `banana-generate` and `veo-generate` cannot be confirmed from local file system alone. CLAUDE.md lists 31 edge functions deployed. These two are not in the explicit list. Verification required: `supabase functions list`.

### Architecture Doc vs. Implementation Gap

The architecture documents (Agents 1–5) describe a complete 6-layer system. The current implementation covers approximately **Layer 1 (partial UI) and Layer 3 (partial adapters)**. Everything else is designed but not built:

| Architecture Layer | Designed | Implemented |
|---|---|---|
| L1 — UI (CreativeStudio, 4 panels) | YES | ~20% (2 panels, both partial) |
| L2 — Router hooks (useCreativeAssets, useBriefs, useForgeContent) | YES | 0% |
| L3 — Adapters (banana-generate, veo-generate, higgsfield-generate, creative-generate) | YES | ~30% (2 of 4 exist, both broken) |
| L4 — Job engine (creative_jobs, async queue, realtime) | YES | 0% |
| L5 — Asset persistence (creative_assets + 8 other tables) | YES | 0% |
| L6 — Feedback (events, Copilot tools, FORGE loop) | YES | 0% |

---

## 3. Security Audit

### Prompt Injection
**CONFIRMED RISK — P0 before real API activation.**

The user prompt string flows:
```
<textarea> (no maxLength) → React state → useGenerativeMedia body → edge function → third-party API
```
No sanitization at any layer. No `maxLength` constraint. No content policy check. No stripping of control characters, prompt delimiters, or role-override strings. A user can submit arbitrarily long strings or attempt to override model instructions (e.g., `\nSystem: ignore all previous instructions...`).

Affected: CreativeStudio.jsx L166-171, useGenerativeMedia.js L13+L33, banana-generate L51, veo-generate L48.

### Auth: JWT Presence Check Only
**LOW RISK currently, structural gap.**

Both edge functions check: `if (!authHeader) throw new Error('Missing Authorization header')`. This only verifies the header is present — it does not validate the JWT signature or claims against Supabase. A request with `Authorization: Bearer fake` passes this check. In practice the Supabase client SDK attaches valid JWTs automatically, so this is not an exploit from the web client. However: (1) if the endpoint is called directly (curl, Postman, script), it can be accessed with any string in the Authorization header; (2) there is no user identity extraction to scope asset creation to the authenticated user's org_id.

### Rate Limiting
**NO RATE LIMITING EXISTS — P0 before real API key activation.**

Neither `banana-generate` nor `veo-generate` implements any rate limiting, per-user quota, per-org quota, or concurrent request throttling. Activating real Banana or Veo API keys without rate limiting exposes the account to unbounded API cost from a single authenticated user making rapid repeated calls. The RLS policies planned in Agent 5's migration do not address rate limiting at the edge function layer.

### Error Message Information Disclosure
**CONFIRMED — MEDIUM severity.**

`CreativeStudio.jsx` L130 renders `{error}` directly in the UI as `SYS_ERR: {error}`. The `error` value originates from `err.message` in the hook catch block. This can expose:
- Supabase internal function error details (function names, Deno runtime paths)
- Third-party API error payloads (quota exceeded messages, model names, internal IDs)
- Edge function exception messages if Deno throws unexpectedly

Should be mapped to user-friendly error codes before display.

### Silent Mock Deception
**CONFIRMED — MEDIUM severity.**

Mock responses succeed silently (HTTP 200) with no indicator that real AI was not invoked. The response `message` field contains disclosure (`"Mocked successful Nano Banana response due to missing API key."`) but this field is never read by the frontend. A user in a demo or sales scenario observes what appears to be successful AI generation but sees a hardcoded placeholder. This is both a UX bug and a trust issue.

### Mock Storage Bucket
**LOW RISK — speculative.**

Mock responses point to `https://storage.googleapis.com/oculops-mock/mock-image-banana.png` and `.../mock-video-veo.mp4`. These GCS paths do not appear to exist. If the bucket were created with public access and populated by a third party, the content displayed to users could be controlled externally. Low likelihood but worth noting.
