# Operations Deploy Checklist

Updated: March 7, 2026

Shortcut:
- Run `bash scripts/deploy-operations.sh` once `.env` and `supabase/.env.deploy` contain the required credentials.

## 1. Database

- Apply all Supabase migrations, including:
  - `20260307162000_operational_messaging_and_prospector_bridge.sql`
  - `20260307170000_automation_runs_realtime_and_anon.sql`
- Confirm the following tables exist and are writable:
  - `crm_activities`
  - `messaging_channels`
  - `automation_runs`
  - `prospector_leads`
  - `prospector_scans`
  - `conversations`
  - `messages`

## 2. Gmail

- Create a Google OAuth client.
- Enable Gmail API.
- Set:
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `GOOGLE_OAUTH_CLIENT_SECRET`
  - `GMAIL_OAUTH_REDIRECT_URL`
  - `GMAIL_PUBSUB_TOPIC_NAME`
- Add the redirect URI to the Google OAuth client.
- Configure Pub/Sub push to `gmail-inbound`.

## 3. WhatsApp

- Create or locate a WhatsApp Cloud API phone number.
- Set:
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_BUSINESS_PHONE_NUMBER`
  - `WHATSAPP_BUSINESS_ACCOUNT_ID`
  - `WHATSAPP_TOKEN`
  - `WHATSAPP_VERIFY_TOKEN`
  - `META_APP_SECRET`
- Point the Meta webhook to `whatsapp-webhook`.
- Subscribe to message and message status events.

## 4. App URLs

- Set:
  - `APP_URL`
  - `PUBLIC_APP_URL`
- `GMAIL_OAUTH_REDIRECT_URL` must point to the deployed `messaging-channel-oauth` function callback URL.
- Optional:
  - `N8N_WEBHOOK_URL` if workflows should hand off to n8n.

## 5. Edge Functions To Deploy

- `messaging-channel-oauth`
- `messaging-dispatch`
- `automation-runner`
- `gmail-inbound`
- `web-analyzer`
- `ai-qualifier`
- `agent-atlas`
- `agent-hunter`
- `agent-strategist`
- `agent-cortex`
- `agent-outreach`
- `whatsapp-webhook`

## 6. Smoke Checks

- Connect Gmail from `Messaging Hub`.
- Activate WhatsApp from `Messaging Hub`.
- Send one Gmail outbound message and confirm:
  - `messages.status = sent`
  - `messages.provider_message_id` is present
  - `conversations.last_outbound_at` updates
- Send one WhatsApp outbound message and confirm:
  - `messages.status = sent`
  - webhook delivery updates `delivered` and `read`
- Run one workflow from `Automation Zone` and confirm:
  - new row in `automation_runs`
  - `automation_workflows.run_count` increments
  - `compose_message` steps create/update `messages`
- Run an Airspace scan and confirm:
  - new row in `prospector_scans`
  - rows in `prospector_leads`
  - `Scanner`, `Mapa`, and `Leads` show the same persisted data
- Trigger `ATLAS`, `HUNTER`, `STRATEGIST`, and `CORTEX` and confirm logs/tasks update.
- Send one inbound Gmail or WhatsApp message and confirm:
  - `message_in` workflows fire automatically
  - `conversations.unread_count` increments
  - follow-up activities/messages are stored
