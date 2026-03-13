import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createPipelineRun,
  executeGoal,
  executePipelineRun,
  getPipelineRunDetails,
  listRecentPipelineRuns,
  planGoal,
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
      goal_id?: string;
      priority?: "low" | "medium" | "high" | "critical";
      risk_class?: "low" | "medium" | "high" | "critical";
      preferred_template_code_name?: string;
      retry_limit?: number;
      auto_replan?: boolean;
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

    if (action === "plan_goal") {
      if (!body.goal) {
        return errorResponse("goal is required");
      }

      const result = await planGoal({
        goal: body.goal,
        context: body.context || {},
        userId: body.user_id || null,
        orgId: body.org_id || null,
        source: body.source || "copilot",
        priority: body.priority,
        riskClass: body.risk_class,
        preferredTemplateCodeName: body.preferred_template_code_name || body.template_code_name || null,
      });

      return jsonResponse(result);
    }

    if (action === "execute_goal") {
      if (!body.goal_id) {
        return errorResponse("goal_id is required");
      }

      const result = await executeGoal({
        goalId: body.goal_id,
        authHeader: req.headers.get("Authorization"),
        retryLimit: body.retry_limit,
        autoReplan: body.auto_replan,
      });

      return jsonResponse(result);
    }

    if (action === "plan_and_execute_goal") {
      if (!body.goal) {
        return errorResponse("goal is required");
      }

      const plan = await planGoal({
        goal: body.goal,
        context: body.context || {},
        userId: body.user_id || null,
        orgId: body.org_id || null,
        source: body.source || "copilot",
        priority: body.priority,
        riskClass: body.risk_class,
        preferredTemplateCodeName: body.preferred_template_code_name || body.template_code_name || null,
      });

      const plannedGoalId = String((plan as { goal?: { id?: string } }).goal?.id || "");
      if (!plannedGoalId) {
        return errorResponse("Failed to derive goal_id after planning", 500);
      }

      const execution = await executeGoal({
        goalId: plannedGoalId,
        authHeader: req.headers.get("Authorization"),
        retryLimit: body.retry_limit,
        autoReplan: body.auto_replan,
      });

      return jsonResponse({
        ok: true,
        status: "planned_and_executed",
        plan,
        execution,
      });
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
