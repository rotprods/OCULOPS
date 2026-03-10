import { callApi } from "./agents.ts";
import { admin } from "./supabase.ts";

/**
 * Dynamically queries an AI model (OpenAI) to match an intent string (e.g., "Get the current weather in London")
 * to the best available open-access API from the public catalog, then automatically executes the request
 * via the central api-gateway.
 * 
 * @param agentCodeName The agent executing the request (must have the required slug in allowed_apis)
 * @param intent Description of the data needed
 */
export async function executeDynamicPublicApi(agentCodeName: string, intent: string) {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY is required for dynamic API routing");

    // Fetch authorized APIs for the specific agent to bound the AI's choices
    const { data: agentRow } = await admin
        .from("agent_registry")
        .select("allowed_apis")
        .eq("code_name", agentCodeName)
        .maybeSingle();

    const allowed = agentRow?.allowed_apis || [];
    const contextStr = allowed.length > 0
        ? `You MUST strictly choose one of the following authorized API slugs: ${JSON.stringify(allowed)}`
        : `You have no strict APIs, guess standard open APIs.`;

    // Phase 1: AI Routing (This can be optimized later with embeddings or a smaller cached index)
    // We send a small prompt asking OpenAI to generate a plausible URL string or slug based on the intent
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `You are an API router. The system has access to hundreds of open-auth APIs. Based on the user's data intent, return a JSON object with two keys: 'slug' (a concise identifier) and 'endpoint' (the absolute URL to fetch the open data, e.g., 'https://api.coingecko.com/api/v3/ping'). ${contextStr}`
                },
                {
                    role: "user",
                    content: `Intent: ${intent}`
                }
            ]
        })
    });

    if (!response.ok) throw new Error("Failed to consult AI routing engine");

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    if (!result.slug || !result.endpoint) {
        throw new Error("AI could not route the intent to a valid public API.");
    }

    // Phase 2: Execute via central API Gateway
    // The gateway will proxy this automatically if it's an unconfigured open API but in the allowed list
    console.log(`[Dynamic API Router] Agent '${agentCodeName}' intending to call '${result.slug}' via '${result.endpoint}'`);

    return await callApi(agentCodeName, result.slug, result.endpoint);
}
