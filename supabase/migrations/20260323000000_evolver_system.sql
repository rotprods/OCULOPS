-- ═══════════════════════════════════════════════════════════════════════════
-- OCULOPS — EVOLVER System
--
-- Autonomous self-improvement loop inspired by karpathy/autoresearch.
-- Agents mutate their own system_prompts overnight, measure quality,
-- keep improvements and discard regressions — without human intervention.
--
-- Tables:
--   agent_experiments  — tracks each mutation trial (like results.tsv)
--   prompt_history     — version column added to agent_definitions
--
-- Functions:
--   rollback_agent_prompt()  — restore previous system_prompt version
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Add versioning to agent_definitions ────────────────────────────────
ALTER TABLE public.agent_definitions
  ADD COLUMN IF NOT EXISTS prompt_history      jsonb[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_evaluated_at   timestamptz,
  ADD COLUMN IF NOT EXISTS baseline_score      numeric(5,4),
  ADD COLUMN IF NOT EXISTS total_experiments   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_improvements integer DEFAULT 0;

-- ── 2. agent_experiments table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_experiments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id              text NOT NULL,           -- agent code_name
  parent_experiment_id  uuid,                    -- lineage: previous best
  mutation_description  text,                    -- what changed + why
  system_prompt_before  text NOT NULL,
  system_prompt_after   text NOT NULL,
  score_before          numeric(5,4),            -- baseline (0–1)
  score_after           numeric(5,4),            -- mutated score (0–1)
  delta                 numeric(6,4)             -- score_after - score_before
    GENERATED ALWAYS AS (score_after - score_before) STORED,
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'kept', 'discarded', 'crashed', 'shadow')),
  judge_reasoning       text,                    -- Claude's keep/discard rationale
  metrics_snapshot      jsonb,                   -- completion_rate, avg_rounds, blocked_rate
  org_id                uuid,
  created_at            timestamptz DEFAULT now()
);

-- ── 3. Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS agent_experiments_agent_id_idx
  ON public.agent_experiments (agent_id);

CREATE INDEX IF NOT EXISTS agent_experiments_status_idx
  ON public.agent_experiments (status);

CREATE INDEX IF NOT EXISTS agent_experiments_created_at_idx
  ON public.agent_experiments (created_at DESC);

-- ── 4. RLS ────────────────────────────────────────────────────────────────
ALTER TABLE public.agent_experiments ENABLE ROW LEVEL SECURITY;

-- service_role (edge functions) can write
CREATE POLICY "service_role_all_experiments"
  ON public.agent_experiments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- authenticated users can read their org's experiments
CREATE POLICY "org_read_experiments"
  ON public.agent_experiments
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ── 5. Rollback function ──────────────────────────────────────────────────
-- Restores an agent's system_prompt to a previous version from history.
-- Usage: SELECT rollback_agent_prompt('hunter', 1);  -- 1 = steps back
CREATE OR REPLACE FUNCTION public.rollback_agent_prompt(
  p_agent_id  text,
  p_steps     integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_history jsonb[];
  v_target  jsonb;
  v_prompt  text;
BEGIN
  SELECT prompt_history INTO v_history
    FROM public.agent_definitions
   WHERE agent_id = p_agent_id;

  IF v_history IS NULL OR array_length(v_history, 1) < p_steps THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not enough history');
  END IF;

  -- History is newest-first (prepended on each update)
  v_target := v_history[p_steps];
  v_prompt := v_target->>'system_prompt';

  UPDATE public.agent_definitions
     SET system_prompt = v_prompt,
         updated_at    = now()
   WHERE agent_id = p_agent_id;

  RETURN jsonb_build_object(
    'ok',         true,
    'agent_id',   p_agent_id,
    'restored_at', v_target->>'saved_at',
    'steps_back', p_steps
  );
END;
$$;

-- ── 6. Auto-save prompt history on update ─────────────────────────────────
-- Trigger: whenever system_prompt changes on agent_definitions, prepend
-- the old value to prompt_history (capped at 20 versions).
CREATE OR REPLACE FUNCTION public.save_prompt_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.system_prompt IS DISTINCT FROM NEW.system_prompt THEN
    NEW.prompt_history := array_prepend(
      jsonb_build_object(
        'system_prompt', OLD.system_prompt,
        'saved_at',      now()::text,
        'replaced_by',   'evolver'
      ),
      COALESCE(OLD.prompt_history, '{}')
    );
    -- Cap at 20 versions
    IF array_length(NEW.prompt_history, 1) > 20 THEN
      NEW.prompt_history := NEW.prompt_history[1:20];
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_def_prompt_history ON public.agent_definitions;
CREATE TRIGGER agent_def_prompt_history
  BEFORE UPDATE ON public.agent_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.save_prompt_history();

-- ── 7. Realtime for UI (Experiments.jsx live feed) ────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_experiments;
