-- Fix rollback_agent_prompt: use code_name (correct column) not agent_id
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
   WHERE code_name = p_agent_id;

  IF v_history IS NULL OR array_length(v_history, 1) < p_steps THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not enough history');
  END IF;

  v_target := v_history[p_steps];
  v_prompt := v_target->>'system_prompt';

  UPDATE public.agent_definitions
     SET system_prompt = v_prompt,
         updated_at    = now()
   WHERE code_name = p_agent_id;

  RETURN jsonb_build_object(
    'ok', true, 'agent_id', p_agent_id,
    'restored_at', v_target->>'saved_at', 'steps_back', p_steps
  );
END;
$$;
