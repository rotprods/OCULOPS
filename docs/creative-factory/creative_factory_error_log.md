# Creative Factory — Error Log
> Agent: code-reviewer (Agent 6) | Date: 2026-03-11
> All known bugs found during full source audit. Verified against actual file contents.
> Ordered by severity (HIGH → MEDIUM → LOW).

---

## BUG-001
**Title:** Video assets rendered with `<img>` tag — video content will never play

**Severity:** HIGH

**Affected File:** `src/components/modules/CreativeStudio.jsx`

**Line(s):** L212–214
```jsx
asset.type === 'video'
  ? <img src={asset.url} alt="Video preview" className="cs-asset-media" />
  : <img src={asset.url} alt="Generated asset" className="cs-asset-media" />
```

**Description:**
Both branches of the conditional render an `<img>` element. When `asset.type === 'video'`, the video URL is assigned to `<img src>`. Browsers do not play video through `<img>` tags (except for animated GIFs which are not real video). Any real video URL (MP4, WebM) will either show nothing or display an error icon.

**Reproduction:**
1. Select VEO 3 (VIDEO) model
2. Submit a prompt
3. Gallery card shows `[READY]` with the video URL loaded into `<img>`
4. No video plays, no controls visible

**Proposed Fix:**
```jsx
asset.type === 'video'
  ? <video src={asset.url} controls preload="metadata" className="cs-asset-media" />
  : <img src={asset.url} alt="Generated asset" className="cs-asset-media" />
```

**Task:** TASK-CF-027

---

## BUG-002
**Title:** Gallery is 100% in-memory — all generated work lost on page navigation or refresh

**Severity:** HIGH

**Affected File:** `src/components/modules/CreativeStudio.jsx`

**Line(s):** L65
```jsx
const [gallery, setGallery] = useState([])
```

**Description:**
The gallery state is initialized as an empty array on every component mount. React Router's lazy loading means the component unmounts when the user navigates away and remounts fresh when returning to `/creative`. All generated assets are lost immediately on any navigation. There is no persistence to Supabase, no localStorage fallback, no session cache.

**Reproduction:**
1. Generate an image
2. Navigate to /crm
3. Navigate back to /creative
4. Gallery is empty

**Proposed Fix:**
Replace `useState([])` gallery with `useCreativeAssets()` hook (TASK-CF-015) which fetches from and subscribes to the `creative_assets` Supabase table.

**Task:** TASK-CF-029

---

## BUG-003
**Title:** Mock response key mismatch — all generation falls through to hardcoded placeholder URLs

**Severity:** HIGH

**Affected Files:**
- `supabase/functions/banana-generate/index.ts` L32–38
- `supabase/functions/veo-generate/index.ts` L31–37
- `src/components/modules/CreativeStudio.jsx` L88–93

**Description:**
The mock paths in both edge functions return a response body with key `mediaUrl`:
```json
{ "status": "success", "mediaUrl": "https://storage.googleapis.com/oculops-mock/...", "message": "..." }
```

The frontend reads the result as:
```jsx
result?.url || result?.output || 'https://images.unsplash.com/...'
```

The key `mediaUrl` is never checked. `result?.url` is undefined. `result?.output` is undefined. The hardcoded Unsplash URL (L90) or GitHub GIF URL (L93) is always used as the final value. This means:
- The mock path is functionally broken — the mock asset URLs from GCS are never displayed
- The real API path (if keys were set) would also fall through if the Banana/Veo API response uses any key other than `url` or `output`
- The gallery always shows a random Unsplash photo or a GIF regardless of what the API returns

**Reproduction:**
1. Keys not set (mock path): generate image → Unsplash photo appears in gallery
2. Keys set (real path): response key from Banana API unknown — likely `callID`, `modelOutputs[0]`, or similar — not `url` or `output`

**Proposed Fix:**
Normalize all adapter responses to `{ url, type, engine, mocked }` as specified in TASK-CF-005 and TASK-CF-006. Remove hardcoded fallback URLs from CreativeStudio.jsx L90–93 — replace with explicit error handling when `result.url` is absent.

**Tasks:** TASK-CF-005, TASK-CF-006

---

## BUG-004
**Title:** Silent mock — users receive fake "success" with no indication AI was not used

**Severity:** HIGH

**Affected Files:**
- `supabase/functions/banana-generate/index.ts` L29–39
- `supabase/functions/veo-generate/index.ts` L28–38

**Description:**
When `BANANA_API_KEY`, `BANANA_MODEL_KEY`, or `VEO_API_KEY` are not set in Supabase secrets, both functions log a warning to the console (`console.warn`) and return HTTP 200 with a response that resembles success. The frontend receives status 200, no error is thrown, and the gallery item transitions to `[READY]` status. The user sees what appears to be a successfully generated AI asset.

There is no UI indicator that the generation was mocked, no toast, no banner, no asterisk. In a demo, sales call, or production scenario with unconfigured keys, every user interaction with the module is a lie.

**The mock `message` field reads:** `"Mocked successful Nano Banana response due to missing API key."` — but this message is never read or displayed by the frontend.

**Reproduction:**
1. Ensure BANANA_API_KEY is not set in Supabase secrets
2. Submit a generation prompt
3. Gallery shows [READY] with a random Unsplash image
4. No indication anywhere that the AI was not invoked

**Proposed Fix:**
Remove silent mock. When keys are missing, return HTTP 503 with an explicit error body. Frontend displays user-friendly "Generation not yet configured" message in the error banner. See TASK-CF-009.

**Task:** TASK-CF-009

---

## BUG-005
**Title:** Raw `err.message` from Supabase/API exposed in UI error banner

**Severity:** MEDIUM

**Affected File:** `src/components/modules/CreativeStudio.jsx`

**Line(s):** L128–132
```jsx
{error && (
  <div className="cs-error-banner">
    <span className="cs-error-icon">⚠️</span>
    <span className="mono cs-error-text">SYS_ERR: {error}</span>
  </div>
)}
```

**And in:** `src/hooks/useGenerativeMedia.js` L20–21, L38–39
```js
setError(err.message)
throw err
```

**Description:**
`err.message` from a Supabase function invocation error can contain:
- Deno runtime paths and function names (e.g., `Error: non-2xx status: 500 from https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/banana-generate`)
- Internal API error payloads (e.g., `{"error": "quota_exceeded", "model": "stable-diffusion-xl-1024-v1-0", "account_id": "..."}`)
- HTTP status codes and internal endpoint URLs
- Stack traces if the edge function throws and includes them in its error response

The Supabase project ID `yxzdafptqtcvpsbqkmkm` is already present in VITE env vars (not secret), so that specific leak is low-impact. However, model names, account IDs, and quota details from third-party APIs are more sensitive.

**Reproduction:**
1. Set an intentionally wrong BANANA_API_KEY in Supabase secrets
2. Submit a generation prompt
3. Error banner shows raw API error message from Banana/Veo with internal details

**Proposed Fix:**
Map known error codes to user-friendly messages:
- `API_KEY_NOT_CONFIGURED` → "Generation is not yet activated."
- `quota_exceeded` / `429` → "Generation limit reached. Try again later."
- `422` / `invalid_prompt` → "Invalid prompt. Please adjust your input and try again."
- Anything else → "Generation failed. Please try again."

**Task:** Part of TASK-CF-009

---

## BUG-006
**Title:** No request timeout — UI can hang indefinitely if edge function stalls

**Severity:** MEDIUM

**Affected File:** `src/hooks/useGenerativeMedia.js`

**Lines:** L9–27 (generateVideo), L29–47 (generateImage)

**Description:**
Neither `generateVideo` nor `generateImage` implements an AbortController, setTimeout, or Promise.race timeout. If the edge function:
- Hangs waiting for the Banana or Veo API (common during high-traffic periods)
- Hits a Supabase 54-second edge function timeout and the client does not receive a proper response
- Enters an infinite retry loop internally

...then `isGeneratingImage` or `isGeneratingVFX` will remain `true` indefinitely. The generate button is disabled, the "GENERATING ASSET..." text is shown, and the loader bar animation runs forever. The user has no recourse other than refreshing the page (which also loses the gallery — BUG-002).

**Supabase edge function hard timeout:** 150 seconds max. Frontend may wait up to 150+ seconds with no indication of failure.

**Reproduction:**
1. Set BANANA_API_URL to a non-responding server
2. Submit a prompt
3. Observe: button stays disabled, loader bar runs indefinitely

**Proposed Fix:**
```js
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 90000) // 90 second timeout
try {
  const { data, error } = await supabase.functions.invoke('banana-generate', {
    body: { prompt, modelInputs },
    signal: controller.signal
  })
  clearTimeout(timeout)
  ...
} catch (err) {
  if (err.name === 'AbortError') {
    setError('Generation timed out. Please try again.')
  }
  ...
}
```

**Task:** TASK-CF-014 (timeout implemented as part of job-engine refactor)

---

## BUG-007
**Title:** Hardcoded fallback URLs used as production media content

**Severity:** MEDIUM

**Affected File:** `src/components/modules/CreativeStudio.jsx`

**Line(s):** L90–93
```jsx
const result = await generateImage(newAsset.prompt)
updateGalleryItem(newAsset.id, { status: 'ready', url: result?.url || result?.output || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80' })
...
const result = await generateVideo(newAsset.prompt)
updateGalleryItem(newAsset.id, { status: 'ready', url: result?.url || result?.output || 'https://raw.githubusercontent.com/intel-isl/MiDaS/master/teaser.gif' })
```

**Description:**
The Unsplash URL and GitHub raw GIF are hard-wired as final fallbacks when the API response does not contain a URL. Due to BUG-003 (key mismatch), these fallbacks are ALWAYS activated. In production:
- Unsplash's CDN can throttle or deny hotlinking at any time
- GitHub raw CDN does not allow hotlinking of binary assets in production contexts and can 403
- The content (an abstract photo and a depth-estimation demo GIF) is completely unrelated to any user prompt

These are development placeholders that made it into the production code path.

**Proposed Fix:**
Remove fallback URLs entirely. If `result.url` is absent after normalization (TASK-CF-005/006), mark the gallery item as `status: 'error'` with message "No output URL returned." Never silently substitute unrelated content.

**Task:** TASK-CF-005, TASK-CF-006

---

## BUG-008
**Title:** CreativeStudio.css uses 10+ deleted CSS design system tokens

**Severity:** MEDIUM

**Affected File:** `src/components/modules/CreativeStudio.css`

**Description:**
CLAUDE.md design system section explicitly marks the following tokens as `ELIMINADOS (ya no existen, no usar)`. CreativeStudio.css uses all of them:

| Deleted Token | Occurrences in CSS | Canonical Replacement |
|---|---|---|
| `--accent-primary` | ~18 uses | `--color-primary` |
| `--text-primary` | ~6 uses | `--color-text` |
| `--text-secondary` | ~4 uses | `--color-text-2` |
| `--border-default` | ~2 uses | `--color-border` |
| `--surface-raised` | ~4 uses | `--color-bg-3` |
| `--gradient-accent` | ~1 use | `linear-gradient(...)` or `--color-primary` |
| `--shadow-glow` | ~4 uses | `0 0 0 1px var(--color-border)` |
| `--shadow-md` | ~1 use | `0 0 0 1px var(--color-border)` |
| `--glass-inner-glow` | ~1 use | remove (no glassmorphism) |

Also: multiple `backdrop-filter` and `-webkit-backdrop-filter` rules (L47–48, L133–134, L509–510) which violate the "NO glassmorphism" rule from CLAUDE.md.

**Impact:** When these CSS custom properties are undefined (i.e., not declared in tokens.css), they resolve to `initial` which for color properties is typically transparent or the browser default. Cards, buttons, and text may render with missing colors, invisible borders, or broken layouts depending on which property is missing.

**Note:** Some aliases still exist in tokens.css per CLAUDE.md (`--glass-bg`, `--border-subtle`, `--text-tertiary`, `--glass-border`) — these are NOT bugs. Only the `ELIMINADOS` list items are bugs.

**Reproduction:**
1. Remove `--accent-primary` from tokens.css (it no longer exists per spec)
2. Load /creative
3. Header title color, model selector active state, execute button border all go invisible/broken

**Proposed Fix:**
Full CSS rewrite per TASK-CF-028 — systematic token replacement.

**Task:** TASK-CF-028

---

## BUG-009
**Title:** No prompt maxLength constraint — unbounded input sent to API

**Severity:** MEDIUM

**Affected Files:**
- `src/components/modules/CreativeStudio.jsx` L166–171
- `supabase/functions/banana-generate/index.ts` L23, L51
- `supabase/functions/veo-generate/index.ts` L22, L48

**Description:**
The prompt textarea in CreativeStudio.jsx has no `maxLength` attribute. The edge functions do not validate prompt length before passing it to the external API. A user can submit:
- A 100,000-character string that causes oversized HTTP requests to both the Supabase function and the downstream API
- A prompt designed to hit API character limits and receive an error that gets exposed via BUG-005
- Repeat injections at maximum length to probe for behavior differences

Most AI image/video APIs enforce their own character limits (typically 500–2000 chars) but return errors that will bubble up as raw messages (BUG-005) rather than being handled gracefully.

**Proposed Fix:**
- Add `maxLength={2000}` to the textarea element in CreativeStudio.jsx
- Add server-side length check in both edge functions: `if (prompt.length > 2000) return 400`
- Show character counter below textarea: `{prompt.length}/2000`

**Task:** TASK-CF-007

---

## BUG-010
**Title:** No rate limiting on generation edge functions — cost explosion risk

**Severity:** MEDIUM (HIGH once real API keys are activated)

**Affected Files:**
- `supabase/functions/banana-generate/index.ts`
- `supabase/functions/veo-generate/index.ts`

**Description:**
Neither edge function implements any form of rate limiting. Once real API keys are set in Supabase secrets:
- A single authenticated user can call these functions hundreds of times per second
- The Supabase edge function platform does not impose per-function request limits beyond the plan's overall invocation limit
- The third-party API (Banana, Veo) charges per generation — an unbounded attack or a runaway client bug could accumulate thousands of dollars in charges within minutes

This is rated MEDIUM in the current state (mocked, no real charges) but must be treated as P0 before any key activation.

**Proposed Fix:**
Implement per-org rate limiting using a shared _shared/rate-limiter.ts module. Defaults: 10 images/10 min per org, 5 videos/10 min per org. See TASK-CF-010.

**Task:** TASK-CF-010

---

## BUG-011
**Title:** Rapid-click race condition on INITIATE GENERATION button

**Severity:** LOW

**Affected File:** `src/components/modules/CreativeStudio.jsx`

**Line(s):** L73–98, L174–180

**Description:**
The `handleDeploy` function is called on button click. The button is disabled while `isWorking` is true. However, `isWorking = isGeneratingImage || isGeneratingVFX` relies on the hook's local state updating asynchronously. There is a small window between the first click and the state update where a second click can be processed, resulting in two concurrent `generateImage` or `generateVideo` calls. Both will attempt to update different gallery entries (different UUIDs), so the gallery will not corrupt. However, two API calls will be made with potentially one returned result (whichever resolves first wins nothing — both update their own gallery entry). This is a low-probability issue but consumes double API credits.

**Proposed Fix:**
Add a local `isSubmitting` ref that is set synchronously before the async call:
```jsx
const isSubmittingRef = useRef(false)
const handleDeploy = async () => {
  if (!prompt.trim() || isSubmittingRef.current) return
  isSubmittingRef.current = true
  try { ... } finally { isSubmittingRef.current = false }
}
```

This becomes a non-issue once the job-engine pattern (TASK-CF-014) is implemented, as the DB INSERT is synchronous and idempotent on the job_id.

**Task:** Low priority — addressed as part of TASK-CF-029 (full generation flow rebuild)

---

## BUG-012
**Title:** Higgsfield API keys exist in Supabase secrets but no edge function references them

**Severity:** LOW (dead config, potential confusion)

**Affected:** Supabase secrets (HIGGSFIELD_API_KEY_ID, HIGGSFIELD_API_SECRET)

**Description:**
Per CLAUDE.md: `Secrets set: OpenAI, Anthropic, Google Maps, Gmail OAuth, n8n, Alpha Vantage, PostHog, GitHub, Telegram bot, Reddit, Higgsfield, CRON_SECRET`. Both Higgsfield secrets are present in production. Zero edge functions in the codebase reference either key. The architecture documents (creative_factory_architecture.md) specifically call out this orphan: `HIGGSFIELD_API_KEY_ID + HIGGSFIELD_API_SECRET → set in Supabase secrets → zero edge functions reference them → completely orphaned`.

The secrets themselves are not a bug, but the missing edge function means the capability is silently missing from the product. Any user-facing mention of Higgsfield as a supported model would be false.

**Proposed Fix:**
Build `higgsfield-generate` edge function per TASK-CF-011.

**Task:** TASK-CF-011

---

## BUG-013
**Title:** BriefEditor exports to clipboard only — brief content is never persisted

**Severity:** LOW (expected to be known, but documented for completeness)

**Affected File:** `src/components/modules/CreativeStudio.jsx`

**Line(s):** L17–22 (exportBrief function), L35 (COPIAR button)

**Description:**
The BriefEditor component has only one action: copy formatted text to clipboard. There is no save, no DB write, no draft state. After the modal is closed, the values entered by the user in the textarea fields (L46–49) are discarded entirely — they existed only in the modal's local state which is destroyed on unmount. The user's work is preserved only if they clicked COPIAR before closing. There is no autosave, no "save as draft" button, no warning on close if unsaved changes exist.

**Proposed Fix:**
Full BriefEditorModal rewrite with save-to-DB as the primary action (TASK-CF-030) and clipboard export as a secondary action.

**Task:** TASK-CF-030

---

## BUG-014
**Title:** Generation success has no user notification (no toast)

**Severity:** LOW

**Affected File:** `src/components/modules/CreativeStudio.jsx`

**Description:**
All other modules in OCULOPS use `react-hot-toast` for operation feedback (Toaster is configured in App.jsx). CreativeStudio does not import or use `toast` at any point. When a generation completes successfully, the gallery card silently updates from [GENERATING ASSET...] to [READY]. The user has no notification if they have scrolled down or switched focus. On failure, the error banner appears at the top of the module but there is no toast. This is inconsistent with the rest of the application.

**Proposed Fix:**
Import `toast` from `react-hot-toast` and add `toast.loading`, `toast.success`, `toast.error` calls at job submit, completion, and failure respectively. See TASK-CF-032.

**Task:** TASK-CF-032

---

## Summary Table

| Bug ID | Severity | Status | Fix Task | Can Fix Independently |
|--------|----------|--------|----------|----------------------|
| BUG-001 | HIGH | OPEN | TASK-CF-027 | YES — 3 line change |
| BUG-002 | HIGH | OPEN | TASK-CF-029 | NO — requires DB tables |
| BUG-003 | HIGH | OPEN | TASK-CF-005, CF-006 | YES — edge function changes only |
| BUG-004 | HIGH | OPEN | TASK-CF-009 | YES — edge function changes only |
| BUG-005 | MEDIUM | OPEN | TASK-CF-009 | YES — part of same fix |
| BUG-006 | MEDIUM | OPEN | TASK-CF-014 | YES — hook change only |
| BUG-007 | MEDIUM | OPEN | TASK-CF-005, CF-006 | YES — same fix as BUG-003 |
| BUG-008 | MEDIUM | OPEN | TASK-CF-028 | YES — CSS only |
| BUG-009 | MEDIUM | OPEN | TASK-CF-007 | YES — minimal change |
| BUG-010 | MEDIUM | OPEN | TASK-CF-010 | YES — edge function + shared module |
| BUG-011 | LOW | OPEN | TASK-CF-029 | YES — 5 line ref fix |
| BUG-012 | LOW | OPEN | TASK-CF-011 | NO — requires new function |
| BUG-013 | LOW | OPEN | TASK-CF-030 | NO — requires DB tables |
| BUG-014 | LOW | OPEN | TASK-CF-032 | YES — 3 import + 3 calls |
