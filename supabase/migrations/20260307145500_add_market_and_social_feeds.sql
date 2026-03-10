-- ═══════════════════════════════════════════════════
-- ANTIGRAVITY OS — Market + Social Feeds
-- Leadership context feeds for markets and social demand radar
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS market_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol         TEXT NOT NULL,
  display_name   TEXT NOT NULL,
  asset_type     TEXT NOT NULL CHECK (asset_type IN ('stock', 'forex', 'crypto')),
  source         TEXT NOT NULL,
  base_currency  TEXT DEFAULT 'USD',
  quote_currency TEXT DEFAULT 'USD',
  price          NUMERIC(18, 8) NOT NULL,
  change_24h     NUMERIC(10, 4),
  volume         NUMERIC(20, 2),
  market_cap     NUMERIC(20, 2),
  metadata       JSONB DEFAULT '{}'::jsonb,
  snapshot_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol_time
  ON market_snapshots(symbol, snapshot_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_snapshots_asset_type_time
  ON market_snapshots(asset_type, snapshot_at DESC);

ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Market snapshots are readable" ON market_snapshots;
CREATE POLICY "Market snapshots are readable" ON market_snapshots
  FOR SELECT USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE market_snapshots;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS social_signals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform          TEXT NOT NULL CHECK (platform IN ('reddit', 'hackernews', 'demo')),
  external_id       TEXT NOT NULL,
  topic             TEXT NOT NULL,
  title             TEXT NOT NULL,
  body_excerpt      TEXT,
  author            TEXT,
  permalink         TEXT,
  published_at      TIMESTAMPTZ NOT NULL,
  engagement        INTEGER DEFAULT 0 CHECK (engagement >= 0),
  comment_count     INTEGER DEFAULT 0 CHECK (comment_count >= 0),
  sentiment_score   INTEGER DEFAULT 0 CHECK (sentiment_score >= -100 AND sentiment_score <= 100),
  velocity_score    INTEGER DEFAULT 0 CHECK (velocity_score >= 0 AND velocity_score <= 100),
  opportunity_score INTEGER DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_social_signals_published_at
  ON social_signals(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_signals_topic
  ON social_signals(topic);

CREATE INDEX IF NOT EXISTS idx_social_signals_platform
  ON social_signals(platform);

ALTER TABLE social_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Social signals are readable" ON social_signals;
CREATE POLICY "Social signals are readable" ON social_signals
  FOR SELECT USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE social_signals;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
