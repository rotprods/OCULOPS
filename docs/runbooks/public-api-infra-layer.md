# Public API Infrastructure Layer

Generated: 2026-03-14T00:44:46.001Z
Source: supabase

## Summary
- Total APIs: 1426
- Executable now (live connectors): 7
- Installable (adapter templates): 5
- Docs only: 1414
- Adapter-ready: 5
- Candidate: 417

## Bridge Modes
- `connector_proxy`: can run now via `api-proxy` and automation `run_connector`
- `install_then_connector_proxy`: needs connector install + credentials before execution
- `docs_only`: docs-level source, usable for research/spec planning until adapter exists

## Skills + Automation
- Agent live execution skill: `fetch_external_data` (live connectors only)
- Agent catalog exploration skill: `catalog_api_lookup`
- Automation action for connectors: `run_connector`
- n8n bridge action: `launch_n8n`

