-- Phase 4: Security Hardening — Drop "anon dev" policies + fix search_path
DO $$
DECLARE
  _tbl text;
  _tables text[] := ARRAY[
    'alerts','api_connectors','automation_runs','automation_workflows',
    'bets','campaign_metrics','campaigns','companies','contacts',
    'conversations','crm_activities','daily_snapshots','deals',
    'decisions','detected_leads','detection_rules','experiments',
    'finance_entries','knowledge_entries','messages','messaging_channels',
    'niches','opportunities','pipeline_entries','profiles',
    'prospector_leads','prospector_scans','resource_allocations',
    'signals','tasks'
  ];
BEGIN
  FOREACH _tbl IN ARRAY _tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon read for dev" ON %I', _tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon write for dev" ON %I', _tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon update for dev" ON %I', _tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon delete for dev" ON %I', _tbl);
  END LOOP;
END;
$$;

-- Fix search_path on SECURITY DEFINER functions (prevents search_path hijacking)
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.seed_user_defaults() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
