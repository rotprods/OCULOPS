-- ═══════════════════════════════════════════════════
-- OCULOPS — Public API Ecosystem Architecture Layer
-- Adds integration map + registration backlog tables for full catalog orchestration.
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS api_catalog_integration_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_slug TEXT NOT NULL UNIQUE REFERENCES api_catalog_entries(slug) ON DELETE CASCADE,
  docs_url TEXT,
  registration_url TEXT,
  auth_type TEXT DEFAULT 'unknown',
  access_class TEXT NOT NULL DEFAULT 'unknown_access',
  requires_registration BOOLEAN DEFAULT FALSE,
  monetization_risk TEXT DEFAULT 'unknown',
  free_tier_confidence TEXT DEFAULT 'unknown',
  payment_status TEXT DEFAULT 'unknown',
  is_free_public_candidate BOOLEAN DEFAULT FALSE,
  is_interesting BOOLEAN DEFAULT FALSE,
  integration_priority INTEGER DEFAULT 0,
  data_formats TEXT[] DEFAULT ARRAY[]::TEXT[],
  extraction_modes TEXT[] DEFAULT ARRAY[]::TEXT[],
  module_targets TEXT[] DEFAULT ARRAY[]::TEXT[],
  agent_targets TEXT[] DEFAULT ARRAY[]::TEXT[],
  automation_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  command_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  n8n_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommended_connector_mode TEXT DEFAULT 'docs_only',
  recommended_auth_mode TEXT DEFAULT 'unknown',
  profile JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_catalog_registration_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_slug TEXT NOT NULL UNIQUE REFERENCES api_catalog_entries(slug) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  docs_url TEXT NOT NULL,
  registration_url TEXT,
  auth_type TEXT NOT NULL DEFAULT 'unknown',
  business_fit_score INTEGER DEFAULT 0,
  integration_priority INTEGER DEFAULT 0,
  module_targets TEXT[] DEFAULT ARRAY[]::TEXT[],
  agent_targets TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending_credentials',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_catalog_integration_access_class ON api_catalog_integration_map(access_class);
CREATE INDEX IF NOT EXISTS idx_api_catalog_integration_priority ON api_catalog_integration_map(integration_priority DESC);
CREATE INDEX IF NOT EXISTS idx_api_catalog_integration_free_candidate ON api_catalog_integration_map(is_free_public_candidate);
CREATE INDEX IF NOT EXISTS idx_api_catalog_integration_interesting ON api_catalog_integration_map(is_interesting);
CREATE INDEX IF NOT EXISTS idx_api_catalog_integration_module_targets ON api_catalog_integration_map USING GIN(module_targets);
CREATE INDEX IF NOT EXISTS idx_api_catalog_integration_agent_targets ON api_catalog_integration_map USING GIN(agent_targets);
CREATE INDEX IF NOT EXISTS idx_api_catalog_integration_command_actions ON api_catalog_integration_map USING GIN(command_actions);
CREATE INDEX IF NOT EXISTS idx_api_catalog_integration_automation_actions ON api_catalog_integration_map USING GIN(automation_actions);
CREATE INDEX IF NOT EXISTS idx_api_catalog_registration_backlog_priority ON api_catalog_registration_backlog(integration_priority DESC);
CREATE INDEX IF NOT EXISTS idx_api_catalog_registration_backlog_status ON api_catalog_registration_backlog(status);

ALTER TABLE api_catalog_integration_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_catalog_registration_backlog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "personal_open" ON api_catalog_integration_map;
DROP POLICY IF EXISTS "personal_open" ON api_catalog_registration_backlog;

CREATE POLICY "personal_open" ON api_catalog_integration_map FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON api_catalog_registration_backlog FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_api_catalog_integration_map_updated_at'
  ) THEN
    CREATE TRIGGER update_api_catalog_integration_map_updated_at
      BEFORE UPDATE ON api_catalog_integration_map
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_api_catalog_registration_backlog_updated_at'
  ) THEN
    CREATE TRIGGER update_api_catalog_registration_backlog_updated_at
      BEFORE UPDATE ON api_catalog_registration_backlog
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'api_catalog_integration_map'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE api_catalog_integration_map;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'api_catalog_registration_backlog'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE api_catalog_registration_backlog;
  END IF;
END $$;
