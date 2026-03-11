-- ═══════════════════════════════════════════════════
-- OCULOPS — Milestone 2: Goal Decomposition Engine
-- Copilot strategic planning layer
-- ═══════════════════════════════════════════════════

-- ─── Goals — top-level user objectives ────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','planning','executing','completed','failed','paused','cancelled')),
  priority integer DEFAULT 0,
  source text DEFAULT 'copilot', -- 'copilot', 'user', 'agent', 'system'
  context jsonb DEFAULT '{}',
  result jsonb DEFAULT '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_org ON public.goals(org_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);

-- ─── Goal Steps — decomposed sub-tasks linked to agents/pipelines ──
CREATE TABLE IF NOT EXISTS public.goal_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  title text NOT NULL,
  description text,
  step_type text NOT NULL DEFAULT 'agent'
    CHECK (step_type IN ('agent','pipeline','manual','decision')),
  agent_code_name text,
  pipeline_template text,
  action text,
  input jsonb DEFAULT '{}',
  output jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed','skipped','waiting_approval')),
  error text,
  pipeline_run_id uuid,
  depends_on uuid[], -- IDs of steps that must complete first
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(goal_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_goal_steps_goal ON public.goal_steps(goal_id, step_number);
CREATE INDEX IF NOT EXISTS idx_goal_steps_status ON public.goal_steps(status);

-- ─── Copilot Context — persistent session state ──────
CREATE TABLE IF NOT EXISTS public.copilot_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  active_goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  intent text,
  state jsonb DEFAULT '{}',
  history jsonb DEFAULT '[]', -- last N key interactions
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(org_id, user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_copilot_ctx_org ON public.copilot_context(org_id);
CREATE INDEX IF NOT EXISTS idx_copilot_ctx_user ON public.copilot_context(user_id);

-- ─── Supervision Log — records Copilot decisions ─────
CREATE TABLE IF NOT EXISTS public.supervision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
  step_id uuid REFERENCES public.goal_steps(id) ON DELETE SET NULL,
  decision_type text NOT NULL
    CHECK (decision_type IN ('decompose','dispatch','evaluate','replan','escalate','complete','abort')),
  rationale text,
  input_context jsonb DEFAULT '{}',
  output_action jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_supervision_goal ON public.supervision_log(goal_id);

-- ─── RLS ─────────────────────────────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'goals', 'goal_steps', 'copilot_context', 'supervision_log'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "org_rw_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "org_rw_%s" ON public.%I FOR ALL TO authenticated USING (org_id IN (SELECT user_org_ids()) OR org_id IS NULL) WITH CHECK (org_id IN (SELECT user_org_ids()) OR org_id IS NULL)',
      tbl, tbl
    );
    EXECUTE format('DROP POLICY IF EXISTS "anon_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "anon_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
      tbl, tbl
    );
    -- updated_at trigger
    EXECUTE format('DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at()',
      tbl, tbl
    );
    -- auto org_id trigger
    EXECUTE format('DROP TRIGGER IF EXISTS auto_set_org_id ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER auto_set_org_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_default_org_id()',
      tbl
    );
  END LOOP;
END $$;

-- ─── Realtime ────────────────────────────────────────
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.goals; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_steps; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.copilot_context; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
