-- ═══════════════════════════════════════════════════
-- OCULOPS — Fix Signup Profiles + Onboarding Completion
-- Restores profile creation on signup and makes onboarding idempotent
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  INSERT INTO public.leads (user_id, email, full_name, source)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'signup'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_role_title TEXT DEFAULT NULL,
  p_default_org_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    company,
    role_title,
    default_org_id,
    onboarding_completed,
    updated_at
  )
  SELECT
    u.id,
    COALESCE(NULLIF(p_full_name, ''), COALESCE(u.raw_user_meta_data->>'full_name', '')),
    u.email,
    NULLIF(p_phone, ''),
    NULLIF(p_company, ''),
    NULLIF(p_role_title, ''),
    p_default_org_id,
    TRUE,
    NOW()
  FROM auth.users u
  WHERE u.id = auth.uid()
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    company = COALESCE(EXCLUDED.company, public.profiles.company),
    role_title = COALESCE(EXCLUDED.role_title, public.profiles.role_title),
    default_org_id = COALESCE(EXCLUDED.default_org_id, public.profiles.default_org_id),
    onboarding_completed = TRUE,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
