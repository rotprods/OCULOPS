import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { evaluateArtifact, type ImpactLevel } from "../_shared/evaluation.ts";
import { compact, errorResponse, handleCors, jsonResponse, readJson, safeNumber } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";

function normalizeImpactLevel(value: unknown): ImpactLevel {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeDecision(value: unknown): "pass" | "retry" | "reject" | "escalate" {
  const normalized = compact(value).toLowerCase();
  if (normalized === "retry") return "retry";
  if (normalized === "reject") return "reject";
  if (normalized === "escalate") return "escalate";
  return "pass";
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
      action?: "evaluate" | "get" | "list" | "metrics";
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
      window_hours?: number;
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

    if (action === "metrics") {
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
          metrics: {
            org_id: null,
            generated_at: new Date().toISOString(),
            window_hours: windowHours,
            filters: {
              correlation_id: body.correlation_id || null,
              artifact_type: body.artifact_type || null,
            },
            totals: {
              evaluations_window: 0,
              decision_distribution: {
                pass: 0,
                retry: 0,
                reject: 0,
                escalate: 0,
              },
            },
            scores: {
              overall_average: 0,
              critics_average: {
                quality: 0,
                architecture: 0,
                risk: 0,
                cost: 0,
              },
            },
            escalation: {
              escalations_total: 0,
              top_artifact_types: [],
            },
            warnings: [
              ...warnings,
              "No org scope provided; evaluation metrics returned advisory defaults.",
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
          .from("evaluation_runs")
          .select("decision, overall_score, artifact_type, scores, created_at")
          .eq("org_id", resolvedOrgId)
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .range(offset, offset + batchSize - 1);

        if (body.correlation_id) query = query.eq("correlation_id", body.correlation_id);
        if (body.artifact_type) query = query.eq("artifact_type", body.artifact_type);

        const { data, error } = await query;
        if (error) throw error;

        const page = data || [];
        if (page.length === 0) break;
        rows.push(...page);

        if (page.length < batchSize) break;
        offset += batchSize;
      }

      if (rows.length >= maxRows) {
        warnings.push(`Metrics truncated at ${maxRows} rows; narrow filters/window for full precision.`);
      }

      const decisionDistribution = {
        pass: 0,
        retry: 0,
        reject: 0,
        escalate: 0,
      };
      let overallTotal = 0;
      let overallCount = 0;

      const criticTotals = {
        quality: 0,
        architecture: 0,
        risk: 0,
        cost: 0,
      };
      const criticCounts = {
        quality: 0,
        architecture: 0,
        risk: 0,
        cost: 0,
      };

      const escalatedByArtifact = new Map<string, number>();

      for (const row of rows) {
        const decision = normalizeDecision(row.decision);
        decisionDistribution[decision] += 1;

        const overall = safeNumber(row.overall_score, NaN);
        if (Number.isFinite(overall)) {
          overallTotal += overall;
          overallCount += 1;
        }

        const scores = asRecord(row.scores);
        const quality = safeNumber(scores.quality, NaN);
        const architecture = safeNumber(scores.architecture, NaN);
        const risk = safeNumber(scores.risk, NaN);
        const cost = safeNumber(scores.cost, NaN);

        if (Number.isFinite(quality)) {
          criticTotals.quality += quality;
          criticCounts.quality += 1;
        }
        if (Number.isFinite(architecture)) {
          criticTotals.architecture += architecture;
          criticCounts.architecture += 1;
        }
        if (Number.isFinite(risk)) {
          criticTotals.risk += risk;
          criticCounts.risk += 1;
        }
        if (Number.isFinite(cost)) {
          criticTotals.cost += cost;
          criticCounts.cost += 1;
        }

        if (decision === "escalate") {
          const artifactType = compact(row.artifact_type) || "unknown";
          escalatedByArtifact.set(artifactType, Number(escalatedByArtifact.get(artifactType) || 0) + 1);
        }
      }

      const topEscalatedArtifactTypes = Array
        .from(escalatedByArtifact.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([artifact_type, count]) => ({ artifact_type, count }));

      const average = (total: number, count: number) => count > 0
        ? Number((total / count).toFixed(2))
        : 0;

      return jsonResponse({
        ok: true,
        metrics: {
          org_id: resolvedOrgId,
          generated_at: new Date().toISOString(),
          window_hours: windowHours,
          filters: {
            correlation_id: body.correlation_id || null,
            artifact_type: body.artifact_type || null,
          },
          totals: {
            evaluations_window: rows.length,
            decision_distribution: decisionDistribution,
          },
          scores: {
            overall_average: average(overallTotal, overallCount),
            critics_average: {
              quality: average(criticTotals.quality, criticCounts.quality),
              architecture: average(criticTotals.architecture, criticCounts.architecture),
              risk: average(criticTotals.risk, criticCounts.risk),
              cost: average(criticTotals.cost, criticCounts.cost),
            },
          },
          escalation: {
            escalations_total: decisionDistribution.escalate,
            top_artifact_types: topEscalatedArtifactTypes,
          },
          warnings,
        },
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
