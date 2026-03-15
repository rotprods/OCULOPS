-- ═══════════════════════════════════════════════════
-- OCULOPS V2 — Variable-Orchestrated Control Plane
-- Deterministic variable snapshots, constraints, V2 plans + violations
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.control_plane_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  variable_key text NOT NULL,
  variable_family text NOT NULL DEFAULT 'runtime',
  value_type text NOT NULL DEFAULT 'json',
  scope text NOT NULL CHECK (scope IN ('global', 'org', 'agent', 'workflow', 'run_override')),
  owner_ref text NOT NULL DEFAULT 'control-plane',
  lifecycle_state text NOT NULL DEFAULT 'active'
    CHECK (lifecycle_state IN ('draft', 'active', 'deprecated', 'retired')),
  default_value jsonb,
  validation_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  sensitivity text NOT NULL DEFAULT 'internal'
    CHECK (sensitivity IN ('public', 'internal', 'confidential', 'restricted')),
  is_required boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cp_variables_org_variable_key
  ON public.control_plane_variables(org_id, variable_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cp_variables_org_key
  ON public.control_plane_variables(org_id, variable_key)
  WHERE org_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cp_variables_global_key
  ON public.control_plane_variables(variable_key)
  WHERE org_id IS NULL;

CREATE TABLE IF NOT EXISTS public.control_plane_variable_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  variable_key text NOT NULL,
  precedence_level text NOT NULL
    CHECK (precedence_level IN ('run_override', 'workflow', 'agent', 'org', 'global')),
  source_ref text NOT NULL DEFAULT '',
  value jsonb,
  effective_from timestamptz,
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cp_variable_bindings_org_variable_key
  ON public.control_plane_variable_bindings(org_id, variable_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cp_variable_bindings_org_scope
  ON public.control_plane_variable_bindings(org_id, variable_key, precedence_level, source_ref)
  WHERE org_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cp_variable_bindings_global_scope
  ON public.control_plane_variable_bindings(variable_key, precedence_level, source_ref)
  WHERE org_id IS NULL;

CREATE TABLE IF NOT EXISTS public.control_plane_variable_snapshots (
  snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id text,
  agent_id text,
  bindings jsonb NOT NULL DEFAULT '[]'::jsonb,
  checksum text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cp_variable_snapshots_snapshot_id
  ON public.control_plane_variable_snapshots(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_cp_variable_snapshots_workflow_created_at_desc
  ON public.control_plane_variable_snapshots(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cp_variable_snapshots_org_created_at_desc
  ON public.control_plane_variable_snapshots(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.control_plane_variable_constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  constraint_id text NOT NULL,
  expression jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  fail_mode text NOT NULL DEFAULT 'advisory'
    CHECK (fail_mode IN ('hard_block', 'soft_block', 'advisory')),
  is_active boolean NOT NULL DEFAULT true,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cp_variable_constraints_org_key
  ON public.control_plane_variable_constraints(org_id, constraint_id)
  WHERE org_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cp_variable_constraints_global_key
  ON public.control_plane_variable_constraints(constraint_id)
  WHERE org_id IS NULL;

CREATE TABLE IF NOT EXISTS public.control_plane_orchestration_plans_v2 (
  plan_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id text,
  agent_id text,
  snapshot_id uuid NOT NULL REFERENCES public.control_plane_variable_snapshots(snapshot_id) ON DELETE RESTRICT,
  correlation_id uuid,
  task_graph jsonb NOT NULL DEFAULT '{}'::jsonb,
  governance_decision jsonb NOT NULL DEFAULT '{}'::jsonb,
  simulation_required boolean NOT NULL DEFAULT false,
  simulation_mode text DEFAULT 'shadow'
    CHECK (simulation_mode IN ('dry_run', 'shadow', 'replay')),
  simulation_mandatory boolean NOT NULL DEFAULT false,
  simulation_status text DEFAULT 'pending'
    CHECK (simulation_status IN ('pending', 'passed', 'failed', 'advisory_failed', 'not_required')),
  preflight_simulation_id uuid REFERENCES public.simulation_runs(id) ON DELETE SET NULL,
  plan_status text NOT NULL DEFAULT 'planned'
    CHECK (plan_status IN ('planned', 'running', 'completed', 'failed', 'blocked', 'cancelled')),
  risk_class text DEFAULT 'medium'
    CHECK (risk_class IN ('low', 'medium', 'high', 'critical')),
  target_environment text DEFAULT 'staging'
    CHECK (target_environment IN ('staging', 'production', 'synthetic')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  execution_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  executed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cp_orchestration_plans_v2_org_status
  ON public.control_plane_orchestration_plans_v2(org_id, plan_status);
CREATE INDEX IF NOT EXISTS idx_cp_orchestration_plans_v2_snapshot
  ON public.control_plane_orchestration_plans_v2(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_cp_orchestration_plans_v2_workflow_created_desc
  ON public.control_plane_orchestration_plans_v2(workflow_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.control_plane_variable_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_id uuid NOT NULL REFERENCES public.control_plane_variable_snapshots(snapshot_id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.control_plane_orchestration_plans_v2(plan_id) ON DELETE CASCADE,
  constraint_id text NOT NULL,
  variable_keys text[] NOT NULL DEFAULT ARRAY[]::text[],
  severity text NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message text NOT NULL,
  blocking boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cp_variable_violations_snapshot_id
  ON public.control_plane_variable_violations(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_cp_variable_violations_org_created_at_desc
  ON public.control_plane_variable_violations(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cp_variable_violations_plan_id
  ON public.control_plane_variable_violations(plan_id);

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'control_plane_variables',
      'control_plane_variable_bindings',
      'control_plane_variable_snapshots',
      'control_plane_variable_constraints',
      'control_plane_orchestration_plans_v2',
      'control_plane_variable_violations'
    ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "org_select_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "org_insert_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "org_update_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "org_delete_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "anon_%s" ON public.%I', tbl, tbl);

    EXECUTE format(
      'CREATE POLICY "org_select_%s" ON public.%I FOR SELECT TO authenticated USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_update_%s" ON public.%I FOR UPDATE TO authenticated USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL) WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "org_delete_%s" ON public.%I FOR DELETE TO authenticated USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "anon_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'control_plane_variables',
      'control_plane_variable_bindings',
      'control_plane_variable_constraints',
      'control_plane_orchestration_plans_v2',
      'control_plane_variable_violations'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'control_plane_variables',
      'control_plane_variable_bindings',
      'control_plane_variable_snapshots',
      'control_plane_variable_constraints',
      'control_plane_orchestration_plans_v2',
      'control_plane_variable_violations'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS auto_set_org_id ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER auto_set_org_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_default_org_id()',
      tbl
    );
  END LOOP;
END $$;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.control_plane_variables; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.control_plane_variable_bindings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.control_plane_variable_snapshots; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.control_plane_variable_constraints; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.control_plane_orchestration_plans_v2; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.control_plane_variable_violations; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
