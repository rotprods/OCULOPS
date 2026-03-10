# n8n Workflows — ANTIGRAVITY OS Agent Network

## 🚀 Complete Workflow Library — 17 Templates

All workflows are pre-configured with your Supabase endpoints and OpenAI API key. Just import and activate.

### Quick Setup

1. Open n8n → **Workflows** → **Import from File**
2. Import each `.json` file
3. **Activate** the workflow

---

## 🧠 CORTEX Agent Workflows (5)

| File | Schedule | Agents | Description |
| ---- | ---- | ---- | ---- |
| `cortex-orchestration.json` | Every 1h | CORTEX → SENTINEL + SCRIBE | Hourly orchestration cycle |
| `atlas-hunter-pipeline.json` | Every 6h | ATLAS → HUNTER | Market scan + lead qualification |
| `oracle-scribe-daily.json` | Daily 8AM | ORACLE → SCRIBE | Deep analytics + daily report |
| `forge-content-webhook.json` | Webhook | FORGE | On-demand content generation |
| `strategist-webhook.json` | Webhook | STRATEGIST | On-demand decision evaluation |

## 🔄 Master Orchestration (1)

| File | Schedule | Agents | Description |
| ---- | ---- | ---- | ---- |
| `master-full-cycle.json` | Daily 7AM | ALL 7 agents | ATLAS→HUNTER→ORACLE→SENTINEL+FORGE→SCRIBE→CORTEX |

## 🎯 Lead Generation & CRM (4)

| File | Schedule | Description |
| ---- | ---- | ---- |
| `speed-to-lead.json` | Webhook | Instant lead capture → CRM → HUNTER qualify → alert |
| `maps-lead-prospector.json` | Every 8h | GPT generates B2B prospect lists for Murcia |
| `chatbot-lead-qualifier.json` | Webhook | AI chatbot that qualifies visitors and logs conversations |
| `crm-deal-nurture.json` | Every 2h | Finds stale deals → GPT suggests nurture actions |

## 📱 Marketing & Content (3)

| File | Schedule | Description |
| ---- | ---- | ---- |
| `social-content-factory.json` | Mon/Wed/Fri 9AM | Generates LinkedIn, Instagram, Twitter, TikTok content |
| `email-outreach-weekly.json` | Monday 10AM | Generates personalized cold outreach emails via FORGE |
| `ad-campaign-optimizer.json` | Every 3h | Analyzes campaigns, suggests budget optimizations |

## 📊 Intelligence & Reporting (3)

| File | Schedule | Description |
| ---- | ---- | ---- |
| `competitor-monitor.json` | Every 12h | GPT competitive analysis → signals + knowledge base |
| `weekly-business-report.json` | Sunday 8PM | Executive weekly report with KPIs and forecasts |
| `niche-discovery.json` | Tuesday 11AM | Discovers and scores new market niches |

## 💰 Pipeline & Monitoring (1)

| File | Schedule | Description |
| ---- | ---- | ---- |
| `pipeline-health-alerts.json` | Every 4h | Pipeline health check via SENTINEL |

---

## Webhook Endpoints (after activation)

```text
POST /webhook/new-lead           → Speed-to-Lead
POST /webhook/chatbot-message    → AI Chatbot
POST /webhook/forge-content      → FORGE Content
POST /webhook/strategist-evaluate → STRATEGIST Decisions
```

## Direct Agent Endpoints

```text
POST https://yxzdafptqtcvpsbqkmkm.supabase.co/functions/v1/agent-{name}
Header: Authorization: Bearer <anon-key>
Body: { "action": "cycle" }

Available: cortex, atlas, hunter, oracle, sentinel, forge, strategist, scribe
```
