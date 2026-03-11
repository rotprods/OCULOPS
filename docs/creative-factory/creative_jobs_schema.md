# Creative Factory — Jobs Schema & Lifecycle
> OCULOPS | Backend Architect Audit | 2026-03-11

---

## 1. Job Lifecycle State Machine

```
QUEUED
  │  (job created in DB, not yet dispatched to engine)
  ▼
RUNNING
  │  (dispatched to sync engine, or building request for async engine)
  ▼
WAITING_EXTERNAL          ← Async engines only (Higgsfield, Veo, Runway)
  │  (external engine accepted job, polling active, progress 0→100)
  │
  ├──→ COMPLETED  (output URLs stored, assets created)
  ├──→ FAILED     (engine error or max polling timeout)
  └──→ CANCELLED  (user-initiated or engine rejected)
```

State transition rules:
- `QUEUED → RUNNING`: set when `adapter.create_job()` is called
- `RUNNING → COMPLETED`: sync engine returns result in HTTP response
- `RUNNING → WAITING_EXTERNAL`: async engine returns external job ID
- `WAITING_EXTERNAL → COMPLETED`: polling detects `status=completed`
- `WAITING_EXTERNAL → FAILED`: polling detects `status=failed` OR max poll time exceeded
- `ANY → CANCELLED`: `cancel_job()` called (best-effort, engine may not support)
- **No backward transitions permitted.**

---

## 2. SQL — creative_jobs Table

```sql
-- NOTE: Agent 5 migration (20260320100000_creative_factory.sql) covers creative_jobs.
-- This file documents the canonical schema spec for reference.

create table if not exists creative_jobs (
  id                  uuid primary key default gen_random_uuid(),

  -- Ownership
  user_id             uuid references auth.users(id) on delete set null,
  org_id              uuid,
  correlation_id      text,          -- links to agent task, campaign, etc.

  -- Engine & task
  engine              text not null,
    -- 'banana' | 'veo' | 'higgsfield' | 'dalle' | 'stability' | 'runway' | 'claude_repurpose'
  task_type           text not null,
    -- 'image_from_text' | 'video_from_text' | 'video_character_consistent' | 'repurpose_text' | ...
  prompt              text not null,
  reference_url       text,          -- source asset for img2img / repurpose / character ref
  options             jsonb default '{}'::jsonb,

  -- External engine tracking
  external_id         text,          -- engine-assigned job ID (for polling)
  external_status     text,          -- raw status from engine (debugging only)

  -- Lifecycle
  status              text not null default 'queued'
                        check (status in ('queued','running','waiting_external','completed','failed','cancelled')),
  progress            integer default 0 check (progress between 0 and 100),
  retry_count         integer default 0,
  error               text,

  -- Output
  output_url          text,          -- primary deliverable URL
  output_urls         text[],        -- multiple outputs (batch jobs)
  output_type         text,          -- 'image' | 'video' | 'text'
  output_format       text,          -- 'png' | 'webp' | 'mp4' | 'gif' | 'txt'
  output_width        integer,
  output_height       integer,
  output_duration_s   numeric(8,3),  -- video duration in seconds
  thumbnail_url       text,
  output_metadata     jsonb default '{}'::jsonb,

  -- Timing
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  started_at          timestamptz,   -- when dispatched to engine
  completed_at        timestamptz,   -- when terminal state reached
  estimated_duration_ms integer,     -- engine estimate at submission

  -- Cost tracking
  estimated_cost_usd  numeric(10,6),
  actual_cost_usd     numeric(10,6),

  -- Source
  created_by          text default 'edge_function'
    -- 'edge_function' | 'agent_forge' | 'agent_herald' | 'copilot' | 'user'
);

-- Indexes
create index creative_jobs_pending_idx on creative_jobs(status, created_at)
  where status in ('queued', 'running', 'waiting_external');

create index creative_jobs_user_idx on creative_jobs(user_id, created_at desc);
create index creative_jobs_engine_idx on creative_jobs(engine, status);

-- Auto-update updated_at (reuse existing trigger function)
create trigger creative_jobs_updated_at
  before update on creative_jobs
  for each row execute function public.set_row_updated_at();

-- RLS
alter table creative_jobs enable row level security;
create policy "Users see own jobs" on creative_jobs
  for select using (auth.uid() = user_id or user_id is null);
create policy "Service role full access" on creative_jobs
  for all using (true);

-- Realtime
alter publication supabase_realtime add table creative_jobs;
```

---

## 3. TypeScript Interfaces

```typescript
// Mirrors SQL — used in edge functions and frontend hooks

type CreativeEngine = "banana" | "veo" | "higgsfield" | "dalle" | "stability" | "runway" | "claude_repurpose";
type CreativeTaskType = "image_from_text" | "image_from_image" | "video_from_text" | "video_from_image" | "video_character_consistent" | "repurpose_text" | "repurpose_video_to_post";
type JobStatus = "queued" | "running" | "waiting_external" | "completed" | "failed" | "cancelled";

interface CreativeJobRow {
  id: string;
  user_id: string | null;
  org_id: string | null;
  correlation_id: string | null;
  engine: CreativeEngine;
  task_type: CreativeTaskType;
  prompt: string;
  reference_url: string | null;
  options: Record<string, unknown>;
  external_id: string | null;
  external_status: string | null;
  status: JobStatus;
  progress: number;
  retry_count: number;
  error: string | null;
  output_url: string | null;
  output_urls: string[] | null;
  output_type: "image" | "video" | "text" | null;
  output_format: string | null;
  output_width: number | null;
  output_height: number | null;
  output_duration_s: number | null;
  thumbnail_url: string | null;
  output_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration_ms: number | null;
  estimated_cost_usd: number | null;
  actual_cost_usd: number | null;
  created_by: string;
}
```

---

## 4. Event Types for Event Bus

New event types added to the existing `event_log` bus (follows `agent.*` convention):

```typescript
type CreativeEventType =
  | "creative.job.queued"       // job created, engine selected
  | "creative.job.started"      // dispatched to engine
  | "creative.job.waiting"      // async engine accepted, polling begins
  | "creative.job.progress"     // progress 0–100 during polling
  | "creative.job.completed"    // output ready, asset created
  | "creative.job.failed"       // engine error or timeout
  | "creative.job.cancelled";   // user or system cancelled

interface CreativeJobEvent {
  job_id: string;
  engine: CreativeEngine;
  task_type: CreativeTaskType;
  status: JobStatus;
  progress?: number;
  output_url?: string;
  error?: string;
  duration_ms?: number;
  user_id?: string;
}
```

Emit via existing `emitSystemEvent()` from `_shared/orchestration.ts`:

```typescript
await emitSystemEvent({
  eventType: "creative.job.completed",
  payload: { job_id, engine, task_type, output_url, duration_ms },
  userId,
  sourceAgent: "creative-router",
  status: "delivered",
});
```

---

## 5. Edge Function Architecture (3-function pattern)

### Function A: `creative-router` (entry point + status)
- Handles `CreativeRequest` from frontend/agents
- Creates `creative_jobs` row
- Dispatches to adapter (sync → return output, async → return job_id)
- Handles `{ action: "get_status", job_id }` poll requests

### Function B: `creative-poller` (scheduled background worker)
- Cron: every 30s
- Queries `creative_jobs WHERE status = 'waiting_external'`
- Calls `adapter.get_status()` for each pending job (limit 20)
- Updates DB rows, emits `creative.job.*` events
- Stale job cleanup: if `created_at < now() - 10min AND status = waiting_external` → mark FAILED

```typescript
// Poller core query
const { data: pending } = await admin
  .from("creative_jobs")
  .select("*")
  .eq("status", "waiting_external")
  .lt("created_at", new Date(Date.now() - 600_000).toISOString()) // not newer than 10s
  .order("created_at", { ascending: true })
  .limit(20);
```

### Function C: `creative-asset-writer` (triggered on job completion)
- Listens for `creative.job.completed` event
- Creates `creative_assets` record from job output
- Links to campaign if `correlation_id` matches a campaign
- Triggers FORGE if repurposing is queued

---

## 6. Polling Strategy Per Engine

| Engine | Strategy | Interval | Max Wait |
|--------|----------|----------|----------|
| Banana | Sync — no polling | N/A | 30s timeout |
| Veo 3 | Polling (real API async) | 10s | 5 min |
| Higgsfield | Polling | 5s | 5 min |
| DALL-E 3 | Sync — no polling | N/A | 60s timeout |
| Claude | Sync (streaming optional) | N/A | 120s timeout |
| Runway ML | Polling | 5s | 3 min |
| Stability AI | Sync — no polling | N/A | 60s timeout |

```typescript
const POLL_CONFIG: Record<CreativeEngine, { interval_ms: number; max_polls: number }> = {
  veo:              { interval_ms: 10_000, max_polls: 30 },  // 5 min
  higgsfield:       { interval_ms:  5_000, max_polls: 60 },  // 5 min
  runway:           { interval_ms:  5_000, max_polls: 36 },  // 3 min
  banana:           { interval_ms:      0, max_polls:  0 },  // sync
  dalle:            { interval_ms:      0, max_polls:  0 },  // sync
  stability:        { interval_ms:      0, max_polls:  0 },  // sync
  claude_repurpose: { interval_ms:      0, max_polls:  0 },  // sync
};
```
