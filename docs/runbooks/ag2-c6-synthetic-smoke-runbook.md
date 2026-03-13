# AG2-C6 Synthetic Smoke Runbook

Purpose: validate closed-loop reconciliation (`outbound -> inbound -> outreach_queue.status=replied`) without external provider credentials.

## Command

```bash
node scripts/smoke-ag2-c6-synthetic.mjs
```

## What It Does

1. Creates synthetic runtime entities (channel/contact/conversation).
2. Creates one outbound `outreach_queue` row in `sent` status.
3. Creates one outbound message linked to that queue row.
4. Calls `gmail-inbound` with `action=synthetic_inbound`.
5. Verifies:
   - `outreach_queue.status = replied`
   - `outreach_queue.provider_status = replied`
   - `outreach_queue.message_id` points to the inbound message
   - `conversations.last_inbound_at` is set

## Outputs

- `docs/runbooks/ag2-c6-synthetic-smoke.latest.json`
- `docs/runbooks/ag2-c6-synthetic-smoke.md`

## Preconditions

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available in `.env` or `supabase/.env.deploy`.
- Deployed `gmail-inbound` function with `synthetic_inbound` action.

## Notes

- This smoke is internal-only and service-role gated.
- It is designed for AG2-C6 verification when Gmail/WhatsApp provider credentials are unavailable.

