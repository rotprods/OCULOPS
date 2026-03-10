-- ═══════════════════════════════════════════════════
-- ANTIGRAVITY OS — Public API Catalog + Connector Activation
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_catalog_sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_repo TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'master',
  repo_pushed_at TIMESTAMPTZ,
  readme_sha TEXT,
  entry_count INTEGER DEFAULT 0,
  category_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_catalog_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  docs_url TEXT NOT NULL,
  description TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'unknown',
  https_only BOOLEAN DEFAULT true,
  cors_policy TEXT DEFAULT 'Unknown',
  module_targets TEXT[] DEFAULT ARRAY[]::TEXT[],
  business_fit_score INTEGER DEFAULT 0,
  activation_tier TEXT NOT NULL DEFAULT 'catalog_only',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  raw_source JSONB DEFAULT '{}'::JSONB,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_listed BOOLEAN DEFAULT true,
  sync_run_id UUID REFERENCES api_catalog_sync_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_catalog_entries_category ON api_catalog_entries(category);
CREATE INDEX IF NOT EXISTS idx_api_catalog_entries_activation_tier ON api_catalog_entries(activation_tier);
CREATE INDEX IF NOT EXISTS idx_api_catalog_entries_business_fit ON api_catalog_entries(business_fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_api_catalog_entries_module_targets ON api_catalog_entries USING GIN(module_targets);
CREATE INDEX IF NOT EXISTS idx_api_catalog_entries_tags ON api_catalog_entries USING GIN(tags);

ALTER TABLE api_connectors
  ADD COLUMN IF NOT EXISTS catalog_slug TEXT,
  ADD COLUMN IF NOT EXISTS template_key TEXT,
  ADD COLUMN IF NOT EXISTS normalizer_key TEXT,
  ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_healthcheck_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS healthcheck_endpoint JSONB,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'api_connectors'
      AND constraint_name = 'api_connectors_catalog_slug_fkey'
  ) THEN
    ALTER TABLE api_connectors
      ADD CONSTRAINT api_connectors_catalog_slug_fkey
      FOREIGN KEY (catalog_slug) REFERENCES api_catalog_entries(slug) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE api_catalog_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_catalog_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "personal_open" ON api_catalog_sync_runs;
DROP POLICY IF EXISTS "personal_open" ON api_catalog_entries;

CREATE POLICY "personal_open" ON api_catalog_sync_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON api_catalog_entries FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_api_catalog_entries_updated_at
  BEFORE UPDATE ON api_catalog_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE api_catalog_sync_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE api_catalog_entries;
