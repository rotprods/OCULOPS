import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runBrain } from "../_shared/agent-brain-v2.ts";
import { autoConnectApiBatch } from "../_shared/auto-api-connector.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const AGENT_CODE = "oracle";

// ═══════════════════════════════════════════════════════════════════════════════
// ORACLE — Unified Analytics Engine (merged: Oracle + Scribe)
// Actions: analyze (AI insights) | daily_report (snapshot only) | cycle (alias)
//
// v2: Uses agent-brain-v2 for autonomous reasoning + skill execution.
//     Brain can create signals, store memory, query metrics, and alert
//     with full policy enforcement + audit trail.
// ═══════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "analyze", task_id } = body;
    const { data: agent } = await supabase
      .from("agent_registry")
      .select("*")
      .eq("code_name", AGENT_CODE)
      .single();
    if (!agent) throw new Error("Agent not found");
    await supabase
      .from("agent_registry")
      .update({ status: "running", last_run_at: new Date().toISOString() })
      .eq("id", agent.id);
    if (task_id)
      await supabase
        .from("agent_tasks")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", task_id);

    let result: Record<string, unknown> = {};
    const today = new Date().toISOString().split("T")[0];

    if (action === "analyze" || action === "cycle" || action === "daily_report") {
      // ── 1. Cross-table data collection (deterministic, no AI) ──
      const [
        contactsRes, dealsRes, campaignsRes, signalsRes,
        financeRes, tasksRes, alertsRes, logsRes,
      ] = await Promise.all([
        supabase.from("contacts").select("id, status, score, created_at").limit(500),
        supabase.from("deals").select("id, stage, value, probability, created_at").limit(200),
        supabase.from("campaigns").select("id, status, budget, spent, channel").limit(50),
        supabase.from("signals").select("id, category, impact, confidence, status").limit(50),
        supabase.from("finance_entries").select("id, type, amount, category").limit(100),
        supabase.from("tasks").select("id, status, priority").limit(100),
        supabase.from("alerts").select("id, severity, status").limit(50),
        supabase.from("agent_logs").select("agent_code_name, duration_ms, tokens_used").gte("created_at", `${today}T00:00:00`),
      ]);

      const contacts = contactsRes.data || [];
      const deals = dealsRes.data || [];
      const campaigns = campaignsRes.data || [];
      const signals = signalsRes.data || [];
      const finance = financeRes.data || [];
      const tasks = tasksRes.data || [];
      const alerts = alertsRes.data || [];
      const agentLogs = logsRes.data || [];

      // ── 2. Computed metrics (deterministic) ──
      const contactsByStatus: Record<string, number> = {};
      for (const c of contacts) {
        contactsByStatus[c.status] = (contactsByStatus[c.status] || 0) + 1;
      }

      const pipelineValue = deals.reduce((s, d) => s + (d.value || 0), 0);
      const weightedPipeline = deals.reduce(
        (s, d) => s + (d.value || 0) * ((d.probability || 0) / 100), 0,
      );
      const income = finance.filter((f) => f.type === "income").reduce((s, f) => s + (f.amount || 0), 0);
      const expenses = finance.filter((f) => f.type === "expense").reduce((s, f) => s + Math.abs(f.amount || 0), 0);
      const activeAlerts = alerts.filter((a) => a.status === "active").length;
      const tasksCompleted = tasks.filter((t) => t.status === "completed").length;
      const tasksPending = tasks.filter((t) => t.status === "pending").length;

      const snapshot = {
        contacts: { total: contacts.length, by_status: contactsByStatus },
        deals: { total: deals.length, pipeline_value: pipelineValue, weighted_pipeline: weightedPipeline },
        campaigns: {
          total: campaigns.length,
          active: campaigns.filter((c) => c.status === "active").length,
          total_budget: campaigns.reduce((s, c) => s + (c.budget || 0), 0),
          total_spent: campaigns.reduce((s, c) => s + (c.spent || 0), 0),
        },
        signals: { total: signals.length, active: signals.filter((s) => s.status === "active").length },
        finance: { mrr: income, burn_rate: expenses, net: income - expenses },
        tasks: { total: tasks.length, completed: tasksCompleted, pending: tasksPending },
        alerts: { active: activeAlerts },
        agent_activity: {
          total_runs_today: agentLogs.length,
          total_tokens_today: agentLogs.reduce((s, l) => s + (l.tokens_used || 0), 0),
          agents_active: [...new Set(agentLogs.map((l) => l.agent_code_name))],
        },
      };

      // ── 3. External data enrichment ──
      const externalResults = await autoConnectApiBatch([
        "stock market indices S&P NASDAQ price today",
        "latest business tech news headlines",
        "euro dollar exchange rate today",
        "global cryptocurrency bitcoin price",
      ], "oracle").catch(() => []);
      const externalData = externalResults
        .filter((r) => r.ok)
        .map((r) => ({ intent: r.intent, api: r.api_used, data: r.data }));

      // ── 4. Deterministic health score (always available, even without AI) ──
      const healthScore = Math.min(100, Math.max(0,
        100 - activeAlerts * 10 - tasksPending * 2));

      // ── 5. Brain-v2: autonomous reasoning + actions ──
      // For daily_report action, skip brain to save tokens — snapshot only.
      let brainResult = null;

      if (action !== "daily_report") {
        brainResult = await runBrain({
          agent: "oracle",
          goal: `Analyze the OCULOPS system snapshot and external market data. Your tasks:
1. Identify the top 3 actionable insights from the data (pipeline health, contact flow, agent efficiency, market signals).
2. Detect bottlenecks: stale deals, low conversion, high alert count, underperforming agents.
3. If you find a significant market signal in the external data, create_signal for it.
4. Store your executive analysis in memory (store_memory) so other agents can recall it.
5. If anything is critical (health score <40, pipeline <5000, >5 active alerts), create an alert.
6. Provide a clear executive summary with health_score, key_insights, bottlenecks, and recommendations.`,
          context: {
            snapshot,
            external_data: externalData,
            health_score_deterministic: healthScore,
            date: today,
          },
          systemPromptExtra: `You are ORACLE: the analytical brain of OCULOPS. You see patterns others miss.
Be specific with numbers. Reference actual data from the snapshot.
Your executive summary should be in Spanish (the team operates in Spain).
Format your final answer as JSON: {"health_score": N, "key_insights": [...], "bottlenecks": [...], "recommendations": [...], "mrr_estimate": N, "market_context": "..."}`,
          maxRounds: 4,
        }).catch((e) => ({ ok: false, answer: `Brain error: ${e.message}`, skills_used: [], rounds: 0, trace_id: undefined }));
      }

      // ── 6. Parse brain insights or use fallback ──
      let aiInsights = null;
      if (brainResult?.answer) {
        try {
          aiInsights = JSON.parse(brainResult.answer.replace(/```json\n?|```/g, ""));
        } catch {
          aiInsights = { raw: brainResult.answer };
        }
      }

      const finalHealthScore = aiInsights?.health_score || healthScore;

      // ── 7. Upsert daily snapshot ──
      const snapshotRow = {
        date: today,
        mrr: income,
        clients: contactsByStatus["client"] || 0,
        pipeline_value: pipelineValue,
        tasks_completed: tasksCompleted,
        leads_generated: contactsByStatus["raw"] || 0,
        alerts_active: activeAlerts,
        health_score: finalHealthScore,
        data: { snapshot, ai_analysis: aiInsights },
      };

      const { data: existing } = await supabase
        .from("daily_snapshots")
        .select("id")
        .eq("date", today)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase.from("daily_snapshots").update(snapshotRow).eq("id", existing[0].id);
      } else {
        await supabase.from("daily_snapshots").insert(snapshotRow);
      }

      // ── 8. Knowledge entry (persists analysis for recall_memory) ──
      await supabase.from("knowledge_entries").insert({
        title: `ORACLE Analysis — ${today}`,
        content: JSON.stringify({ snapshot, ai_analysis: aiInsights }, null, 2),
        category: "analytics",
        type: "ai_generated",
        source: "ORACLE",
        tags: ["analytics", "insights", "auto"],
      });

      result = {
        snapshot,
        ai_analysis: aiInsights,
        health_score: finalHealthScore,
        external_data: externalData,
        brain: brainResult ? {
          skills_used: brainResult.skills_used?.length || 0,
          rounds: brainResult.rounds || 0,
          trace_id: brainResult.trace_id,
          status: brainResult.status || (brainResult.ok ? "completed" : "failed"),
        } : null,
      };
    }

    const duration = Date.now() - startTime;
    await supabase
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
      await supabase
        .from("agent_tasks")
        .update({ status: "completed", result, completed_at: new Date().toISOString() })
        .eq("id", task_id);

    await supabase.from("agent_logs").insert({
      agent_id: agent.id,
      agent_code_name: AGENT_CODE,
      task_id,
      action,
      input: body,
      output: result,
      duration_ms: duration,
    });

    return new Response(
      JSON.stringify({ success: true, agent: AGENT_CODE, result, duration_ms: duration }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    await supabase
      .from("agent_registry")
      .update({ status: "error" })
      .eq("code_name", AGENT_CODE);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
