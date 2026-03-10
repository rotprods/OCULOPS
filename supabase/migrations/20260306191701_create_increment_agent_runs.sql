
CREATE OR REPLACE FUNCTION increment_agent_runs(agent_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE agent_registry
  SET total_runs = total_runs + 1,
      last_run_at = NOW()
  WHERE code_name = agent_code;
END;
$$;
;
