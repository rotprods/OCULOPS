# Go-Live Checklist

Updated: 2026-03-08

This is the ordered list of what is still missing to finish the platform and let Codex push it fully live.

## 1. Centralize and provide the missing secrets

Use `/Users/robertoortega/Documents/AI OPS/ANTIGRAVITY-OS/missing/secrets-template.env` as the handoff checklist.

Highest priority secrets to provide or set:
- `ALPHA_VANTAGE_KEY`
- `GOOGLE_MAPS_API_KEY`
- `N8N_WEBHOOK_URL`
- `META_ACCESS_TOKEN`
- `MANYCHAT_API_KEY`
- `TIKTOK_API_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GMAIL_OAUTH_REDIRECT_URL`
- `GMAIL_PUBSUB_TOPIC_NAME`
- `WHATSAPP_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`

Optional but relevant:
- `ANTHROPIC_API_KEY`
- `TELEGRAM_THREAD_ID`
- `META_APP_ID`
- `META_APP_SECRET`
- `TIKTOK_API_SECRET`

## 2. Finish the agent reporting path

Current gap:
- manual studies post correctly into `agent_studies` and Telegram
- live agent runs are callable
- but the live agent endpoints still need reconciliation so every run auto-creates a study and pushes Telegram consistently

After secrets are ready, Codex should:
1. redeploy the agent runtime functions
2. run live smoke tests for `agent-cortex`, `agent-atlas`, `agent-hunter`, `agent-outreach`, `agent-strategist`, `agent-herald`
3. confirm each run creates a new `agent_studies` row
4. confirm each row appears in the app dashboard in realtime
5. confirm Telegram delivery on the automated path

## 3. Finish the market and social feeds

Still required:
- add `ALPHA_VANTAGE_KEY`
- verify Reddit ingestion is actually contributing rows
- configure cron jobs for `market-data` and `social-signals`

Then Codex should:
1. redeploy or re-run the feed functions
2. verify `market_snapshots` contains live stock/forex rows, not only demo fallback
3. verify `social_signals` contains Reddit rows in addition to Hacker News
4. verify the app leaves mixed/demo states

## 4. Finish live prospecting and messaging providers

Still required:
- Google Maps key
- Gmail OAuth config
- Meta + WhatsApp config
- TikTok key
- ManyChat key

Then Codex should:
1. set the secrets in Supabase
2. redeploy affected edge functions
3. smoke test each provider path
4. verify the related dashboard modules show live data instead of fallback behavior

## 5. Finish n8n execution

Current state:
- n8n templates are downloaded and mapped in the app
- automation packs exist for the agents
- live remote execution still depends on `N8N_WEBHOOK_URL`

Then Codex should:
1. set `N8N_WEBHOOK_URL`
2. test `automation-runner`
3. trigger a real n8n workflow from the app
4. verify the run is logged back into the dashboard

## 6. Deploy the remaining local frontend changes

Local files still modified in the working tree:
- `src/components/modules/ControlTower.css`
- `src/components/modules/FlightDeck.css`
- `src/components/modules/Intelligence.css`
- `src/components/modules/Markets.css`
- `src/components/modules/StudyHub.css`

Before final signoff:
1. review these files
2. decide whether they should ship
3. deploy the final frontend state to Vercel

## 7. Final live verification

Final acceptance check:
- agents are visible in the app
- studies appear in realtime in the dashboard
- automated agent runs create study rows
- Telegram receives automated reports
- markets are fully live
- social radar is fully live
- provider-backed modules no longer depend on demo-only fallbacks
