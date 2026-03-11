# Creative Event Map
> OCULOPS Creative Factory | Agent 3 — Job System / Orchestration Engineer
> Authored: 2026-03-11

---

## 1. Naming Convention

All creative events follow the same `domain.verb` pattern as existing system events:

```
agent.started         → existing
agent.completed       → existing
agent.error           → existing
deal.stage_changed    → existing
lead.captured         → existing
signal.detected       → existing
```

New creative events introduced by this system:

```
creative.job_queued        → request accepted, job row created
creative.job_processing    → engine adapter called, external API hit
creative.job_completed     → asset saved to storage, URL available
creative.job_failed        → engine error, retry scheduled
creative.job_dead_lettered → all retries exhausted, manual intervention needed
creative.asset_published   → asset linked to campaign or deal (downstream action)
creative.request_cancelled → user or agent cancelled before processing
```

---

## 2. Event Payload Structures

All events use the existing `event_log` schema columns plus `payload` jsonb. The shapes below describe the `payload` field contents.

### `creative.job_queued`
```json
{
  "job_id":      "uuid",
  "request_id":  "uuid",
  "engine":      "higgsfield | veo3 | openai_image | openai_copy | internal",
  "asset_type":  "image | video | copy | audio | carousel | batch",
  "priority":    "normal | high | critical",
  "campaign_id": "uuid | null",
  "agent_code_name": "forge | null"
}
```
`source_agent`: the agent that requested generation (e.g., `forge`) or `creative-studio` if user-initiated.

### `creative.job_processing`
```json
{
  "job_id":     "uuid",
  "engine":     "string",
  "attempt":    1,
  "started_at": "ISO8601"
}
```

### `creative.job_completed`
```json
{
  "job_id":       "uuid",
  "request_id":   "uuid",
  "engine":       "string",
  "asset_type":   "string",
  "output_url":   "https://...",
  "duration_ms":  12340,
  "campaign_id":  "uuid | null",
  "cost_usd":     0.04
}
```

### `creative.job_failed`
```json
{
  "job_id":      "uuid",
  "engine":      "string",
  "error":       "Higgsfield error 500: ...",
  "retry_count": 1,
  "retry_after": "ISO8601"
}
```

### `creative.job_dead_lettered`
```json
{
  "job_id":            "uuid",
  "engine":            "string",
  "error":             "string",
  "retries_exhausted": 3,
  "request_id":        "uuid",
  "campaign_id":       "uuid | null"
}
```

### `creative.asset_published`
```json
{
  "asset_id":    "uuid",
  "campaign_id": "uuid",
  "deal_id":     "uuid | null",
  "asset_type":  "string",
  "url":         "https://..."
}
```

---

## 3. Subscription Map — What Listens to What

```
┌──────────────────────────────────────────────────────────────────────────┐
│  EVENT                       │ SUBSCRIBERS                                │
├──────────────────────────────┼────────────────────────────────────────────┤
│ creative.job_queued          │ • UI: CreativeStudio (show "queued" badge) │
│                              │ • FORGE agent (track its own requests)     │
│                              │ • n8n webhook (optional: Slack notify)     │
├──────────────────────────────┼────────────────────────────────────────────┤
│ creative.job_processing      │ • UI: CreativeStudio (show spinner)        │
│                              │ • UI: Agents.jsx (show forge as 'running') │
├──────────────────────────────┼────────────────────────────────────────────┤
│ creative.job_completed       │ • UI: CreativeStudio (show asset preview)  │
│                              │ • HERALD agent (include in daily brief)    │
│                              │ • GTM module (update campaign asset count) │
│                              │ • n8n webhook → campaign automation        │
│                              │ • Copilot (notify user via chat)           │
├──────────────────────────────┼────────────────────────────────────────────┤
│ creative.job_failed          │ • UI: CreativeStudio (show error + retry)  │
│                              │ • SENTINEL (count failures, alert if spike)│
├──────────────────────────────┼────────────────────────────────────────────┤
│ creative.job_dead_lettered   │ • UI: CreativeStudio (error state, manual  │
│                              │       retry button)                        │
│                              │ • SENTINEL (critical alert)                │
│                              │ • n8n webhook → Telegram alert to Roberto  │
├──────────────────────────────┼────────────────────────────────────────────┤
│ creative.asset_published     │ • GTM module (refresh campaign assets)     │
│                              │ • Copilot (tool: query campaign assets)    │
│                              │ • n8n → social scheduling workflow         │
└──────────────────────────────┴────────────────────────────────────────────┘
```

---

## 4. How Events Connect to System Layers

### 4a. UI Updates (React hooks)

```js
// In CreativeStudio.jsx — subscribe to creative job events
const { subscribe } = useEventBus()

useEffect(() => {
  const unsubQueued    = subscribe('creative.job_queued',    handleJobQueued)
  const unsubDone      = subscribe('creative.job_completed', handleJobCompleted)
  const unsubFailed    = subscribe('creative.job_failed',    handleJobFailed)
  const unsubDead      = subscribe('creative.job_dead_lettered', handleDeadLettered)
  return () => { unsubQueued(); unsubDone(); unsubFailed(); unsubDead() }
}, [subscribe])
```

Additionally, `useCreativeJobs` hook (to be built) subscribes to the `creative_jobs` table via `subscribeDebouncedToTable` — the same pattern used in `useAgents.js`. This provides:
- Optimistic updates when a job status changes in the DB
- The event bus provides the instant notification
- The realtime table subscription guarantees consistency

### 4b. n8n Webhook Consumers

n8n is already connected at `https://rotprods.app.n8n.cloud/webhook/architect-os-handoff`.

For creative events, two new webhook paths should be wired (in n8n, create new webhook-trigger workflows):

| Event | n8n webhook path | Workflow action |
|-------|-----------------|-----------------|
| `creative.job_completed` | `/webhook/creative-completed` | Check if asset links to active campaign → trigger social scheduling |
| `creative.job_dead_lettered` | `/webhook/creative-alert` | Send Telegram message to Roberto with job ID + error |

The event_subscriptions table (from `20260317113000_multiagent_orchestration_core.sql`) should have rows for each of these:

```sql
INSERT INTO public.event_subscriptions (name, event_pattern, target_type, target_ref, delivery_mode, retry_limit)
VALUES
  ('creative-completed-n8n', 'creative.job_completed',    'webhook', 'https://rotprods.app.n8n.cloud/webhook/creative-completed', 'async', 3),
  ('creative-dead-letter-alert', 'creative.job_dead_lettered', 'webhook', 'https://rotprods.app.n8n.cloud/webhook/creative-alert', 'async', 5);
```

### 4c. Agent Triggers

**FORGE** agent: when Copilot calls FORGE with a creative brief, FORGE submits a `creative_request` via the `creative-job-processor` edge function. FORGE then subscribes to `creative.job_completed` with the `correlation_id` matching its task, and includes the asset URL in its output study.

**HERALD** agent: on its daily cycle, queries `creative_assets` for assets created in the last 24h, mentions them in the briefing. Also listens to `creative.job_completed` to update its day's summary in real-time.

**SENTINEL** agent: subscribes to `creative.job_failed` and `creative.job_dead_lettered`. Tracks failure rate per engine. If failure rate > 3 in 1 hour, emits `signal.detected` with category `system_health`.

**COPILOT orchestrator**: `creative.job_completed` is one of the event types that can wake Copilot's multi-turn context, allowing it to say "Your video is ready — here it is: [url]" mid-conversation.

### 4d. Campaign Updates

When `creative.asset_published` fires:
1. `campaigns` table `asset_count` column is incremented (via DB trigger or edge function)
2. GTM module (`useEventBus` subscription) refreshes the campaign asset panel
3. If campaign `status = 'pending_assets'` and all required asset_types are now present → auto-advance campaign status to `ready`

---

## 5. Real-Time Update Flow Diagram

```
User clicks "Generate" in CreativeStudio.jsx
       │
       ▼
emitEvent('creative.job_queued', payload)    ← eventBus.js
  │      │
  │      └─► INSERT into event_log
  │               │
  │               └─► pg_notify('oculops:events', row)      [DB trigger]
  │                        │
  │                        └─► Supabase Realtime broadcast
  │                                 │
  │                                 └─► useEventBus listeners in all tabs
  │
  └─► Supabase channel.send(broadcast)       [instant, parallel path]
           │
           └─► Same useEventBus listeners (instant, before DB confirm)

                         ──────────

Edge function processes job
  │
  ├─► UPDATE creative_jobs SET status = 'processing'
  │         │
  │         └─► Supabase Realtime (table change) → useCreativeJobs refreshes
  │
  ├─► emitSystemEvent('creative.job_processing')  → event_log → pg_notify → broadcast
  │
  └─► [async] Poll cycle advances job...
           │
           └─► UPDATE creative_jobs SET status = 'completed', output_url = '...'
                     │
                     ├─► Supabase Realtime → CreativeStudio shows preview
                     │
                     └─► emitSystemEvent('creative.job_completed')
                               │
                               ├─► useEventBus → UI toast notification
                               ├─► event_deliveries → n8n webhook dispatch
                               └─► HERALD / SENTINEL subscriptions
```

---

## 6. Event Registration in `event_subscriptions`

Full set of creative event subscriptions to seed:

```sql
INSERT INTO public.event_subscriptions
  (name, event_pattern, target_type, target_ref, delivery_mode, retry_limit, timeout_ms, config)
VALUES
  -- UI real-time (handled by Supabase broadcast directly, no DB subscription needed)

  -- n8n webhooks
  (
    'creative-completed-campaign-automation',
    'creative.job_completed',
    'webhook',
    'https://rotprods.app.n8n.cloud/webhook/creative-completed',
    'async', 3, 10000,
    '{"filter": {"campaign_id": "not_null"}}'
  ),
  (
    'creative-dead-letter-telegram-alert',
    'creative.job_dead_lettered',
    'webhook',
    'https://rotprods.app.n8n.cloud/webhook/creative-alert',
    'async', 5, 10000,
    '{}'
  ),

  -- Agent triggers
  (
    'creative-completed-herald-briefing',
    'creative.job_completed',
    'agent',
    'herald',
    'async', 1, 5000,
    '{"skip_telegram": true}'
  ),
  (
    'creative-failed-sentinel-monitor',
    'creative.job_failed',
    'agent',
    'sentinel',
    'async', 1, 5000,
    '{}'
  ),
  (
    'creative-dead-lettered-sentinel-alert',
    'creative.job_dead_lettered',
    'agent',
    'sentinel',
    'async', 2, 5000,
    '{}'
  );
```
