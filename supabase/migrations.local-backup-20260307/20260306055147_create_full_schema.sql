
-- ═══════════════════════════════════════════════════
-- ANTIGRAVITY OS — Full Database Schema
-- ═══════════════════════════════════════════════════

-- ── Profiles ──
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Contacts (CRM) ──
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  status TEXT DEFAULT 'raw',
  source TEXT,
  notes TEXT,
  score INT DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Companies ──
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  location TEXT,
  size TEXT,
  status TEXT DEFAULT 'prospect',
  revenue_estimate NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Deals (Pipeline) ──
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  value NUMERIC DEFAULT 0,
  stage TEXT DEFAULT 'lead',
  probability INT DEFAULT 10,
  expected_close_date DATE,
  notes TEXT,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tasks (Execution) ──
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  assignee TEXT,
  due_date DATE,
  category TEXT,
  tags TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Campaigns (GTM) ──
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT,
  status TEXT DEFAULT 'draft',
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  target_audience TEXT,
  goals JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Campaign Metrics ──
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Signals (Intelligence) ──
CREATE TABLE IF NOT EXISTS signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'macro',
  indicator TEXT DEFAULT 'leading',
  impact INT DEFAULT 50,
  confidence INT DEFAULT 70,
  source TEXT,
  implication TEXT,
  status TEXT DEFAULT 'active',
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Experiments (Lab) ──
CREATE TABLE IF NOT EXISTS experiments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  hypothesis TEXT,
  status TEXT DEFAULT 'planned',
  category TEXT,
  metrics JSONB,
  results TEXT,
  start_date DATE,
  end_date DATE,
  confidence INT DEFAULT 50,
  impact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Decisions ──
CREATE TABLE IF NOT EXISTS decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  category TEXT,
  impact TEXT DEFAULT 'medium',
  urgency TEXT DEFAULT 'medium',
  options JSONB,
  decision TEXT,
  rationale TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Alerts (Watchtower) ──
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'warning',
  category TEXT,
  status TEXT DEFAULT 'active',
  source TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Finance Entries ──
CREATE TABLE IF NOT EXISTS finance_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT,
  description TEXT,
  amount NUMERIC NOT NULL,
  date DATE,
  recurrence TEXT DEFAULT 'one-time',
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Knowledge Entries ──
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT[],
  source TEXT,
  type TEXT DEFAULT 'note',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Niches ──
CREATE TABLE IF NOT EXISTS niches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  market_size NUMERIC,
  competition_level TEXT DEFAULT 'medium',
  opportunity_score INT DEFAULT 50,
  status TEXT DEFAULT 'researching',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Bets (Portfolio) ──
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  confidence INT DEFAULT 50,
  potential_value NUMERIC,
  status TEXT DEFAULT 'active',
  deadline DATE,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Opportunities (Scanner) ──
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  category TEXT,
  score INT DEFAULT 50,
  status TEXT DEFAULT 'detected',
  potential_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Automation Workflows ──
CREATE TABLE IF NOT EXISTS automation_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT,
  trigger_config JSONB,
  actions JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  run_count INT DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Automation Runs ──
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Conversations (Messaging) ──
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'email',
  subject TEXT,
  status TEXT DEFAULT 'active',
  unread_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Messages ──
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT DEFAULT 'agent',
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Detected Leads ──
CREATE TABLE IF NOT EXISTS detected_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  company TEXT,
  source TEXT,
  signal TEXT,
  score INT DEFAULT 0,
  status TEXT DEFAULT 'new',
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Detection Rules ──
CREATE TABLE IF NOT EXISTS detection_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT,
  criteria JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Daily Snapshots ──
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  mrr NUMERIC DEFAULT 0,
  clients INT DEFAULT 0,
  pipeline_value NUMERIC DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  leads_generated INT DEFAULT 0,
  alerts_active INT DEFAULT 0,
  health_score INT DEFAULT 0,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Prospector Leads ──
CREATE TABLE IF NOT EXISTS prospector_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating NUMERIC,
  reviews_count INT,
  category TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT DEFAULT 'raw',
  score INT DEFAULT 0,
  scan_id UUID,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Prospector Scans ──
CREATE TABLE IF NOT EXISTS prospector_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT,
  location TEXT,
  radius INT,
  results_count INT DEFAULT 0,
  status TEXT DEFAULT 'completed',
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ Enable RLS on all tables ═══
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospector_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospector_scans ENABLE ROW LEVEL SECURITY;

-- ═══ RLS Policies — Allow authenticated users full access ═══
-- (For MVP: all authenticated users can CRUD all rows)

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'contacts','companies','deals','tasks','campaigns','campaign_metrics',
    'signals','experiments','decisions','alerts','finance_entries',
    'knowledge_entries','niches','bets','opportunities',
    'automation_workflows','automation_runs','conversations','messages',
    'detected_leads','detection_rules','daily_snapshots',
    'prospector_leads','prospector_scans'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "authenticated_select_%s" ON %I FOR SELECT TO authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY "authenticated_insert_%s" ON %I FOR INSERT TO authenticated WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "authenticated_update_%s" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "authenticated_delete_%s" ON %I FOR DELETE TO authenticated USING (true)', t, t);
  END LOOP;
END
$$;

-- Profiles: users can only manage their own profile
CREATE POLICY "users_own_profile_select" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_own_profile_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_own_profile_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ═══ Trigger for auto-creating profile on signup ═══
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══ Enable Realtime for key tables ═══
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE deals;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_snapshots;
;
