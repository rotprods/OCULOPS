-- ═══════════════════════════════════════════════════
-- ANTIGRAVITY OS — Database Schema v3
-- SaaS Layer: Multi-tenancy, AI Agents, Assets, Audit
-- Prerequisite: 001_initial_schema.sql
-- ═══════════════════════════════════════════════════

-- ═══ 1. ORGANIZATIONS ═══

CREATE TABLE IF NOT EXISTS organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  plan        text DEFAULT 'starter', -- starter | pro | agency
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text DEFAULT 'member', -- owner | admin | member
  created_at  timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ═══ 2. AI AGENTS ═══

CREATE TABLE IF NOT EXISTS ai_agents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name             text NOT NULL, -- ATLAS | HUNTER | ORACLE | FORGE | SENTINEL | SCRIBE | CORTEX
  type             text NOT NULL,
  config           jsonb DEFAULT '{}',
  status           text DEFAULT 'idle', -- idle | running | error | disabled
  last_run         timestamptz,
  next_run         timestamptz,
  n8n_webhook_url  text,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  started_at   timestamptz DEFAULT now(),
  finished_at  timestamptz,
  status       text DEFAULT 'running', -- running | success | error
  output       jsonb DEFAULT '{}',
  error        text,
  duration_ms  integer
);

-- ═══ 3. CREATIVE ASSETS ═══

CREATE TABLE IF NOT EXISTS creative_assets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES organizations(id) ON DELETE CASCADE,
  type         text NOT NULL, -- image | video | copy | carousel
  url          text,
  prompt       text,
  campaign_id  uuid, -- soft ref — campaigns table exists in 001
  platform     text, -- meta | tiktok | instagram | linkedin
  status       text DEFAULT 'draft', -- draft | approved | published
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);

-- ═══ 4. NOTIFICATIONS ═══

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL, -- info | success | warning | error | agent
  title       text NOT NULL,
  body        text,
  read        boolean DEFAULT false,
  action_url  text,
  created_at  timestamptz DEFAULT now()
);

-- ═══ 5. ERROR LOGS ═══

CREATE TABLE IF NOT EXISTS error_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),
  module      text,
  error_type  text,
  message     text NOT NULL,
  stack       text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- ═══ 6. AUDIT LOG ═══

CREATE TABLE IF NOT EXISTS audit_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id),
  org_id         uuid REFERENCES organizations(id),
  action         text NOT NULL,
  resource_type  text,
  resource_id    uuid,
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now()
);

-- ═══ 7. SIGNALS — EXTEND EXISTING TABLE ═══
-- NOTE: 001_initial_schema.sql already defines 'confidence' on signals.
-- Only adding the new columns not present in the base schema.

ALTER TABLE signals ADD COLUMN IF NOT EXISTS source     text DEFAULT 'manual';
ALTER TABLE signals ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- ═══ 8. INDEXES ═══

CREATE INDEX IF NOT EXISTS idx_org_members_org      ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user     ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_org        ON ai_agents(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status     ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent     ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status    ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_creative_assets_org  ON creative_assets(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_audit_log_org        ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user       ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_module    ON error_logs(module);

-- ═══ 9. ROW LEVEL SECURITY ═══

ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log             ENABLE ROW LEVEL SECURITY;

-- Organizations: visible to members only
CREATE POLICY "Org members see their org" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Org members table: users see rows for orgs they belong to
CREATE POLICY "Users see own memberships" ON organization_members
  FOR ALL USING (user_id = auth.uid());

-- AI Agents: org members can read agents
CREATE POLICY "Org members see agents" ON ai_agents
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Agent runs: visible via agent org membership
CREATE POLICY "Org members see agent runs" ON agent_runs
  FOR SELECT USING (
    agent_id IN (
      SELECT a.id FROM ai_agents a
      JOIN organization_members m ON m.org_id = a.org_id
      WHERE m.user_id = auth.uid()
    )
  );

-- Creative assets: org-scoped
CREATE POLICY "Org members see creative assets" ON creative_assets
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Notifications: personal
CREATE POLICY "Users see own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Error logs: personal
CREATE POLICY "Users see own error logs" ON error_logs
  FOR ALL USING (auth.uid() = user_id);

-- Audit log: users see their own actions + org-level actions for their orgs
CREATE POLICY "Users see own audit entries" ON audit_log
  FOR SELECT USING (
    auth.uid() = user_id
    OR org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- ═══ updated_at trigger for organizations ═══
-- update_updated_at() function already defined in 001_initial_schema.sql

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
