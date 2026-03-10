-- ═══════════════════════════════════════════════════
-- OCULOPS OS — Social Signals
-- Social chatter feed for demand, urgency, and buyer pain detection
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS social_signals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
