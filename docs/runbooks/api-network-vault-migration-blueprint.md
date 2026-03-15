# API Network Vault Migration Blueprint (Phase 2)

## Objective
- Migrate connector credential handling from `api_connectors.auth_config` plaintext values to Supabase Vault-backed secret references.
- Keep existing API Network activation flow operational during migration.
- Provide rollback-safe cutover with no `api-proxy` contract break for frontend callers.

## Target Architecture
- `api_connectors.auth_config` stores non-sensitive transport metadata only (`query_name`, `header_name`, auth mode flags).
- Sensitive values (`api_key`, `token`, `username`, `password`) are stored in Vault and referenced by secret ids.
- `api-proxy` resolves secret references at runtime using service role and never returns secrets in responses.
- UI surfaces only masked credential status (set/missing/updated_at), never raw secret values after migration.

## Data Model and Backend Changes
- Add migration fields to `api_connectors`:
  - `credential_refs jsonb not null default '{}'::jsonb`
  - `credentials_migrated_at timestamptz`
  - `credentials_version integer not null default 1`
- Add helper SQL/RPC layer:
  - `set_connector_credentials(connector_id uuid, credential_payload jsonb)` writes/rotates Vault secrets and updates refs.
  - `get_connector_credential_status(connector_id uuid)` returns masked status metadata.
- Update `api-proxy`:
  - Before outbound request, resolve required credential refs from Vault.
  - Preserve existing error envelope (`ok`, `error`, status codes), adding `code` values for missing/invalid secret refs.
  - Keep existing healthcheck/update behavior for `health_status` and `last_healthcheck_at`.

## Migration Plan
1. **Preparation**
- Ship schema additions and RPCs with dual-read capability (legacy plaintext + refs).
- Add audit logging for credential set/rotate/delete actions.

2. **Backfill**
- One-time migration job scans `api_connectors.auth_config` for sensitive keys.
- For each connector:
  - create Vault secret(s),
  - write `credential_refs`,
  - scrub sensitive fields from `auth_config`,
  - set `credentials_migrated_at`.
- Emit migration report with success/failure list.

3. **Dual-Read Window**
- `api-proxy` reads refs first; falls back to legacy plaintext only for unmigrated connectors.
- UI shows migration status and prompts rotation for failed rows.

4. **Cutover**
- Disable plaintext fallback in `api-proxy`.
- Enforce writes through `set_connector_credentials` only.
- Add DB check/trigger to block direct storage of sensitive plaintext keys in `auth_config`.

5. **Post-Cutover**
- Rotate high-risk provider credentials.
- Run connector healthchecks in waves and compare live/error rates vs pre-cutover baseline.

## Rollback Strategy
- Keep dual-read code path behind a runtime flag for one release cycle.
- If cutover fails, re-enable fallback mode while preserving Vault refs.
- Restore from migration report only for affected connectors, not full-table rollback.

## Acceptance Criteria
- No credential plaintext remains in `api_connectors.auth_config` for migrated connectors.
- `api-proxy` executes live connectors using Vault refs with unchanged frontend request shape.
- Activation queue can still classify `credentials_missing` and `healthcheck_failed` correctly post-migration.
- Audit trail exists for all credential mutations (who, when, connector, action).
