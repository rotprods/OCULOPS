# Creative Factory — Adapter Registry
> OCULOPS | Backend Architect Audit | 2026-03-11
> Status: Design document — no existing files modified

---

## 1. Engine Registry

| Engine | Type | Status | Auth | Async | Cost | Mock Available |
|--------|------|--------|------|-------|------|----------------|
| **Nano Banana** | Image gen | MOCKED | API key pair (POST body) | Sync | ~$0.01/img | YES |
| **Veo 3** | Video gen | MOCKED | Bearer token | Async (real) / Sync (current impl) | ~$0.05–0.20/clip | YES |
| **Higgsfield** | Video gen (character) | KEYS SET, NO ADAPTER | Key ID + Secret (dual) | Async (polling) | ~$0.10–0.50/clip | NO |
| **OpenAI DALL-E 3** | Image gen | KEY LIVE | Bearer token | Sync | ~$0.04/img | NO |
| **Anthropic Claude** | Repurpose / copy | KEY LIVE | x-api-key header | Sync (streaming) | ~$0.003/1k tokens | NO |
| **EverArt** | Image gen | CONFIGURED (api-gateway) | Bearer token | Sync | TBD | NO |
| **Runway ML** | Video gen | PLANNED | Bearer token | Async (polling) | ~$0.05/s | NO |
| **Stability AI** | Image gen | PLANNED | Bearer token | Sync | ~$0.01/img | NO |
| **Blotato-style repurpose** | Repurpose pipeline | PLANNED | Internal (Claude) | Sync | Claude cost | NO |

### Auth Method Detail

| Engine | Auth Implementation |
|--------|-------------------|
| Nano Banana | `apiKey` + `modelKey` embedded in POST body — non-standard, cannot use api-gateway |
| Veo 3 | `Authorization: Bearer {VEO_API_KEY}` |
| Higgsfield | `HIGGSFIELD_API_KEY_ID` + `HIGGSFIELD_API_SECRET` — requires dual-header auth. Current api-gateway entry (line 63) only uses the secret as a Bearer token, which is INCORRECT. |
| OpenAI DALL-E | `Authorization: Bearer {OPENAI_API_KEY}` |
| Anthropic | `x-api-key: {ANTHROPIC_API_KEY}` + `anthropic-version: 2023-06-01` |
| EverArt | `Authorization: Bearer {EVERART_API_KEY}` |
| Runway | `Authorization: Bearer {RUNWAY_API_KEY}` |
| Stability AI | `Authorization: Bearer {STABILITY_API_KEY}` |

---

## 2. Adapter Interface Specification (TypeScript)

```typescript
// Target file: supabase/functions/_shared/creative-adapters.ts

interface CreativeOutput {
  media_url: string;
  media_urls?: string[];
  media_type: "image" | "video" | "audio" | "text";
  format: string;             // "png" | "webp" | "mp4" | "gif" | "txt"
  width?: number;
  height?: number;
  duration_seconds?: number;
  file_size_bytes?: number;
  thumbnail_url?: string;
  metadata: Record<string, unknown>;
}

type JobStatus =
  | "queued"
  | "running"
  | "waiting_external"
  | "completed"
  | "failed"
  | "cancelled";

interface CreativeJobRecord {
  job_id: string;
  external_id?: string;
  engine: CreativeEngine;
  status: JobStatus;
  progress?: number;          // 0–100
  output?: CreativeOutput;
  error?: string;
  created_at: string;
  updated_at: string;
  estimated_duration_ms?: number;
}

type CreativeEngine =
  | "banana"
  | "veo"
  | "higgsfield"
  | "dalle"
  | "stability"
  | "runway"
  | "claude_repurpose";

type CreativeTaskType =
  | "image_from_text"
  | "image_from_image"
  | "video_from_text"
  | "video_from_image"
  | "video_character_consistent"
  | "repurpose_text"
  | "repurpose_video_to_post";

interface CreativeRequest {
  engine?: CreativeEngine;
  task_type: CreativeTaskType;
  prompt: string;
  reference_url?: string;
  options?: Record<string, unknown>;
  user_id?: string;
  org_id?: string;
  correlation_id?: string;
  skip_db?: boolean;
}

interface CreativeAdapter {
  readonly engine: CreativeEngine;
  readonly supports: CreativeTaskType[];

  create_job(request: CreativeRequest): Promise<CreativeJobRecord>;
  get_status(job_id: string, external_id: string): Promise<CreativeJobRecord | undefined>;
  fetch_result(job_id: string, external_id: string): Promise<CreativeOutput>;
  cancel_job(job_id: string, external_id: string): Promise<boolean>;
  normalize_output(raw_response: Record<string, unknown>): CreativeOutput;
}
```

---

## 3. Router Decision Matrix

```
CreativeRequest received by creative-router
    │
    ├─ engine explicitly set?
    │   ├─ YES + key present  → route to that adapter directly
    │   └─ YES + key missing  → return { error: "engine_unavailable", can_mock: bool }
    │
    └─ NO → auto-select by task_type:
        ├─ image_from_text         → dalle (live) → banana (mock)
        ├─ image_from_image        → stability → dalle
        ├─ video_from_text         → veo → higgsfield
        ├─ video_from_image        → higgsfield → runway
        ├─ video_character_*       → higgsfield ONLY
        └─ repurpose_*             → claude_repurpose ONLY
```

Priority rules:
1. Explicit engine + live key → direct route.
2. Explicit engine + no key → structured error (NO silent fallback).
3. Auto-select → try primary, then fallback, then structured error.
4. `skip_db=false` (default) → persist job to `creative_jobs` regardless of sync/async.

---

## 4. Adapter Registry Map

```typescript
const ADAPTER_REGISTRY: Record<CreativeEngine, CreativeAdapter> = {
  banana:           new BananaAdapter(),
  veo:              new VeoAdapter(),
  higgsfield:       new HiggsfieldAdapter(),
  dalle:            new DalleAdapter(),
  stability:        new StabilityAdapter(),
  runway:           new RunwayAdapter(),
  claude_repurpose: new ClaudeRepurposeAdapter(),
};
```

---

## 5. Implementation Priority

| Priority | Adapter | Reason |
|----------|---------|--------|
| P0 | Fix BananaAdapter + VeoAdapter | Replace fire-and-forget with job-tracked versions |
| P0 | HiggsfieldAdapter | Keys are live, no code — biggest quick win |
| P1 | DalleAdapter | OpenAI key is live, DALL-E adds real image quality |
| P1 | ClaudeRepurposeAdapter | Anthropic key live, enables repurposing pipeline |
| P2 | StabilityAdapter | Needs new API key |
| P2 | RunwayAdapter | Needs new API key |
