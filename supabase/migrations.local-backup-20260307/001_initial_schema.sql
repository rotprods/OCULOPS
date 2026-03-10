-- ═══════════════════════════════════════════════════
-- ANTIGRAVITY OS — Database Schema v1
-- Full-stack migration from localStorage → Supabase
-- ═══════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══ PROFILES ═══
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  agency_name TEXT DEFAULT 'Antigravity Agency',
  avatar_url TEXT,
  target_mrr INTEGER DEFAULT 20000,
  ultimate_target INTEGER DEFAULT 100000,
  budget NUMERIC(10,2) DEFAULT 3000,
  hours_per_day INTEGER DEFAULT 8,
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ CRM: COMPANIES ═══
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  size TEXT, -- '1-10', '10-50', '50-200', '200+'
  revenue_range TEXT,
  location TEXT,
  google_maps_id TEXT,
  meta_page_id TEXT,
  tiktok_id TEXT,
  tech_stack TEXT[],
  pain_points TEXT,
  notes TEXT,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'prospected', -- prospected, active, client, churned
  source TEXT, -- google_maps, meta, tiktok, manual, referral
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ CRM: CONTACTS ═══
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  role TEXT,
  is_decision_maker BOOLEAN DEFAULT false,
  buy_signal TEXT,
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  status TEXT DEFAULT 'raw', -- raw, qualified, contacted, responded, meeting, proposal, closed, lost
  source TEXT, -- linkedin, referral, web, event, cold_research, google_maps, meta, tiktok
  tags TEXT[],
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ CRM: DEALS ═══
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value NUMERIC(10,2) DEFAULT 0,
  monthly_value NUMERIC(10,2) DEFAULT 0, -- MRR contribution
  stage TEXT DEFAULT 'lead', -- lead, contacted, response, meeting, proposal, negotiation, closed_won, closed_lost, onboarding
  probability INTEGER DEFAULT 10,
  expected_close_date DATE,
  actual_close_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ CRM: ACTIVITIES ═══
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- call, email, meeting, note, task, whatsapp, manychat
  subject TEXT,
  description TEXT,
  outcome TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ PIPELINE ═══ (enhanced from current)
CREATE TABLE pipeline_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  exited_at TIMESTAMPTZ,
  notes TEXT
);

-- ═══ MARKET INTELLIGENCE: SIGNALS ═══
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT, -- macro, mercado, competencia, tecnología, social, economic
  indicator TEXT DEFAULT 'leading', -- leading, lagging
  impact INTEGER DEFAULT 50 CHECK (impact >= 0 AND impact <= 100),
  confidence INTEGER DEFAULT 70 CHECK (confidence >= 0 AND confidence <= 100),
  source TEXT,
  implication TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ DECISIONS ═══
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  context TEXT,
  options JSONB, -- [{option, pros, cons}]
  chosen TEXT,
  rationale TEXT,
  outcome TEXT,
  decision_date DATE DEFAULT CURRENT_DATE,
  review_date DATE,
  status TEXT DEFAULT 'active', -- active, reviewed, reversed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ EXPERIMENTS ═══
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hypothesis TEXT,
  kpi TEXT,
  kill_criteria TEXT,
  pivot_path TEXT,
  status TEXT DEFAULT 'active', -- active, concluded, killed, pivoted
  result TEXT,
  started_at DATE DEFAULT CURRENT_DATE,
  ended_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ OPPORTUNITIES ═══
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  if_condition TEXT,
  expect_result TEXT,
  risk_level INTEGER DEFAULT 50,
  time_horizon TEXT, -- short, medium, long
  status TEXT DEFAULT 'identified', -- identified, evaluating, pursuing, captured, missed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ KNOWLEDGE VAULT ═══
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'learning', -- learning, framework, sop, case_study, template
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ EXECUTION TASKS ═══
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day INTEGER,
  task TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, in-progress, done
  gate TEXT,
  priority INTEGER DEFAULT 5,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ NICHES ═══
CREATE TABLE niches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  impact INTEGER DEFAULT 50,
  velocity INTEGER DEFAULT 50,
  scalability INTEGER DEFAULT 50,
  confidence INTEGER DEFAULT 50,
  risk INTEGER DEFAULT 50,
  resource_cost INTEGER DEFAULT 50,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ BETS / PORTFOLIO ═══
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'core', -- core, explore, moonshot
  name TEXT NOT NULL,
  hypothesis TEXT,
  kpi TEXT,
  kill_criteria TEXT,
  pivot_path TEXT,
  status TEXT DEFAULT 'active',
  resources TEXT, -- percentage string
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ FINANCE ═══
CREATE TABLE finance_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- revenue, expense
  category TEXT,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence TEXT, -- monthly, quarterly, annual
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ ALERTS (WATCHTOWER) ═══
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- opportunity, risk, critical, info
  severity INTEGER DEFAULT 3 CHECK (severity >= 1 AND severity <= 5),
  title TEXT,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, acknowledged, resolved
  source TEXT, -- system, manual, api
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ MESSAGING: CHANNELS ═══
CREATE TABLE messaging_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- whatsapp, manychat, email, instagram_dm
  name TEXT NOT NULL,
  config JSONB, -- API keys, phone numbers, etc (encrypted)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ MESSAGING: CONVERSATIONS ═══
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES messaging_channels(id) ON DELETE SET NULL,
  external_id TEXT, -- ID from WhatsApp/ManyChat
  status TEXT DEFAULT 'open', -- open, pending, resolved, archived
  assigned_to TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ MESSAGING: MESSAGES ═══
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- inbound, outbound
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- text, image, video, document, template
  media_url TEXT,
  external_id TEXT,
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ LEAD DETECTION ═══
CREATE TABLE detected_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- google_maps, meta, tiktok
  external_id TEXT,
  business_name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  has_website BOOLEAN DEFAULT false,
  website_url TEXT,
  social_profiles JSONB, -- {instagram, tiktok, facebook}
  follower_count INTEGER,
  content_frequency TEXT, -- daily, weekly, monthly, rare
  engagement_rate NUMERIC(5,2),
  icp_match_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'detected', -- detected, qualified, contacted, converted, rejected
  contact_info JSONB,
  notes TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE detection_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL, -- google_maps, meta, tiktok
  criteria JSONB NOT NULL, -- {location, category, has_website: false, min_followers, etc.}
  is_active BOOLEAN DEFAULT true,
  schedule TEXT DEFAULT 'daily', -- hourly, daily, weekly
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ AUTOMATION ═══
CREATE TABLE automation_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- time, event, webhook, manual
  trigger_config JSONB,
  steps JSONB, -- Array of {type, config, next_step_id}
  is_active BOOLEAN DEFAULT false,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running', -- running, completed, failed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  log JSONB, -- Step-by-step execution log
  error TEXT
);

-- ═══ API CONNECTORS ═══
CREATE TABLE api_connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  auth_type TEXT DEFAULT 'api_key', -- api_key, oauth2, basic, bearer
  auth_config JSONB, -- Encrypted credentials
  endpoints JSONB, -- [{name, method, path, params}]
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ MARKETING: CAMPAIGNS ═══
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT, -- email, social, paid, content, outbound
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  budget NUMERIC(10,2),
  start_date DATE,
  end_date DATE,
  target_audience TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend NUMERIC(10,2) DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ RESOURCE ALLOCATION ═══
CREATE TABLE resource_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- outbound, delivery, content, systems, strategy, admin
  percentage INTEGER DEFAULT 0,
  week_start DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ HISTORY / SNAPSHOTS ═══
CREATE TABLE daily_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  mrr NUMERIC(10,2) DEFAULT 0,
  clients INTEGER DEFAULT 0,
  pipeline_total INTEGER DEFAULT 0,
  active_alerts INTEGER DEFAULT 0,
  task_completion_pct NUMERIC(5,2) DEFAULT 0,
  health_score INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INDEXES ═══
CREATE INDEX idx_contacts_user ON contacts(user_id);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_deals_user ON deals(user_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_signals_user ON signals(user_id);
CREATE INDEX idx_signals_category ON signals(category);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_detected_leads_user ON detected_leads(user_id);
CREATE INDEX idx_detected_leads_source ON detected_leads(source);
CREATE INDEX idx_detected_leads_status ON detected_leads(status);
CREATE INDEX idx_companies_user ON companies(user_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_finance_user ON finance_entries(user_id);
CREATE INDEX idx_alerts_user_status ON alerts(user_id, status);
CREATE INDEX idx_daily_snapshots_user_date ON daily_snapshots(user_id, snapshot_date);

-- ═══ ROW LEVEL SECURITY ═══
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies (owner-only access for personal app)
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "Users can manage own contacts" ON contacts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own companies" ON companies FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own deals" ON deals FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own activities" ON crm_activities FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own signals" ON signals FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own decisions" ON decisions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own experiments" ON experiments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own opportunities" ON opportunities FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own knowledge" ON knowledge_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own niches" ON niches FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own bets" ON bets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own finance" ON finance_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own alerts" ON alerts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own channels" ON messaging_channels FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own conversations" ON conversations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own detected_leads" ON detected_leads FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own detection_rules" ON detection_rules FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own workflows" ON automation_workflows FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own connectors" ON api_connectors FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own campaigns" ON campaigns FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own resources" ON resource_allocations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own pipeline" ON pipeline_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own snapshots" ON daily_snapshots FOR ALL USING (user_id = auth.uid());

-- Messages policy via conversation ownership
CREATE POLICY "Users can manage messages in own conversations" ON messages FOR ALL
  USING (conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()));

-- Automation runs via workflow ownership
CREATE POLICY "Users can manage runs of own workflows" ON automation_runs FOR ALL
  USING (workflow_id IN (SELECT id FROM automation_workflows WHERE user_id = auth.uid()));

-- Campaign metrics via campaign ownership
CREATE POLICY "Users can manage own campaign metrics" ON campaign_metrics FOR ALL
  USING (campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()));

-- ═══ UPDATED_AT TRIGGER ═══
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON knowledge_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON automation_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
