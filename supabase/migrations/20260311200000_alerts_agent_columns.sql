-- Add missing columns to alerts table used by agent-brain-v2 skills
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS agent TEXT,
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trace_id UUID;
