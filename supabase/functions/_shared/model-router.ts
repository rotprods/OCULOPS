/**
 * OCULOPS — Model Router
 *
 * Centralised model-routing layer that enforces the locked policy:
 *   "hybrid with local-first preference"
 *
 * Routing rules:
 *   1. If Ollama (local) is reachable AND the requested model class is
 *      available locally → route to local Ollama.
 *   2. If local is unreachable or the model class is cloud-only
 *      (e.g. gpt-4o, claude-3.5) → route to the cloud provider.
 *   3. Every call records provider, model, and lane in the returned metadata
 *      so billing and audit can track it.
 *
 * Usage:
 *   import { chatCompletion, MODEL_POLICY } from "../_shared/model-router.ts";
 *   const result = await chatCompletion({ messages, model: "auto" });
 */

// ─── Policy & Config ──────────────────────────────────────────────────────────

export const MODEL_POLICY = "hybrid_with_local_first_preference" as const;

/** Lane labels for audit trails */
export type ModelLane = "lane_1_local" | "lane_2_cloud" | "lane_3_fallback";

interface ModelRoute {
  provider: "ollama" | "openai" | "anthropic";
  model: string;
  baseUrl: string;
  lane: ModelLane;
  authHeader?: Record<string, string>;
}

/** Local Ollama models available on the Mac Mini */
const LOCAL_MODELS: Record<string, string> = {
  "auto": "qwen3:8b",
  "local": "qwen3:8b",
  "qwen3:8b": "qwen3:8b",
  "deepseek-coder-v2": "deepseek-coder-v2",
  "llama3": "llama3",
};

const OLLAMA_BASE = () => Deno.env.get("OLLAMA_BASE_URL") || "http://127.0.0.1:11434";
const OPENAI_KEY = () => Deno.env.get("OPENAI_API_KEY") || "";

// ─── Ollama health check (cached for 60s) ─────────────────────────────────────

let _ollamaAlive: boolean | null = null;
let _ollamaCheckedAt = 0;
const OLLAMA_CHECK_TTL_MS = 60_000;

async function isOllamaReachable(): Promise<boolean> {
  if (_ollamaAlive !== null && Date.now() - _ollamaCheckedAt < OLLAMA_CHECK_TTL_MS) {
    return _ollamaAlive;
  }
  try {
    const res = await fetch(`${OLLAMA_BASE()}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    _ollamaAlive = res.ok;
  } catch {
    _ollamaAlive = false;
  }
  _ollamaCheckedAt = Date.now();
  return _ollamaAlive;
}

// ─── Route resolver ───────────────────────────────────────────────────────────

async function resolveRoute(requestedModel: string): Promise<ModelRoute> {
  const normModel = requestedModel.toLowerCase().trim();

  // 1. If model is local-eligible, try Ollama first
  if (normModel in LOCAL_MODELS) {
    const ollamaUp = await isOllamaReachable();
    if (ollamaUp) {
      return {
        provider: "ollama",
        model: LOCAL_MODELS[normModel],
        baseUrl: OLLAMA_BASE(),
        lane: "lane_1_local",
      };
    }
  }

  // 2. Cloud fallback or explicit cloud model
  const key = OPENAI_KEY();
  if (!key) {
    throw new Error("MODEL_ROUTER: no local Ollama and no OPENAI_API_KEY — cannot serve request");
  }

  // Map common model names to their cloud equivalents
  const cloudModel = (normModel === "auto" || normModel === "local")
    ? "gpt-4o-mini"
    : normModel;

  return {
    provider: "openai",
    model: cloudModel,
    baseUrl: "https://api.openai.com",
    lane: normModel in LOCAL_MODELS ? "lane_3_fallback" : "lane_2_cloud",
    authHeader: { Authorization: `Bearer ${key}` },
  };
}

// ─── Public: chatCompletion ───────────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: unknown[];
  tool_call_id?: string;
}

export interface ChatCompletionInput {
  messages: ChatMessage[];
  model?: string;
  tools?: unknown[];
  tool_choice?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatCompletionOutput {
  ok: boolean;
  message: { role: string; content: string | null; tool_calls?: unknown[] } | null;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  meta: {
    provider: string;
    model: string;
    lane: ModelLane;
    policy: typeof MODEL_POLICY;
    latency_ms: number;
  };
  raw?: unknown;
}

export async function chatCompletion(input: ChatCompletionInput): Promise<ChatCompletionOutput> {
  const { messages, model = "auto", tools, tool_choice, max_tokens = 2000, temperature } = input;
  const route = await resolveRoute(model);
  const t0 = Date.now();

  if (route.provider === "ollama") {
    return await ollamaChat(route, messages, max_tokens, temperature, t0);
  }

  // OpenAI-compatible cloud call
  const body: Record<string, unknown> = {
    model: route.model,
    messages,
    max_tokens,
  };
  if (tools?.length) body.tools = tools;
  if (tool_choice) body.tool_choice = tool_choice;
  if (temperature !== undefined) body.temperature = temperature;

  const res = await fetch(`${route.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { ...route.authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const latency_ms = Date.now() - t0;

  if (!res.ok) {
    return {
      ok: false,
      message: null,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      meta: { provider: route.provider, model: route.model, lane: route.lane, policy: MODEL_POLICY, latency_ms },
    };
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message || null;
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  return {
    ok: true,
    message: msg,
    usage,
    meta: { provider: route.provider, model: route.model, lane: route.lane, policy: MODEL_POLICY, latency_ms },
    raw: data,
  };
}

// ─── Ollama adapter ───────────────────────────────────────────────────────────

async function ollamaChat(
  route: ModelRoute,
  messages: ChatMessage[],
  max_tokens: number,
  temperature: number | undefined,
  t0: number,
): Promise<ChatCompletionOutput> {
  const body: Record<string, unknown> = {
    model: route.model,
    messages: messages.map((m) => ({ role: m.role, content: m.content || "" })),
    stream: false,
    options: {
      num_predict: max_tokens,
      ...(temperature !== undefined ? { temperature } : {}),
    },
  };

  try {
    const res = await fetch(`${route.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    const latency_ms = Date.now() - t0;

    if (!res.ok) {
      return {
        ok: false,
        message: null,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        meta: { provider: "ollama", model: route.model, lane: route.lane, policy: MODEL_POLICY, latency_ms },
      };
    }

    const data = await res.json();
    return {
      ok: true,
      message: { role: "assistant", content: data.message?.content || "" },
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      meta: { provider: "ollama", model: route.model, lane: route.lane, policy: MODEL_POLICY, latency_ms },
      raw: data,
    };
  } catch {
    // Ollama failed — invalidate cache
    _ollamaAlive = null;
    return {
      ok: false,
      message: null,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      meta: { provider: "ollama", model: route.model, lane: route.lane, policy: MODEL_POLICY, latency_ms: Date.now() - t0 },
    };
  }
}

// ─── Simple text generation (non-tool) helper ─────────────────────────────────

export async function generateText(
  prompt: string,
  opts: { model?: string; systemPrompt?: string; maxTokens?: number; temperature?: number } = {},
): Promise<{ ok: boolean; text: string; meta: ChatCompletionOutput["meta"] }> {
  const messages: ChatMessage[] = [];
  if (opts.systemPrompt) messages.push({ role: "system", content: opts.systemPrompt });
  messages.push({ role: "user", content: prompt });

  const result = await chatCompletion({
    messages,
    model: opts.model || "auto",
    max_tokens: opts.maxTokens || 800,
    temperature: opts.temperature,
  });

  return {
    ok: result.ok,
    text: result.message?.content || "",
    meta: result.meta,
  };
}
