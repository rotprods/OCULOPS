# Creative Factory — Backend Integration Design
> OCULOPS | Backend Architect Audit | 2026-03-11

---

## 1. Current Integration Status

### banana-generate (MOCKED)
- **File**: `supabase/functions/banana-generate/index.ts`
- **Pattern**: `serve()` with manual CORS + manual JWT presence check (no JWT decode)
- **Mock path**: `if (!BANANA_API_KEY || !BANANA_MODEL_KEY)` → returns hardcoded mock URL
- **Critical**: Mock returns key `mediaUrl` but frontend reads `result?.url || result?.output` — **neither matches**. All generation (real and mock) falls through to hardcoded Unsplash URLs. API is effectively non-functional end-to-end.
- **Gaps vs adapter spec**:
  - No job persistence (no DB write)
  - No job ID returned to client
  - Sync-only; no polling surface
  - Uses `serve()` (old Deno std) instead of `Deno.serve()` (used by all newer functions)
  - Returns raw banana response — no normalization
  - Auth is JWT presence check only (not decoded/validated)

### veo-generate (MOCKED)
- **File**: `supabase/functions/veo-generate/index.ts`
- **Pattern**: Same as banana-generate (same template)
- **Mock path**: `if (!VEO_API_KEY)` → returns hardcoded mock URL
- **Critical gap**: Real Veo 3 API is async (returns an operation name, must poll `GET /operations/{name}`). Current implementation treats it as sync — **will break immediately when a real key is added**.
- **Same gaps**: No job persistence, no polling, old `serve()`, no normalization.
- **Same mock mismatch**: Returns `mediaUrl`, frontend reads `result?.url` — broken.

### api-gateway Higgsfield entry (MISCONFIGURED)
- Treats `HIGGSFIELD_API_SECRET` as a Bearer token and ignores `HIGGSFIELD_API_KEY_ID`.
- **Resolution**: Do not use api-gateway for Higgsfield. Build a dedicated `HiggsfieldAdapter`.

### OpenAI (LIVE, not wired to creative layer)
- Key set as Supabase secret `OPENAI_API_KEY`. Used by `ai-advisor` and `agent-brain-v2`.
- DALL-E 3 endpoint (`/images/generations`) is available but no edge function wraps it for creative use.

### Anthropic (LIVE, not wired to creative layer)
- Key set. Used by agents via `api-gateway`.
- Claude-based repurpose adapter would call `/messages` endpoint directly.

### agent-forge (LIVE but unreachable from UI)
- Calls GPT-4o, generates 5 content types, writes to `knowledge_entries`, runs `agent-brain-v2` enrichment.
- **Completely unreachable from CreativeStudio.jsx** — zero UI connection.
- This is the closest thing to a working creative backend. Should be a primary integration target.

---

## 2. Higgsfield Adapter Design

### API Auth Pattern
Higgsfield uses two credentials that must both be sent:

```typescript
// Correct auth headers for Higgsfield API
const higgsfieldHeaders = {
  "Content-Type": "application/json",
  "X-Api-Key-Id": Deno.env.get("HIGGSFIELD_API_KEY_ID")!,
  "X-Api-Key-Secret": Deno.env.get("HIGGSFIELD_API_SECRET")!,
};
// Verify exact header names against Higgsfield API docs.
// Alternative pattern: "Authorization: ApiKey {key_id}:{secret}"
```

### Job Lifecycle (async polling)

```
1. POST /videos/generate
   Body: { prompt, character_reference_url?, style?, duration_seconds?, aspect_ratio? }
   Response: { job_id: "hf_xxx", status: "queued", estimated_seconds: 60 }

2. GET /videos/{job_id}
   Response: { job_id, status: "running"|"completed"|"failed", progress: 0-100,
               output_url?: "...", thumbnail_url?: "..." }

3. Poll every 5s until status in ["completed", "failed"]
   Max polls: 60 (5 minutes timeout)
```

### HiggsfieldAdapter pseudo-implementation

```typescript
// supabase/functions/_shared/adapters/higgsfield.ts

export class HiggsfieldAdapter implements CreativeAdapter {
  readonly engine = "higgsfield" as const;
  readonly supports: CreativeTaskType[] = [
    "video_from_text",
    "video_from_image",
    "video_character_consistent",
  ];

  private getHeaders() {
    const keyId = Deno.env.get("HIGGSFIELD_API_KEY_ID");
    const secret = Deno.env.get("HIGGSFIELD_API_SECRET");
    if (!keyId || !secret) throw new Error("Higgsfield credentials not configured");
    return {
      "Content-Type": "application/json",
      "X-Api-Key-Id": keyId,
      "X-Api-Key-Secret": secret,
    };
  }

  async create_job(request: CreativeRequest): Promise<CreativeJobRecord> {
    const res = await fetch("https://api.higgsfield.ai/v1/videos/generate", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        prompt: request.prompt,
        character_reference_url: request.reference_url,
        ...request.options,
      }),
    });
    const data = await res.json();
    // Persist to creative_jobs with status "waiting_external", external_id = data.job_id
    return this.mapToJobRecord(data, request);
  }

  async get_status(job_id: string, external_id: string): Promise<CreativeJobRecord> {
    const res = await fetch(`https://api.higgsfield.ai/v1/videos/${external_id}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    // Map Higgsfield status → internal JobStatus
    // Update creative_jobs row in DB
    return this.mapToJobRecord(data, { job_id });
  }

  normalize_output(raw: Record<string, unknown>): CreativeOutput {
    return {
      media_url: String(raw.output_url ?? raw.video_url ?? ""),
      media_type: "video",
      format: "mp4",
      thumbnail_url: raw.thumbnail_url ? String(raw.thumbnail_url) : undefined,
      metadata: raw,
    };
  }
}
```

---

## 3. creative-router Edge Function Design

```typescript
// supabase/functions/creative-router/index.ts

Deno.serve(async (req) => {
  // 1. CORS + auth
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const user = await getAuthUser(req);

  // 2. Parse CreativeRequest
  const body: CreativeRequest = await req.json();

  // 3. Handle status poll
  if (body.action === "get_status") {
    const job = await getJobFromDB(body.job_id);
    if (job.status === "waiting_external") {
      const adapter = ADAPTER_REGISTRY[job.engine];
      const updated = await adapter.get_status(job.id, job.external_id!);
      return jsonResponse(updated);
    }
    return jsonResponse(job);
  }

  // 4. Resolve engine
  const engine = resolveEngine(body.task_type, body.engine);

  // 5. Create job record in creative_jobs
  const jobId = await createJobRecord(body, engine, user.id);

  // 6. Dispatch to adapter
  const adapter = ADAPTER_REGISTRY[engine];
  const jobRecord = await adapter.create_job({ ...body, job_id: jobId });

  // 7. Return immediately
  return jsonResponse({
    job_id: jobRecord.job_id,
    status: jobRecord.status,
    output: jobRecord.output ?? null,
    poll_url: jobRecord.status === "waiting_external"
      ? `/functions/v1/creative-router?action=get_status&job_id=${jobRecord.job_id}`
      : null,
  });
});
```

---

## 4. useCreativeFactory Hook Design

Replaces and extends `useGenerativeMedia.js`. Located at `src/hooks/useCreativeFactory.js`.

```javascript
// src/hooks/useCreativeFactory.js

export function useCreativeFactory() {
  const [jobs, setJobs] = useState({})       // { [job_id]: CreativeJobRecord }
  const [polling, setPolling] = useState({}) // { [job_id]: intervalId }
  const [error, setError] = useState(null)

  const updateJob = useCallback((jobId, updates) => {
    setJobs(prev => ({ ...prev, [jobId]: { ...prev[jobId], ...updates } }))
  }, [])

  const stopPolling = useCallback((jobId) => {
    setPolling(prev => {
      if (prev[jobId]) clearInterval(prev[jobId])
      const next = { ...prev }
      delete next[jobId]
      return next
    })
  }, [])

  const startPolling = useCallback((jobId) => {
    const intervalId = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('creative-router', {
          body: { action: 'get_status', job_id: jobId }
        })
        updateJob(jobId, data)
        if (['completed', 'failed', 'cancelled'].includes(data.status)) {
          stopPolling(jobId)
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }, 5000)
    setPolling(prev => ({ ...prev, [jobId]: intervalId }))
  }, [updateJob, stopPolling])

  const submitJob = useCallback(async (request) => {
    setError(null)
    const { data, error: fnError } = await supabase.functions.invoke('creative-router', {
      body: request
    })
    if (fnError) { setError(fnError.message); throw fnError }

    const jobId = data.job_id
    updateJob(jobId, data)

    if (data.status === 'waiting_external') startPolling(jobId)
    return jobId
  }, [updateJob, startPolling])

  // Backwards-compatible shorthands
  const generateImage = useCallback((prompt, options) =>
    submitJob({ task_type: 'image_from_text', prompt, options }), [submitJob])

  const generateVideo = useCallback((prompt, options) =>
    submitJob({ task_type: 'video_from_text', prompt, options }), [submitJob])

  const generateCharacterVideo = useCallback((prompt, reference_url, options) =>
    submitJob({ task_type: 'video_character_consistent', prompt, reference_url, options }), [submitJob])

  const repurpose = useCallback((prompt, reference_url) =>
    submitJob({ task_type: 'repurpose_text', prompt, reference_url }), [submitJob])

  // Derived state for UI
  const jobList = useMemo(() => Object.values(jobs).sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)), [jobs])

  const isWorking = useMemo(() =>
    Object.values(jobs).some(j => ['queued', 'running', 'waiting_external'].includes(j.status)),
    [jobs])

  return {
    jobs, jobList, isWorking, error,
    submitJob, generateImage, generateVideo, generateCharacterVideo, repurpose,
  }
}
```

---

## 5. Error Handling Strategy Per Engine

| Engine | Timeout | Retry | On Key Missing | On API Error |
|--------|---------|-------|----------------|-------------|
| Banana | 30s | 1 retry (network only) | Return structured error | Mark job FAILED |
| Veo | 5min (polling) | 3 polls on transient 5xx | Return structured error | Mark job FAILED |
| Higgsfield | 5min (polling) | 3 polls on transient 5xx | Return `engine_unavailable` | Mark job FAILED |
| DALL-E | 60s | 2 retries on 429 | Return `engine_unavailable` | Mark job FAILED |
| Claude | 120s | 2 retries on 529 | Return `engine_unavailable` | Mark job FAILED |
| Stability/Runway | 3min | 2 retries | Return `engine_unavailable` | Mark job FAILED |

**Key rule**: NO silent mock fallbacks on missing keys. Return structured `{ error: "engine_unavailable", engine, task_type }` so the UI can show a meaningful message.

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 2,
  delayMs = 1000,
): Promise<T> {
  let lastError!: Error;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts && isRetryable(lastError)) {
        await new Promise(r => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

function isRetryable(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return msg.includes("network") || msg.includes("fetch") ||
         msg.includes("timeout") || msg.includes("503") || msg.includes("529");
}
```

---

## 6. FORGE Agent Integration

`agent-forge` is the internal creative content generator. Connect it to the factory:

```typescript
// Inside agent-forge handler — replace direct knowledge_entries write with:
const job = await callCreativeRouter({
  task_type: "image_from_text",       // or repurpose_text for content
  prompt: generatedPrompt,
  user_id: payload.user_id,
  correlation_id: payload.correlation_id,
  skip_db: false,
});
// job.job_id can be stored in knowledge_entries.source_job_id
// creative-poller handles completion → emits creative.job.completed
// FORGE subscribes to that event for downstream steps
```

This makes FORGE non-blocking (no hanging on video generation) and all FORGE outputs become first-class assets in the library.
