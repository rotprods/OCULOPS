# Central Secrets Inventory

Updated: 2026-03-08

No, the secrets were not centralized before this file.

Before this inventory, they were split across:
- `/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/.env.example`
- `/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/supabase/.env.deploy.example`
- Vercel project environment variables
- Supabase Edge Function runtime secrets
- local machine CLI/deploy credentials

This document is now the single reference point for the project.

## Current remote Supabase runtime secrets detected

Present remotely:
- `CRON_SECRET`
- `OPENAI_API_KEY`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Present remotely but not mapped to a known repo requirement:
- `FEPGQ5TC1RSITP`

## Secrets and config matrix

### 1. Core platform

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Vercel + local `.env` | Frontend app runtime | required |
| `VITE_SUPABASE_ANON_KEY` | Vercel + local `.env` | Frontend app runtime | required |
| `SUPABASE_URL` | Supabase Edge secrets | Edge Functions shared runtime | set remotely |
| `SUPABASE_ANON_KEY` | Supabase Edge secrets | `market-data`, `social-signals`, `api-proxy` | set remotely |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge secrets | all privileged Edge Functions | set remotely |
| `SUPABASE_DB_URL` | Supabase Edge secrets | server-side DB access / jobs | set remotely |
| `SUPABASE_PROJECT_REF` | local deploy machine | Supabase CLI deploy flow | missing from tracked docs |
| `SUPABASE_ACCESS_TOKEN` | local deploy machine | Supabase CLI deploy flow | missing from tracked docs |
| `SUPABASE_DB_PASSWORD` | local deploy machine | direct DB/deploy ops | missing from tracked docs |

### 2. AI and automation

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Supabase Edge secrets | `ai-advisor`, lead-intel helpers | set remotely |
| `ANTHROPIC_API_KEY` | Supabase Edge secrets | future Claude-backed flows | missing |
| `N8N_WEBHOOK_URL` | Supabase Edge secrets | `automation-runner` / n8n handoff | missing |
| `CRON_SECRET` | Supabase Edge secrets | scheduled function auth | set remotely |

### 3. Markets and social intelligence

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `ALPHA_VANTAGE_KEY` | Supabase Edge secrets | `market-data` stocks + forex | missing |
| `REDDIT_CLIENT_ID` | Supabase Edge secrets | `social-signals` Reddit ingestion | set remotely |
| `REDDIT_CLIENT_SECRET` | Supabase Edge secrets | `social-signals` Reddit ingestion | set remotely |
| `REDDIT_USER_AGENT` | Supabase Edge secrets | `social-signals` Reddit ingestion | set remotely |

### 4. Prospecting and maps

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `GOOGLE_MAPS_API_KEY` | Supabase Edge secrets | `google-maps-search` / Atlas prospecting | missing |

### 5. Gmail and Google auth

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | Supabase Edge secrets | Gmail OAuth | missing |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Supabase Edge secrets | Gmail OAuth | missing |
| `GMAIL_OAUTH_REDIRECT_URL` | Supabase Edge secrets | Gmail OAuth callback | missing |
| `GMAIL_PUBSUB_TOPIC_NAME` | Supabase Edge secrets | Gmail inbound sync | missing |
| `APP_URL` | Vercel + local `.env` | OAuth redirect construction | missing from tracked runtime inventory |
| `PUBLIC_APP_URL` | Vercel + local `.env` | OAuth redirect construction | missing from tracked runtime inventory |

### 6. Meta and WhatsApp

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `META_APP_ID` | Supabase Edge secrets | Meta auth / webhooks | missing |
| `META_APP_SECRET` | Supabase Edge secrets | Meta auth / webhook verification | missing |
| `META_ACCESS_TOKEN` | Supabase Edge secrets | Meta business discovery / WhatsApp | missing |
| `META_GRAPH_VERSION` | Supabase Edge secrets or defaults | Meta API versioning | optional, defaults in code |
| `WHATSAPP_PHONE_NUMBER_ID` | Supabase Edge secrets | WhatsApp outbound | missing |
| `WHATSAPP_BUSINESS_PHONE_NUMBER` | Supabase Edge secrets | WhatsApp outbound metadata | missing |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Supabase Edge secrets | WhatsApp account scope | missing |
| `WHATSAPP_TOKEN` | Supabase Edge secrets | WhatsApp Cloud API | missing |
| `WHATSAPP_VERIFY_TOKEN` | Supabase Edge secrets | WhatsApp webhook verification | missing |

### 7. TikTok and ManyChat

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `TIKTOK_API_KEY` | Supabase Edge secrets | `tiktok-business-search` | missing |
| `TIKTOK_API_SECRET` | Supabase Edge secrets | `tiktok-business-search` | missing |
| `MANYCHAT_API_KEY` | Supabase Edge secrets | `manychat-sync` | missing |

### 8. Telegram delivery

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Supabase Edge secrets | study/report delivery | set remotely |
| `TELEGRAM_CHAT_ID` | Supabase Edge secrets | default Telegram target fallback | set remotely |
| `TELEGRAM_THREAD_ID` | Supabase Edge secrets | optional thread/topic delivery | optional, missing |

## What still blocks full live mode

Highest-impact missing secrets:
- `ALPHA_VANTAGE_KEY`
- `GOOGLE_MAPS_API_KEY`
- `N8N_WEBHOOK_URL`
- `META_ACCESS_TOKEN`
- `MANYCHAT_API_KEY`
- `TIKTOK_API_KEY`
- Gmail OAuth group
- WhatsApp group

These are the main features still limited by missing config:
- full live markets for stocks/forex
- live Google Maps business search
- real Gmail OAuth/inbound
- real Meta/Instagram/WhatsApp channel operations
- real TikTok discovery
- real ManyChat sync
- real n8n handoff instead of configuration-only wiring

## Rule for handling secrets

- Never commit real values into git.
- Put frontend/browser env in Vercel and local `.env`.
- Put server/runtime secrets in Supabase Edge secrets.
- Keep deploy-machine credentials on the operator machine, not in the app runtime.
