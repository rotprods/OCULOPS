import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { applyUserScope, admin, getAuthUser } from "../_shared/supabase.ts";
import { compact, errorResponse, handleCors, jsonResponse } from "../_shared/http.ts";

type Insight = {
  type: "risk" | "opportunity" | "action";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  confidence: number;
};

const GLOBAL_TABLES = new Set([
  "alerts",
  "deals",
  "market_snapshots",
  "signals",
  "social_signals",
  "tasks",
]);

async function loadRows<T = Record<string, unknown>>(
  table: string,
  userId: string | null,
  columns: string,
  options: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    filters?: Array<{ op: "eq" | "gte"; column: string; value: string | number }>;
  } = {},
) {
  let query = admin
    .from(table)
    .select(columns);

  if (!GLOBAL_TABLES.has(table)) {
    query = applyUserScope(query, userId);
  }

  for (const filter of options.filters || []) {
    query = filter.op === "gte"
      ? query.gte(filter.column, filter.value)
      : query.eq(filter.column, filter.value);
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as T[];
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computeContext(summary: {
  deals: Array<Record<string, unknown>>;
  alerts: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  signals: Array<Record<string, unknown>>;
  marketSnapshots: Array<Record<string, unknown>>;
  socialSignals: Array<Record<string, unknown>>;
}) {
  const wonDeals = summary.deals.filter(deal =>
    ["closed_won", "onboarding"].includes(compact(deal.stage))
  );
  const openDeals = summary.deals.filter(deal =>
    !["closed_won", "closed_lost"].includes(compact(deal.stage))
  );
  const mrr = wonDeals.reduce((sum, deal) => sum + toNumber(deal.monthly_value ?? deal.value), 0);
  const pipelineTotal = openDeals.reduce((sum, deal) => sum + toNumber(deal.value), 0);
  const activeAlerts = summary.alerts.filter(alert => compact(alert.status) === "active");
  const completedTasks = summary.tasks.filter(task => compact(task.status) === "done").length;
  const completionRate = summary.tasks.length > 0
    ? Math.round((completedTasks / summary.tasks.length) * 100)
    : 0;
  const strongestSignals = [...summary.signals]
    .sort((a, b) => toNumber(b.impact) - toNumber(a.impact))
    .slice(0, 3);
  const recentSocial = [...summary.socialSignals]
    .sort((a, b) => toNumber(b.opportunity_score) - toNumber(a.opportunity_score))
    .slice(0, 3);
  const recentMarkets = [...summary.marketSnapshots]
    .slice(0, 12);

  return {
    mrr,
    pipelineTotal,
    activeAlertsCount: activeAlerts.length,
    completionRate,
    strongestSignals,
    recentSocial,
    recentMarkets,
  };
}

function buildHeuristicInsights(context: ReturnType<typeof computeContext>) {
  const insights: Insight[] = [];

  if (context.activeAlertsCount >= 3) {
    insights.push({
      type: "risk",
      title: "Alert load is starting to crowd execution",
      description: `You have ${context.activeAlertsCount} active alerts. Clear the highest-severity blockers before adding new campaigns or experiments.`,
      priority: "high",
      confidence: 82,
    });
  }

  if (context.pipelineTotal < 15000) {
    insights.push({
      type: "action",
      title: "Pipeline coverage is thin for the next revenue step",
      description: `Open pipeline is ${Math.round(context.pipelineTotal).toLocaleString()} and should be expanded with new outbound or inbound demand generation this week.`,
      priority: context.pipelineTotal < 5000 ? "high" : "medium",
      confidence: 76,
    });
  }

  if (context.completionRate < 65) {
    insights.push({
      type: "risk",
      title: "Execution pace is below target",
      description: `Task completion is ${context.completionRate}%. Tighten weekly priorities and reduce context switching before expanding the stack further.`,
      priority: "medium",
      confidence: 71,
    });
  }

  const hotSocial = context.recentSocial[0];
  if (hotSocial && toNumber(hotSocial.opportunity_score) >= 70) {
    insights.push({
      type: "opportunity",
      title: `Social demand is spiking around ${compact(hotSocial.topic) || "a target topic"}`,
      description: compact(hotSocial.title) || "Recent social conversations suggest a clear angle for a new offer or outbound hook.",
      priority: "high",
      confidence: Math.max(68, Math.min(92, toNumber(hotSocial.opportunity_score))),
    });
  }

  const strongestSignal = context.strongestSignals[0];
  if (strongestSignal) {
    insights.push({
      type: "action",
      title: "Promote your strongest signal into a concrete play",
      description: `Top internal signal: ${compact(strongestSignal.title) || "Unnamed signal"}. Translate it into one campaign, one outreach script, and one proof asset.`,
      priority: "medium",
      confidence: Math.max(60, Math.min(90, toNumber(strongestSignal.confidence, 70))),
    });
  }

  if (context.recentMarkets.length > 0) {
    const strongestMover = [...context.recentMarkets]
      .sort((a, b) => Math.abs(toNumber(b.change_24h)) - Math.abs(toNumber(a.change_24h)))
      .at(0);

    if (strongestMover) {
      insights.push({
        type: "opportunity",
        title: `Market volatility is elevated in ${compact(strongestMover.symbol) || "tracked assets"}`,
        description: `${compact(strongestMover.display_name) || compact(strongestMover.symbol)} moved ${toNumber(strongestMover.change_24h).toFixed(2)}% in the last snapshot window. Use that movement to shape finance-facing content or alerts.`,
        priority: "low",
        confidence: 64,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: "action",
      title: "Data is flowing but strategic pressure is low",
      description: "Keep feeds live, promote one signal into execution, and increase outbound volume before adding new providers.",
      priority: "low",
      confidence: 58,
    });
  }

  return insights.slice(0, 4);
}

async function generateOpenAIInsights(context: ReturnType<typeof computeContext>) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_QUALIFIER_MODEL") || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are the OCULOPS OS strategy advisor. Return compact JSON with an insights array. Each insight must include type, title, description, priority, confidence. Only use risk, opportunity, or action. Confidence must be 0-100.",
        },
        {
          role: "user",
          content: JSON.stringify(context),
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.insights) ? parsed.insights as Insight[] : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const user = await getAuthUser(req);
    const userId = user?.id || null;
    const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString();

    const [deals, alerts, tasks, signals, marketSnapshots, socialSignals] = await Promise.all([
      loadRows("deals", userId, "stage, value", { limit: 50 }),
      loadRows("alerts", userId, "status, severity, category", { limit: 20 }),
      loadRows("tasks", userId, "status, priority", { limit: 40 }),
      loadRows("signals", userId, "title, impact, confidence, category, status", { limit: 20 }),
      loadRows("market_snapshots", null, "symbol, display_name, change_24h, snapshot_at", {
        orderBy: "snapshot_at",
        limit: 20,
      }),
      loadRows("social_signals", null, "title, topic, opportunity_score, published_at", {
        orderBy: "published_at",
        filters: [{ op: "gte", column: "published_at", value: sevenDaysAgo }],
        limit: 20,
      }),
    ]);

    const context = computeContext({
      deals,
      alerts,
      tasks,
      signals,
      marketSnapshots,
      socialSignals,
    });

    const openAIInsights = await generateOpenAIInsights(context);
    const insights = (openAIInsights && openAIInsights.length > 0)
      ? openAIInsights.slice(0, 4)
      : buildHeuristicInsights(context);

    return jsonResponse({
      insights,
      source: openAIInsights?.length ? "openai" : "heuristic",
      generated_at: new Date().toISOString(),
      context: {
        mrr: context.mrr,
        pipeline_total: context.pipelineTotal,
        active_alerts: context.activeAlertsCount,
        completion_rate: context.completionRate,
        social_topics: context.recentSocial.map(item => compact(item.topic)).filter(Boolean),
      },
    });
  } catch (error) {
    console.error("[ai-advisor] error:", error);
    const message = error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
    return errorResponse(message || "AI advisor failed", 500);
  }
});
