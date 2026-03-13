-- ═══════════════════════════════════════════════════
-- OCULOPS — Evaluation Layer Baseline
-- Critics + score history for high-impact outputs
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.evaluation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  artifact_type text NOT NULL,
  artifact_id text,
  impact_level text NOT NULL CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score numeric NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  threshold numeric NOT NULL CHECK (threshold >= 0 AND threshold <= 100),
  decision text NOT NULL CHECK (decision IN ('pass', 'retry', 'reject', 'escalate')),
  retry_recommended boolean NOT NULL DEFAULT false,
  escalation_required boolean NOT NULL DEFAULT false,
  explanation text NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  evaluated_by text[] NOT NULL DEFAULT ARRAY['quality_critic', 'architecture_critic', 'risk_critic', 'cost_critic'],
  correlation_id uuid,
  pipeline_run_id uuid REFERENCES public.pipeline_runs(id) ON DELETE SET NULL,
  step_run_id uuid REFERENCES public.pipeline_step_runs(id) ON DELETE SET NULL,
  goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  goal_step_id uuid REFERENCES public.goal_steps(id) ON DELETE SET NULL,
  source_agent text,
  artifact_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_runs_org_id ON public.evaluation_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_correlation_id ON public.evaluation_runs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_decision ON public.evaluation_runs(decision);
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_artifact ON public.evaluation_runs(artifact_type, artifact_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_runs_created_at ON public.evaluation_runs(created_at DESC);

ALTER TABLE public.evaluation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select_evaluation_runs" ON public.evaluation_runs;
DROP POLICY IF EXISTS "org_insert_evaluation_runs" ON public.evaluation_runs;
DROP POLICY IF EXISTS "org_update_evaluation_runs" ON public.evaluation_runs;
DROP POLICY IF EXISTS "org_delete_evaluation_runs" ON public.evaluation_runs;
DROP POLICY IF EXISTS "anon_agent_evaluation_runs" ON public.evaluation_runs;

CREATE POLICY "org_select_evaluation_runs"
  ON public.evaluation_runs
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL);

CREATE POLICY "org_insert_evaluation_runs"
  ON public.evaluation_runs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL);

CREATE POLICY "org_update_evaluation_runs"
  ON public.evaluation_runs
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)
  WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL);

CREATE POLICY "org_delete_evaluation_runs"
  ON public.evaluation_runs
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL);

CREATE POLICY "anon_agent_evaluation_runs"
  ON public.evaluation_runs
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS auto_set_org_id ON public.evaluation_runs;
CREATE TRIGGER auto_set_org_id
  BEFORE INSERT ON public.evaluation_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_default_org_id();

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluation_runs;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
