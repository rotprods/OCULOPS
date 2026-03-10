-- ═══════════════════════════════════════════════════
-- Migration 002: Add user_id to conversations table
-- Required for RLS to filter conversations per user
-- ═══════════════════════════════════════════════════

-- 1. Add column (nullable first to allow backfill)
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- 2. Backfill from messaging_channels (conversations belong to the channel owner)
UPDATE conversations c
SET user_id = mc.user_id
FROM messaging_channels mc
WHERE c.channel_id = mc.id
  AND c.user_id IS NULL;

-- 3. Add RLS policy
DROP POLICY IF EXISTS "own_conversations" ON conversations;

CREATE POLICY "own_conversations" ON conversations
    FOR ALL USING (user_id = auth.uid());

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- NOTE: After verifying backfill is complete and no nulls remain, run:
-- ALTER TABLE conversations ALTER COLUMN user_id SET NOT NULL;
