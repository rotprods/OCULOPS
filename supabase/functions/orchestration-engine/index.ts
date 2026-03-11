import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createPipelineRun,
  executePipelineRun,
  getPipelineRunDetails,
  listRecentPipelineRuns,
} from "../_shared/orchestration.ts";
import { errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = await readJson<{
      action?: string;
      template_code_name?: string;
      goal?: string;
      context?: Record<string, unknown>;
      pipeline_run_id?: string;
      user_id?: string;
      org_id?: string;
      source?: string;
      auto_execute?: boolean;
      limit?: number;
    }>(req);

    const action = body.action || "list";

    if (action === "create_run") {
      if (!body.template_code_name) {
        return errorResponse("template_code_name is required");
      }

      const result = await createPipelineRun({
        templateCodeName: body.template_code_name,
        goal: body.goal || null,
        context: body.context || {},
        initiatedByUserId: body.user_id || null,
        orgId: body.org_id || null,
        source: body.source || "copilot",
        autoExecute: body.auto_execute !== false,
        authHeader: req.headers.get("Authorization"),
      });

      return jsonResponse(result);
    }

    if (action === "execute_run") {
      if (!body.pipeline_run_id) {
        return errorResponse("pipeline_run_id is required");
      }

      const result = await executePipelineRun({
        pipelineRunId: body.pipeline_run_id,
        authHeader: req.headers.get("Authorization"),
      });

      return jsonResponse(result);
    }

    if (action === "get_run") {
      if (!body.pipeline_run_id) {
        return errorResponse("pipeline_run_id is required");
      }

      return jsonResponse(await getPipelineRunDetails(body.pipeline_run_id));
    }

    if (action === "list") {
      return jsonResponse({
        ok: true,
        runs: await listRecentPipelineRuns(Math.max(1, Math.min(50, body.limit || 20))),
      });
    }

    return errorResponse(`Unknown action: ${action}`, 400);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Orchestration engine failed",
      500,
    );
  }
});
