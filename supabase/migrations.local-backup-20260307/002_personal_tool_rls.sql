-- ═══════════════════════════════════════════════════
-- ANTIGRAVITY OS — Migration 002: Personal Tool RLS
-- This is a SINGLE-USER personal tool.
-- Replace per-user RLS policies with open access.
-- Apply in Supabase dashboard > SQL Editor.
-- ═══════════════════════════════════════════════════

-- Drop all auth.uid()-based policies
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can manage own companies" ON companies;
DROP POLICY IF EXISTS "Users can manage own deals" ON deals;
DROP POLICY IF EXISTS "Users can manage own activities" ON crm_activities;
DROP POLICY IF EXISTS "Users can manage own signals" ON signals;
DROP POLICY IF EXISTS "Users can manage own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can manage own experiments" ON experiments;
DROP POLICY IF EXISTS "Users can manage own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Users can manage own knowledge" ON knowledge_entries;
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own niches" ON niches;
DROP POLICY IF EXISTS "Users can manage own bets" ON bets;
DROP POLICY IF EXISTS "Users can manage own finance" ON finance_entries;
DROP POLICY IF EXISTS "Users can manage own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can manage own channels" ON messaging_channels;
DROP POLICY IF EXISTS "Users can manage own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can manage own detected_leads" ON detected_leads;
DROP POLICY IF EXISTS "Users can manage own detection_rules" ON detection_rules;
DROP POLICY IF EXISTS "Users can manage own workflows" ON automation_workflows;
DROP POLICY IF EXISTS "Users can manage own connectors" ON api_connectors;
DROP POLICY IF EXISTS "Users can manage own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can manage own resources" ON resource_allocations;
DROP POLICY IF EXISTS "Users can manage own pipeline" ON pipeline_entries;
DROP POLICY IF EXISTS "Users can manage own snapshots" ON daily_snapshots;
DROP POLICY IF EXISTS "Users can manage messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can manage runs of own workflows" ON automation_runs;
DROP POLICY IF EXISTS "Users can manage own campaign metrics" ON campaign_metrics;

-- Create open policies (single-user personal tool, anon key is private)
CREATE POLICY "personal_open" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON crm_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON signals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON experiments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON knowledge_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON niches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON bets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON finance_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON messaging_channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON detected_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON detection_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON automation_workflows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON automation_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON api_connectors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON campaign_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON resource_allocations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON pipeline_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_open" ON daily_snapshots FOR ALL USING (true) WITH CHECK (true);
