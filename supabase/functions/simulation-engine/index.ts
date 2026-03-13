import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { compact, errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { replaySimulation, runSimulation, type RiskClass, type SimulationMode } from "../_shared/simulation.ts";
import { admin } from "../_shared/supabase.ts";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function resolveOrgId(explicitOrgId?: string | null, userId?: string | null) {
  if (compact(explicitOrgId)) return compact(explicitOrgId);
  if (!compact(userId)) return null;

  const { data, error } = await admin
    .from("organization_members")
    .select("org_id")
    .eq("user_id", compact(userId))
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return compact(data?.org_id) || null;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = await readJson<{
      action?: "run" | "get" | "list" | "replay" | "taxonomy" | "latest_failures";
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
      window_hours?: number;
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

    if (action === "taxonomy") {
      const windowHours = Math.max(1, Math.min(168, Number(body.window_hours || 24)));
      const sinceIso = new Date(Date.now() - (windowHours * 60 * 60 * 1000)).toISOString();
      const warnings: string[] = [];

      let resolvedOrgId: string | null = null;
      try {
        resolvedOrgId = await resolveOrgId(body.org_id || null, body.user_id || null);
      } catch {
        warnings.push("Unable to resolve org_id from user context.");
      }

      if (!resolvedOrgId) {
        return jsonResponse({
          ok: true,
          taxonomy: {
            org_id: null,
            generated_at: new Date().toISOString(),
            window_hours: windowHours,
            filters: {
              correlation_id: body.correlation_id || null,
              target_type: body.target_type || null,
            },
            totals: {
              simulations_window: 0,
              status: { passed: 0, failed: 0, pass_ratio: 0 },
              policy_gate: { passed: 0, blocked: 0 },
            },
            breakdown: {
              by_mode: {},
              by_target_type: {},
              by_recommended_action: {},
              top_recommended_action: null,
            },
            warnings: [
              ...warnings,
              "No org scope provided; taxonomy returned advisory defaults.",
            ],
          },
        });
      }

      const rows: Array<Record<string, unknown>> = [];
      const batchSize = 1000;
      const maxRows = 20_000;
      let offset = 0;

      while (offset < maxRows) {
        let query = admin
          .from("simulation_runs")
          .select("status, policy_gate_passed, mode, target_type, recommended_action, created_at")
          .eq("org_id", resolvedOrgId)
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .range(offset, offset + batchSize - 1);

        if (body.correlation_id) query = query.eq("correlation_id", body.correlation_id);
        if (body.target_type) query = query.eq("target_type", body.target_type);

        const { data, error } = await query;
        if (error) throw error;

        const page = data || [];
        if (page.length === 0) break;
        rows.push(...page);

        if (page.length < batchSize) break;
        offset += batchSize;
      }

      if (rows.length >= maxRows) {
        warnings.push(`Taxonomy truncated at ${maxRows} rows; narrow filters/window for full precision.`);
      }

      let passed = 0;
      let failed = 0;
      let policyGatePassed = 0;
      let policyGateBlocked = 0;
      const byMode: Record<string, number> = {};
      const byTargetType: Record<string, number> = {};
      const byRecommendedAction: Record<string, number> = {};

      for (const row of rows) {
        const status = compact(row.status).toLowerCase();
        if (status === "passed") passed += 1;
        else failed += 1;

        if (row.policy_gate_passed === true) policyGatePassed += 1;
        else policyGateBlocked += 1;

        const mode = compact(row.mode) || "unknown";
        byMode[mode] = Number(byMode[mode] || 0) + 1;

        const targetType = compact(row.target_type) || "unknown";
        byTargetType[targetType] = Number(byTargetType[targetType] || 0) + 1;

        const recommendedAction = compact(row.recommended_action) || "unknown";
        byRecommendedAction[recommendedAction] = Number(byRecommendedAction[recommendedAction] || 0) + 1;
      }

      const topRecommendedAction = Object.entries(byRecommendedAction)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 1)
        .map(([action, count]) => ({ action, count }))[0] || null;

      const total = rows.length;
      const passRatio = total > 0 ? Number((passed / total).toFixed(4)) : 0;

      return jsonResponse({
        ok: true,
        taxonomy: {
          org_id: resolvedOrgId,
          generated_at: new Date().toISOString(),
          window_hours: windowHours,
          filters: {
            correlation_id: body.correlation_id || null,
            target_type: body.target_type || null,
          },
          totals: {
            simulations_window: total,
            status: {
              passed,
              failed,
              pass_ratio: passRatio,
            },
            policy_gate: {
              passed: policyGatePassed,
              blocked: policyGateBlocked,
            },
          },
          breakdown: {
            by_mode: byMode,
            by_target_type: byTargetType,
            by_recommended_action: byRecommendedAction,
            top_recommended_action: topRecommendedAction,
          },
          warnings,
        },
      });
    }

    if (action === "latest_failures") {
      const limit = Math.max(1, Math.min(100, Number(body.limit || 20)));
      const warnings: string[] = [];

      let resolvedOrgId: string | null = null;
      try {
        resolvedOrgId = await resolveOrgId(body.org_id || null, body.user_id || null);
      } catch {
        warnings.push("Unable to resolve org_id from user context.");
      }

      if (!resolvedOrgId) {
        return jsonResponse({
          ok: true,
          failures: [],
          limit,
          warnings: [
            ...warnings,
            "No org scope provided; latest_failures returned empty advisory payload.",
          ],
        });
      }

      let query = admin
        .from("simulation_runs")
        .select("id, mode, status, target_type, target_id, risk_class, target_environment, recommended_action, score, findings, input_snapshot, source_agent, correlation_id, created_at")
        .eq("org_id", resolvedOrgId)
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (body.correlation_id) query = query.eq("correlation_id", body.correlation_id);
      if (body.target_type) query = query.eq("target_type", body.target_type);

      const { data, error } = await query;
      if (error) throw error;

      const failures = (data || []).map((row) => {
        const findingsRaw = Array.isArray(row.findings) ? row.findings : [];
        const findings = findingsRaw.slice(0, 5).map((finding) => {
          const rec = asRecord(finding);
          return {
            code: compact(rec.code) || "unknown",
            severity: compact(rec.severity) || "unknown",
            blocking: rec.blocking === true,
            message: compact(rec.message) || "",
          };
        });

        const inputSnapshot = asRecord(row.input_snapshot);
        return {
          simulation_id: row.id,
          created_at: row.created_at,
          mode: row.mode,
          target_type: row.target_type,
          target_id: row.target_id,
          risk_class: row.risk_class,
          target_environment: row.target_environment,
          recommended_action: row.recommended_action,
          score: row.score,
          source_agent: row.source_agent,
          correlation_id: row.correlation_id,
          findings,
          input_preview: {
            action: compact(inputSnapshot.action) || null,
            step_key: compact(inputSnapshot.step_key) || null,
            tool: compact(inputSnapshot.tool || inputSnapshot.tool_id) || null,
            channel: compact(inputSnapshot.channel) || null,
            approval_required: inputSnapshot.approval_required === true,
            approval_granted: inputSnapshot.approval_granted === true,
          },
        };
      });

      return jsonResponse({
        ok: true,
        failures,
        limit,
        warnings,
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
