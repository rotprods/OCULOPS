# Asset Library — Specification
> OCULOPS | Creative Factory
> Agent 5: Data / Library / Feedback Loop Engineer
> Date: 2026-03-11

---

## Storage Strategy

### Decision: Supabase Storage + URL reference hybrid

| Asset source | How stored |
|---|---|
| Engine returns a URL (Higgsfield CDN, DALL-E URL) | `external_url` in `creative_assets`. No upload until approved. |
| User uploads reference images | Upload to Supabase Storage → `storage_path` + `public_url` |
| Engine returns binary (base64) | Decode, upload to Storage → `storage_path` + `public_url` |
| Text/copy assets | Store content in `metadata.content` field (no binary needed) |

### Supabase Storage buckets

```
creative-assets/          — primary bucket, private
  {org_id}/
    images/
      {asset_id}.webp
    videos/
      {asset_id}.mp4
    thumbnails/
      {asset_id}_thumb.webp
    documents/
      {asset_id}.json

creative-references/      — user uploads for briefs/requests, private
  {org_id}/
    {creative_request_id}/
      ref_0.webp
      ref_1.webp
```

**Bucket policies:**
- Both buckets: private by default
- Authenticated users in org: read/write via Supabase Storage RLS (match `org_id` in path)
- FORGE edge function: uses service-role key, bypasses RLS
- Public CDN: only if `is_approved = TRUE` and a signed URL is generated on request (do NOT set bucket to public)

---

## Asset Metadata Structure

```jsonb
-- creative_assets.metadata (JSONB)
{
  "content":       "Full text body for copy assets",
  "alt_text":      "Accessibility description",
  "color_palette": ["#FFD400", "#000000", "#FFFFFF"],
  "dominant_color": "#FFD400",
  "style_tags":    ["minimalist", "bold", "dark"],
  "engine_id":     "higgsfield-job-abc123",   -- external job ID
  "generation_seed": 42,
  "safety_rating": "safe",
  "nsfw_score":    0.01,
  "faces_detected": 0,
  "brand_elements": ["logo", "product"]
}
```

```jsonb
-- creative_assets.dimensions (JSONB)
{
  "width":        1080,
  "height":       1080,
  "aspect_ratio": "1:1",
  "duration_sec": null,          -- for video
  "fps":          null,
  "bitrate_kbps": null
}
```

---

## Search and Filter Capabilities

### Queries that must be fast (index-covered)

| Query | Index used |
|---|---|
| All assets for org | `idx_creative_assets_org` |
| Assets by type + platform | `idx_creative_assets_type_platform` |
| Assets by status | `idx_creative_assets_status` |
| Assets with a specific tag | `idx_creative_assets_tags` (GIN) |
| Assets by job or request | `idx_creative_assets_job`, `idx_creative_assets_request` |
| Recently created | `idx_creative_assets_created` |
| Top performers by CTR | `idx_asset_perf_ctr` |
| Assets in a campaign | `idx_campaign_assets_campaign` |

### Filter combinations (compound queries)

```sql
-- Gallery view: org assets, type=image, platform=instagram, status=ready
SELECT * FROM creative_assets
WHERE org_id = $1
  AND asset_type = 'image'
  AND platform = 'instagram'
  AND status = 'ready'
ORDER BY created_at DESC
LIMIT 50;

-- Tag search
SELECT * FROM creative_assets
WHERE org_id = $1
  AND tags @> ARRAY['product-launch']
ORDER BY created_at DESC;

-- Full-text search on title + prompt (no pgvector needed at this stage)
SELECT * FROM creative_assets
WHERE org_id = $1
  AND (title ILIKE '%zapatos%' OR prompt_used ILIKE '%zapatos%');
```

Note: Full semantic search (pgvector) is NOT included here. The `20260310150000_knowledge_pgvector.sql` migration handles that for the Knowledge module. Creative assets use simple text search + tag filtering until a dedicated embedding pipeline is added.

---

## Asset Lifecycle

```
creative_request created
        ↓
creative_job queued → running
        ↓
creative_asset created (status: pending)
        ↓ (engine completes)
creative_asset status → ready
        ↓ (human or agent approves)
is_approved = TRUE
        ↓ (linked to campaign)
campaign_assets row created (status: planned)
        ↓ (scheduled)
campaign_assets.status → scheduled, publish_at set
        ↓ (published)
campaign_assets.status → published, published_at set
        ↓ (performance data arrives)
asset_performance rows created
        ↓ (feedback signals generated)
creative_feedback_signals rows created
        ↓ (archived or replaced by new version)
creative_asset status → archived
```

### Versioning

Assets are not mutated after creation. A new version means a new `creative_assets` row with `version = previous + 1`, same `request_id`. The `asset_variants` table tracks repurposing (resize, reformat) without incrementing version.

### Linking to CRM entities

| Link | How |
|---|---|
| Asset → Deal | via `creative_requests.deal_id` |
| Asset → Contact | via `creative_requests.contact_id` |
| Asset → Campaign | via `campaign_assets.campaign_id` |
| Asset → Company | indirect: deal.contact_id → contacts.company |

---

## `useCreativeAssets` Hook Spec

File: `src/hooks/useCreativeAssets.js`

```javascript
// useCreativeAssets() — return shape
{
  // DATA
  assets: CreativeAsset[],           // current page
  total: number,
  loading: boolean,
  error: string | null,

  // FILTERS (state)
  filters: {
    assetType: string | null,        // 'image'|'video'|'copy'|null
    platform: string | null,
    status: string,                  // default: 'ready'
    campaignId: string | null,
    tags: string[],
    search: string,                  // title/prompt ILIKE
    dateRange: { from: Date, to: Date } | null,
  },
  setFilters: (partial) => void,

  // PAGINATION
  page: number,
  pageSize: number,                  // default 24
  setPage: (n) => void,

  // ACTIONS
  addAsset: (data) => Promise<CreativeAsset>,
  updateAsset: (id, partial) => Promise<void>,
  archiveAsset: (id) => Promise<void>,
  approveAsset: (id, approvedBy) => Promise<void>,
  linkToCampaign: (assetId, campaignId, platform) => Promise<void>,

  // COMPUTED
  byType: (type) => CreativeAsset[],
  byPlatform: (platform) => CreativeAsset[],
  approved: CreativeAsset[],

  // REALTIME
  // Supabase channel auto-subscribed on mount:
  //   table: creative_assets, filter: org_id=eq.{orgId}
  //   → on INSERT/UPDATE: upsert into local state
}
```

### Supabase realtime subscription pattern (matches existing hooks)

```javascript
useEffect(() => {
  const channel = supabase
    .channel('creative_assets_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'creative_assets',
      filter: `org_id=eq.${orgId}`,
    }, (payload) => {
      // upsert or remove from local state
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [orgId]);
```

### Companion hooks

| Hook | Table | Purpose |
|---|---|---|
| `useCreativeJobs(requestId?)` | `creative_jobs` | Live job status for a request or all queued jobs |
| `useCreativeBriefs()` | `creative_briefs` | Load/CRUD brief templates |
| `useAssetPerformance(assetId)` | `asset_performance` | Performance timeseries for a single asset |
| `useCampaignAssets(campaignId)` | `campaign_assets` | All assets linked to a campaign + their status |
