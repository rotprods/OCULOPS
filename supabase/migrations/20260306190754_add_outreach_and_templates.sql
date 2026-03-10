
-- Outreach queue: staged emails awaiting approval
CREATE TABLE IF NOT EXISTS outreach_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES prospector_leads(id),
  contact_id UUID REFERENCES contacts(id),
  template_type TEXT DEFAULT 'cold',
  niche TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  pdf_url TEXT,
  calendly_link TEXT DEFAULT 'https://calendly.com/oculops-murcia/30min',
  status TEXT DEFAULT 'staged',
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  follow_up_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email templates per niche
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche TEXT NOT NULL,
  template_type TEXT DEFAULT 'cold',
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service packages per niche
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche TEXT NOT NULL,
  tier TEXT NOT NULL,
  name TEXT NOT NULL,
  price_monthly NUMERIC NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE outreach_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all outreach_queue" ON outreach_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all email_templates" ON email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all service_packages" ON service_packages FOR ALL USING (true) WITH CHECK (true);
;
