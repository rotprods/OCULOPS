-- ═══════════════════════════════════════════════════════════════
-- OCULOPS — Fix: crm_activities RLS policies + credit_balances seed
-- ═══════════════════════════════════════════════════════════════

-- ── 1. RLS policies for crm_activities ──────────────────────────
-- Table already has RLS ENABLED (20260316100000). Add missing policies.

DROP POLICY IF EXISTS "crm_activities_select" ON crm_activities;
DROP POLICY IF EXISTS "crm_activities_insert" ON crm_activities;
DROP POLICY IF EXISTS "crm_activities_update" ON crm_activities;
DROP POLICY IF EXISTS "crm_activities_delete" ON crm_activities;
DROP POLICY IF EXISTS "crm_activities_service_role" ON crm_activities;

-- Users can read their own activities OR global (user_id IS NULL)
CREATE POLICY "crm_activities_select"
  ON crm_activities FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- Users can insert their own activities
CREATE POLICY "crm_activities_insert"
  ON crm_activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- Users can update their own activities
CREATE POLICY "crm_activities_update"
  ON crm_activities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "crm_activities_delete"
  ON crm_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass (for agent edge functions writing activities)
CREATE POLICY "crm_activities_service_role"
  ON crm_activities FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- ── 2. Auto-seed credit_balances when missing ────────────────────
-- RPC callable from frontend: upserts default row and returns it
-- Avoids 404 from .single() when no credits row exists for org yet.

CREATE OR REPLACE FUNCTION get_or_create_credit_balance(p_org_id UUID)
RETURNS TABLE(
  org_id UUID,
  available_credits NUMERIC,
  billing_mode TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO credit_balances (org_id, available_credits, billing_mode)
  VALUES (p_org_id, 0, 'prepaid')
  ON CONFLICT (org_id) DO NOTHING;

  RETURN QUERY
  SELECT cb.org_id, cb.available_credits, cb.billing_mode
  FROM credit_balances cb
  WHERE cb.org_id = p_org_id;
END;
$$;
