# Creative Feedback Loop
> OCULOPS | Creative Factory
> Agent 5: Data / Library / Feedback Loop Engineer
> Date: 2026-03-11

---

## The Learning Loop

```
GENERATE → PUBLISH → MEASURE → LEARN → IMPROVE
    ↑                                       |
    └───────────────────────────────────────┘
```

1. **GENERATE** — FORGE agent creates assets via creative_requests → creative_jobs → creative_assets
2. **PUBLISH** — Asset linked to campaign via campaign_assets, published to platform
3. **MEASURE** — Performance data lands in asset_performance (CTR, engagement, ROAS, watch time)
4. **LEARN** — creative_feedback_signals rows are created (by human rating, agent evaluation, threshold triggers)
5. **IMPROVE** — FORGE reads top-scoring signals + best brief patterns → updates creative_briefs.prompt_template + informs next generation prompt

---

## Metrics Tracked Per Asset Per Platform

| Metric | Column | Applies to |
|---|---|---|
| Impressions | `impressions` | all types |
| Clicks | `clicks` | all types |
| CTR | `ctr` | all types (computed: clicks/impressions*100) |
| Conversions | `conversions` | image, video, carousel |
| Engagement rate | `engagement_rate` | social (likes+comments+shares)/impressions*100 |
| Watch time total | `watch_time_sec` | video, reel |
| Completion rate | `completion_rate` | video, reel (% who watched to end) |
| Likes | `likes` | social |
| Comments | `comments` | social |
| Shares | `shares` | social |
| Saves | `saves` | Instagram, TikTok |
| Ad spend | `spend_usd` | paid campaigns |
| Revenue attributed | `revenue_usd` | conversion campaigns |
| ROAS | `roas` | paid (revenue/spend) |

---

## Feedback Signal Types and When They Are Created

| signal_type | Trigger | Created by |
|---|---|---|
| `human_rating` | User rates asset in CreativeStudio UI | Frontend → Supabase insert |
| `ab_winner` | A/B test concludes, winning variant identified | FORGE agent or n8n webhook |
| `performance_threshold` | CTR > 3% or ROAS > 4x threshold crossed | SENTINEL agent or n8n polling job |
| `client_approval` | Client marks asset as approved/rejected | Frontend or email webhook |
| `agent_evaluation` | FORGE runs quality check on completed asset | FORGE edge function |
| `platform_boost` | Platform (Meta, TikTok) boosts organic reach autonomously | n8n webhook from platform API |

### Signal `attributes` JSONB — Pattern Extraction Keys

```jsonb
{
  "format":           "video",
  "platform":         "instagram",
  "tone":             "urgent",
  "objective":        "conversion",
  "duration_sec":     15,
  "has_text_overlay": true,
  "color_scheme":     "dark",
  "has_face":         false,
  "prompt_keywords":  ["oferta", "tiempo limitado", "precio"],
  "brief_id":         "uuid-of-brief-used",
  "campaign_type":    "remarketing"
}
```

These attributes are what the Content Strategy Agent aggregates to find patterns like: "15-second dark-background videos with urgency copy achieve CTR > 4% on Instagram remarketing".

---

## Performance Data Flow

### Channel 1: Manual Entry (immediate, MVP)

```
User sees performance in Meta Ads Manager
  → enters data in AssetPerformance UI
  → INSERT into asset_performance with source='manual'
```

### Channel 2: n8n Webhook (primary automated path)

```
Meta Ads API → n8n workflow (daily at 08:00) →
  n8n reads campaign insights per ad creative →
  n8n maps creative_id → asset_id (via metadata.engine_id or external_url match) →
  POST to Supabase edge function or direct REST upsert:
    UPSERT asset_performance
      ON CONFLICT (asset_id, platform, date)
      DO UPDATE SET impressions=..., clicks=..., source='n8n_webhook'
```

### Channel 3: Agent Poll (fallback)

```
SENTINEL agent (scheduled, runs daily) →
  queries asset_performance for rows older than 24h with source='manual' →
  checks if n8n delivery confirmed →
  if not: calls platform API directly to backfill
```

### Channel 4: Platform Webhooks (future)

Meta sends real-time webhooks on ad events → n8n receives → upserts asset_performance.

---

## Feedback Ingestion Mechanism

### Threshold trigger (runs in SENTINEL or n8n)

```sql
-- Detect assets that crossed CTR threshold today
SELECT
  ap.asset_id,
  ca.title,
  ap.ctr,
  ap.platform
FROM asset_performance ap
JOIN creative_assets ca ON ca.id = ap.asset_id
WHERE ap.date = CURRENT_DATE
  AND ap.ctr > 3.0
  AND ap.impressions > 500
  AND NOT EXISTS (
    SELECT 1 FROM creative_feedback_signals cfs
    WHERE cfs.asset_id = ap.asset_id
      AND cfs.signal_type = 'performance_threshold'
      AND cfs.created_at::date = CURRENT_DATE
  );
```

On match: INSERT into `creative_feedback_signals` with `signal_type='performance_threshold'`, `score=8.0`, `sentiment='positive'`, `attributes` populated.

---

## SQL Queries for Best-Performing Creative

### Best performing by asset type + platform

```sql
SELECT
  ca.id,
  ca.title,
  ca.asset_type,
  ca.platform,
  ca.engine,
  ca.tags,
  ROUND(AVG(ap.ctr), 2)             AS avg_ctr,
  ROUND(AVG(ap.engagement_rate), 2) AS avg_engagement,
  ROUND(AVG(ap.roas), 2)            AS avg_roas,
  SUM(ap.impressions)               AS total_impressions,
  COUNT(DISTINCT ap.date)           AS days_measured
FROM creative_assets ca
JOIN asset_performance ap ON ap.asset_id = ca.id
WHERE ca.org_id = $1
  AND ca.asset_type = $2     -- e.g. 'video'
  AND ap.platform = $3       -- e.g. 'instagram'
  AND ap.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ca.id, ca.title, ca.asset_type, ca.platform, ca.engine, ca.tags
HAVING SUM(ap.impressions) > 1000
ORDER BY avg_ctr DESC
LIMIT 10;
```

### Best performing by campaign

```sql
SELECT
  ca.id,
  ca.title,
  ca.asset_type,
  ROUND(AVG(ap.ctr), 2)   AS avg_ctr,
  ROUND(AVG(ap.roas), 2)  AS avg_roas,
  SUM(ap.revenue_usd)     AS total_revenue
FROM creative_assets ca
JOIN campaign_assets cam_a ON cam_a.asset_id = ca.id
JOIN asset_performance ap  ON ap.asset_id = ca.id
                          AND ap.campaign_id = cam_a.campaign_id
WHERE cam_a.campaign_id = $1
GROUP BY ca.id, ca.title, ca.asset_type
ORDER BY avg_roas DESC NULLS LAST;
```

### Top signals — what attributes correlate with high performance

```sql
SELECT
  cfs.attributes->>'tone'         AS tone,
  cfs.attributes->>'format'       AS format,
  cfs.attributes->>'platform'     AS platform,
  cfs.attributes->>'objective'    AS objective,
  COUNT(*)                        AS signal_count,
  ROUND(AVG(cfs.score), 2)        AS avg_score,
  COUNT(*) FILTER (WHERE cfs.sentiment='positive') AS positive_count
FROM creative_feedback_signals cfs
WHERE cfs.org_id = $1
  AND cfs.score >= 7.0
  AND cfs.created_at >= NOW() - INTERVAL '90 days'
GROUP BY tone, format, platform, objective
HAVING COUNT(*) >= 3
ORDER BY avg_score DESC, signal_count DESC;
```

### Which briefs produce the best outcomes

```sql
SELECT
  cb.id,
  cb.name,
  cb.format,
  cb.platform,
  cb.tone,
  cb.usage_count,
  COUNT(DISTINCT ca.id)           AS assets_generated,
  ROUND(AVG(ap.ctr), 2)          AS avg_ctr,
  ROUND(AVG(cfs.score), 2)       AS avg_feedback_score
FROM creative_briefs cb
JOIN creative_requests cr  ON cr.brief_id = cb.id
JOIN creative_assets ca    ON ca.request_id = cr.id
LEFT JOIN asset_performance ap ON ap.asset_id = ca.id
LEFT JOIN creative_feedback_signals cfs ON cfs.asset_id = ca.id
WHERE cb.org_id = $1
GROUP BY cb.id, cb.name, cb.format, cb.platform, cb.tone, cb.usage_count
ORDER BY avg_feedback_score DESC NULLS LAST;
```

---

## How FORGE Uses This Data to Improve Future Requests

### Step 1 — Pattern Extraction (FORGE reads signals)

FORGE calls a Supabase RPC or direct query against `creative_feedback_signals` to get the top-N `attributes` clusters from high-scoring signals (score >= 7) in the last 90 days.

```sql
-- Called by FORGE on every new request for same format/platform
SELECT attributes
FROM creative_feedback_signals
WHERE org_id = $1
  AND attributes->>'format' = $2
  AND attributes->>'platform' = $3
  AND score >= 7.0
  AND created_at >= NOW() - INTERVAL '90 days'
ORDER BY score DESC
LIMIT 20;
```

### Step 2 — Brief Template Update (FORGE writes to creative_briefs)

When FORGE detects a strong pattern (e.g., "urgency tone + 15s video + dark background = consistent CTR > 3%"), it:

1. Finds the matching `creative_briefs` row
2. Updates `prompt_template` to embed the winning pattern
3. Increments `usage_count`

```sql
UPDATE creative_briefs
SET
  prompt_template = $1,    -- new template with embedded best-practice
  updated_at = now()
WHERE id = $2 AND org_id = $3;
```

### Step 3 — Prompt Enrichment at Generation Time

When FORGE generates a new request, it:

1. Queries top signals for format+platform
2. Extracts top 3 `prompt_keywords` from high-score signal attributes
3. Appends them to the resolved prompt before sending to engine

```
Original prompt: "Create a 15-second Instagram reel for spring sale"
Enriched prompt: "Create a 15-second Instagram reel for spring sale.
  Style: dark background, bold text overlay, urgency tone.
  Keywords proven to work: oferta, tiempo limitado, precio especial.
  Based on top-performing creative patterns for this org."
```

### Step 4 — Continuous Scoring (FORGE evaluates own outputs)

When a job completes and `creative_assets` row is created:

- FORGE inserts an `agent_evaluation` signal with an initial quality score (1–10) based on prompt adherence, brand guidelines, and format specs.
- This populates the signal table even before performance data arrives.
- Once real performance data lands (24–48h later), the score is updated or a new `performance_threshold` signal is added.

---

## Learning Loop Timing

| Step | When | Who |
|---|---|---|
| Asset generated | On-demand or FORGE scheduled | FORGE edge function |
| Agent evaluation signal | Immediately after generation | FORGE |
| Performance data ingested | Daily at 08:00 | n8n workflow |
| Threshold signals created | Daily after performance ingest | SENTINEL or n8n |
| Brief template updates | Weekly (FORGE cron) or on manual trigger | FORGE |
| Human ratings | Anytime | User via UI |

---

## Feedback Loop Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  OCULOPS Event Bus                  │
│           (event_log + pg_notify channel)           │
└──────────────────────┬──────────────────────────────┘
                       │ creative.job.completed
                       ▼
┌─────────────────────────────────────────────────────┐
│              FORGE Edge Function                    │
│  • Creates creative_assets row                      │
│  • Inserts agent_evaluation signal (score)          │
│  • Emits creative.asset.ready event                 │
└──────────────────────┬──────────────────────────────┘
                       │ 24–48h later (n8n daily job)
                       ▼
┌─────────────────────────────────────────────────────┐
│              n8n — Platform Ingestion               │
│  • Calls Meta/TikTok/Google API                     │
│  • UPSERTs asset_performance rows                   │
│  • Triggers POST to /functions/v1/sentinel          │
└──────────────────────┬──────────────────────────────┘
                       │ performance_threshold check
                       ▼
┌─────────────────────────────────────────────────────┐
│              SENTINEL Edge Function                 │
│  • Detects threshold crossings                      │
│  • Inserts performance_threshold signals            │
│  • Emits creative.feedback.signal event             │
└──────────────────────┬──────────────────────────────┘
                       │ weekly FORGE cron
                       ▼
┌─────────────────────────────────────────────────────┐
│              FORGE — Learning Run                   │
│  • Queries top signals (last 90d)                   │
│  • Extracts attribute patterns                      │
│  • Updates creative_briefs.prompt_template          │
│  • Stores insight in agent_memory_v2 (namespace:    │
│    'procedural', key: 'best_patterns_{platform}')   │
└─────────────────────────────────────────────────────┘
```
