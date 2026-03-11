# Creative Job Engine — Design Specification
> OCULOPS Creative Factory | Agent 3 — Job System / Orchestration Engineer
> Authored: 2026-03-11

---

## 1. Problem Statement

`CreativeStudio.jsx` currently generates assets in-memory only. No persistence, no retry, no observable status. This document specifies the complete job engine that fixes this.

---

## 2. Job Lifecycle — State Machine

```
                          ┌───────────────┐
         User / Agent     │   REQUESTED   │  creative_requests.status
         submits brief ──►│  (validated)  │
                          └──────┬────────┘
                                 │ router picks engine
                          ┌──────▼────────┐
                          │    QUEUED     │  creative_jobs.status
                          │  (persisted)  │
                          └──────┬────────┘
                                 │ edge function picks up
                          ┌──────▼────────┐
                          │   PROCESSING  │
                          │  (API called) │
                          └──────┬────────┘
                     ┌───────────┼────────────┐
                     │           │            │
              ┌──────▼──────┐    │     ┌──────▼──────┐
              │   POLLING   │    │     │   FAILED    │
              │(async APIs) │    │     │  (retryable)│
              └──────┬──────┘    │     └──────┬──────┘
                     │           │            │ retry < max
              asset  │           │ sync done  │
              ready  │      ┌────▼─────┐      │ retry >= max
                     │      │COMPLETED │      ▼
                     └─────►│(assets   │   DEAD_LETTERED
                             │ saved)  │
                             └─────────┘
```

**Valid transitions:**

| From | To | Trigger |
|------|----|---------|
| `requested` | `queued` | Validation passes, job row inserted |
| `queued` | `processing` | Edge function picks up job |
| `processing` | `completed` | Sync engine returns asset URL |
| `processing` | `polling` | Async engine returns external job ID |
| `polling` | `completed` | Poll finds asset ready |
| `polling` | `failed` | Poll timeout or API error |
| `processing` | `failed` | Engine throws or returns error |
| `failed` | `queued` | Retry trigger (retry_count < max_retries) |
| `failed` | `dead_lettered` | retry_count >= max_retries |

---

## 3. Database Schema

### 3a. `creative_requests` — The user-facing intake record

```sql
CREATE TABLE public.creative_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid        REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           uuid        REFERENCES auth.users(id),
  -- Ownership / context
  campaign_id       uuid        REFERENCES public.campaigns(id) ON DELETE SET NULL,
  deal_id           uuid        REFERENCES public.deals(id)     ON DELETE SET NULL,
  agent_code_name   text,                                         -- NULL if human-initiated
  correlation_id    uuid,                                         -- links to pipeline_run if agent-driven
  -- Request content
  asset_type        text        NOT NULL
    CHECK (asset_type IN ('image','video','copy','audio','carousel','batch')),
  engine            text        NOT NULL
    CHECK (engine IN ('higgsfield','veo3','openai_image','openai_copy','internal')),
  prompt            text        NOT NULL,
  style_preset      text,                                         -- e.g. 'cinematic', 'minimalist'
  aspect_ratio      text        DEFAULT '16:9',
  duration_seconds  int,                                          -- video only
  parameters        jsonb       DEFAULT '{}',                     -- engine-specific overrides
  context           jsonb       DEFAULT '{}',                     -- brand voice, tone, ref assets
  -- Routing
  priority          text        DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','critical')),
  -- Status
  status            text        NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','queued','processing','completed','failed','cancelled')),
  -- Output
  job_id            uuid        REFERENCES public.creative_jobs(id) ON DELETE SET NULL,
  -- Audit
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creative_requests_org_id       ON public.creative_requests(org_id);
CREATE INDEX idx_creative_requests_status        ON public.creative_requests(status);
CREATE INDEX idx_creative_requests_campaign_id   ON public.creative_requests(campaign_id);
CREATE INDEX idx_creative_requests_agent         ON public.creative_requests(agent_code_name);
CREATE INDEX idx_creative_requests_created_at    ON public.creative_requests(created_at DESC);
```

### 3b. `creative_jobs` — The execution record (one per attempt)

```sql
CREATE TABLE public.creative_jobs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          uuid        NOT NULL REFERENCES public.creative_requests(id) ON DELETE CASCADE,
  org_id              uuid        REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Engine
  engine              text        NOT NULL,
  engine_job_id       text,                          -- external job ID for polling (Higgsfield, Veo3)
  engine_model        text,                          -- model/version used
  -- Execution
  status              text        NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','processing','polling','completed','failed','dead_lettered','cancelled')),
  started_at          timestamptz,
  completed_at        timestamptz,
  next_poll_at        timestamptz,                   -- when to next poll external API
  poll_interval_ms    int         DEFAULT 5000,
  poll_count          int         DEFAULT 0,
  max_polls           int         DEFAULT 60,        -- safety ceiling
  -- Retry
  attempt_number      int         NOT NULL DEFAULT 1,
  max_retries         int         NOT NULL DEFAULT 3,
  retry_count         int         NOT NULL DEFAULT 0,
  retry_after         timestamptz,
  last_error          text,
  -- Output
  output_url          text,                          -- primary asset URL (Storage or CDN)
  output_urls         jsonb       DEFAULT '[]',      -- multiple assets (carousel, variants)
  output_metadata     jsonb       DEFAULT '{}',      -- width, height, duration, format, size_bytes
  -- Cost tracking
  tokens_used         int         DEFAULT 0,
  credits_used        numeric     DEFAULT 0,
  cost_usd            numeric     DEFAULT 0,
  -- Timing
  duration_ms         int,
  -- Audit
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creative_jobs_request_id      ON public.creative_jobs(request_id);
CREATE INDEX idx_creative_jobs_status          ON public.creative_jobs(status);
CREATE INDEX idx_creative_jobs_engine          ON public.creative_jobs(engine);
CREATE INDEX idx_creative_jobs_next_poll_at    ON public.creative_jobs(next_poll_at)
  WHERE status = 'polling';
CREATE INDEX idx_creative_jobs_org_id          ON public.creative_jobs(org_id);

-- Enable realtime so UI gets instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.creative_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creative_requests;
```

### 3c. `creative_assets` — Saved output records (permanent, one per asset file)

```sql
CREATE TABLE public.creative_assets (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid        NOT NULL REFERENCES public.creative_jobs(id) ON DELETE CASCADE,
  request_id    uuid        NOT NULL REFERENCES public.creative_requests(id) ON DELETE CASCADE,
  org_id        uuid        REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id   uuid        REFERENCES public.campaigns(id) ON DELETE SET NULL,
  -- Asset
  asset_type    text        NOT NULL,
  url           text        NOT NULL,                -- Supabase Storage public URL
  storage_path  text        NOT NULL,                -- internal path in storage bucket
  format        text,                                -- 'mp4', 'webp', 'png', 'txt'
  width_px      int,
  height_px     int,
  duration_ms   int,
  size_bytes    bigint,
  -- Source
  engine        text        NOT NULL,
  prompt        text,
  -- Metadata
  metadata      jsonb       DEFAULT '{}',
  tags          text[]      DEFAULT '{}',
  -- Audit
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creative_assets_job_id      ON public.creative_assets(job_id);
CREATE INDEX idx_creative_assets_campaign_id ON public.creative_assets(campaign_id);
CREATE INDEX idx_creative_assets_org_id      ON public.creative_assets(org_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.creative_assets;
```

### 3d. `updated_at` auto-update trigger (apply to both tables)

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creative_requests_updated_at
  BEFORE UPDATE ON public.creative_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER creative_jobs_updated_at
  BEFORE UPDATE ON public.creative_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 3e. RLS Policies

```sql
ALTER TABLE public.creative_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_jobs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_assets   ENABLE ROW LEVEL SECURITY;

-- Pattern: same as agent tables — authenticated + anon (service role bypasses anyway)
-- Authenticated: select/insert/update their org's data
-- Anon: insert only (edge functions use service role which bypasses RLS)
```

---

## 4. Edge Function — `creative-job-processor`

### 4a. Entry points

The function handles two invocation modes:

```
POST /functions/v1/creative-job-processor
  { action: 'submit',  request: CreateRequestInput }   → creates request + queued job
  { action: 'process', job_id: uuid }                  → processes one specific job
  { action: 'poll_cycle' }                             → invoked by pg_cron, advances polling jobs
```

### 4b. TypeScript pseudocode

```typescript
// supabase/functions/creative-job-processor/index.ts
// Runtime: Deno (no Node APIs)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { admin } from "../_shared/supabase.ts";
import { emitSystemEvent } from "../_shared/orchestration.ts";

// ─── Engine adapters ─────────────────────────────────────────────

interface EngineAdapter {
  /** Submit to external API. Returns { engine_job_id, output_url? } */
  submit(job: CreativeJob): Promise<EngineSubmitResult>;
  /** Poll for result. Returns { done, output_url?, error? } */
  poll?(engineJobId: string, job: CreativeJob): Promise<EnginePollResult>;
  /** Is this engine async (needs polling)? */
  isAsync: boolean;
  /** How long between polls in ms */
  pollIntervalMs: number;
  /** Max total poll attempts before timeout failure */
  maxPolls: number;
}

const ENGINES: Record<string, EngineAdapter> = {
  higgsfield: {
    isAsync: true,
    pollIntervalMs: 8_000,
    maxPolls: 90,           // 90 × 8s = 12 min max
    async submit(job) {
      const apiKey = Deno.env.get("HIGGSFIELD_API_KEY_ID");
      const secret = Deno.env.get("HIGGSFIELD_API_SECRET");
      // POST to Higgsfield API
      const res = await fetch("https://api.higgsfield.ai/v1/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: job.prompt,
          model: job.engine_model ?? "default",
          ...job.parameters,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Higgsfield error ${res.status}`);
      return { engine_job_id: data.job_id };
    },
    async poll(engineJobId) {
      const secret = Deno.env.get("HIGGSFIELD_API_SECRET");
      const res = await fetch(`https://api.higgsfield.ai/v1/jobs/${engineJobId}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      if (data.status === "completed") return { done: true, output_url: data.output_url };
      if (data.status === "failed")    return { done: true, error: data.error ?? "Higgsfield job failed" };
      return { done: false };
    },
  },
  veo3: {
    isAsync: true,
    pollIntervalMs: 15_000,
    maxPolls: 80,           // 80 × 15s = 20 min max
    async submit(job) {
      // Google Veo3 — submit via Vertex AI or direct API
      const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
      // ... Veo3-specific request body
      const res = await fetch("https://videogeneration.googleapis.com/v1/videos:generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: job.prompt, ...job.parameters }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? `Veo3 error ${res.status}`);
      return { engine_job_id: data.operationId };
    },
    async poll(engineJobId) {
      const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
      const res = await fetch(
        `https://videogeneration.googleapis.com/v1/operations/${engineJobId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
      const data = await res.json();
      if (data.done && !data.error) return { done: true, output_url: data.response?.outputUri };
      if (data.done && data.error)  return { done: true, error: data.error.message };
      return { done: false };
    },
  },
  openai_image: {
    isAsync: false,
    pollIntervalMs: 0,
    maxPolls: 0,
    async submit(job) {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: job.engine_model ?? "dall-e-3",
          prompt: job.prompt,
          n: 1,
          size: job.parameters?.size ?? "1024x1024",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? `OpenAI image error ${res.status}`);
      return { output_url: data.data[0].url };
    },
  },
  openai_copy: {
    isAsync: false,
    pollIntervalMs: 0,
    maxPolls: 0,
    async submit(job) {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: job.engine_model ?? Deno.env.get("OPENAI_QUALIFIER_MODEL") ?? "gpt-4o-mini",
          messages: [{ role: "user", content: job.prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? `OpenAI copy error ${res.status}`);
      const text = data.choices[0].message.content;
      // Save copy text as Storage object so it has a URL like other assets
      const textBlob = new Blob([text], { type: "text/plain" });
      const storagePath = `copy/${job.id}.txt`;
      await admin.storage.from("creative_assets").upload(storagePath, textBlob);
      const { data: urlData } = admin.storage.from("creative_assets").getPublicUrl(storagePath);
      return {
        output_url: urlData.publicUrl,
        tokens_used: data.usage?.total_tokens ?? 0,
      };
    },
  },
};

// ─── Action: submit ───────────────────────────────────────────────

async function handleSubmit(input: CreateRequestInput) {
  // 1. Insert creative_request
  const { data: req } = await admin
    .from("creative_requests")
    .insert({
      org_id: input.org_id,
      user_id: input.user_id,
      campaign_id: input.campaign_id,
      agent_code_name: input.agent_code_name,
      correlation_id: input.correlation_id,
      asset_type: input.asset_type,
      engine: input.engine,
      prompt: input.prompt,
      style_preset: input.style_preset,
      aspect_ratio: input.aspect_ratio ?? "16:9",
      duration_seconds: input.duration_seconds,
      parameters: input.parameters ?? {},
      context: input.context ?? {},
      priority: input.priority ?? "normal",
      status: "queued",
    })
    .select().single();

  // 2. Insert creative_job
  const adapter = ENGINES[input.engine];
  const { data: job } = await admin
    .from("creative_jobs")
    .insert({
      request_id: req.id,
      org_id: input.org_id,
      engine: input.engine,
      engine_model: input.parameters?.model ?? null,
      status: "queued",
      max_retries: ENGINE_MAX_RETRIES[input.engine] ?? 3,
      poll_interval_ms: adapter.pollIntervalMs,
      max_polls: adapter.maxPolls,
    })
    .select().single();

  // 3. Link job to request
  await admin.from("creative_requests")
    .update({ job_id: job.id })
    .eq("id", req.id);

  // 4. Emit event
  await emitSystemEvent({
    eventType: "creative.job_queued",
    payload: { job_id: job.id, request_id: req.id, engine: input.engine, asset_type: input.asset_type },
    userId: input.user_id,
    orgId: input.org_id,
    sourceAgent: input.agent_code_name ?? "creative-studio",
    correlationId: input.correlation_id,
    status: "emitted",
  });

  // 5. Immediately process (or defer to background)
  //    For sync engines: process inline. For async: trigger self (pg_cron / recursive invoke).
  if (!adapter.isAsync) {
    await handleProcess(job.id);
  }
  // Async engines: pg_cron poll_cycle will pick them up

  return { ok: true, job_id: job.id, request_id: req.id };
}

// ─── Action: process ──────────────────────────────────────────────

async function handleProcess(jobId: string) {
  const startMs = Date.now();

  // Optimistic lock: set status = processing
  const { data: job, error } = await admin
    .from("creative_jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "queued")   // only pick up queued jobs (prevents double-processing)
    .select().single();

  if (error || !job) return; // already picked up by another invocation

  const req = await admin.from("creative_requests").select("*").eq("id", job.request_id).single();
  const adapter = ENGINES[job.engine];

  try {
    await emitSystemEvent({
      eventType: "creative.job_processing",
      payload: { job_id: job.id, engine: job.engine },
      orgId: job.org_id,
      status: "processing",
    });

    const result = await adapter.submit({ ...job, prompt: req.data.prompt, parameters: req.data.parameters });

    if (adapter.isAsync) {
      // Store external job ID, switch to polling state
      await admin.from("creative_jobs").update({
        status: "polling",
        engine_job_id: result.engine_job_id,
        next_poll_at: new Date(Date.now() + job.poll_interval_ms).toISOString(),
      }).eq("id", job.id);
    } else {
      // Sync: asset URL returned immediately
      await finalizeJob(job, req.data, result, Date.now() - startMs);
    }
  } catch (err) {
    await handleJobFailure(job, req.data, err instanceof Error ? err.message : String(err));
  }
}

// ─── Action: poll_cycle ───────────────────────────────────────────
// Called by pg_cron every 15 seconds (or a dedicated poller edge function)

async function handlePollCycle() {
  const now = new Date().toISOString();

  // Find all jobs due for polling
  const { data: jobs } = await admin
    .from("creative_jobs")
    .select("*")
    .eq("status", "polling")
    .lte("next_poll_at", now)
    .order("next_poll_at", { ascending: true })
    .limit(20);                          // Process up to 20 at a time

  await Promise.allSettled((jobs ?? []).map(job => pollJob(job)));
}

async function pollJob(job: CreativeJob) {
  const adapter = ENGINES[job.engine];
  if (!adapter.poll || !job.engine_job_id) return;

  const newPollCount = (job.poll_count ?? 0) + 1;

  // Timeout guard
  if (newPollCount >= job.max_polls) {
    const req = await admin.from("creative_requests").select("*").eq("id", job.request_id).single();
    await handleJobFailure(job, req.data, `Polling timeout after ${newPollCount} attempts`);
    return;
  }

  // Update poll count + reschedule
  await admin.from("creative_jobs").update({
    poll_count: newPollCount,
    next_poll_at: new Date(Date.now() + job.poll_interval_ms).toISOString(),
  }).eq("id", job.id);

  try {
    const result = await adapter.poll(job.engine_job_id, job);
    if (!result.done) return;                           // still in progress

    const req = await admin.from("creative_requests").select("*").eq("id", job.request_id).single();

    if (result.error) {
      await handleJobFailure(job, req.data, result.error);
    } else {
      const durationMs = job.started_at
        ? Date.now() - new Date(job.started_at).getTime()
        : null;
      await finalizeJob(job, req.data, { output_url: result.output_url }, durationMs);
    }
  } catch (err) {
    // Transient poll error — just let next cycle retry (don't count as job failure)
    console.error(`[poll] transient error for job ${job.id}:`, err);
  }
}

// ─── Finalize a successful job ────────────────────────────────────

async function finalizeJob(job: CreativeJob, req: CreativeRequest, result: EngineSubmitResult, durationMs: number | null) {
  // 1. Download asset → upload to Supabase Storage
  let storagePath: string | null = null;
  if (result.output_url) {
    storagePath = await downloadAndStore(result.output_url, job, req);
  }

  const publicUrl = storagePath
    ? admin.storage.from("creative_assets").getPublicUrl(storagePath).data.publicUrl
    : result.output_url;

  // 2. Update job
  await admin.from("creative_jobs").update({
    status: "completed",
    output_url: publicUrl,
    output_metadata: result.output_metadata ?? {},
    tokens_used: result.tokens_used ?? 0,
    duration_ms: durationMs,
    completed_at: new Date().toISOString(),
  }).eq("id", job.id);

  // 3. Update request
  await admin.from("creative_requests").update({ status: "completed" }).eq("id", job.request_id);

  // 4. Save creative_asset record
  await admin.from("creative_assets").insert({
    job_id: job.id,
    request_id: job.request_id,
    org_id: job.org_id,
    campaign_id: req.campaign_id,
    asset_type: req.asset_type,
    url: publicUrl,
    storage_path: storagePath ?? "",
    format: inferFormat(req.asset_type, req.engine),
    engine: job.engine,
    prompt: req.prompt,
    metadata: result.output_metadata ?? {},
  });

  // 5. Emit completion event
  await emitSystemEvent({
    eventType: "creative.job_completed",
    payload: {
      job_id: job.id,
      request_id: job.request_id,
      engine: job.engine,
      asset_type: req.asset_type,
      output_url: publicUrl,
      duration_ms: durationMs,
      campaign_id: req.campaign_id ?? null,
    },
    orgId: job.org_id,
    sourceAgent: req.agent_code_name ?? "creative-studio",
    correlationId: req.correlation_id,
    status: "delivered",
  });
}

// ─── Failure handler ──────────────────────────────────────────────

async function handleJobFailure(job: CreativeJob, req: CreativeRequest, errorMessage: string) {
  const newRetryCount = (job.retry_count ?? 0) + 1;
  const maxRetries    = job.max_retries ?? 3;

  if (newRetryCount >= maxRetries) {
    // Dead letter
    await admin.from("creative_jobs").update({
      status: "dead_lettered",
      retry_count: newRetryCount,
      last_error: errorMessage,
      completed_at: new Date().toISOString(),
    }).eq("id", job.id);

    await admin.from("creative_requests").update({ status: "failed" }).eq("id", job.request_id);

    await emitSystemEvent({
      eventType: "creative.job_dead_lettered",
      payload: { job_id: job.id, engine: job.engine, error: errorMessage, retries_exhausted: newRetryCount },
      orgId: job.org_id,
      status: "failed",
    });
    return;
  }

  // Retryable — exponential backoff
  const backoffMs = Math.min(30_000 * Math.pow(2, newRetryCount - 1), 300_000);
  const retryAfter = new Date(Date.now() + backoffMs).toISOString();

  await admin.from("creative_jobs").update({
    status: "failed",
    retry_count: newRetryCount,
    last_error: errorMessage,
    retry_after: retryAfter,
  }).eq("id", job.id);

  await emitSystemEvent({
    eventType: "creative.job_failed",
    payload: { job_id: job.id, engine: job.engine, error: errorMessage, retry_count: newRetryCount, retry_after: retryAfter },
    orgId: job.org_id,
    status: "failed",
  });
}
```

---

## 5. Polling Strategy for External Async APIs

### Higgsfield (video generation)
- Submit returns `job_id` immediately (HTTP 202)
- Poll `GET /v1/jobs/{id}` every **8 seconds**
- Expected completion: 2–8 minutes → max 90 polls (12 min ceiling)
- Status field: `queued | processing | completed | failed`

### Veo3 (Google video)
- Submit returns a long-running `operationId` (Google LRO pattern)
- Poll `GET /v1/operations/{id}` every **15 seconds**
- Expected completion: 5–20 minutes → max 80 polls (20 min ceiling)
- `done: true` field signals completion; check `error` field

### OpenAI DALL-E / GPT
- **Synchronous** — response arrives in same HTTP call (< 30s)
- No polling needed
- Timeout: 60 seconds on the fetch call

### Poll cycle scheduling

```sql
-- pg_cron job: advance all polling jobs every 15 seconds
SELECT cron.schedule(
  'creative-poll-cycle',
  '*/15 * * * * *',   -- every 15 seconds (requires pg_cron 1.4+)
  $$
    SELECT net.http_post(
      url      := current_setting('app.supabase_url') || '/functions/v1/creative-job-processor',
      headers  := '{"Authorization":"Bearer " || current_setting("app.service_key")}',
      body     := '{"action":"poll_cycle"}'
    );
  $$
);
```

> Alternatively, if pg_cron resolution is 1 minute, use a self-rescheduling edge function that loops internally for 60 seconds and polls every 15 seconds.

---

## 6. Queue Management Strategy

### Concurrency limits per engine

| Engine | Max concurrent jobs | Reasoning |
|--------|---------------------|-----------|
| `higgsfield` | 5 | API rate limit |
| `veo3` | 3 | Expensive, slow |
| `openai_image` | 10 | Fast, generous limits |
| `openai_copy` | 15 | Token-based, no concurrency limit |
| `internal` | 20 | No external API |

### Enforcement query (in `handleProcess`)

```sql
-- Before starting a new processing job, check concurrency:
SELECT COUNT(*) FROM creative_jobs
WHERE engine = $1
  AND status IN ('processing', 'polling')
  AND org_id = $2;
-- If count >= limit: leave job in 'queued', return without error.
-- pg_cron or next invocation will retry.
```

### Priority ordering

When the poll_cycle or a trigger picks up queued jobs, order by:

```sql
ORDER BY
  CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
  created_at ASC
```

### Stale job cleanup

```sql
-- Mark jobs stuck in 'processing' for > 30 min as failed
UPDATE creative_jobs
SET status = 'failed', last_error = 'Processing timeout — no response from engine'
WHERE status = 'processing'
  AND started_at < now() - interval '30 minutes';
```

---

## 7. Storage Bucket

```
Bucket: creative_assets  (public, RLS off — URLs are unguessable UUIDs)

Path structure:
  {asset_type}/{job_id}.{ext}

Examples:
  video/b3f7a1c2-....mp4
  image/9e2d0f44-....webp
  copy/1a5c8e23-....txt
```
