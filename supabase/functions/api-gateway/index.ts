import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";

// ═══════════════════════════════════════════════════
// API Configuration Map
// Each entry: base URL, auth method, env variable name
// ═══════════════════════════════════════════════════

interface ApiConfig {
    base: string;
    authType: "bearer" | "query-param" | "basic" | "custom-header" | "none";
    envKey: string;
    envFallbackKeys?: string[];
    paramName?: string;       // for query-param auth
    headerName?: string;      // for custom-header auth
    extraHeaders?: Record<string, string>;
}

const API_CONFIGS: Record<string, ApiConfig> = {
    // ── CRM & Sales ──
    "hubspot": { base: "https://api.hubapi.com", authType: "bearer", envKey: "HUBSPOT_API_KEY" },
    "stripe": { base: "https://api.stripe.com/v1", authType: "bearer", envKey: "STRIPE_API_KEY" },

    // ── Dev Platforms ──
    "github": { base: "https://api.github.com", authType: "bearer", envKey: "GITHUB_TOKEN" },
    "gitlab": { base: "https://gitlab.com/api/v4", authType: "custom-header", envKey: "GITLAB_TOKEN", headerName: "PRIVATE-TOKEN" },
    "sentry": { base: "https://sentry.io/api/0", authType: "bearer", envKey: "SENTRY_AUTH_TOKEN" },
    "linear": { base: "https://api.linear.app", authType: "bearer", envKey: "LINEAR_API_KEY" },
    "vercel": { base: "https://api.vercel.com", authType: "bearer", envKey: "VERCEL_TOKEN" },

    // ── Productivity ──
    "notion": { base: "https://api.notion.com/v1", authType: "bearer", envKey: "NOTION_API_KEY", extraHeaders: { "Notion-Version": "2022-06-28" } },
    "todoist": { base: "https://api.todoist.com/rest/v2", authType: "bearer", envKey: "TODOIST_API_TOKEN" },
    "trello": { base: "https://api.trello.com/1", authType: "query-param", envKey: "TRELLO_API_KEY", paramName: "key" },
    "airtable": { base: "https://api.airtable.com/v0", authType: "bearer", envKey: "AIRTABLE_API_KEY" },
    "google-tasks": { base: "https://tasks.googleapis.com/tasks/v1", authType: "bearer", envKey: "GOOGLE_TASKS_TOKEN" },

    // ── Communication ──
    "slack": { base: "https://slack.com/api", authType: "bearer", envKey: "SLACK_BOT_TOKEN" },
    "resend": { base: "https://api.resend.com", authType: "bearer", envKey: "RESEND_API_KEY" },

    // ── Search & Maps ──
    "brave-search": { base: "https://api.search.brave.com/res/v1", authType: "custom-header", envKey: "BRAVE_API_KEY", headerName: "X-Subscription-Token" },
    "google-maps": { base: "https://maps.googleapis.com/maps/api", authType: "query-param", envKey: "GOOGLE_MAPS_KEY", paramName: "key" },

    // ── Cloud & DevOps ──
    "cloudflare": { base: "https://api.cloudflare.com/client/v4", authType: "bearer", envKey: "CLOUDFLARE_API_TOKEN" },

    // ── Data & Finance ──
    "alphavantage": { base: "https://www.alphavantage.co", authType: "query-param", envKey: "ALPHAVANTAGE_KEY", envFallbackKeys: ["ALPHA_VANTAGE_KEY"], paramName: "apikey" },

    // ── Storage ──
    "dropbox": { base: "https://api.dropboxapi.com/2", authType: "bearer", envKey: "DROPBOX_TOKEN" },

    // ── AI & Media ──
    "everart": { base: "https://api.everart.ai/v1", authType: "bearer", envKey: "EVERART_API_KEY" },

    // ── AI & Models ──
    "openai": { base: "https://api.openai.com/v1", authType: "bearer", envKey: "OPENAI_API_KEY" },
    "anthropic": { base: "https://api.anthropic.com/v1", authType: "custom-header", envKey: "ANTHROPIC_API_KEY", headerName: "x-api-key", extraHeaders: { "anthropic-version": "2023-06-01" } },
    "higgsfield": { base: "https://api.higgsfield.ai/v1", authType: "bearer", envKey: "HIGGSFIELD_API_SECRET" },

    // ── Social & Advertising ──
    "meta": { base: "https://graph.facebook.com/v22.0", authType: "bearer", envKey: "META_ACCESS_TOKEN" },
    "tiktok": { base: "https://business-api.tiktok.com/open_api/v1.3", authType: "custom-header", envKey: "TIKTOK_ACCESS_TOKEN", headerName: "Access-Token" },

    // ── Messaging & Chatbots ──
    "whatsapp": { base: "https://graph.facebook.com/v22.0", authType: "bearer", envKey: "WHATSAPP_TOKEN" },
    "manychat": { base: "https://api.manychat.com/fb", authType: "bearer", envKey: "MANYCHAT_API_KEY" },
    "telegram": { base: "https://api.telegram.org", authType: "none", envKey: "TELEGRAM_BOT_TOKEN" }, // Requires `/bot<token>` in endpoint

    // ── Workflows & Automation ──
    "n8n": { base: "https://rotprods.app.n8n.cloud/api/v1", authType: "custom-header", envKey: "N8N_API_KEY", headerName: "X-N8N-API-KEY" },

    // ── Analytics ──
    "posthog": { base: "https://us.i.posthog.com", authType: "bearer", envKey: "POSTHOG_API_KEY" },

    // ── Scraping ──
    "apify": { base: "https://api.apify.com/v2", authType: "bearer", envKey: "APIFY_TOKEN" },
};

// ═══════════════════════════════════════════════════
// Gateway Handler
// ═══════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
    const cors = handleCors(req);
    if (cors) return cors;

    if (req.method !== "POST") {
        return errorResponse("Method not allowed", 405);
    }

    const body = await readJson<{
        agent: string;
        api: string;
        endpoint: string;
        method?: string;
        params?: Record<string, string>;
        body?: unknown;
    }>(req);

    const { agent, api, endpoint, method = "GET", params = {}, body: reqBody } = body;

    if (!agent || !api || !endpoint) {
        return errorResponse("Missing required fields: agent, api, endpoint", 400);
    }

    // ── 1. Check permissions ──
    const { data: agentRow, error: agentError } = await admin
        .from("agent_registry")
        .select("code_name, allowed_apis")
        .eq("code_name", agent)
        .maybeSingle();

    if (agentError || !agentRow) {
        return errorResponse(`Agent '${agent}' not found`, 404);
    }

    const allowedApis: string[] = agentRow.allowed_apis || [];
    if (!allowedApis.includes(api)) {
        await logApiCall(agent, api, endpoint, method, 403, 0, "API not in allowed_apis");
        return errorResponse(`Agent '${agent}' is not authorized to use '${api}'`, 403);
    }

    // ── 2. Get API config ──
    const config = API_CONFIGS[api];
    let apiKey: string | undefined = undefined;
    let url: URL;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    };

    if (!config) {
        // Fallback: If it's an allowed API but has no config, we treat it as a Public API
        if (!endpoint.startsWith("http")) {
            return errorResponse(`API '${api}' not configured. For public catalog APIs, provide the full absolute URL in 'endpoint'.`, 400);
        }
        url = new URL(endpoint);

        // Add query params
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
    } else {
        // Handle configured API with auth
        apiKey = Deno.env.get(config.envKey)
            || config.envFallbackKeys?.map((key) => Deno.env.get(key)).find(Boolean);

        if (!apiKey && config.authType !== "none") {
            const expectedKeys = [config.envKey, ...(config.envFallbackKeys || [])].join(" or ");
            return errorResponse(`API key not set: ${expectedKeys}. Add it as a Supabase secret.`, 500);
        }

        // ── 3. Build request ──
        let endpointUrl = endpoint;
        if (api === "telegram" && apiKey) {
            // Telegram expects the token in the URL path: /bot<token>/METHOD
            endpointUrl = `/bot${apiKey}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
        }

        url = new URL(endpointUrl.startsWith("/") ? `${config.base}${endpointUrl}` : `${config.base}/${endpointUrl}`);

        // Add query params
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }

        // Add auth via query param if needed
        if (config.authType === "query-param" && config.paramName && apiKey) {
            url.searchParams.set(config.paramName, apiKey);
        }

        // Extra headers
        if (config.extraHeaders) {
            Object.assign(headers, config.extraHeaders);
        }

        // Add auth header
        if (config.authType === "bearer" && apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        } else if (config.authType === "custom-header" && config.headerName && apiKey) {
            headers[config.headerName] = apiKey;
        }
    }

    const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers,
    };

    if (reqBody && method.toUpperCase() !== "GET") {
        fetchOptions.body = JSON.stringify(reqBody);
    }

    // ── 4. Call external API ──
    const startMs = Date.now();
    let statusCode = 0;
    let responseData: unknown;
    let errorMsg: string | null = null;

    try {
        const response = await fetch(url.toString(), fetchOptions);
        statusCode = response.status;
        const text = await response.text();

        try {
            responseData = JSON.parse(text);
        } catch {
            responseData = { raw: text.slice(0, 2000) };
        }

        if (!response.ok) {
            errorMsg = `API returned ${statusCode}`;
        }
    } catch (err) {
        errorMsg = err instanceof Error ? err.message : "Network error";
        statusCode = 0;
        responseData = { error: errorMsg };
    }

    const durationMs = Date.now() - startMs;

    // ── 5. Log the call ──
    await logApiCall(agent, api, endpoint, method, statusCode, durationMs, errorMsg);

    // ── 6. Return ──
    if (errorMsg && statusCode === 0) {
        return errorResponse(errorMsg, 502);
    }

    return jsonResponse({
        ok: !errorMsg,
        api,
        agent,
        status: statusCode,
        duration_ms: durationMs,
        data: responseData,
    }, statusCode >= 200 && statusCode < 300 ? 200 : statusCode);
});

// ═══════════════════════════════════════════════════
// Log API call to agent_api_logs
// ═══════════════════════════════════════════════════

async function logApiCall(
    agentCodeName: string,
    apiName: string,
    endpoint: string,
    method: string,
    statusCode: number,
    durationMs: number,
    error: string | null,
) {
    try {
        await admin.from("agent_api_logs").insert({
            agent_code_name: agentCodeName,
            api_name: apiName,
            endpoint,
            method: method.toUpperCase(),
            status_code: statusCode,
            duration_ms: durationMs,
            error: error || null,
        });
    } catch (logErr) {
        console.error("Failed to log API call:", logErr);
    }
}
