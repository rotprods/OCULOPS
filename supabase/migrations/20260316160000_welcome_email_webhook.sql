-- ═══════════════════════════════════════════════════
-- OCULOPS — Auto Welcome Email on Signup
-- Database webhook trigger: calls welcome-email edge function
-- ═══════════════════════════════════════════════════

-- ── 1. HTTP extension (needed for pg_net) ──
-- CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ── 2. Trigger function: fires welcome-email edge function on new user ──
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  edge_url TEXT;
  service_key TEXT;
BEGIN
  -- Build the edge function URL from Supabase project config
  edge_url := 'https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/welcome-email';
  service_key := current_setting('app.settings.service_role_key', true);

  -- Fire-and-forget HTTP POST via pg_net
  PERFORM net.http_post(
    url := edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_key, '')
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'raw_user_meta_data', NEW.raw_user_meta_data
      )
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block user creation if email fails
    RAISE WARNING 'welcome_email trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Attach trigger to auth.users INSERT ──
DROP TRIGGER IF EXISTS on_user_created_send_welcome ON auth.users;
CREATE TRIGGER on_user_created_send_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();

-- ── 4. Helper function to mark onboarding complete ──
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_phone TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_role_title TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET
    phone = COALESCE(p_phone, phone),
    company = COALESCE(p_company, company),
    role_title = COALESCE(p_role_title, role_title),
    onboarding_completed = true,
    updated_at = now()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
