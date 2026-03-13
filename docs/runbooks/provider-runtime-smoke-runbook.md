# Provider Runtime Smoke Runbook

Validate provider runtime readiness and channel provisioning state before live outbound/inbound verification.

## Command

```bash
node scripts/smoke-provider-runtime.mjs
```

## Optional Flags

- `--bootstrap-whatsapp` attempts `bootstrap_whatsapp` when runtime is outbound-ready.
- `--sync-gmail` attempts `gmail-inbound` manual sync on the active Gmail channel.
- `--strict` fails if outbound runtime is not ready for both Gmail and WhatsApp.

Example:

```bash
node scripts/smoke-provider-runtime.mjs --bootstrap-whatsapp --sync-gmail --strict
```

## Outputs

- `docs/runbooks/provider-runtime-smoke.latest.json`
- `docs/runbooks/provider-runtime-smoke.md`

## Pass Criteria

- `runtime.summary.outbound_ready.gmail = true`
- `runtime.summary.outbound_ready.whatsapp = true`
- At least one active provider channel in `channels_summary.active`

## Notes

- This smoke does not send outbound messages by itself.
- Use this as AG2-C2 readiness gate before AG2-C6 live round-trip (outbound -> inbound reconciliation).

