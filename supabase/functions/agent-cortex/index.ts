import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { runBrain } from "../_shared/agent-brain-v2.ts";
import { errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";

const AGENT_CODE = "cortex";

// ═══════════════════════════════════════════════════════════════════════════════
// CORTEX — Pipeline Orchestrator (hierarchy_level: 1, reports to NEXUS)
//
// v2: Uses agent-brain-v2 for intelligent orchestration.
//     Brain decides which agents to call based on the action and context,
//     replacing the hardcoded atlas→hunter→outreach chain.
//
// Actions:
//   orchestrate  — full pipeline (brain decides which agents and order)
//   query_public_data — public API catalog query (deterministic, no brain)
// ═══════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const startTime = Date.now();

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
      task_id?: string;
    }>(req);

    const action = body.action || "orchestrate";
    const { task_id } = body;

    // ── Agent lifecycle: start ──
    const { data: agent } = await admin
      .from("agent_registry")
      .select("*")
      .eq("code_name", AGENT_CODE)
      .single();
    if (!agent) throw new Error("Agent not found");

    await admin
      .from("agent_registry")
      .update({ status: "running", last_run_at: new Date().toISOString() })
      .eq("id", agent.id);

    if (task_id)
      await admin
        .from("agent_tasks")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", task_id);

    let result: Record<string, unknown> = {};

    // ── Deterministic action: public data query (no brain) ──
    if (action === "query_public_data" && body.query) {
      const { executeDynamicPublicApi } = await import("../_shared/public-catalog-router.ts");
      const data = await executeDynamicPublicApi("cortex", body.query);
      const dataPreview = JSON.stringify(data, null, 2).slice(0, 1500);

      result = {
        summary: `Fetched Public Data\nIntent: ${body.query}\n\nResults Preview:\n${dataPreview}`,
        action,
        public_data: { intent: body.query, fetched_data: data },
      };
    }
    // ── Brain-powered orchestration ──
    else if (action === "orchestrate") {
      // Gather current system context for brain
      const [agentsRes, recentScansRes, queueStatsRes] = await Promise.all([
        admin.from("agent_registry")
          .select("code_name, status, total_runs, last_run_at")
          .order("code_name"),
        admin.from("prospector_scans")
          .select("id, query, location, results_count, created_at")
          .order("created_at", { ascending: false })
          .limit(3),
        admin.from("outreach_queue")
          .select("status"),
      ]);

      const queueRows = queueStatsRes.data || [];
      const queueStats = {
        staged: queueRows.filter(r => r.status === "staged").length,
        approved: queueRows.filter(r => r.status === "approved").length,
        sent: queueRows.filter(r => r.status === "sent").length,
      };

      const brainResult = await runBrain({
        agent: "cortex",
        goal: `Orchestrate a prospecting pipeline based on the user's request.

User request:
- Query: "${body.query || "businesses"}"
- Location: "${body.location || "not specified"}"
- Scan ID: ${body.scan_id || "none (new scan needed)"}

Your orchestration process:
1. Check system state: which agents are online? Any recent scans we can reuse?
2. If no scan_id provided: call ATLAS to scan the zone → {action: "cycle", query: "${body.query || "businesses"}", location: "${body.location || ""}", radius: ${body.radius || 5000}, maxResults: ${body.maxResults || 20}${body.user_id ? `, user_id: "${body.user_id}"` : ""}}
3. After ATLAS completes: call HUNTER to qualify leads → {action: "cycle"${body.scan_id ? `, scan_id: "${body.scan_id}"` : ""}${body.user_id ? `, user_id: "${body.user_id}"` : ""}}
4. After HUNTER completes: call OUTREACH to stage emails → {action: "cycle"${body.user_id ? `, user_id: "${body.user_id}"` : ""}}
5. Store the orchestration outcome in memory.
6. Summarize: how many leads found, qualified, and staged for outreach.

If scan_id is already provided, skip ATLAS and go directly to HUNTER.`,
        context: {
          agents: (agentsRes.data || []).map(a => ({
            name: a.code_name,
            status: a.status,
            runs: a.total_runs,
          })),
          recent_scans: recentScansRes.data || [],
          outreach_queue: queueStats,
          user_params: {
            query: body.query,
            location: body.location,
            scan_id: body.scan_id,
            user_id: body.user_id,
          },
        },
        systemPromptExtra: `You are CORTEX: the pipeline orchestrator. You coordinate the prospecting pipeline.
Be efficient — don't call agents unnecessarily. If a recent scan matches the query, tell the user.
Your job is coordination, not analysis. Let each agent do its domain work.
Summarize results concisely at the end.`,
        maxRounds: 4,
      });

      result = {
        action,
        brain_status: brainResult.status,
        brain_ok: brainResult.ok,
        answer: brainResult.answer,
        skills_used: brainResult.skills_used,
        rounds: brainResult.rounds,
        trace_id: brainResult.trace_id,
        blocked_skills: brainResult.blocked_skills,
        loop_detected: brainResult.loop_detected,
      };
    }

    // ── Agent lifecycle: close ──
    const duration = Date.now() - startTime;
    await admin
      .from("agent_registry")
      .update({
        status: "online",
        total_runs: (agent.total_runs || 0) + 1,
        avg_duration_ms: Math.round(
          ((agent.avg_duration_ms || 0) * (agent.total_runs || 0) + duration) /
            ((agent.total_runs || 0) + 1),
        ),
      })
      .eq("id", agent.id);

    if (task_id)
      await admin
        .from("agent_tasks")
        .update({ status: "completed", result, completed_at: new Date().toISOString() })
        .eq("id", task_id);

    await admin.from("agent_logs").insert({
      agent_id: agent.id,
      agent_code_name: AGENT_CODE,
      task_id,
      action,
      input: body,
      output: result,
      duration_ms: duration,
    });

    return jsonResponse({
      success: true,
      agent: AGENT_CODE,
      result,
      duration_ms: duration,
    });
  } catch (error) {
    await admin
      .from("agent_registry")
      .update({ status: "error" })
      .eq("code_name", AGENT_CODE);
    return errorResponse(error instanceof Error ? error.message : "CORTEX failed", 500);
  }
});
