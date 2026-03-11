import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { runBrain } from "../_shared/agent-brain-v2.ts";
import { autoConnectApiBatch } from "../_shared/auto-api-connector.ts";
import { compact, errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";
import { resolveFallbackTelegramTarget, sendTelegramMessage } from "../_shared/telegram.ts";

const AGENT_CODE = "herald";

// ═══════════════════════════════════════════════════════════════════════════════
// HERALD — Daily Briefing & Communications Agent
//
// v2: Uses agent-brain-v2 for intelligent briefing generation.
//     Brain analyzes system data + external feeds, prioritizes what matters,
//     and generates a smart briefing. Telegram delivery stays deterministic.
// ═══════════════════════════════════════════════════════════════════════════════

type BriefingData = {
  pipeline_total?: number;
  pipeline_change_pct?: number;
  deal_count?: number;
  signal_count?: number;
  critical_signals?: number;
  health_score?: number;
  agents_online?: number;
  agents_total?: number;
  signals?: Array<{ title?: string; impact?: number }>;
  top_tasks?: Array<{ title?: string; priority?: string; status?: string }>;
};

function formatBriefingMessage(briefing: BriefingData = {}) {
  const signals = Array.isArray(briefing.signals) ? briefing.signals.slice(0, 3) : [];
  const tasks = Array.isArray(briefing.top_tasks) ? briefing.top_tasks.slice(0, 3) : [];

  return [
    "HERALD // DAILY BRIEFING",
    "",
    `[PIPELINE] $${Math.round(Number(briefing.pipeline_total) || 0).toLocaleString()} (${Number(briefing.pipeline_change_pct) || 0}% vs D-1)`,
    `[DEALS] ${briefing.deal_count || 0} active`,
    `[SIGNALS] ${briefing.signal_count || 0} total / ${briefing.critical_signals || 0} critical`,
    `[HEALTH] ${briefing.health_score || 0}/100`,
    `[AGENTS] ${briefing.agents_online || 0}/${briefing.agents_total || 0} online`,
    "",
    "TOP SIGNALS",
    ...(signals.length > 0
      ? signals.map(signal => `- L${signal.impact || 0} ${compact(signal.title) || "Untitled signal"}`)
      : ["- No critical signals logged"]),
    "",
    "TOP TASKS",
    ...(tasks.length > 0
      ? tasks.map(task => `- [${compact(task.status).toUpperCase() || "OPEN"}] ${compact(task.title) || "Untitled task"}`)
      : ["- No open priority tasks"]),
  ].join("\n").slice(0, 3900);
}

async function loadTelegramTarget() {
  const { data, error } = await admin
    .from("agent_delivery_targets")
    .select("*")
    .eq("type", "telegram")
    .eq("is_active", true)
    .or("agent_code_name.eq.herald,agent_code_name.is.null")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw error;
  return data?.[0] || resolveFallbackTelegramTarget();
}

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
      dryRun?: boolean;
      user_id?: string;
      task_id?: string;
    }>(req);

    const action = body.action || "daily_briefing";
    const { task_id } = body;

    // ── Agent lifecycle ──
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

    // ── 1. Collect briefing data + external feeds in parallel ──
    const [{ data: briefingData, error: rpcError }, externalResults] = await Promise.all([
      admin.rpc("get_daily_briefing_data"),
      autoConnectApiBatch([
        "latest news headlines today",
        "bitcoin ethereum crypto prices",
        "euro dollar pound currency exchange rate",
      ], "herald").catch(() => []),
    ]);
    if (rpcError) throw rpcError;

    const externalData = externalResults
      .filter((r) => r.ok)
      .map((r) => ({ intent: r.intent, api: r.api_used, data: r.data }));

    // ── 2. Brain-v2: intelligent briefing generation ──
    const brainResult = await runBrain({
      agent: "herald",
      goal: `Generate an intelligent daily briefing for the OCULOPS operations team. Your tasks:
1. Analyze the system data: pipeline health, signals, tasks, agent status.
2. Identify the #1 priority action for today based on the data.
3. Check external market data for anything relevant to an AI agency in Spain.
4. Store today's briefing in memory (store_memory) so other agents can reference it.
5. Produce a concise executive briefing in Spanish, formatted for Telegram (plain text, no markdown).

Format your final answer as a Telegram message:
HERALD // DAILY BRIEFING INTELIGENTE

[KEY METRICS] pipeline, deals, health score
[PRIORIDAD #1] The single most important thing to act on today
[MARKET] 1-line market context from external data
[SIGNALS] Top 2-3 signals worth attention
[RECOMENDACION] What to do next`,
      context: {
        briefing_data: briefingData || {},
        external_data: externalData,
        date: new Date().toISOString().split("T")[0],
      },
      systemPromptExtra: `You are HERALD: the communications officer of OCULOPS. You deliver clear, actionable briefings.
Your briefings are read by the CEO at the start of each day. Be sharp, specific, and action-oriented.
Always write in Spanish. Keep it under 3000 characters for Telegram.`,
      maxRounds: 3,
    }).catch((e) => ({
      ok: false,
      answer: "",
      skills_used: [] as Array<{ name: string; args: Record<string, unknown>; result: unknown }>,
      rounds: 0,
      trace_id: undefined as string | undefined,
      status: "failed" as const,
    }));

    // ── 3. Build final message: brain output or deterministic fallback ──
    const baseBriefing = formatBriefingMessage((briefingData || {}) as BriefingData);
    const externalLines = externalResults
      .filter((r) => r.ok)
      .map((r) => `[EXT] ${r.api_used.toUpperCase()}: data connected`)
      .join("\n");

    let finalMessage: string;
    if (brainResult.ok && brainResult.answer) {
      // Brain produced an intelligent briefing — use it
      finalMessage = brainResult.answer.slice(0, 3900);
    } else {
      // Fallback to deterministic template
      finalMessage = baseBriefing + (externalLines ? `\n\nEXTERNAL FEEDS\n${externalLines}` : "");
    }

    // ── 4. Telegram delivery (deterministic, not through brain) ──
    let telegramSent = false;
    let warning: string | null = null;
    let telegramResponse = null;

    if (!body.dryRun) {
      const target = await loadTelegramTarget();
      if (target) {
        telegramResponse = await sendTelegramMessage(target, finalMessage);
        telegramSent = true;
      } else {
        warning = "No Telegram target configured";
      }
    }

    const result = {
      briefing_data: briefingData,
      telegram_sent: telegramSent,
      warning,
      message: finalMessage,
      telegram: telegramResponse,
      brain: {
        skills_used: brainResult.skills_used?.length || 0,
        rounds: brainResult.rounds || 0,
        trace_id: brainResult.trace_id,
        status: brainResult.ok ? "completed" : "failed",
      },
    };

    // ── 5. Agent lifecycle: close ──
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
      ...result,
      duration_ms: duration,
    });
  } catch (error) {
    await admin
      .from("agent_registry")
      .update({ status: "error" })
      .eq("code_name", AGENT_CODE);
    return errorResponse(error instanceof Error ? error.message : "HERALD failed", 500);
  }
});
