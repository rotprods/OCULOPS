# Go-Live Checklist

Updated: 2026-03-10

This is the reduced checklist based on the real current platform state.

## Already closed

- Supabase CLI auth works
- pending database migrations were applied
- `ai-advisor`, `messaging-dispatch`, `api-proxy`, `market-data`, and `social-signals` were redeployed
- cron jobs for `market-data` and `social-signals` were created
- `ALPHA_VANTAGE_KEY` is set remotely
- `GOOGLE_MAPS_API_KEY` is set remotely
- Gmail OAuth secret group is set remotely
- `N8N_WEBHOOK_URL` is set remotely
- build/lint/test baseline passes locally

## Still missing for full live mode

### 1. Reddit reliability

Still required:
- `APIFY_TOKEN` if Reddit must be made reliable from Supabase runtime

Current state:
- `social-signals` is live
- Hacker News ingestion works
- Reddit code path exists, but remote Reddit access is still blocked or unauthorized from the current runtime path

After `APIFY_TOKEN` is set, Codex should:
1. set the secret in Supabase
2. redeploy `social-signals`
3. verify `social_signals` includes Reddit rows, not only Hacker News

### 2. Telegram default target

Still required:
- `TELEGRAM_CHAT_ID` if automated reporting should have a default destination

### 3. Deferred provider groups

Intentionally still blank:
- Meta
- WhatsApp
- TikTok
- ManyChat

Do not treat these as current blockers unless work resumes on those integrations.

## Final acceptance state for current phase

Current phase can be considered operational when:
- markets remain live for crypto + available Alpha Vantage coverage
- `social-signals` continues ingesting Hacker News
- Reddit is either fixed via Apify or explicitly accepted as deferred
- no core module depends on hardcoded auth bypass
- build/lint baseline stays green
