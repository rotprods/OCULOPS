# Public API Keys Bootstrap

Este flujo deja ANTIGRAVITY listo para activar conectores públicos con un único comando.

## 1) Variables mínimas en `.env`

Base:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Keys de conectores adapter-ready (solo las requeridas):
- `GRAPHHOPPER_API_KEY`
- `AEMET_API_KEY`
- `GUARDIAN_API_KEY` (o `THE_GUARDIAN_API_KEY`)
- `FRED_API_KEY`

Opcional (si prefieres naming explícito por conector):
- `CONNECTOR_GRAPHHOPPER_API_KEY`
- `CONNECTOR_AEMET_API_KEY`
- `CONNECTOR_THE_GUARDIAN_API_KEY`
- `CONNECTOR_FRED_API_KEY`

## 2) Dry-run (sin tocar DB)

```bash
npm run public-apis:bootstrap
```

Genera reporte en:
- `reports/public-api-bootstrap.json`

## 3) Aplicar instalación + credenciales + healthchecks

```bash
npm run public-apis:bootstrap -- --apply --healthcheck --strict
```

## 4) Cierre end-to-end (catálogo + capa infra + conectores + n8n)

```bash
npm run public-apis:finalize -- --apply --strict
```

## Resultado esperado

- Conectores `adapter_ready` instalados en `api_connectors`.
- `auth_config` cargado desde `.env`.
- `health_status=live` para conectores con key válida.
- Reportes actualizados:
  - `public/public-api-catalog/infrastructure-layer.json`
  - `reports/public-api-bootstrap.json`
  - `reports/n8n-workflow-audit.json`
  - `reports/n8n-oculops-reconcile.json`
