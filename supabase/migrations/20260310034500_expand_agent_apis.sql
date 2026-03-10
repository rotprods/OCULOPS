-- ═══════════════════════════════════════════════════
-- Expand Agent APIs with New Connectors
-- ═══════════════════════════════════════════════════

-- Update CORTEX
UPDATE agent_registry 
SET allowed_apis = (SELECT jsonb_agg(DISTINCT elem) FROM jsonb_array_elements(allowed_apis || '["openai", "anthropic", "n8n", "telegram"]'::jsonb) AS elem)
WHERE code_name = 'cortex';

-- Update ATLAS
UPDATE agent_registry 
SET allowed_apis = (SELECT jsonb_agg(DISTINCT elem) FROM jsonb_array_elements(allowed_apis || '["meta", "tiktok", "posthog"]'::jsonb) AS elem)
WHERE code_name = 'atlas';

-- Update HUNTER
UPDATE agent_registry 
SET allowed_apis = (SELECT jsonb_agg(DISTINCT elem) FROM jsonb_array_elements(allowed_apis || '["manychat", "whatsapp"]'::jsonb) AS elem)
WHERE code_name = 'hunter';

-- Update ORACLE
UPDATE agent_registry 
SET allowed_apis = (SELECT jsonb_agg(DISTINCT elem) FROM jsonb_array_elements(allowed_apis || '["posthog", "n8n", "anthropic"]'::jsonb) AS elem)
WHERE code_name = 'oracle';

-- Update SENTINEL
UPDATE agent_registry 
SET allowed_apis = (SELECT jsonb_agg(DISTINCT elem) FROM jsonb_array_elements(allowed_apis || '["telegram", "whatsapp", "n8n"]'::jsonb) AS elem)
WHERE code_name = 'sentinel';

-- Update FORGE
UPDATE agent_registry 
SET allowed_apis = (SELECT jsonb_agg(DISTINCT elem) FROM jsonb_array_elements(allowed_apis || '["openai", "anthropic", "meta", "tiktok", "higgsfield"]'::jsonb) AS elem)
WHERE code_name = 'forge';

-- Update STRATEGIST
UPDATE agent_registry 
SET allowed_apis = (SELECT jsonb_agg(DISTINCT elem) FROM jsonb_array_elements(allowed_apis || '["openai", "anthropic", "posthog"]'::jsonb) AS elem)
WHERE code_name = 'strategist';

-- Update SCRIBE
UPDATE agent_registry 
SET allowed_apis = (SELECT jsonb_agg(DISTINCT elem) FROM jsonb_array_elements(allowed_apis || '["telegram", "n8n"]'::jsonb) AS elem)
WHERE code_name = 'scribe';

-- Update OUTREACH
UPDATE agent_registry 
SET allowed_apis = (SELECT COALESCE(jsonb_agg(DISTINCT elem), '[]'::jsonb) FROM jsonb_array_elements(COALESCE(allowed_apis, '[]'::jsonb) || '["whatsapp", "manychat", "telegram"]'::jsonb) AS elem)
WHERE code_name = 'outreach';
