-- ═══════════════════════════════════════════════════
-- ANTIGRAVITY OS — Market Snapshots
-- Financial markets feed for leadership context
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS market_snapshots (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER PUBLICATION supabase_realtime ADD TABLE market_snapshots;
