import { compact } from "./http.ts";
import { admin } from "./supabase.ts";
import { formatAgentStudyTelegramMessage, resolveFallbackTelegramTarget, sendTelegramMessage } from "./telegram.ts";

interface AgentRow {
  id: string;
  code_name: string;
  name: string;
  status: string;
  total_runs: number;
  avg_duration_ms: number;
}

interface StudyRow {
  id: string;
  user_id: string | null;
  agent_id: string | null;
  agent_code_name: string;
  source: string;
  study_type: string;
  title: string;
  summary: string | null;
  content_markdown: string | null;
  content_json: Record<string, unknown>;
  highlights: string[];
  tags: string[];
  delivery_status: string;
  metadata: Record<string, unknown>;
}

function normalizeText(value: unknown, fallback = "") {
  return compact(value) || fallback;
}

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function summarizeValue(key: string, value: unknown) {
  if (typeof value === "number") return `${key}: ${value}`;
  if (typeof value === "string") return `${key}: ${value}`;
  if (Array.isArray(value)) return `${key}: ${value.length} items`;
  if (value && typeof value === "object") return `${key}: ${Object.keys(value as Record<string, unknown>).length} fields`;
  if (typeof value === "boolean") return `${key}: ${value ? "yes" : "no"}`;
  return "";
}

function buildStudyContent(output: unknown) {
  if (typeof output === "string") {
    return {
      summary: truncate(output, 240),
      contentMarkdown: output,
      highlights: [] as string[],
      contentJson: { value: output },
    };
  }

  if (Array.isArray(output)) {
    return {
      summary: `Generated ${output.length} result items.`,
      contentMarkdown: `Generated ${output.length} result items.\n\n\`\`\`json\n${JSON.stringify(output.slice(0, 10), null, 2)}\n\`\`\``,
      highlights: [`items: ${output.length}`],
      contentJson: { items: output },
    };
  }

  if (output && typeof output === "object") {
    const record = output as Record<string, unknown>;
    const preferredSummary = [
      record.summary,
      record.message,
      record.recommendation,
      record.brief,
      record.description,
      record.notes,
    ].map(value => compact(value)).find(Boolean);
    const highlights = Object.entries(record)
      .map(([key, value]) => summarizeValue(key.replace(/_/g, " "), value))
      .filter(Boolean)
      .slice(0, 6);

    return {
      summary: preferredSummary || truncate(highlights.join(" · "), 240) || "Agent output published.",
      contentMarkdown: `\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\``,
      highlights,
      contentJson: record,
    };
  }

  return {
    summary: "Agent output published.",
    contentMarkdown: "No structured content available.",
    highlights: [] as string[],
    contentJson: {},
  };
}

async function ensureAgent(codeName: string) {
  const { data, error } = await admin
    .from("agent_registry")
    .select("*")
    .eq("code_name", codeName)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as AgentRow;

  const { data: created, error: insertError } = await admin
    .from("agent_registry")
    .insert({
      code_name: codeName,
      name: codeName.toUpperCase(),
      role: "Agent",
      description: `${codeName} runtime agent`,
      status: "online",
      capabilities: [],
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created as AgentRow;
}

async function loadDeliveryTargets({
  userId,
  agentCodeName,
  manual,
}: {
  userId: string | null;
  agentCodeName: string;
  manual: boolean;
}) {
  let query = admin
    .from("agent_delivery_targets")
    .select("*")
    .eq("type", "telegram")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  query = userId ? query.eq("user_id", userId) : query.is("user_id", null);

  const { data, error } = await query;
  if (error) throw error;

  const filtered = (data || []).filter(target => {
    if (target.agent_code_name && target.agent_code_name !== agentCodeName) return false;
    return manual ? target.notify_manual !== false : target.notify_automated !== false;
  });

  return filtered.length > 0 ? filtered : (resolveFallbackTelegramTarget() ? [resolveFallbackTelegramTarget()] : []);
}

async function updateDeliveryTargets(targets: Array<Record<string, unknown>>, patch: Record<string, unknown>) {
  const scopedTargets = targets.filter(target => compact(target.id) && compact(target.id) !== "env-default");
  await Promise.all(scopedTargets.map(target =>
    admin
      .from("agent_delivery_targets")
      .update(patch)
      .eq("id", target.id)
  ));
}

export async function loadAgentStudyById(studyId: string, userId?: string | null) {
  let query = admin
    .from("agent_studies")
    .select("*")
    .eq("id", studyId);

  query = userId ? query.eq("user_id", userId) : query.is("user_id", null);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as StudyRow | null;
}

export async function createAgentStudy({
  userId,
  agentCodeName,
  title,
  summary,
  contentMarkdown,
  contentJson,
  highlights,
  tags,
  source,
  studyType,
  taskId,
  metadata,
}: {
  userId?: string | null;
  agentCodeName: string;
  title: string;
  summary?: string | null;
  contentMarkdown?: string | null;
  contentJson?: Record<string, unknown>;
  highlights?: string[];
  tags?: string[];
  source?: string;
  studyType?: string;
  taskId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const agent = await ensureAgent(agentCodeName);
  const { data, error } = await admin
    .from("agent_studies")
    .insert({
      user_id: userId || null,
      agent_id: agent.id,
      agent_code_name: agent.code_name,
      task_id: taskId || null,
      source: source || "agent_run",
      study_type: studyType || "study",
      title,
      summary: summary || null,
      content_markdown: contentMarkdown || null,
      content_json: contentJson || {},
      highlights: highlights || [],
      tags: tags || [],
      metadata: metadata || {},
      delivery_status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data as StudyRow;
}

export async function deliverAgentStudy(study: StudyRow, {
  userId,
  manual,
}: {
  userId?: string | null;
  manual?: boolean;
}) {
  const targets = await loadDeliveryTargets({
    userId: userId || study.user_id || null,
    agentCodeName: study.agent_code_name,
    manual: Boolean(manual),
  });

  if (targets.length === 0) {
    await admin
      .from("agent_studies")
      .update({ delivery_status: "skipped" })
      .eq("id", study.id);

    return {
      delivered: false,
      reason: "No Telegram target configured",
      targets: 0,
    };
  }

  const text = formatAgentStudyTelegramMessage(study);
  const results = [];
  let lastError = "";

  for (const target of targets) {
    try {
      const response = await sendTelegramMessage(target, text);
      results.push({
        target_id: compact(target.id) || "env-default",
        ok: true,
        message_id: response?.result?.message_id || null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Telegram delivery failed";
      lastError = message;
      results.push({
        target_id: compact(target.id) || "env-default",
        ok: false,
        error: message,
      });
    }
  }

  const delivered = results.some(result => result.ok);
  const timestamp = new Date().toISOString();

  await admin
    .from("agent_studies")
    .update({
      delivery_status: delivered ? "sent" : "failed",
      telegram_sent_at: delivered ? timestamp : null,
      metadata: {
        ...(study.metadata || {}),
        telegram_delivery: results,
      },
    })
    .eq("id", study.id);

  if (delivered) {
    await updateDeliveryTargets(targets, {
      last_delivery_at: timestamp,
      last_error: null,
    });
  } else if (lastError) {
    await updateDeliveryTargets(targets, {
      last_error: lastError,
    });
  }

  return {
    delivered,
    targets: targets.length,
    results,
  };
}

export async function runAgentTask<T>({
  codeName,
  action,
  title,
  payload,
  handler,
}: {
  codeName: string;
  action: string;
  title: string;
  payload: Record<string, unknown>;
  handler: (ctx: { taskId: string; agent: AgentRow }) => Promise<T>;
}) {
  const agent = await ensureAgent(codeName);
  const startedAt = new Date().toISOString();

  const { data: task, error: taskError } = await admin
    .from("agent_tasks")
    .insert({
      agent_id: agent.id,
      agent_code_name: codeName,
      type: action,
      title,
      payload,
      status: "running",
      started_at: startedAt,
      created_by: "edge_function",
    })
    .select()
    .single();

  if (taskError) throw taskError;

  await admin
    .from("agent_registry")
    .update({ status: "running" })
    .eq("id", agent.id);

  const startMs = Date.now();

  try {
    const output = await handler({ taskId: task.id, agent });
    const durationMs = Date.now() - startMs;
    const userId = normalizeText((payload as Record<string, unknown>).user_id || null) || null;

    await admin.from("agent_logs").insert({
      agent_id: agent.id,
      agent_code_name: codeName,
      task_id: task.id,
      action,
      input: payload,
      output,
      duration_ms: durationMs,
      model: "hybrid",
    });

    await admin
      .from("agent_tasks")
      .update({
        status: "completed",
        result: output,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    const nextRuns = (agent.total_runs || 0) + 1;
    const nextAvg = agent.avg_duration_ms
      ? Math.round(((agent.avg_duration_ms * (nextRuns - 1)) + durationMs) / nextRuns)
      : durationMs;

    await admin
      .from("agent_registry")
      .update({
        status: "online",
        last_run_at: new Date().toISOString(),
        total_runs: nextRuns,
        avg_duration_ms: nextAvg,
      })
      .eq("id", agent.id);

    try {
      const studyContent = buildStudyContent(output);
      const study = await createAgentStudy({
        userId,
        agentCodeName: codeName,
        taskId: task.id,
        source: "agent_run",
        studyType: action,
        title: `${agent.name} · ${title}`,
        summary: studyContent.summary,
        contentMarkdown: studyContent.contentMarkdown,
        contentJson: studyContent.contentJson,
        highlights: studyContent.highlights,
        tags: [codeName, action],
        metadata: {
          task_id: task.id,
          duration_ms: durationMs,
        },
      });

      await deliverAgentStudy(study, {
        userId,
        manual: false,
      });
    } catch (studyError) {
      console.error(`Failed to publish study for ${codeName}:`, studyError);
    }

    return {
      ok: true,
      task_id: task.id,
      agent_id: agent.id,
      output,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown agent error";

    await admin.from("agent_logs").insert({
      agent_id: agent.id,
      agent_code_name: codeName,
      task_id: task.id,
      action,
      input: payload,
      error: message,
      duration_ms: Date.now() - startMs,
      model: "hybrid",
    });

    await admin
      .from("agent_tasks")
      .update({
        status: "failed",
        error: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    await admin
      .from("agent_registry")
      .update({
        status: "error",
        last_run_at: new Date().toISOString(),
      })
      .eq("id", agent.id);

    throw error;
  }
}

export async function sendAgentMessage(fromAgent: string, toAgent: string, subject: string, content: Record<string, unknown>) {
  await admin
    .from("agent_messages")
    .insert({
      from_agent: fromAgent,
      to_agent: toAgent,
      type: "request",
      subject,
      content,
      status: "processed",
      processed_at: new Date().toISOString(),
    });
}

/**
 * Call an external API through the api-gateway Edge Function.
 * The gateway checks agent permissions (allowed_apis) and logs usage.
 *
 * Usage: const data = await callApi("hunter", "hubspot", "/crm/v3/objects/contacts");
 */
export async function callApi(
  agentCodeName: string,
  apiName: string,
  endpoint: string,
  options?: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  },
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for callApi");
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/api-gateway`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      agent: agentCodeName,
      api: apiName,
      endpoint,
      method: options?.method || "GET",
      params: options?.params || {},
      body: options?.body || null,
    }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || `API call failed: ${apiName}${endpoint} → ${res.status}`);
  }

  return data.data ?? data;
}
