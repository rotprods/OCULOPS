-- ═══════════════════════════════════════════════════
-- OCULOPS — Simulation Layer Baseline
-- Shadow / dry-run / replay execution traces + policy gate
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.simulation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('dry_run', 'shadow', 'replay')),
  target_type text NOT NULL,
  target_id text,
  workflow_id text,
  risk_class text NOT NULL CHECK (risk_class IN ('low', 'medium', 'high', 'critical')),
  target_environment text NOT NULL DEFAULT 'staging' CHECK (target_environment IN ('staging', 'production')),
  status text NOT NULL CHECK (status IN ('passed', 'failed')),
  simulation_required boolean NOT NULL DEFAULT false,
  policy_gate_passed boolean NOT NULL DEFAULT false,
  escalation_required boolean NOT NULL DEFAULT false,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 100),
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_action text NOT NULL DEFAULT 'proceed',
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id uuid,
  source_agent text,
  previous_simulation_id uuid REFERENCES public.simulation_runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_simulation_runs_org_id ON public.simulation_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_correlation_id ON public.simulation_runs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_target ON public.simulation_runs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_status ON public.simulation_runs(status);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_created_at ON public.simulation_runs(created_at DESC);

ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select_simulation_runs" ON public.simulation_runs;
DROP POLICY IF EXISTS "org_insert_simulation_runs" ON public.simulation_runs;
DROP POLICY IF EXISTS "org_update_simulation_runs" ON public.simulation_runs;
DROP POLICY IF EXISTS "org_delete_simulation_runs" ON public.simulation_runs;
DROP POLICY IF EXISTS "anon_agent_simulation_runs" ON public.simulation_runs;

CREATE POLICY "org_select_simulation_runs"
  ON public.simulation_runs
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL);

CREATE POLICY "org_insert_simulation_runs"
  ON public.simulation_runs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL);

CREATE POLICY "org_update_simulation_runs"
  ON public.simulation_runs
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)
  WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL);

CREATE POLICY "org_delete_simulation_runs"
  ON public.simulation_runs
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL);

CREATE POLICY "anon_agent_simulation_runs"
  ON public.simulation_runs
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS auto_set_org_id ON public.simulation_runs;
CREATE TRIGGER auto_set_org_id
  BEFORE INSERT ON public.simulation_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_default_org_id();

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.simulation_runs;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
