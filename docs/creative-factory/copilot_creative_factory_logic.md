# Copilot — Creative Factory Integration Logic
> OCULOPS | Agent 4: UI/UX Designer + Frontend Engineer
> Authored: 2026-03-11 | Status: DESIGN SPEC — not yet implemented

---

## 0. Context: How Copilot Tool Calling Works Today

`CopilotChat.jsx` sends messages to the `agent-copilot` edge function via `useEdgeFunction('agent-copilot')`. The edge function maintains a multi-turn loop (max 5 rounds) using OpenAI function calling. Tools are defined in `agent-copilot/index.ts` as a `tools` array in the OpenAI API call. When OpenAI returns a `tool_calls` message, the edge function executes the tool, collects the result, and feeds it back into the next round.

The front-end receives:
```json
{
  "response": "Natural language summary",
  "tools_executed": [{ "tool": "tool_name", "success": true, "error": null }],
  "actions": [{ "type": "navigate", "payload": { "path": "/creative-factory", "label": "CREATIVE FACTORY" } }]
}
```

`CopilotChat.jsx` renders `ToolBadge` components for each entry in `tools_executed` and handles `actions` (currently only `navigate` type). The `TOOL_LABELS` map in `CopilotChat.jsx` must be extended with the 5 new tools.

**What this document specifies:**
1. Five new Copilot tools with exact OpenAI function calling schemas
2. How each tool maps to edge function calls or Supabase operations
3. `TOOL_LABELS` extension entries for `CopilotChat.jsx`
4. Example conversations showing end-to-end flows
5. How results surface back in chat
6. New `actions` types beyond `navigate`

---

## 1. New Tools — Summary Table

| Tool name | What it does | Async? | Result in chat |
|-----------|-------------|--------|----------------|
| `generate_creative` | Creates a new creative job (image/video/copy) | Yes (job queued, result polled) | Job ID + status + nav to factory |
| `create_content_pack` | Queues multiple jobs for a campaign at once | Yes | Pack summary + nav to factory |
| `repurpose_asset` | Creates format variants of an existing asset | Yes | Variant job IDs + nav to lab |
| `get_creative_status` | Returns current status of a job or asset | No (read) | Status report inline in chat |
| `list_campaign_assets` | Lists all assets linked to a campaign | No (read) | Asset count + summary list inline |

---

## 2. Tool Definitions — OpenAI Function Calling Spec

These are the exact objects to add to the `tools` array in `agent-copilot/index.ts`.

### 2.1 `generate_creative`

```json
{
  "type": "function",
  "function": {
    "name": "generate_creative",
    "description": "Creates a new creative asset generation job in the Creative Factory. Use this when the user asks to generate, create, or produce an image, video, or copy/text asset. The job is queued asynchronously — the tool returns a job_id immediately, not the final asset. After calling this tool, navigate the user to the Creative Factory so they can monitor the job queue.",
    "parameters": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["image", "video", "copy"],
          "description": "The type of creative asset to generate. Use 'image' for static visuals, 'video' for motion content, 'copy' for text/written content."
        },
        "prompt": {
          "type": "string",
          "description": "The creative prompt or directive. Be specific: include style, tone, dimensions context, subject matter, and any negative constraints. For copy assets, describe the format, tone, channel, and key messages."
        },
        "engine": {
          "type": "string",
          "enum": ["banana", "dalle3", "flux", "veo3", "higgsfield", "gpt4o", "claude"],
          "description": "The AI engine to use. 'banana' = Nano Banana (fast, cheap image). 'dalle3' = DALL-E 3 (high quality image). 'flux' = Flux Pro (stylized image). 'veo3' = Veo 3 (Google video). 'higgsfield' = Higgsfield (character video). 'gpt4o' = GPT-4o (copy/text). 'claude' = Claude (long-form copy). If omitted, the system selects the best engine for the asset type."
        },
        "campaign_id": {
          "type": "string",
          "description": "Optional. The UUID of the deal or campaign this asset is being created for. Retrieve the campaign_id first using query_data if you don't have it."
        }
      },
      "required": ["type", "prompt"]
    }
  }
}
```

### 2.2 `create_content_pack`

```json
{
  "type": "function",
  "function": {
    "name": "create_content_pack",
    "description": "Creates a full content pack for a campaign by queuing multiple creative jobs at once across different formats. Use this when the user asks for 'a full pack', 'all formats', or 'content for the campaign'. Each format generates a separate job. Returns a pack_id that groups all jobs.",
    "parameters": {
      "type": "object",
      "properties": {
        "campaign_id": {
          "type": "string",
          "description": "The UUID of the campaign or deal this content pack is for. Required."
        },
        "base_prompt": {
          "type": "string",
          "description": "The creative concept or prompt that will be adapted for each format. The system will suffix format-specific instructions automatically."
        },
        "formats": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "image_social",
              "image_banner",
              "video_short",
              "video_story",
              "copy_post",
              "copy_email",
              "copy_ad"
            ]
          },
          "description": "List of content formats to generate. 'image_social' = square/landscape for social. 'image_banner' = wide banner. 'video_short' = 15-30s clip. 'video_story' = 9:16 story format. 'copy_post' = social media post. 'copy_email' = email body. 'copy_ad' = ad copy with CTA."
        }
      },
      "required": ["campaign_id", "base_prompt", "formats"]
    }
  }
}
```

### 2.3 `repurpose_asset`

```json
{
  "type": "function",
  "function": {
    "name": "repurpose_asset",
    "description": "Takes an existing creative asset and generates format-adapted variants of it for different platforms. Use this when the user asks to 'repurpose', 'adapt', 'resize', 'convert', or 'make versions of' an existing asset. After calling, navigate the user to the Repurpose Lab.",
    "parameters": {
      "type": "object",
      "properties": {
        "asset_id": {
          "type": "string",
          "description": "The UUID of the source creative asset to repurpose. Use list_campaign_assets or get_creative_status to find asset IDs if not provided."
        },
        "target_formats": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "tiktok_9_16",
              "reels_9_16",
              "stories_9_16",
              "linkedin_1_1",
              "twitter_2_1",
              "email_banner_3_1",
              "blog_header_16_9",
              "youtube_thumb_16_9"
            ]
          },
          "description": "List of target format identifiers. Each maps to specific dimensions and platform optimization."
        }
      },
      "required": ["asset_id", "target_formats"]
    }
  }
}
```

### 2.4 `get_creative_status`

```json
{
  "type": "function",
  "function": {
    "name": "get_creative_status",
    "description": "Returns the current status of a specific creative job or asset. Use this when the user asks 'what happened to the image I generated', 'is my video ready', 'check the status of job X', or anything implying they want to track a specific generation task.",
    "parameters": {
      "type": "object",
      "properties": {
        "job_id": {
          "type": "string",
          "description": "The UUID of the creative_jobs row. Preferred lookup method."
        },
        "asset_id": {
          "type": "string",
          "description": "The UUID of the creative_assets row. Use if job_id is not known."
        }
      },
      "required": []
    }
  }
}
```

**Implementation note:** At least one of `job_id` or `asset_id` must be provided at runtime. The edge function should validate and return an error if both are absent.

### 2.5 `list_campaign_assets`

```json
{
  "type": "function",
  "function": {
    "name": "list_campaign_assets",
    "description": "Returns a list of all creative assets linked to a specific campaign or deal. Use this when the user asks 'what have we created for client X', 'show me all assets for this campaign', 'how many images do we have for deal Y', or wants to pick an asset to repurpose.",
    "parameters": {
      "type": "object",
      "properties": {
        "campaign_id": {
          "type": "string",
          "description": "The UUID of the campaign or deal. Required."
        },
        "type_filter": {
          "type": "string",
          "enum": ["all", "image", "video", "copy"],
          "description": "Optional. Filter by asset type. Defaults to 'all'."
        },
        "status_filter": {
          "type": "string",
          "enum": ["ready", "all", "failed"],
          "description": "Optional. Filter by status. Defaults to 'ready'."
        },
        "limit": {
          "type": "integer",
          "description": "Optional. Maximum assets to return. Defaults to 10."
        }
      },
      "required": ["campaign_id"]
    }
  }
}
```

---

## 3. `TOOL_LABELS` Extension for `CopilotChat.jsx`

Add these entries to the `TOOL_LABELS` object in `CopilotChat.jsx` (the existing map that drives `ToolBadge` rendering):

```js
// Add to existing TOOL_LABELS object in CopilotChat.jsx:
generate_creative:     { icon: '🎨', label: 'GENERATE CREATIVE' },
create_content_pack:   { icon: '📦', label: 'CONTENT PACK' },
repurpose_asset:       { icon: '🔄', label: 'REPURPOSE ASSET' },
get_creative_status:   { icon: '📡', label: 'CREATIVE STATUS' },
list_campaign_assets:  { icon: '🗂️', label: 'CAMPAIGN ASSETS' },
```

---

## 4. Edge Function Execution — Tool → Backend Mapping

Each tool call in the Copilot loop calls a specific edge function or Supabase query. These are executed inside `agent-copilot/index.ts` in the tool dispatch switch/case.

### Tool: `generate_creative`

```
Copilot receives tool_call: generate_creative({ type, prompt, engine?, campaign_id? })
        │
        ▼
agent-copilot calls: supabase.functions.invoke('creative-request', {
  body: { type, prompt, engine, campaign_id, source: 'copilot' }
})
        │
        ▼
creative-request fn:
  1. Validates params
  2. Inserts creative_requests row
  3. Inserts creative_jobs row (status='queued')
  4. emitEvent('creative.job_queued', { job_id, type, engine, campaign_id })
  5. Returns: { request_id, job_id, status: 'queued' }
        │
        ▼
agent-copilot returns tool result to OpenAI:
{
  "tool_call_id": "...",
  "role": "tool",
  "content": "{\"job_id\": \"...\", \"status\": \"queued\", \"message\": \"Job queued successfully\"}"
}
        │
        ▼
OpenAI generates final response + agent-copilot appends action:
{
  "response": "Job queued. I've sent a [type] generation request to [engine]. Head to the Creative Factory to monitor progress.",
  "tools_executed": [{ "tool": "generate_creative", "success": true }],
  "actions": [{ "type": "navigate", "payload": { "path": "/creative-factory", "label": "CREATIVE FACTORY" } }]
}
```

### Tool: `create_content_pack`

```
agent-copilot calls: supabase.functions.invoke('creative-request', {
  body: {
    mode: 'pack',
    campaign_id,
    base_prompt,
    formats,
    source: 'copilot'
  }
})
        │
        ▼
creative-request fn (pack mode):
  1. Validates campaign_id exists in deals table
  2. For each format in formats[]:
     a. Derives type (image/video/copy) from format string
     b. Derives engine from format (sensible defaults)
     c. Appends format-specific suffix to base_prompt
     d. Inserts creative_requests row
     e. Inserts creative_jobs row
  3. Inserts creative_packs row linking all job_ids (pack_id)
  4. Returns: { pack_id, job_ids: [...], count: N }
        │
        ▼
agent-copilot returns to OpenAI:
{
  "pack_id": "...",
  "job_count": 5,
  "jobs": [{ "job_id": "...", "format": "image_social", "engine": "banana" }, ...]
}
        │
OpenAI response:
"Content pack created with 5 jobs for [campaign name]. All queued: 2 images, 1 video, 2 copy pieces. Navigating to Creative Factory."
actions: [{ type: "navigate", path: "/creative-factory" }]
```

### Tool: `repurpose_asset`

```
agent-copilot calls: supabase.functions.invoke('creative-repurpose', {
  body: { asset_id, target_formats, source: 'copilot' }
})
        │
        ▼
creative-repurpose fn:
  1. Fetches source asset from creative_assets (validates exists + status='ready')
  2. For each target_format:
     a. Inserts asset_variants row (status='queued')
     b. Calls engine adapter with format-specific resize/crop params
  3. Returns: { variant_job_ids: [...], source_asset_id, format_count: N }
        │
        ▼
agent-copilot appends action:
{
  "type": "set_creative_lab_source",
  "payload": { "asset_id": "...", "thumb_url": "...", "prompt": "..." }
}
+ navigate action: /creative-factory (lab view)
```

### Tool: `get_creative_status`

```
agent-copilot queries Supabase directly (no edge function needed — read-only):
  supabase
    .from('creative_jobs')
    .select('id, type, engine, status, progress, url, thumb_url, error, created_at')
    .eq('id', job_id)
    .single()
        │
        ▼
Returns job row as tool result JSON
        │
OpenAI generates inline status report:
"Your image job (ID: a3f2) is [status]. [If ready: The asset is ready — head to Creative Factory to view it. If processing: currently 47% complete. If failed: It failed with error 'rate limit exceeded' — want me to retry it?]"
No navigate action (user is asking for info — let them choose to navigate)
```

### Tool: `list_campaign_assets`

```
agent-copilot queries Supabase:
  supabase
    .from('creative_assets')
    .select('id, type, engine, status, thumb_url, created_at, creative_jobs(prompt)')
    .eq('campaign_id', campaign_id)
    .eq('status', status_filter || 'ready')
    .eq(type_filter !== 'all' ? 'type' : 'id', ...)  -- conditional filter
    .order('created_at', { ascending: false })
    .limit(limit || 10)
        │
        ▼
Returns asset list as tool result JSON
        │
OpenAI generates summary:
"Campaign [name] has [N] ready assets: [X] images (most recent: 'minimalist clinic...'), [Y] videos, [Z] copy pieces.
The most recent asset ID is [id] — do you want to repurpose it?"
No automatic navigate — this is a discovery/query call.
```

---

## 5. New `actions` Type: `set_creative_lab_source`

The existing Copilot `actions` array only handles `navigate`. A new action type is needed to pre-fill the Repurpose Lab source when the Copilot triggers `repurpose_asset`.

**Edge function response addition (agent-copilot):**
```json
{
  "actions": [
    {
      "type": "set_creative_lab_source",
      "payload": {
        "asset_id": "uuid",
        "thumb_url": "https://...",
        "prompt": "The original prompt text"
      }
    },
    {
      "type": "navigate",
      "payload": {
        "path": "/creative-factory",
        "label": "CREATIVE FACTORY — LAB"
      }
    }
  ]
}
```

**`CopilotChat.jsx` action handler addition** (in the `result.actions` loop):
```js
// Add inside the for..of result.actions loop in handleSend():
if (action.type === 'set_creative_lab_source' && action.payload) {
  useCreativeStore.getState().setLabSource({
    assetId: action.payload.asset_id,
    jobId: null,
    url: action.payload.thumb_url,
    thumbUrl: action.payload.thumb_url,
    prompt: action.payload.prompt,
  })
  useCreativeStore.getState().setActiveView('lab')
}
```

This action should be processed **before** the `navigate` action so that by the time the module renders, the `labSource` is already in the store.

---

## 6. Copilot Quick Actions Extension

The `quickActions` array in `CopilotChat.jsx` should include 2 new creative quick actions:

```js
{ label: 'GENERATE ASSET', cmd: 'Genera una imagen para la campaña activa, estilo profesional, colores de marca' },
{ label: 'CONTENT PACK', cmd: 'Crea un pack completo de contenido para el último deal del pipeline' },
```

These appear in the quick action row alongside the existing PIPELINE STATUS, FULL SCAN, DAILY BRIEFING, HEALTH CHECK buttons.

---

## 7. Example Copilot Conversations

### 7.1 Simple Image Generation

```
User: Genera una imagen de una clínica dental moderna, exterior, luz de tarde

Copilot (thinking): tool_call → generate_creative({
  type: "image",
  prompt: "Modern dental clinic exterior, afternoon golden hour light, photorealistic, 16:9, architectural photography style",
  engine: "dalle3"
})

creative-request fn: inserts job → returns { job_id: "j_a3f2" }

Copilot response:
  "Trabajo en cola. He enviado la petición a DALL-E 3 con tu descripción adaptada.
   El job ID es j_a3f2. Navegando a Creative Factory para que puedas seguir el progreso."

  ToolBadge: 🎨 GENERATE CREATIVE · OK
  Action: navigate → /creative-factory
```

### 7.2 Content Pack for a Campaign

```
User: Crea un pack completo para Clínica Dental Q1: imagen para Instagram, vídeo corto y un copy para email

Copilot (thinking):
  Round 1: tool_call → query_data({ table: "deals", filter: "name ilike '%clinica dental%'" })
  Result: { id: "deal_456", name: "Clinica Dental Q1" }

  Round 2: tool_call → create_content_pack({
    campaign_id: "deal_456",
    base_prompt: "Professional dental clinic branding, clean minimalist style, trustworthy, warm tones",
    formats: ["image_social", "video_short", "copy_email"]
  })
  Result: { pack_id: "pack_789", job_count: 3 }

Copilot response:
  "Pack de contenido creado para Clínica Dental Q1 con 3 trabajos:
   - Imagen Instagram (Nano Banana) · QUEUED
   - Vídeo corto 15s (Veo 3) · QUEUED
   - Copy email (GPT-4o) · QUEUED

   Navegando a Creative Factory para monitorizar el progreso."

  ToolBadges: 🔍 QUERY DATA · OK  |  📦 CONTENT PACK · OK
  Action: navigate → /creative-factory
```

### 7.3 Status Check on a Job

```
User: ¿Cómo va el vídeo de la clínica?

Copilot (thinking):
  Round 1: tool_call → query_data({
    table: "creative_jobs",
    filter: "type=video AND created_at > now()-interval '7 days'",
    limit: 5
  })
  Result: [{ id: "j_b7c1", status: "processing", progress: 47, engine: "veo3" }]

  Round 2: tool_call → get_creative_status({ job_id: "j_b7c1" })
  Result: { id: "j_b7c1", status: "processing", progress: 47, engine: "veo3", created_at: "..." }

Copilot response:
  "Tu vídeo de Veo 3 (job j_b7c1) está al 47% de procesamiento.
   Lleva en cola desde hace 4 minutos. Los vídeos de Veo 3 suelen tardar
   entre 8 y 15 minutos. ¿Quieres que te avise cuando esté listo?"

  ToolBadges: 🔍 QUERY DATA · OK  |  📡 CREATIVE STATUS · OK
  No navigation action (informational response)
```

### 7.4 Repurpose an Asset Across Formats

```
User: Coge la imagen de la clínica que generamos antes y hazla para TikTok y Reels

Copilot (thinking):
  Round 1: tool_call → list_campaign_assets({ campaign_id: "deal_456", type_filter: "image", limit: 3 })
  Result: [{ id: "asset_001", thumb_url: "...", status: "ready", ... }]

  Round 2: tool_call → repurpose_asset({
    asset_id: "asset_001",
    target_formats: ["tiktok_9_16", "reels_9_16"]
  })
  Result: { variant_job_ids: ["vj_x1", "vj_x2"], format_count: 2 }

Copilot response:
  "Perfecto. He iniciado 2 variantes de la imagen de la clínica:
   - TikTok 9:16 · QUEUED
   - Reels 9:16 · QUEUED

   Navegando al Repurpose Lab para que sigas el progreso."

  ToolBadges: 🗂️ CAMPAIGN ASSETS · OK  |  🔄 REPURPOSE ASSET · OK
  Actions:
    set_creative_lab_source → { asset_id: "asset_001", thumb_url: "...", prompt: "..." }
    navigate → /creative-factory (lab view active)
```

### 7.5 List Assets Before Choosing One to Repurpose

```
User: ¿Qué imágenes tenemos listas para Meta Ads?

Copilot (thinking):
  Round 1: tool_call → query_data({ table: "deals", filter: "name ilike '%meta ads%'" })
  Result: { id: "deal_789", name: "Campana Meta Ads" }

  Round 2: tool_call → list_campaign_assets({
    campaign_id: "deal_789",
    type_filter: "image",
    status_filter: "ready",
    limit: 10
  })
  Result: [
    { id: "asset_a", prompt: "Instagram ad, minimalist product...", created_at: "..." },
    { id: "asset_b", prompt: "Facebook banner, blue tones...", created_at: "..." }
  ]

Copilot response:
  "Para la campaña Meta Ads tienes 2 imágenes listas:
   1. asset_a — 'Instagram ad, minimalist product...' (hace 2 días)
   2. asset_b — 'Facebook banner, blue tones...' (hace 3 días)

   ¿Quieres que reproponga alguna de ellas para Stories o TikTok?"

  ToolBadges: 🔍 QUERY DATA · OK  |  🗂️ CAMPAIGN ASSETS · OK
  No navigation (conversation continues)
```

---

## 8. Edge Function Implementation Notes

### New edge functions required

| Function | Trigger | Description |
|----------|---------|-------------|
| `creative-request` | Copilot tool + UI button | Validates + inserts creative_requests + creative_jobs. Handles both single and pack modes. |
| `creative-repurpose` | Copilot tool + UI button | Fetches source asset, creates asset_variants rows, calls engine adapters. |

Both functions follow the existing pattern in `_shared/agents.ts` using `callApi()` for external engine calls and `supabaseServiceRole` for DB writes.

### `agent-copilot` modifications required

In `agent-copilot/index.ts`:
1. Add 5 new tool definitions to the `tools` array passed to OpenAI
2. Add 5 new cases to the tool dispatch switch statement
3. Add `set_creative_lab_source` action builder in the action construction logic

### Supabase direct queries (no edge fn)

`get_creative_status` and `list_campaign_assets` can be implemented as direct Supabase client queries inside `agent-copilot` using the service role key, since they are read-only and don't need the validation/persistence logic of a full edge function.

---

## 9. Result Surfacing in Chat

### Inline asset preview in chat (future enhancement)

For `get_creative_status` when status is `completed`, the Copilot response message can include the `thumb_url` in a structured response marker that `CopilotChat.jsx` renders as an inline thumbnail:

```
// In CopilotChat.jsx message renderer, check for metadata on assistant messages:
if (msg.creative_asset) {
  render: <img src={msg.creative_asset.thumb_url} className="copilot-inline-thumb" />
}
```

The edge function would add this to the response object:
```json
{
  "response": "Tu imagen está lista.",
  "tools_executed": [...],
  "creative_asset": {
    "thumb_url": "https://...",
    "asset_id": "asset_001",
    "type": "image"
  }
}
```

This is a Phase 2 enhancement — Phase 1 is text-only response + navigate action.

### Tool badge coloring

Existing pattern in `ToolBadge`:
- `success: true` → gold border + "OK" in gold
- `error: string` → danger border + "ERR" in red
- Default → subtle border, no status suffix

Creative tools follow the same pattern. No special styling needed.
