import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { evaluateArtifact, type ImpactLevel } from "../_shared/evaluation.ts";
import { errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";

function normalizeImpactLevel(value: unknown): ImpactLevel {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = await readJson<{
      action?: "evaluate" | "get" | "list";
      evaluation_id?: string;
      artifact_type?: string;
      artifact_id?: string | null;
      artifact_payload?: Record<string, unknown>;
      impact_level?: ImpactLevel;
      correlation_id?: string | null;
      org_id?: string | null;
      user_id?: string | null;
      pipeline_run_id?: string | null;
      step_run_id?: string | null;
      goal_id?: string | null;
      goal_step_id?: string | null;
      source_agent?: string | null;
      explanation_hint?: string | null;
      limit?: number;
      decision?: "pass" | "retry" | "reject" | "escalate";
    }>(req);

    const action = body.action || "evaluate";

    if (action === "evaluate") {
      if (!body.artifact_type || !body.artifact_payload) {
        return errorResponse("artifact_type and artifact_payload are required");
      }

      const result = await evaluateArtifact({
        artifactType: body.artifact_type,
        artifactPayload: body.artifact_payload,
        impactLevel: normalizeImpactLevel(body.impact_level),
        artifactId: body.artifact_id || null,
        correlationId: body.correlation_id || null,
        orgId: body.org_id || null,
        userId: body.user_id || null,
        pipelineRunId: body.pipeline_run_id || null,
        stepRunId: body.step_run_id || null,
        goalId: body.goal_id || null,
        goalStepId: body.goal_step_id || null,
        sourceAgent: body.source_agent || "evaluation-engine",
        explanationHint: body.explanation_hint || null,
      });

      return jsonResponse({
        ok: true,
        result,
      });
    }

    if (action === "get") {
      if (!body.evaluation_id) return errorResponse("evaluation_id is required");

      const { data, error } = await admin
        .from("evaluation_runs")
        .select("*")
        .eq("id", body.evaluation_id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return errorResponse("Evaluation not found", 404);

      return jsonResponse({
        ok: true,
        evaluation: data,
      });
    }

    if (action === "list") {
      const limit = Math.max(1, Math.min(200, Number(body.limit || 50)));
      let query = admin
        .from("evaluation_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (body.correlation_id) query = query.eq("correlation_id", body.correlation_id);
      if (body.artifact_type) query = query.eq("artifact_type", body.artifact_type);
      if (body.artifact_id) query = query.eq("artifact_id", body.artifact_id);
      if (body.decision) query = query.eq("decision", body.decision);
      if (body.org_id) query = query.eq("org_id", body.org_id);

      const { data, error } = await query;
      if (error) throw error;

      return jsonResponse({
        ok: true,
        evaluations: data || [],
      });
    }

    return errorResponse(`Unknown action: ${action}`, 400);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "evaluation-engine failed",
      500,
    );
  }
});
