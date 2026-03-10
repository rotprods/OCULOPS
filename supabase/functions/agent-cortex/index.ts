import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { runAgentTask } from "../_shared/agents.ts";
import { errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function callAgent(endpoint: string, payload: Record<string, unknown>) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase runtime env is not configured");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `${endpoint} failed`);
  }

  return data as Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = await readJson<{
      action?: string;
      query?: string;
      location?: string;
      lat?: number;
      lng?: number;
      radius?: number;
      scan_id?: string;
      user_id?: string;
      maxResults?: number;
    }>(req);

    const action = body.action || "orchestrate";

    const result = await runAgentTask({
      codeName: "cortex",
      action,
      title: `CORTEX ${action}`,
      payload: body as Record<string, unknown>,
      handler: async () => {
        let scanId = body.scan_id || null;
        let atlasResult: Record<string, unknown> | null = null;

        if (!scanId) {
          atlasResult = await callAgent("agent-atlas", {
            action: "cycle",
            query: body.query,
            location: body.location,
            lat: body.lat,
            lng: body.lng,
            radius: body.radius,
            user_id: body.user_id,
            maxResults: body.maxResults,
          });
          scanId = String((atlasResult.output as Record<string, unknown> | undefined)?.scan?.id || "");
        }

        const hunterResult = await callAgent("agent-hunter", {
          action: "cycle",
          scan_id: scanId,
          user_id: body.user_id,
        });
        const strategistResult = await callAgent("agent-strategist", {
          action: "cycle",
          scan_id: scanId,
          user_id: body.user_id,
        });
        const outreachResult = await callAgent("agent-outreach", {
          action: "cycle",
          user_id: body.user_id,
        });

        return {
          scan_id: scanId,
          atlas: atlasResult,
          hunter: hunterResult,
          strategist: strategistResult,
          outreach: outreachResult,
        };
      },
    });

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "CORTEX failed", 500);
  }
});
