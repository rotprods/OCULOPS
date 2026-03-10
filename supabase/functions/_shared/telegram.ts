import { compact } from "./http.ts";

const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const defaultChatId = Deno.env.get("TELEGRAM_CHAT_ID");
const defaultThreadId = Deno.env.get("TELEGRAM_THREAD_ID");

type TelegramTarget = {
  id?: string | null;
  label?: string | null;
  chat_id?: string | null;
  thread_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

function truncate(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function normalizeLines(values: Array<string | null | undefined>) {
  return values
    .map(value => compact(value))
    .filter(Boolean)
    .join("\n");
}

export function resolveFallbackTelegramTarget() {
  if (!compact(defaultChatId)) return null;

  return {
    id: "env-default",
    label: "Default Telegram target",
    chat_id: compact(defaultChatId),
    thread_id: compact(defaultThreadId) || null,
    metadata: {},
  };
}

export function formatAgentStudyTelegramMessage(study: {
  agent_code_name?: string | null;
  title?: string | null;
  summary?: string | null;
  content_markdown?: string | null;
  highlights?: unknown;
  source?: string | null;
  study_type?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const highlights = Array.isArray(study.highlights)
    ? study.highlights.map(item => compact(item)).filter(Boolean).slice(0, 5)
    : [];
  const header = normalizeLines([
    `🤖 ${compact(study.agent_code_name).toUpperCase() || "AGENT"} · ${compact(study.study_type) || "study"}`,
    compact(study.title),
  ]);
  const summary = compact(study.summary) || compact(study.content_markdown);
  const highlightsBlock = highlights.length > 0
    ? `\nHighlights:\n${highlights.map(item => `- ${item}`).join("\n")}`
    : "";
  const footer = normalizeLines([
    "",
    `Source: ${compact(study.source) || "manual"}`,
    compact(study.metadata?.task_id) ? `Task: ${compact(study.metadata?.task_id)}` : "",
  ]);

  return truncate(`${header}\n\n${truncate(summary, 2500)}${highlightsBlock}${footer}`.trim(), 4000);
}

export async function sendTelegramMessage(target: TelegramTarget, text: string) {
  if (!telegramBotToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const chatId = compact(target.chat_id) || compact(defaultChatId);
  if (!chatId) {
    throw new Error("Telegram chat_id is not configured");
  }

  const threadId = compact(target.thread_id) || compact(defaultThreadId) || null;
  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      ...(threadId ? { message_thread_id: Number(threadId) || threadId } : {}),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(typeof data?.description === "string" ? data.description : `Telegram send failed (${response.status})`);
  }

  return data;
}
