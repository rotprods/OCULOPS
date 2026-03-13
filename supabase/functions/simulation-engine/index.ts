import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { replaySimulation, runSimulation, type RiskClass, type SimulationMode } from "../_shared/simulation.ts";
import { admin } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = await readJson<{
      action?: "run" | "get" | "list" | "replay";
      simulation_id?: string;
      mode?: SimulationMode;
      target_type?: string;
      target_id?: string | null;
      workflow_id?: string | null;
      risk_class?: RiskClass;
      target_environment?: "staging" | "production";
      input_snapshot?: Record<string, unknown>;
      output_snapshot?: Record<string, unknown>;
      correlation_id?: string | null;
      org_id?: string | null;
      user_id?: string | null;
      source_agent?: string | null;
      limit?: number;
      status?: "passed" | "failed";
    }>(req);

    const action = body.action || "run";

    if (action === "run") {
      if (!body.target_type) {
        return errorResponse("target_type is required");
      }

      const result = await runSimulation({
        mode: body.mode,
        targetType: body.target_type,
        targetId: body.target_id || null,
        workflowId: body.workflow_id || null,
        riskClass: body.risk_class,
        targetEnvironment: body.target_environment,
        inputSnapshot: body.input_snapshot || {},
        outputSnapshot: body.output_snapshot || {},
        correlationId: body.correlation_id || null,
        orgId: body.org_id || null,
        userId: body.user_id || null,
        sourceAgent: body.source_agent || "simulation-engine",
      });

      return jsonResponse({
        ok: true,
        result,
      });
    }

    if (action === "replay") {
      if (!body.simulation_id) {
        return errorResponse("simulation_id is required");
      }

      const result = await replaySimulation(body.simulation_id, body.source_agent || "simulation-engine");
      return jsonResponse({
        ok: true,
        result,
      });
    }

    if (action === "get") {
      if (!body.simulation_id) {
        return errorResponse("simulation_id is required");
      }

      const { data, error } = await admin
        .from("simulation_runs")
        .select("*")
        .eq("id", body.simulation_id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return errorResponse("Simulation not found", 404);

      return jsonResponse({
        ok: true,
        simulation: data,
      });
    }

    if (action === "list") {
      const limit = Math.max(1, Math.min(200, Number(body.limit || 50)));
      let query = admin
        .from("simulation_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (body.correlation_id) query = query.eq("correlation_id", body.correlation_id);
      if (body.target_type) query = query.eq("target_type", body.target_type);
      if (body.target_id) query = query.eq("target_id", body.target_id);
      if (body.status) query = query.eq("status", body.status);
      if (body.org_id) query = query.eq("org_id", body.org_id);

      const { data, error } = await query;
      if (error) throw error;

      return jsonResponse({
        ok: true,
        simulations: data || [],
      });
    }

    return errorResponse(`Unknown action: ${action}`, 400);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "simulation-engine failed",
      500,
    );
  }
});
