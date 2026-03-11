-- ═══════════════════════════════════════════════════════════════
-- OCULOPS — Creative Factory: Full Data Layer
-- Tablas: creative_briefs, creative_requests, creative_jobs,
--         creative_assets, asset_variants, engine_runs,
--         asset_performance, campaign_assets,
--         creative_feedback_signals
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. creative_briefs ──────────────────────────────────────────────────────
-- DB-backed brief templates (replaces hardcoded array in CreativeStudio.jsx)

CREATE TABLE IF NOT EXISTS public.creative_briefs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  format          text CHECK (format IN ('image','video','copy','carousel','reel','story','audio')),
  platform        text,
  tone            text,
  objective       text,
  prompt_template text,
  variables       jsonb DEFAULT '[]',
  example_output  text,
  tags            text[],
  is_active       boolean DEFAULT true,
  usage_count     int DEFAULT 0,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creative_briefs_org ON public.creative_briefs(org_id);
CREATE INDEX IF NOT EXISTS idx_creative_briefs_format_platform ON public.creative_briefs(format, platform);
CREATE INDEX IF NOT EXISTS idx_creative_briefs_active ON public.creative_briefs(is_active) WHERE is_active = true;

-- ─── 2. creative_requests ────────────────────────────────────────────────────
-- Entry point: who asked for what, from where. Created by UI or FORGE agent.

CREATE TABLE IF NOT EXISTS public.creative_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  brief_id       uuid REFERENCES public.creative_briefs(id) ON DELETE SET NULL,
  contact_id     uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id        uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  campaign_id    uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  requested_by   text DEFAULT 'user',
  title          text NOT NULL,
  description    text,
  format         text NOT NULL,
  platform       text NOT NULL,
  tone           text,
  objective      text,
  prompt         text NOT NULL,
  variables      jsonb DEFAULT '{}',
  reference_urls text[],
  dimensions     jsonb,
  duration_sec   int,
  status         text DEFAULT 'pending'
                 CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  priority       int DEFAULT 0,
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creative_requests_org ON public.creative_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_creative_requests_status ON public.creative_requests(status);
CREATE INDEX IF NOT EXISTS idx_creative_requests_campaign ON public.creative_requests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creative_requests_deal ON public.creative_requests(deal_id);
CREATE INDEX IF NOT EXISTS idx_creative_requests_created ON public.creative_requests(created_at DESC);

-- ─── 3. creative_jobs ────────────────────────────────────────────────────────
-- Async job tracking. One request → one or many jobs (variants).

CREATE TABLE IF NOT EXISTS public.creative_jobs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  request_id     uuid NOT NULL REFERENCES public.creative_requests(id) ON DELETE CASCADE,
  engine         text NOT NULL,
  engine_model   text,
  status         text DEFAULT 'queued'
                 CHECK (status IN ('queued','running','completed','failed','cancelled','timed_out')),
  attempt        int DEFAULT 1,
  max_attempts   int DEFAULT 3,
  input_payload  jsonb DEFAULT '{}',
  output_payload jsonb DEFAULT '{}',
  error_message  text,
  error_code     text,
  queued_at      timestamptz DEFAULT now(),
  started_at     timestamptz,
  completed_at   timestamptz,
  duration_ms    int,
  tokens_used    int DEFAULT 0,
  cost_usd       numeric(10,6) DEFAULT 0,
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creative_jobs_org ON public.creative_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_creative_jobs_request ON public.creative_jobs(request_id);
CREATE INDEX IF NOT EXISTS idx_creative_jobs_status ON public.creative_jobs(status);
CREATE INDEX IF NOT EXISTS idx_creative_jobs_engine ON public.creative_jobs(engine);
CREATE INDEX IF NOT EXISTS idx_creative_jobs_queued_at ON public.creative_jobs(queued_at DESC);

-- ─── 4. creative_assets ──────────────────────────────────────────────────────
-- Generated outputs. Each completed job produces one or more assets.

CREATE TABLE IF NOT EXISTS public.creative_assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id          uuid REFERENCES public.creative_jobs(id) ON DELETE SET NULL,
  request_id      uuid REFERENCES public.creative_requests(id) ON DELETE SET NULL,
  title           text,
  asset_type      text NOT NULL
                  CHECK (asset_type IN ('image','video','copy','audio','carousel','document')),
  format          text,
  platform        text,
  storage_path    text,
  public_url      text,
  thumbnail_url   text,
  external_url    text,
  file_size_bytes bigint,
  dimensions      jsonb,
  metadata        jsonb DEFAULT '{}',
  tags            text[],
  prompt_used     text,
  engine          text,
  status          text DEFAULT 'ready'
                  CHECK (status IN ('pending','ready','archived','deleted')),
  is_approved     boolean DEFAULT false,
  approved_by     text,
  approved_at     timestamptz,
  version         int DEFAULT 1,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creative_assets_org ON public.creative_assets(org_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_job ON public.creative_assets(job_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_request ON public.creative_assets(request_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_type_platform ON public.creative_assets(asset_type, platform);
CREATE INDEX IF NOT EXISTS idx_creative_assets_status ON public.creative_assets(status);
CREATE INDEX IF NOT EXISTS idx_creative_assets_tags ON public.creative_assets USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_creative_assets_created ON public.creative_assets(created_at DESC);

-- ─── 5. asset_variants ───────────────────────────────────────────────────────
-- Repurposed versions of an existing asset (resize, reformat, crop, copy variant).

CREATE TABLE IF NOT EXISTS public.asset_variants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_asset_id  uuid NOT NULL REFERENCES public.creative_assets(id) ON DELETE CASCADE,
  asset_id         uuid NOT NULL REFERENCES public.creative_assets(id) ON DELETE CASCADE,
  variant_type     text NOT NULL
                   CHECK (variant_type IN ('resize','reformat','crop','copy_variation','translation','thumbnail')),
  platform         text,
  dimensions       jsonb,
  notes            text,
  created_at       timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_asset_variants_parent ON public.asset_variants(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_variants_asset ON public.asset_variants(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_variants_org ON public.asset_variants(org_id);

-- ─── 6. engine_runs ──────────────────────────────────────────────────────────
-- Log of every API call to a creative engine. Cost tracking + debugging.

CREATE TABLE IF NOT EXISTS public.engine_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id         uuid NOT NULL REFERENCES public.creative_jobs(id) ON DELETE CASCADE,
  engine         text NOT NULL,
  model          text,
  endpoint       text,
  method         text DEFAULT 'POST',
  request_body   jsonb DEFAULT '{}',
  response_body  jsonb DEFAULT '{}',
  http_status    int,
  duration_ms    int,
  tokens_in      int DEFAULT 0,
  tokens_out     int DEFAULT 0,
  cost_usd       numeric(10,6) DEFAULT 0,
  error          text,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_engine_runs_job ON public.engine_runs(job_id);
CREATE INDEX IF NOT EXISTS idx_engine_runs_org ON public.engine_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_engine_runs_engine ON public.engine_runs(engine);
CREATE INDEX IF NOT EXISTS idx_engine_runs_created ON public.engine_runs(created_at DESC);

-- ─── 7. asset_performance ────────────────────────────────────────────────────
-- CTR, engagement, watch time per asset per platform per day.
-- Fed by n8n workflows or manual entry.

CREATE TABLE IF NOT EXISTS public.asset_performance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id         uuid NOT NULL REFERENCES public.creative_assets(id) ON DELETE CASCADE,
  campaign_id      uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  platform         text NOT NULL,
  date             date NOT NULL,
  impressions      bigint DEFAULT 0,
  clicks           bigint DEFAULT 0,
  conversions      int DEFAULT 0,
  ctr              numeric(8,4),
  engagement_rate  numeric(8,4),
  watch_time_sec   bigint DEFAULT 0,
  completion_rate  numeric(8,4),
  likes            int DEFAULT 0,
  comments         int DEFAULT 0,
  shares           int DEFAULT 0,
  saves            int DEFAULT 0,
  spend_usd        numeric(10,2) DEFAULT 0,
  revenue_usd      numeric(10,2) DEFAULT 0,
  roas             numeric(8,4),
  source           text DEFAULT 'manual'
                   CHECK (source IN ('manual','n8n_webhook','meta_api','tiktok_api','google_api','agent_poll')),
  raw_data         jsonb DEFAULT '{}',
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,
  UNIQUE (asset_id, platform, date)
);

CREATE INDEX IF NOT EXISTS idx_asset_perf_asset ON public.asset_performance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_perf_org_platform ON public.asset_performance(org_id, platform);
CREATE INDEX IF NOT EXISTS idx_asset_perf_campaign ON public.asset_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_asset_perf_date ON public.asset_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_asset_perf_ctr ON public.asset_performance(ctr DESC) WHERE ctr IS NOT NULL;

-- ─── 8. campaign_assets ──────────────────────────────────────────────────────
-- M2M link between campaigns and assets. Tracks publish state.

CREATE TABLE IF NOT EXISTS public.campaign_assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id  uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_id     uuid NOT NULL REFERENCES public.creative_assets(id) ON DELETE CASCADE,
  status       text DEFAULT 'planned'
               CHECK (status IN ('planned','scheduled','published','paused','rejected')),
  publish_at   timestamptz,
  published_at timestamptz,
  platform     text,
  placement    text,
  notes        text,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE (campaign_id, asset_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_campaign_assets_campaign ON public.campaign_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_asset ON public.campaign_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_status ON public.campaign_assets(status);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_org ON public.campaign_assets(org_id);

-- ─── 9. creative_feedback_signals ────────────────────────────────────────────
-- Structured learning data. FORGE reads this to improve future prompt templates.

CREATE TABLE IF NOT EXISTS public.creative_feedback_signals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id     uuid NOT NULL REFERENCES public.creative_assets(id) ON DELETE CASCADE,
  signal_type  text NOT NULL
               CHECK (signal_type IN (
                 'human_rating','ab_winner','performance_threshold',
                 'client_approval','agent_evaluation','platform_boost'
               )),
  score        numeric(4,2) CHECK (score BETWEEN 0 AND 10),
  sentiment    text CHECK (sentiment IN ('positive','neutral','negative')),
  feedback_text text,
  source       text,
  attributes   jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_signals_asset ON public.creative_feedback_signals(asset_id);
CREATE INDEX IF NOT EXISTS idx_feedback_signals_org ON public.creative_feedback_signals(org_id);
CREATE INDEX IF NOT EXISTS idx_feedback_signals_type ON public.creative_feedback_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_feedback_signals_score ON public.creative_feedback_signals(score DESC) WHERE score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_signals_created ON public.creative_feedback_signals(created_at DESC);

-- ─── updated_at triggers ─────────────────────────────────────────────────────
-- Reuses set_row_updated_at() from 20260315100000_phase1_foundation.sql

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'creative_briefs', 'creative_requests', 'creative_jobs', 'creative_assets',
    'asset_performance', 'campaign_assets'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ─── RLS + auto org_id triggers ──────────────────────────────────────────────
-- Pattern matches 20260310160000_multi_tenancy.sql and 20260318120000_goal_decomposition_engine.sql

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'creative_briefs', 'creative_requests', 'creative_jobs', 'creative_assets',
    'asset_variants', 'engine_runs', 'asset_performance', 'campaign_assets',
    'creative_feedback_signals'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "org_select_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "org_select_%s" ON public.%I FOR SELECT TO authenticated
       USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS "org_insert_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "org_insert_%s" ON public.%I FOR INSERT TO authenticated
       WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS "org_update_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "org_update_%s" ON public.%I FOR UPDATE TO authenticated
       USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)
       WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS "org_delete_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "org_delete_%s" ON public.%I FOR DELETE TO authenticated
       USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );

    -- anon policy for edge functions (FORGE, SENTINEL, n8n webhooks)
    EXECUTE format('DROP POLICY IF EXISTS "anon_agent_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "anon_agent_%s" ON public.%I FOR ALL TO anon
       USING (true) WITH CHECK (true)',
      tbl, tbl
    );

    -- auto org_id on INSERT (reuses set_default_org_id() from multi_tenancy migration)
    EXECUTE format('DROP TRIGGER IF EXISTS auto_set_org_id ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER auto_set_org_id BEFORE INSERT ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_default_org_id()',
      tbl
    );
  END LOOP;
END $$;

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable for tables the UI polls live.

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.creative_jobs;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.creative_assets;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.asset_performance;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_assets;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
