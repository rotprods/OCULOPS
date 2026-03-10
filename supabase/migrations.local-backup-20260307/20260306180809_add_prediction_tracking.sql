CREATE TABLE IF NOT EXISTS prediction_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  prediction_text TEXT NOT NULL,
  source TEXT DEFAULT 'atlas',
  category TEXT,
  confidence INTEGER DEFAULT 50,
  actual_outcome TEXT,
  accuracy_score INTEGER,
  validated_at TIMESTAMPTZ,
  validated_by TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prediction_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for prediction_tracking" ON prediction_tracking FOR ALL USING (true) WITH CHECK (true);;
