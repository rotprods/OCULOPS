# Creative Factory — Retry & Fallback Logic
> OCULOPS | Creative Factory Design | 2026-03-11

---

## 1. Overview

The creative job system spans two execution environments: edge functions (per-request, max 60s wall time for Supabase free tier) and a scheduled poller (runs every 30s, handles long-running async jobs). Retry logic is split accordingly — transient HTTP errors are retried inline inside the edge function; stale or repeatedly-failing polling jobs are handled by the poller's cleanup pass.

---

## 2. Engine Classification

| Engine | Type | Max Latency | Retry Site |
|--------|------|-------------|------------|
| Banana | Sync | 30s | Inline in edge function |
| DALL-E 3 | Sync | 60s | Inline in edge function |
| Stability AI | Sync | 60s | Inline in edge function |
| Claude (repurpose) | Sync | 120s | Inline in edge function |
| Veo 3 | Async polling | 5 min | creative-poller |
| Higgsfield | Async polling | 5 min | creative-poller |
| Runway ML | Async polling | 3 min | creative-poller |

**Key rule**: Async engines must NEVER be retried inline. The edge function submits the job and returns a `job_id`. All subsequent retry and fallback decisions live in `creative-poller`.

---

## 3. `withRetry()` Utility

Used only by sync adapters inside `creative-router`. Source of truth for inline retry behaviour.

```typescript
// supabase/functions/_shared/withRetry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;   // default 2
    baseDelayMs?: number;   // default 1000
    jitter?: boolean;       // default true — adds up to 20% random offset
  } = {},
): Promise<T> {
  const { maxAttempts = 2, baseDelayMs = 1000, jitter = true } = options;
  let lastError!: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      const isLast = attempt === maxAttempts;
      if (isLast || !isRetryable(lastError)) throw lastError;

      const delay = baseDelayMs * attempt * (jitter ? 1 + Math.random() * 0.2 : 1);
      await sleep(delay);
    }
  }
  throw lastError;
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function isRetryable(err: Error): boolean {
  const msg = err.message.toLowerCase();
  // Retry on: network failures, gateway errors, rate limits (429), overloaded (529)
  return (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("econnreset") ||
    msg.includes("timeout") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("529") ||
    msg.includes("429")   // rate limit — still retry, delay handles backoff
  );
  // Do NOT retry: 400 (bad request), 401 (auth), 404, 422 (invalid prompt)
}
```

### Exponential Backoff Parameters Per Engine

| Engine | maxAttempts | baseDelayMs | Effective max wait |
|--------|-------------|-------------|-------------------|
| Banana | 2 | 1000 | ~2.2s |
| DALL-E 3 | 3 | 2000 | ~10s |
| Stability AI | 2 | 1000 | ~2.2s |
| Claude repurpose | 2 | 2000 | ~4.4s |

DALL-E gets 3 attempts because OpenAI rate-limit 429s are common on burst traffic. Claude gets 2 attempts with a longer base delay because 529 (overloaded) events warrant more patience between tries, not more total attempts.

---

## 4. Sync Adapter — Inline Retry Pattern

```typescript
// Inside a sync adapter (e.g. dalle.ts)

export class DalleAdapter implements CreativeAdapter {
  async create_job(request: CreativeRequest): Promise<CreativeJobRecord> {
    const result = await withRetry(
      () => this.callOpenAI(request.prompt, request.options),
      { maxAttempts: 3, baseDelayMs: 2000 },
    );
    return this.mapToJobRecord(result, request, "completed");
  }

  private async callOpenAI(prompt: string, options: Record<string, unknown>) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: (options.size as string) ?? "1024x1024",
        response_format: "url",
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI ${res.status}: ${text}`);
    }
    return res.json();
  }
}
```

---

## 5. Async Adapter — Submit-Only Pattern (No Inline Retry)

Async adapters call their API once, persist the external job ID, and return `status: "waiting_external"`. The only retry at submit time is a single network-level retry for the initial POST.

```typescript
// Inside an async adapter (e.g. higgsfield.ts)

export class HiggsfieldAdapter implements CreativeAdapter {
  async create_job(request: CreativeRequest): Promise<CreativeJobRecord> {
    // One network retry at submission — if the API rejects the prompt (4xx), fail fast.
    const data = await withRetry(
      () => this.submitToHiggsfield(request),
      { maxAttempts: 2, baseDelayMs: 500 },
    );

    return {
      ...request,
      status: "waiting_external",
      external_id: data.job_id,
      external_status: data.status,
    };
    // DB row is written by creative-router AFTER this returns.
    // creative-poller takes over from here.
  }
}
```

---

## 6. Polling Retry Strategy (creative-poller)

The poller runs on a 30s cron. For each `waiting_external` job it calls `adapter.get_status()`. A status-check failure does NOT immediately fail the job — the poller increments `retry_count` and moves on. Only when `retry_count` exceeds the engine's max-poll threshold is the job marked `failed`.

```typescript
// supabase/functions/creative-poller/index.ts (core logic)

const MAX_STATUS_FAILURES: Record<CreativeEngine, number> = {
  veo:        5,  // 5 consecutive poll failures → fail job
  higgsfield: 5,
  runway:     4,
  // sync engines never reach poller
  banana: 0, dalle: 0, stability: 0, claude_repurpose: 0,
};

async function pollJob(job: CreativeJobRow): Promise<void> {
  const adapter = ADAPTER_REGISTRY[job.engine];

  try {
    const updated = await adapter.get_status(job.id, job.external_id!);

    await admin.from("creative_jobs").update({
      status:          updated.status,
      progress:        updated.progress,
      external_status: updated.external_status,
      output_url:      updated.output_url ?? null,
      thumbnail_url:   updated.thumbnail_url ?? null,
      completed_at:    isTerminal(updated.status) ? new Date().toISOString() : null,
      retry_count:     0,  // reset on successful poll
    }).eq("id", job.id);

  } catch (err) {
    const newCount = job.retry_count + 1;
    const maxFailures = MAX_STATUS_FAILURES[job.engine];

    if (newCount >= maxFailures) {
      await markJobFailed(job.id, `Polling failed ${newCount} times: ${err.message}`);
    } else {
      await admin.from("creative_jobs")
        .update({ retry_count: newCount })
        .eq("id", job.id);
    }
  }
}
```

### Poll interval vs cron interval

The poller cron fires every 30s. Engine-level poll intervals are enforced by filtering out jobs that were updated too recently:

```typescript
const minAgeByEngine: Record<string, number> = {
  veo:        9_000,   // poll no faster than every 9s (3 cron ticks ≈ 90s effective)
  higgsfield: 4_000,   // poll every 4s (every cron tick)
  runway:     4_000,
};

// In the query:
.gt("updated_at", new Date(Date.now() - minAgeByEngine[job.engine]).toISOString())
```

In practice with a 30s cron, Veo jobs are polled roughly every 30s and Higgsfield every 30s as well. Sub-30s polling requires a different scheduler strategy (e.g. Supabase realtime trigger + deno subprocess), which is out of scope for v1.

---

## 7. Fallback Engine Routing

When the primary engine is unavailable (missing key, persistent 5xx, or explicit `engine_unavailable` error), `creative-router` applies this fallback chain:

```typescript
// supabase/functions/creative-router/engineFallback.ts

type FallbackChain = CreativeEngine[];

const FALLBACK_CHAINS: Record<CreativeTaskType, FallbackChain> = {
  image_from_text:               ["banana", "dalle", "stability"],
  image_from_image:              ["stability", "dalle"],
  video_from_text:               ["higgsfield", "veo", "runway"],
  video_from_image:              ["higgsfield", "runway"],
  video_character_consistent:    ["higgsfield"],     // no fallback — unique capability
  repurpose_text:                ["claude_repurpose"],
  repurpose_video_to_post:       ["claude_repurpose"],
};

export async function resolveEngine(
  taskType: CreativeTaskType,
  preferred: CreativeEngine | undefined,
): Promise<CreativeEngine> {
  const chain = FALLBACK_CHAINS[taskType];
  const candidates = preferred
    ? [preferred, ...chain.filter(e => e !== preferred)]
    : chain;

  for (const engine of candidates) {
    if (isEngineAvailable(engine)) return engine;
  }

  // All engines unavailable — structured error, no silent fallback
  throw Object.assign(new Error("No available engine for task"), {
    code: "engine_unavailable",
    task_type: taskType,
    tried: candidates,
  });
}

function isEngineAvailable(engine: CreativeEngine): boolean {
  switch (engine) {
    case "banana":         return !!(Deno.env.get("BANANA_API_KEY") && Deno.env.get("BANANA_MODEL_KEY"));
    case "dalle":          return !!Deno.env.get("OPENAI_API_KEY");
    case "stability":      return !!Deno.env.get("STABILITY_API_KEY");
    case "veo":            return !!Deno.env.get("VEO_API_KEY");
    case "higgsfield":     return !!(Deno.env.get("HIGGSFIELD_API_KEY_ID") && Deno.env.get("HIGGSFIELD_API_SECRET"));
    case "runway":         return !!Deno.env.get("RUNWAY_API_KEY");
    case "claude_repurpose": return !!Deno.env.get("ANTHROPIC_API_KEY");
    default: return false;
  }
}
```

### Fallback error response shape

When all engines in a chain fail, return this structured error so the UI can give a meaningful message rather than a raw 500:

```typescript
return jsonResponse({
  error: "engine_unavailable",
  code: "NO_ENGINE",
  task_type: taskType,
  tried_engines: candidates,
  message: "No generation engine is configured for this task type.",
}, 503);
```

**No silent mock fallbacks.** The old `banana-generate` behaviour of returning a hardcoded Unsplash URL when keys are missing is the anti-pattern to avoid. A missing key means the feature is not available — tell the user explicitly.

---

## 8. Dead Letter Handling

When all retries are exhausted and no fallback engine is available, the job reaches terminal state `failed`. At this point:

1. `creative-poller` writes `status = 'failed'`, `error = <last error message>`, `completed_at = now()`.
2. `emitSystemEvent("creative.job.failed", { job_id, engine, error, retry_count })` is called.
3. The UI subscribes to `creative_jobs` realtime and renders the failure state on the asset card.
4. **No automatic re-queue.** Manual re-submission is the user's action.

There is no dead-letter queue table — `creative_jobs` with `status = 'failed'` IS the dead letter record. Failed jobs are queryable indefinitely (no TTL on the table). Cost tracking fields (`estimated_cost_usd`, `actual_cost_usd`) remain null for failed jobs.

---

## 9. Timeout Management Per Engine

Timeouts are enforced at the fetch level, not via `AbortController` wrapping the whole adapter. This keeps the DB write path clean even if the fetch times out.

```typescript
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
```

Per-engine timeout values:

| Engine | Timeout | Rationale |
|--------|---------|-----------|
| Banana | 30 000 ms | Sync image — should return fast |
| DALL-E 3 | 60 000 ms | OpenAI latency can spike |
| Stability AI | 60 000 ms | Similar to DALL-E |
| Claude repurpose | 120 000 ms | Long text generation |
| Veo 3 (submit only) | 15 000 ms | Just the POST, not the generation |
| Higgsfield (submit) | 15 000 ms | Just the POST |
| Higgsfield (status poll) | 10 000 ms | Single GET per poll tick |
| Runway (submit) | 15 000 ms | Just the POST |
| Runway (status poll) | 10 000 ms | Single GET |

Edge function wall-clock limit (Supabase free tier) is 60s. For sync engines with a 120s timeout (Claude), the edge function will hit the wall-clock limit before the fetch timeout triggers. Claude adapter must be deployed on a paid plan or the timeout reduced to 55s.

---

## 10. Poller Stale Job Cleanup

Jobs that stay in `waiting_external` indefinitely due to bugs, network splits, or edge function crashes are cleaned up by the poller's maintenance pass.

```typescript
// Runs after the normal polling pass, once per cron tick

const STALE_THRESHOLDS_MS: Record<CreativeEngine, number> = {
  veo:        5 * 60 * 1000,   // 5 min
  higgsfield: 5 * 60 * 1000,   // 5 min
  runway:     3 * 60 * 1000,   // 3 min
  banana: 0, dalle: 0, stability: 0, claude_repurpose: 0, // sync — never stale
};

async function cleanupStaleJobs(): Promise<void> {
  for (const [engine, maxMs] of Object.entries(STALE_THRESHOLDS_MS)) {
    if (maxMs === 0) continue;
    const cutoff = new Date(Date.now() - maxMs).toISOString();

    const { data: stale } = await admin
      .from("creative_jobs")
      .select("id, engine, prompt")
      .eq("status", "waiting_external")
      .eq("engine", engine)
      .lt("created_at", cutoff);

    for (const job of stale ?? []) {
      await markJobFailed(job.id, `Job exceeded maximum wait time for engine ${engine}`);
    }
  }
}

async function markJobFailed(jobId: string, reason: string): Promise<void> {
  await admin.from("creative_jobs").update({
    status:       "failed",
    error:        reason,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId);

  await emitSystemEvent({
    eventType: "creative.job.failed",
    payload:   { job_id: jobId, reason },
    sourceAgent: "creative-poller",
    status: "delivered",
  });
}
```

Stale cleanup runs after the active-job polling pass on every cron tick. The order matters: poll first, then clean, so a job that legitimately completes in the same tick is not erroneously failed.

---

## 11. Frontend Polling Abort on Unmount

`useCreativeFactory` uses `setInterval` for client-side optimistic polling. Intervals must be cleared on component unmount to avoid memory leaks and ghost updates after navigation.

```javascript
// src/hooks/useCreativeFactory.js — cleanup

useEffect(() => {
  return () => {
    // Clear all active polling intervals on unmount
    Object.values(pollingRef.current).forEach(id => clearInterval(id));
    pollingRef.current = {};
  };
}, []);
```

Use a `useRef` for the interval map (not `useState`) so cleanup does not require a re-render and does not create stale-closure issues inside the cleanup callback.
