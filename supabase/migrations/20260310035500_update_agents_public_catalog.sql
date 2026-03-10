-- ═══════════════════════════════════════════════════
-- Update 9 Agents to explicitly have Public Catalog capability
-- ═══════════════════════════════════════════════════

UPDATE agent_registry
SET capabilities = (
  SELECT COALESCE(jsonb_agg(DISTINCT elem), '[]'::jsonb) 
  FROM jsonb_array_elements(COALESCE(capabilities, '[]'::jsonb) || '["query_public_catalog", "autonomous_api_routing"]'::jsonb) AS elem
);

-- We also inject the router knowledge directly into their core instructions so that UI interfaces
-- immediately know they can query ANY open data via the gateway using their respective allowed_apis array.

UPDATE agent_registry
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{system_prompt_addon}',
  '"You now have autonomous routing access to an internal catalog of 668 open-auth APIs and massive intelligence endpoints through the API Gateway. If the user asks for open data, weather, cryptocurrencies, sports, or specialized knowledge, you can seamlessly query the public-api-catalog via the executeDynamicPublicApi router to retrieve it instantly."'::jsonb,
  true
);
