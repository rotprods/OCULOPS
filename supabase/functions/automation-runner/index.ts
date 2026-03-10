import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { executeTriggeredWorkflows } from "../_shared/automation.ts";
import { errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { getAuthUser } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = await readJson<{
      action?: string;
      workflow_id?: string;
      trigger_key?: string;
      context?: Record<string, unknown>;
      send_live?: boolean;
      source?: string;
    }>(req);
    const user = await getAuthUser(req);
    const userId = user?.id || null;
    const action = body.action || "run";

    if (action === "run" && !body.workflow_id) {
      return errorResponse("workflow_id is required");
    }

    if (action === "trigger" && !body.trigger_key) {
      return errorResponse("trigger_key is required");
    }

    const result = await executeTriggeredWorkflows({
      workflowId: action === "run" ? body.workflow_id || null : null,
      triggerKey: action === "trigger" ? body.trigger_key || null : null,
      userId,
      context: body.context || {},
      authHeader: req.headers.get("Authorization"),
      sendLive: Boolean(body.send_live),
      source: body.source || (action === "run" ? "automation_ui" : "automation_trigger"),
    });

    return jsonResponse({
      ok: true,
      ...result,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Automation runner failed", 500);
  }
});

