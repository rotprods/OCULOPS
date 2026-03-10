# Central Secrets Inventory

Updated: 2026-03-10

This file reflects the current real state of OCULOPS OS secrets after checking:
- local `.env`
- `supabase/.env.deploy`
- remote Supabase Edge secrets

Important:
- `set remotely` means a non-empty secret exists remotely.
- `blank remotely` means the secret key exists in Supabase, but its value is empty.
- never commit real values into git.

## Remote Supabase runtime summary

Set remotely:
- `ALPHA_VANTAGE_KEY`
- `ANTHROPIC_API_KEY`
- `APP_URL`
- `CRON_SECRET`
- `GMAIL_OAUTH_REDIRECT_URL`
- `GMAIL_PUBSUB_TOPIC_NAME`
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `N8N_WEBHOOK_URL`
- `OPENAI_API_KEY`
- `PUBLIC_APP_URL`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`

Blank remotely:
- `MANYCHAT_API_KEY`
- `META_ACCESS_TOKEN`
- `META_APP_ID`
- `META_APP_SECRET`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_THREAD_ID`
- `TIKTOK_API_KEY`
- `TIKTOK_API_SECRET`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_BUSINESS_PHONE_NUMBER`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`

Unmapped remote secret:
- `FEPGQ5TC1RSITP`

## Secrets matrix

### 1. Core platform

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | local `.env` + Vercel | frontend runtime | set locally, set remotely |
| `VITE_SUPABASE_ANON_KEY` | local `.env` + Vercel | frontend runtime | set locally, set remotely |
| `SUPABASE_URL` | Supabase Edge secrets | shared Edge runtime | set remotely |
| `SUPABASE_ANON_KEY` | Supabase Edge secrets | auth-scoped function calls | set remotely |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge secrets | privileged Edge runtime | set remotely |
| `SUPABASE_DB_URL` | Supabase Edge secrets | DB jobs / SQL helpers | set remotely |
| `APP_URL` | local `.env` + Vercel + Supabase | app URL / redirects | set locally, set remotely |
| `PUBLIC_APP_URL` | local `.env` + Vercel + Supabase | public app URL | set locally, set remotely |
| `SUPABASE_PROJECT_REF` | local deploy machine | Supabase CLI | set in `supabase/.env.deploy` |
| `SUPABASE_ACCESS_TOKEN` | local deploy machine | Supabase CLI | set in `supabase/.env.deploy` |
| `SUPABASE_DB_PASSWORD` | local deploy machine | DB push / linking | set in `supabase/.env.deploy` |

### 2. AI and automation

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Supabase Edge secrets | `ai-advisor`, AI helpers | set remotely |
| `ANTHROPIC_API_KEY` | Supabase Edge secrets | Claude-backed flows | set remotely |
| `N8N_WEBHOOK_URL` | Supabase Edge secrets | `automation-runner` / n8n handoff | set remotely |
| `CRON_SECRET` | Supabase Edge secrets | scheduled jobs auth | set remotely |

### 3. Markets and social intelligence

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `ALPHA_VANTAGE_KEY` | Supabase Edge secrets | `market-data` stocks + forex | set remotely |
| `REDDIT_CLIENT_ID` | Supabase Edge secrets | `social-signals` Reddit OAuth | set remotely |
| `REDDIT_CLIENT_SECRET` | Supabase Edge secrets | `social-signals` Reddit OAuth | set remotely |
| `REDDIT_USER_AGENT` | Supabase Edge secrets | `social-signals` Reddit OAuth | set remotely |
| `APIFY_TOKEN` | Supabase Edge secrets | optional Reddit fallback in `social-signals` | missing |
| `APIFY_REDDIT_ACTOR_ID` | Supabase Edge secrets | optional Reddit fallback actor | optional, code default exists |

### 4. Prospecting and maps

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `GOOGLE_MAPS_API_KEY` | Supabase Edge secrets | `google-maps-search` / Atlas | set remotely |
| `GOOGLE_MAPS_KEY` | Supabase Edge secrets | legacy fallback alias | set remotely |

### 5. Gmail and Google auth

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | Supabase Edge secrets | Gmail OAuth | set remotely |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Supabase Edge secrets | Gmail OAuth | set remotely |
| `GMAIL_OAUTH_REDIRECT_URL` | Supabase Edge secrets | Gmail callback | set remotely |
| `GMAIL_PUBSUB_TOPIC_NAME` | Supabase Edge secrets | Gmail inbound sync | set remotely |

### 6. Meta and WhatsApp

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `META_APP_ID` | Supabase Edge secrets | Meta auth | blank remotely |
| `META_APP_SECRET` | Supabase Edge secrets | webhook verification | blank remotely |
| `META_ACCESS_TOKEN` | Supabase Edge secrets | Meta discovery / WhatsApp | blank remotely |
| `META_GRAPH_VERSION` | Supabase Edge secrets or defaults | API versioning | set remotely |
| `WHATSAPP_PHONE_NUMBER_ID` | Supabase Edge secrets | WhatsApp outbound | blank remotely |
| `WHATSAPP_BUSINESS_PHONE_NUMBER` | Supabase Edge secrets | WhatsApp metadata | blank remotely |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Supabase Edge secrets | WhatsApp scope | blank remotely |
| `WHATSAPP_TOKEN` | Supabase Edge secrets | WhatsApp Cloud API | blank remotely |
| `WHATSAPP_VERIFY_TOKEN` | Supabase Edge secrets | WhatsApp webhook verification | blank remotely |

### 7. TikTok and ManyChat

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `TIKTOK_API_KEY` | Supabase Edge secrets | `tiktok-business-search` | blank remotely |
| `TIKTOK_API_SECRET` | Supabase Edge secrets | `tiktok-business-search` | blank remotely |
| `MANYCHAT_API_KEY` | Supabase Edge secrets | `manychat-sync` | blank remotely |

### 8. Telegram delivery

| Name | Where it belongs | Used by | Status |
| --- | --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Supabase Edge secrets | reporting / delivery | set remotely |
| `TELEGRAM_CHAT_ID` | Supabase Edge secrets | default delivery target | blank remotely |
| `TELEGRAM_THREAD_ID` | Supabase Edge secrets | optional topic/thread delivery | blank remotely |

## What is actually still missing

Operationally missing now:
- `APIFY_TOKEN` if Reddit must work reliably from Supabase runtime
- real Meta / WhatsApp secrets
- real TikTok secrets
- real ManyChat secret
- `TELEGRAM_CHAT_ID` if Herald/report delivery should target a default chat

No longer missing:
- `ALPHA_VANTAGE_KEY`
- `GOOGLE_MAPS_API_KEY`
- `N8N_WEBHOOK_URL`
- Gmail OAuth group
- core Supabase runtime group

## Current blockers tied to secrets

- `social-signals` still cannot fetch Reddit reliably from Supabase runtime.
  Current code already supports:
  - Reddit OAuth
  - fallback to `old.reddit.com`
  - optional Apify fallback
  The remaining practical fix is `APIFY_TOKEN` or valid Reddit credentials that actually authorize app-only access.

- Meta / WhatsApp / TikTok / ManyChat are intentionally deferred and still blank remotely.

## Handling rules

- Never commit real values.
- Frontend/browser envs belong in local `.env` and Vercel.
- Server/runtime secrets belong in Supabase Edge secrets.
- Deploy-machine credentials stay on the operator machine.
