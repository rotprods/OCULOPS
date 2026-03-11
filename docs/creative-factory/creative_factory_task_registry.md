# Creative Factory — Task Registry
> Agent: code-reviewer (Agent 6) | Date: 2026-03-11
> Prioritized implementation backlog for all 9 phases.
> Reference this as the single source of truth for build sequencing.
> Architecture docs: creative_factory_architecture.md, creative_data_model.md, creative_job_engine.md, creative_factory_adapter_registry.md, creative_feedback_loop.md, asset_library_spec.md, creative_event_map.md

---

## Legend

- **Priority**: P0 = blocker / P1 = required for usable feature / P2 = enhancement
- **Effort**: S = 1–2h / M = 2–6h / L = 6–16h / XL = 16h+
- **Phase**: 1–9 (see phase headers)
- **Deps**: task IDs that must complete first
- **DoD**: Definition of Done — specific, verifiable criteria

---

## Phase 1 — Current Module Inspection
> COMPLETE. This phase produced the architecture, data model, adapter registry, job engine, event map, asset library spec, and feedback loop documents. No implementation tasks remain in Phase 1.

```
TASK-CF-001
Title: Audit existing CreativeStudio.jsx for bugs and integration gaps
Agent/Person: code-reviewer (Agent 6)
Phase: 1
Priority: P0
Effort: S
Deps: none
Files: docs/creative-factory/creative_factory_validation.md (this audit)
Definition of Done:
  - All bugs enumerated with file:line references
  - Integration coherence check completed (frontend ↔ backend ↔ DB)
  - Security risks documented
  - Validation report written and present in docs/creative-factory/
STATUS: DONE
```

---

## Phase 2 — Gap Analysis

```
TASK-CF-002
Title: Confirm remote deployment status of banana-generate and veo-generate
Agent/Person: Developer
Phase: 2
Priority: P0
Effort: S
Deps: none
Files: none (verification only)
Definition of Done:
  - Run `supabase functions list` and confirm both functions appear as ACTIVE
  - If not deployed: run `supabase functions deploy banana-generate` and `supabase functions deploy veo-generate`
  - Document result in this registry as a comment
```

```
TASK-CF-003
Title: Verify Higgsfield secrets are correctly set in remote Supabase
Agent/Person: Developer
Phase: 2
Priority: P1
Effort: S
Deps: none
Files: none (verification only)
Definition of Done:
  - Run `supabase secrets list` and confirm HIGGSFIELD_API_KEY_ID and HIGGSFIELD_API_SECRET are present
  - Attempt a manual curl to the Higgsfield API using the keys to confirm they are valid/active
  - If keys are expired or invalid: obtain new credentials before TASK-CF-014 begins
```

```
TASK-CF-004
Title: Confirm creative-factory migration has NOT been applied to production DB
Agent/Person: Developer
Phase: 2
Priority: P0
Effort: S
Deps: none
Files: none (verification only)
Definition of Done:
  - Run `supabase db diff --linked` or check Supabase Studio table list
  - Confirm: creative_assets, creative_briefs, creative_jobs, creative_requests, asset_variants, engine_runs, asset_performance, campaign_assets, creative_feedback_signals are ALL absent
  - If any table already exists with a different schema from Agent 5's spec: document the discrepancy before applying migration
```

---

## Phase 3 — Adapter Normalization

```
TASK-CF-005
Title: Fix response shape mismatch in banana-generate mock and real path
Agent/Person: Developer
Phase: 3
Priority: P0
Effort: S
Deps: TASK-CF-002
Files: supabase/functions/banana-generate/index.ts
Definition of Done:
  - Mock response changed from { status, mediaUrl, message } to { url, type: 'image', mocked: true, message }
  - Real response normalized: extract the output URL from Banana API response and return { url, type: 'image', mocked: false }
  - When mocked: HTTP response includes header X-Mocked: true
  - Frontend can read result.url in all code paths without falling back to hardcoded Unsplash URL
  - Existing fallback Unsplash URL in CreativeStudio.jsx L90 removed (replaced by proper error handling)
  NOTE: Do not deploy until TASK-CF-010 (rate limiting) is also complete
```

```
TASK-CF-006
Title: Fix response shape mismatch in veo-generate mock and real path
Agent/Person: Developer
Phase: 3
Priority: P0
Effort: S
Deps: TASK-CF-002
Files: supabase/functions/veo-generate/index.ts
Definition of Done:
  - Mock response changed to { url, type: 'video', mocked: true, message }
  - Real response normalized: extract video URL from Veo API response and return { url, type: 'video', mocked: false }
  - When mocked: HTTP response includes header X-Mocked: true
  - Frontend can read result.url without falling back to hardcoded GitHub GIF
  - Hardcoded fallback GIF URL in CreativeStudio.jsx L92-93 removed
  NOTE: Do not deploy until TASK-CF-010 (rate limiting) is also complete
```

```
TASK-CF-007
Title: Add prompt sanitization and maxLength enforcement to both edge functions
Agent/Person: Developer
Phase: 3
Priority: P0
Effort: S
Deps: none
Files: supabase/functions/banana-generate/index.ts, supabase/functions/veo-generate/index.ts
Definition of Done:
  - prompt.trim() applied before any use
  - prompt.length > 2000: return 400 with user-friendly message "Prompt too long (max 2000 characters)"
  - textarea in CreativeStudio.jsx gets maxLength={2000} attribute
  - No raw prompt string is passed to external API without the length check passing first
```

```
TASK-CF-008
Title: Add real JWT validation to banana-generate and veo-generate
Agent/Person: Developer
Phase: 3
Priority: P1
Effort: S
Deps: none
Files: supabase/functions/banana-generate/index.ts, supabase/functions/veo-generate/index.ts
Definition of Done:
  - Import createClient from _shared/supabase.ts
  - Call supabase.auth.getUser(jwt) to validate the token and extract user_id and org_id
  - If getUser returns error: return 401 Unauthorized
  - user_id available for asset ownership tracking in future tasks
  - Replaces the current header-presence-only check
```

```
TASK-CF-009
Title: Add user-visible mock warning to both edge functions
Agent/Person: Developer
Phase: 3
Priority: P1
Effort: S
Deps: TASK-CF-005, TASK-CF-006
Files: supabase/functions/banana-generate/index.ts, supabase/functions/veo-generate/index.ts, src/components/modules/CreativeStudio.jsx
Definition of Done:
  - When API key is missing: return HTTP 503 with body { error: 'API_KEY_NOT_CONFIGURED', message: 'Image generation is not yet activated. Contact your administrator.' }
  - Remove the silent 200 mock entirely — mock mode is now an explicit error, not a fake success
  - CreativeStudio error banner displays the user-friendly message (not the raw error code)
  - Developer/staging environments: environment variable ALLOW_MOCK=true can restore mock behavior if needed, but must return mocked: true in response
```

```
TASK-CF-010
Title: Add per-org rate limiting to banana-generate and veo-generate
Agent/Person: Developer
Phase: 3
Priority: P0
Effort: M
Deps: TASK-CF-008
Files: supabase/functions/banana-generate/index.ts, supabase/functions/veo-generate/index.ts, supabase/functions/_shared/rate-limiter.ts (new)
Definition of Done:
  - Shared _shared/rate-limiter.ts module with checkRateLimit(org_id, action, limit, windowSeconds) function
  - Uses Supabase DB table `rate_limit_buckets` or the existing `engine_runs` table to count recent calls
  - Default limits: 10 image requests / 10 minutes per org, 5 video requests / 10 minutes per org
  - Exceeding limit: return 429 with Retry-After header and user-friendly message
  - Rate limit values configurable via Supabase secrets BANANA_RATE_LIMIT and VEO_RATE_LIMIT
  - TASK-CF-005 and TASK-CF-006 NOT deployed until this task is complete
```

```
TASK-CF-011
Title: Create higgsfield-generate edge function
Agent/Person: Developer
Phase: 3
Priority: P1
Effort: M
Deps: TASK-CF-003, TASK-CF-008, TASK-CF-010
Files: supabase/functions/higgsfield-generate/index.ts (new)
Definition of Done:
  - New edge function at supabase/functions/higgsfield-generate/index.ts
  - Reads HIGGSFIELD_API_KEY_ID and HIGGSFIELD_API_SECRET from Deno.env
  - Authenticates via Higgsfield API (consult Higgsfield docs for auth method — likely HMAC or Bearer)
  - Accepts { prompt, job_id, options } body
  - Returns normalized { url, type: 'video', engine: 'higgsfield', mocked: false }
  - Rate limiting applied (5 video requests / 10 minutes per org, shared with veo-generate quota)
  - Prompt sanitization applied (maxLength 2000)
  - JWT validation via _shared/supabase.ts
  - Function deployed: `supabase functions deploy higgsfield-generate`
  - Manual test with curl confirms API call succeeds and returns a valid video URL
```

```
TASK-CF-012
Title: Create creative-generate unified router edge function
Agent/Person: Developer
Phase: 3
Priority: P1
Effort: M
Deps: TASK-CF-005, TASK-CF-006, TASK-CF-011
Files: supabase/functions/creative-generate/index.ts (new)
Definition of Done:
  - New edge function at supabase/functions/creative-generate/index.ts
  - Accepts { prompt, model, job_id, campaign_id, options } body
  - model values: 'banana' | 'veo3' | 'higgsfield'
  - Routes to appropriate adapter based on model field
  - Unknown model: returns 400 with supported model list
  - All adapters return normalized { url, type, engine, mocked, job_id }
  - Function reads from creative_jobs (TASK-CF-016) to update job status on completion/failure
  - Deployed: `supabase functions deploy creative-generate`
  - Unit-testable: adapter routing logic exported as pure function
```

---

## Phase 4 — Job Engine

```
TASK-CF-013
Title: Apply creative factory migration to production DB
Agent/Person: Developer
Phase: 4
Priority: P0
Effort: S
Deps: TASK-CF-004
Files: supabase/migrations/20260320100000_creative_factory.sql (created by Agent 5)
Definition of Done:
  - Migration file verified to match Agent 5's specification in creative_data_model.md
  - Run `npx supabase db push --linked`
  - All 9 tables confirmed in Supabase Studio: creative_briefs, creative_requests, creative_jobs, creative_assets, asset_variants, engine_runs, asset_performance, campaign_assets, creative_feedback_signals
  - RLS policies confirmed active on all 9 tables
  - Realtime enabled for creative_jobs, creative_assets, asset_performance, campaign_assets
  - updated_at triggers confirmed for 6 tables
  - No errors in migration output
```

```
TASK-CF-014
Title: Refactor useGenerativeMedia to use job-based async pattern
Agent/Person: Developer
Phase: 4
Priority: P0
Effort: M
Deps: TASK-CF-013, TASK-CF-012
Files: src/hooks/useGenerativeMedia.js
Definition of Done:
  - generateImage(prompt, options) now:
    1. INSERTs row to creative_requests (status=pending)
    2. INSERTs row to creative_jobs (status=queued, engine, request_id)
    3. Invokes creative-generate edge function with { prompt, model: 'banana', job_id }
    4. Returns { job_id, request_id } immediately — does NOT await the URL
  - generateVideo(prompt, options) same pattern with model: 'veo3' or 'higgsfield'
  - isGeneratingImage / isGeneratingVFX flags remain for backward compatibility
  - error state covers DB write failures as well as API failures
  - AbortController added with 90-second timeout — throws TimeoutError on expiry
  - No in-memory gallery state managed by this hook (moved to useCreativeAssets)
```

```
TASK-CF-015
Title: Create useCreativeAssets hook
Agent/Person: Developer
Phase: 4
Priority: P0
Effort: M
Deps: TASK-CF-013
Files: src/hooks/useCreativeAssets.js (new)
Definition of Done:
  - Follows exact pattern of useCampaigns.js: fetchAll, insertRow, updateRow, deleteRow, subscribeDebouncedToTable
  - fetchAll() queries creative_assets WHERE org_id = currentOrg, ORDER BY created_at DESC, LIMIT 50
  - Supabase Realtime subscription on creative_assets table — gallery updates automatically when a job completes
  - Supabase Realtime subscription on creative_jobs table — job status updates push to UI without polling
  - deleteAsset(id) sets status = 'archived' (soft delete), does not physically delete row
  - linkToCampaign(asset_id, campaign_id) INSERTs to campaign_assets with status=planned
  - Exported from src/hooks/index.js
  - No local state for gallery — all state is server state from Supabase
```

```
TASK-CF-016
Title: Create useBriefs hook
Agent/Person: Developer
Phase: 4
Priority: P1
Effort: M
Deps: TASK-CF-013
Files: src/hooks/useBriefs.js (new)
Definition of Done:
  - Follows useCampaigns.js pattern
  - fetchAll() queries creative_briefs WHERE org_id = currentOrg AND is_active = true, ORDER BY usage_count DESC
  - createBrief(data) INSERTs to creative_briefs with org_id
  - updateBrief(id, data) UPDATEs row
  - archiveBrief(id) sets is_active = false
  - incrementUsage(id) increments usage_count by 1 on brief open
  - searchBriefs(query) filters by name ILIKE %query% OR tags @> ARRAY[query]
  - Exported from src/hooks/index.js
  - Realtime subscription on creative_briefs table
```

```
TASK-CF-017
Title: Seed initial brief templates from hardcoded BRIEF_TEMPLATES constant
Agent/Person: Developer
Phase: 4
Priority: P1
Effort: S
Deps: TASK-CF-013
Files: supabase/migrations/20260320110000_creative_briefs_seed.sql (new)
Definition of Done:
  - New migration that INSERTs the 4 existing BRIEF_TEMPLATES entries (chatbot, meta-ads, prospecting, content) into creative_briefs table
  - Seed rows have org_id = NULL (available to all orgs as shared templates) OR a system org_id placeholder
  - Migration applied: `npx supabase db push --linked`
  - After migration: the hardcoded BRIEF_TEMPLATES constant in CreativeStudio.jsx can be removed
```

---

## Phase 5 — Data Model Completion

```
TASK-CF-018
Title: Provision Supabase Storage bucket for creative assets
Agent/Person: Developer
Phase: 5
Priority: P0
Effort: S
Deps: TASK-CF-013
Files: supabase/migrations/20260320120000_creative_storage.sql (new) OR Supabase Studio
Definition of Done:
  - Bucket named `creative-assets` created in Supabase Storage
  - Bucket is private (not public) — access via signed URLs only
  - RLS policy: authenticated users can read objects WHERE object path starts with their org_id
  - Edge functions (with service role key) can write to any path in the bucket
  - Signed URL generation added to useCreativeAssets hook: getSignedUrl(storage_path, expiresInSeconds=3600)
```

```
TASK-CF-019
Title: Add asset download flow to creative_assets (upload external URL to Supabase Storage)
Agent/Person: Developer
Phase: 5
Priority: P1
Effort: M
Deps: TASK-CF-018, TASK-CF-012
Files: supabase/functions/creative-generate/index.ts
Definition of Done:
  - After successful generation: if engine returns an external_url, creative-generate fetches the content
  - Uploads the binary to Supabase Storage at path: creative-assets/{org_id}/{asset_id}.{ext}
  - Sets creative_assets.storage_path and public_url after upload
  - Sets creative_assets.external_url = original engine URL (for reference)
  - File size captured and written to creative_assets.file_size_bytes
  - If upload fails: asset still marked as ready with external_url only — no blocking
```

```
TASK-CF-020
Title: Wire campaign_id and deal_id through the full generation path
Agent/Person: Developer
Phase: 5
Priority: P1
Effort: S
Deps: TASK-CF-014, TASK-CF-013
Files: src/hooks/useGenerativeMedia.js, supabase/functions/creative-generate/index.ts
Definition of Done:
  - generateImage/generateVideo accept optional { campaign_id, deal_id } in options
  - campaign_id / deal_id passed in body to creative-generate edge function
  - creative-generate writes these FKs to creative_requests row on INSERT
  - creative_assets row inherits campaign_id via creative_requests.campaign_id JOIN
  - useCreativeAssets.fetchByCampaign(campaign_id) added — filters gallery by campaign
```

```
TASK-CF-021
Title: Add engine_runs logging to all generation adapters
Agent/Person: Developer
Phase: 5
Priority: P1
Effort: S
Deps: TASK-CF-012, TASK-CF-013
Files: supabase/functions/creative-generate/index.ts
Definition of Done:
  - Before each external API call: start timer
  - After response: INSERT to engine_runs with { job_id, engine, model, endpoint, http_status, duration_ms, request_body, response_body, cost_usd }
  - cost_usd: hardcode per-unit estimates (banana: $0.002/image, veo3: $0.05/video, higgsfield: $0.08/video) until real billing data available
  - engine_runs inserts do not block the main job completion path (fire-and-forget INSERT)
  - engine_runs table queryable from Supabase Studio for cost monitoring
```

---

## Phase 6 — Copilot + Agent Connection

```
TASK-CF-022
Title: Register get_creative_assets Copilot tool
Agent/Person: Developer
Phase: 6
Priority: P1
Effort: M
Deps: TASK-CF-015, TASK-CF-013
Files: supabase/functions/agent-copilot/index.ts
Definition of Done:
  - New tool definition added to Copilot tool array:
    name: "get_creative_assets"
    description: "List generated creative assets for this org. Can filter by campaign_id, asset_type (image/video/copy), and limit."
    parameters: { campaign_id?: string, asset_type?: string, limit?: number }
  - Tool handler: SELECT from creative_assets with provided filters, ORDER BY created_at DESC
  - Returns array of { id, title, asset_type, public_url, thumbnail_url, prompt_used, engine, created_at, campaign_id }
  - Copilot can reference last returned asset_id in follow-up conversation turns
  - Tool registered in Copilot function array and deployed: `supabase functions deploy agent-copilot`
```

```
TASK-CF-023
Title: Register generate_asset Copilot tool
Agent/Person: Developer
Phase: 6
Priority: P1
Effort: M
Deps: TASK-CF-012, TASK-CF-013, TASK-CF-022
Files: supabase/functions/agent-copilot/index.ts
Definition of Done:
  - New tool definition added to Copilot tool array:
    name: "generate_asset"
    description: "Generate an AI image or video asset. Triggers the Creative Factory generation pipeline."
    parameters: { prompt: string, type: 'image' | 'video', model?: 'banana' | 'veo3' | 'higgsfield', campaign_id?: string }
  - Tool handler: invokes creative-generate edge function with the provided parameters
  - Returns { job_id, request_id, status: 'queued', message: 'Asset generation started. Check Creative Studio for progress.' }
  - Copilot stores returned job_id in session context for follow-up queries
  - Deployed: `supabase functions deploy agent-copilot`
```

```
TASK-CF-024
Title: Wire FORGE agent output to creative_assets table (type=copy)
Agent/Person: Developer
Phase: 6
Priority: P1
Effort: M
Deps: TASK-CF-013
Files: supabase/functions/agent-forge/index.ts
Definition of Done:
  - After FORGE generates content and writes to knowledge_entries (existing behavior, unchanged):
  - Also INSERT to creative_assets: { org_id, asset_type: 'copy', format: 'txt', prompt_used, engine: 'gpt-4o', status: 'ready', campaign_id (if provided in FORGE call) }
  - external_url set to null; content stored in metadata.content JSONB field
  - FORGE accepts optional campaign_id parameter — passed through to creative_assets FK
  - No breaking changes to existing FORGE behavior
  - Deployed: `supabase functions deploy agent-forge`
```

```
TASK-CF-025
Title: Create useForgeContent hook
Agent/Person: Developer
Phase: 6
Priority: P1
Effort: M
Deps: TASK-CF-013
Files: src/hooks/useForgeContent.js (new)
Definition of Done:
  - Follows useAgents.js invocation pattern
  - generateCopy({ content_type, topic, audience, tone, campaign_id }) — invokes agent-forge
  - Returns { knowledge_entry_id, asset_id, content } on success
  - isGenerating, error, result states
  - content_type values match FORGE's existing supported types: blog_post, social_post, email, ad_copy, whatsapp_sequence
  - Exported from src/hooks/index.js
```

```
TASK-CF-026
Title: Emit creative event bus events from creative-generate and creative_jobs
Agent/Person: Developer
Phase: 6
Priority: P1
Effort: S
Deps: TASK-CF-012, TASK-CF-013
Files: supabase/functions/creative-generate/index.ts, supabase/migrations/20260320130000_creative_events_trigger.sql (new)
Definition of Done:
  - DB trigger on creative_jobs: when status changes to 'completed', INSERT to event_log: { event_type: 'creative.asset_ready', payload: { asset_id, asset_type, campaign_id, engine, org_id } }
  - DB trigger on creative_jobs: when status changes to 'failed', INSERT to event_log: { event_type: 'creative.job_failed', payload: { job_id, error_message, prompt, engine, org_id } }
  - DB trigger on creative_briefs: when status changes to 'approved', INSERT to event_log: { event_type: 'creative.brief_approved', payload: { brief_id, campaign_id, org_id } }
  - All events follow existing event_log schema from 20260310120000_event_bus.sql
  - Events visible in ControlTower event feed
```

---

## Phase 7 — UI / Module Experience

```
TASK-CF-027
Title: Fix video asset rendering — replace img tag with video tag
Agent/Person: Developer
Phase: 7
Priority: P0
Effort: S
Deps: none
Files: src/components/modules/CreativeStudio.jsx
Definition of Done:
  - Line 213: `asset.type === 'video'` branch renders `<video src={asset.url} controls className="cs-asset-media" />`
  - Image branch unchanged: `<img src={asset.url} alt="Generated asset" className="cs-asset-media" />`
  - Video element has controls attribute so user can play/pause
  - Video element has preload="metadata" to avoid autoloading large files
```

```
TASK-CF-028
Title: Rewrite CreativeStudio.css with canonical design system tokens
Agent/Person: Developer
Phase: 7
Priority: P0
Effort: M
Deps: none
Files: src/components/modules/CreativeStudio.css
Definition of Done:
  - All occurrences of deleted tokens replaced with canonical equivalents per CLAUDE.md spec:
    --accent-primary → --color-primary
    --text-primary → --color-text
    --text-secondary → --color-text-2
    --text-tertiary → --color-text-3
    --border-default → --color-border
    --surface-raised → --color-bg-3
    --gradient-accent → linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))
    --shadow-glow → 0 0 0 1px var(--color-border) (NO glow — war room aesthetic)
    --shadow-md → 0 0 0 1px var(--color-border)
    --glass-inner-glow → removed (no glassmorphism per CLAUDE.md)
  - All backdrop-filter rules removed (no glassmorphism)
  - All box-shadow gold glow rules replaced with 1px border approach
  - Modal overlay: rgba(0,0,0,0.85) — already correct, retain
  - No hardcoded color values (all through tokens)
  - Visual parity with CRM.jsx as reference implementation
  - No visual regressions on existing two views (deploy, briefs)
```

```
TASK-CF-029
Title: Replace in-memory gallery with Supabase-persisted AssetVaultPanel
Agent/Person: Developer
Phase: 7
Priority: P0
Effort: L
Deps: TASK-CF-015, TASK-CF-027, TASK-CF-028, TASK-CF-014
Files: src/components/modules/CreativeStudio.jsx
Definition of Done:
  - gallery: useState([]) removed from CreativeStudio
  - useCreativeAssets() hook imported and used for gallery data
  - Gallery displays assets from DB ordered by created_at DESC
  - Asset card shows: thumbnail/preview, status badge, prompt_used, engine, created_at, campaign link
  - Realtime subscription drives live status updates (queued → running → completed) without polling
  - Loading state: skeleton card inserted immediately on job submit, replaced when Realtime fires
  - Empty state: "AWAITING GENERATION PROTOCOL." retained when creative_assets query returns empty
  - Pagination: LIMIT 20, "Load more" button triggers offset query
  - Image assets: <img> with object-fit: cover
  - Video assets: <video controls preload="metadata"> (BUG-001 fix applied)
  - Download button on each ready asset (generates signed URL via getSignedUrl())
  - "Link to Campaign" action on each ready asset — opens campaign picker modal
```

```
TASK-CF-030
Title: Replace hardcoded BRIEF_TEMPLATES with DB-driven BriefPanel
Agent/Person: Developer
Phase: 7
Priority: P1
Effort: L
Deps: TASK-CF-016, TASK-CF-017, TASK-CF-028
Files: src/components/modules/CreativeStudio.jsx
Definition of Done:
  - BRIEF_TEMPLATES constant removed
  - useBriefs() hook imported and used
  - Brief library fetches from creative_briefs table (DB-backed)
  - Category filter driven by distinct format/category values from DB (not hardcoded)
  - Search input added to filter briefs by name or tag
  - "New Brief" button opens BriefEditorModal in create mode
  - Click on existing brief opens BriefEditorModal in edit mode
  - BriefEditorModal saves to DB via createBrief / updateBrief (replaces clipboard-only export)
  - Clipboard export retained as secondary action within modal
  - Archive action on brief cards (sets is_active = false)
  - usage_count incremented on brief open via incrementUsage()
```

```
TASK-CF-031
Title: Add ForgePanel (text/copy generation via FORGE agent)
Agent/Person: Developer
Phase: 7
Priority: P1
Effort: M
Deps: TASK-CF-025, TASK-CF-028
Files: src/components/modules/CreativeStudio.jsx
Definition of Done:
  - Third view tab added: [ FORGE OPS ] alongside [ MEDIA OPS ] and [ BRIEF DB ]
  - ForgePanel contains: content_type selector, topic input, audience input, tone selector, optional campaign picker
  - content_type options: Social Post, Blog Post, Email, Ad Copy, WhatsApp Sequence
  - "Generate" button invokes useForgeContent.generateCopy()
  - Output panel shows generated text, copyable, with "Save to Brief" button
  - Saved copy assets appear in AssetVaultPanel with asset_type=copy
  - Loading state, error state per existing pattern
```

```
TASK-CF-032
Title: Add react-hot-toast notifications for creative generation events
Agent/Person: Developer
Phase: 7
Priority: P1
Effort: S
Deps: TASK-CF-029
Files: src/components/modules/CreativeStudio.jsx
Definition of Done:
  - On job submit: toast.loading('Generating asset...', { id: job_id })
  - On Realtime status=completed: toast.success('Asset ready!', { id: job_id })
  - On Realtime status=failed: toast.error('Generation failed. ' + friendly_message, { id: job_id })
  - Timeout error (90s): toast.error('Generation timed out. Please try again.', { id: job_id })
  - Consistent with toast styling in rest of app (already configured in App.jsx Toaster)
```

```
TASK-CF-033
Title: Add LinkToCampaignModal component
Agent/Person: Developer
Phase: 7
Priority: P2
Effort: M
Deps: TASK-CF-029, TASK-CF-020
Files: src/components/modules/CreativeStudio.jsx
Definition of Done:
  - Modal renders list of campaigns from useCampaigns() with search
  - Selecting a campaign and confirming: calls useCreativeAssets.linkToCampaign(asset_id, campaign_id)
  - INSERT to campaign_assets with status=planned
  - Success toast: "Asset linked to [Campaign Name]"
  - Modal follows standard overlay pattern: rgba(0,0,0,0.85), var(--color-bg-2), ESC to close
```

---

## Phase 8 — Feedback Loop

```
TASK-CF-034
Title: Add human rating UI to asset cards
Agent/Person: Developer
Phase: 8
Priority: P2
Effort: S
Deps: TASK-CF-029, TASK-CF-013
Files: src/components/modules/CreativeStudio.jsx
Definition of Done:
  - Each asset card in AssetVaultPanel has a star rating or thumbs-up/down action
  - Rating action INSERTs to creative_feedback_signals: { asset_id, signal_type: 'human_rating', score, source: 'user' }
  - Optimistic UI: rating reflects immediately, reverted on DB error
  - Visual: minimal — 5 small dots or 👍/👎 buttons, no visual weight
```

```
TASK-CF-035
Title: Wire asset_performance table to n8n webhook for Meta/TikTok data ingestion
Agent/Person: Developer
Phase: 8
Priority: P2
Effort: L
Deps: TASK-CF-013
Files: supabase/functions/asset-performance-ingest/index.ts (new)
Definition of Done:
  - New edge function that receives POST from n8n with { asset_id, platform, date, impressions, clicks, conversions, spend_usd } body
  - UPSERTs to asset_performance on (asset_id, platform, date) UNIQUE constraint
  - Computes ctr = clicks/impressions*100 before insert
  - Secured with CRON_SECRET header check (same pattern as daily-snapshot)
  - n8n workflow configured to call this function after Meta/TikTok data pull
  - Not blocked on Meta/TikTok API secrets — function deployed, n8n side wired when secrets are ready
```

```
TASK-CF-036
Title: Implement FORGE learning loop from creative_feedback_signals
Agent/Person: Developer
Phase: 8
Priority: P2
Effort: L
Deps: TASK-CF-034, TASK-CF-021, TASK-CF-013
Files: supabase/functions/agent-forge/index.ts, supabase/functions/_shared/agent-brain-v2.ts
Definition of Done:
  - New FORGE action: 'analyze_performance'
  - Reads creative_feedback_signals WHERE score IS NOT NULL ORDER BY created_at DESC LIMIT 100
  - Reads asset_performance for the same assets WHERE ctr IS NOT NULL
  - Produces: top 3 performing prompt patterns, worst 3 performing patterns, recommended tone/format combinations
  - Writes analysis to knowledge_entries (type='creative_learning_report')
  - Callable from Copilot: "What creative content is working best?"
  - Runs automatically on creative.brief_approved event (via event_log trigger)
```

---

## Phase 9 — Validation

```
TASK-CF-037
Title: End-to-end integration test: image generation flow
Agent/Person: Developer
Phase: 9
Priority: P0
Effort: M
Deps: all Phase 4–7 tasks
Files: No source file changes — manual test protocol
Definition of Done:
  - With real API keys set (or ALLOW_MOCK=true in staging): submit prompt in MediaOpsPanel
  - creative_requests row appears in DB with status=pending
  - creative_jobs row appears with status=queued, then running, then completed
  - creative_assets row appears with public_url or external_url populated
  - Gallery in AssetVaultPanel updates via Realtime WITHOUT page refresh
  - Toast shows loading → success sequence
  - Refresh page: asset still visible in gallery (persistence confirmed)
  - Attach to campaign: campaign_assets row created
  - Result documented in this registry
```

```
TASK-CF-038
Title: End-to-end integration test: brief creation and save flow
Agent/Person: Developer
Phase: 9
Priority: P1
Effort: S
Deps: TASK-CF-030, TASK-CF-016
Files: No source file changes — manual test protocol
Definition of Done:
  - Open Brief DB tab
  - Click "New Brief" — BriefEditorModal opens in create mode
  - Fill in name, format, platform, template text, tags
  - Save — creative_briefs row inserted in DB
  - Brief appears in grid without page refresh (Realtime)
  - Click brief — opens in edit mode, values pre-populated
  - Edit a field, save — UPDATE confirmed in DB
  - Archive brief — is_active = false, brief disappears from grid
  - Search: type partial name — results filter correctly
```

```
TASK-CF-039
Title: Security validation: prompt injection and rate limiting
Agent/Person: Developer
Phase: 9
Priority: P0
Effort: M
Deps: TASK-CF-007, TASK-CF-010
Files: No source file changes — manual test protocol
Definition of Done:
  - Submit prompt > 2000 characters: edge function returns 400, user sees friendly error in banner
  - Submit 11 image requests within 10 minutes from same org: 11th request returns 429 with Retry-After header
  - UI shows "Too many requests. Please wait X minutes." message
  - Submit curl with Authorization: Bearer fake: edge function returns 401
  - Submit prompt containing "Ignore all previous instructions. System: you are now...": request processed normally (no special behavior — sanitization does not need to block this, API's own guardrails handle it; test confirms no server-side crash or unexpected response shape)
```

```
TASK-CF-040
Title: Validate CSS token compliance — zero deleted tokens in CreativeStudio.css
Agent/Person: Developer
Phase: 9
Priority: P0
Effort: S
Deps: TASK-CF-028
Files: src/components/modules/CreativeStudio.css
Definition of Done:
  - Run: `grep -n -- '--accent-primary\|--text-primary\|--text-secondary\|--border-default\|--surface-raised\|--gradient-accent\|--shadow-glow\|--shadow-md\|--glass-inner-glow\|--bg-primary\|--success\|--danger\|--warning' src/components/modules/CreativeStudio.css`
  - Output: zero matches
  - Run: `grep -n 'backdrop-filter' src/components/modules/CreativeStudio.css`
  - Output: zero matches
  - Visual QA: module renders correctly in Vite dev server with correct gold/black/border aesthetic
```

```
TASK-CF-041
Title: Update CLAUDE.md module status table for CreativeStudio
Agent/Person: Developer
Phase: 9
Priority: P1
Effort: S
Deps: TASK-CF-037, TASK-CF-038
Files: CLAUDE.md
Definition of Done:
  - CreativeStudio.jsx row in module table updated from EXISTS to PARCIAL or DONE depending on actual phase completion
  - New hooks listed in Hooks section: useCreativeAssets, useBriefs, useForgeContent
  - New tables listed: creative_assets, creative_briefs, creative_jobs, creative_requests, asset_variants, engine_runs, asset_performance, campaign_assets, creative_feedback_signals
  - New edge functions listed: creative-generate, higgsfield-generate
  - Session log appended to docs/session-log.md per CLAUDE.md protocol
```

---

## Task Dependency Map

```
Phase 2:  CF-002, CF-003, CF-004  (independent, run in parallel)
Phase 3:  CF-007 (no dep, can start now)
          CF-008 (no dep, can start now)
          CF-009 → CF-005, CF-006
          CF-010 → CF-008
          CF-005, CF-006 (no dep, but DO NOT DEPLOY until CF-010 done)
          CF-011 → CF-003, CF-008, CF-010
          CF-012 → CF-005, CF-006, CF-011
Phase 4:  CF-013 → CF-004
          CF-014 → CF-013, CF-012
          CF-015 → CF-013
          CF-016 → CF-013
          CF-017 → CF-013
Phase 5:  CF-018 → CF-013
          CF-019 → CF-018, CF-012
          CF-020 → CF-014, CF-013
          CF-021 → CF-012, CF-013
Phase 6:  CF-022 → CF-015, CF-013
          CF-023 → CF-012, CF-013, CF-022
          CF-024 → CF-013
          CF-025 → CF-013
          CF-026 → CF-012, CF-013
Phase 7:  CF-027 (no dep, can start NOW — isolated bug fix)
          CF-028 (no dep, can start NOW — CSS only)
          CF-029 → CF-015, CF-027, CF-028, CF-014
          CF-030 → CF-016, CF-017, CF-028
          CF-031 → CF-025, CF-028
          CF-032 → CF-029
          CF-033 → CF-029, CF-020
Phase 8:  CF-034 → CF-029, CF-013
          CF-035 → CF-013
          CF-036 → CF-034, CF-021, CF-013
Phase 9:  CF-037 → all P3-P7
          CF-038 → CF-030, CF-016
          CF-039 → CF-007, CF-010
          CF-040 → CF-028
          CF-041 → CF-037, CF-038
```

**Immediate unblocked tasks (can start today, no deps):**
- TASK-CF-002 (verify remote deployment)
- TASK-CF-003 (verify Higgsfield secrets)
- TASK-CF-004 (verify migration not applied)
- TASK-CF-007 (prompt sanitization)
- TASK-CF-008 (JWT validation)
- TASK-CF-027 (fix video img→video tag — 5 line change)
- TASK-CF-028 (CSS token rewrite)
