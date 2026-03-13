#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function parseEnvContent(content) {
  const parsed = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2] ?? "";
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function loadEnvFile(relativePath) {
  const filePath = path.resolve(projectRoot, relativePath);
  if (!existsSync(filePath)) return {};
  return parseEnvContent(readFileSync(filePath, "utf8"));
}

function resolveEnv(keys) {
  const fromDotEnv = loadEnvFile(".env");
  const fromDeployEnv = loadEnvFile("supabase/.env.deploy");
  const merged = {
    ...fromDotEnv,
    ...fromDeployEnv,
    ...process.env,
  };
  const out = {};
  for (const key of keys) out[key] = merged[key] || "";
  return out;
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function compact(value) {
  return value == null ? "" : String(value).trim();
}

function parseArgs(argv) {
  const args = {
    strict: false,
    bootstrapWhatsApp: false,
    syncGmail: false,
  };
  for (const token of argv) {
    if (token === "--strict") args.strict = true;
    if (token === "--bootstrap-whatsapp") args.bootstrapWhatsApp = true;
    if (token === "--sync-gmail") args.syncGmail = true;
  }
  return args;
}

async function callFunction({ baseUrl, serviceKey, functionName, body }) {
  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch {
    json = { raw };
  }

  return {
    status: response.status,
    ok: response.ok,
    data: json,
  };
}

function buildMarkdown(report) {
  const lines = [];
  lines.push("# Provider Runtime Smoke");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Strict mode: ${report.flags.strict ? "on" : "off"}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Outbound ready (gmail): ${report.runtime.summary.outbound_ready.gmail}`);
  lines.push(`- Outbound ready (whatsapp): ${report.runtime.summary.outbound_ready.whatsapp}`);
  lines.push(`- Inbound ready (gmail): ${report.runtime.summary.inbound_ready.gmail}`);
  lines.push(`- Inbound ready (whatsapp): ${report.runtime.summary.inbound_ready.whatsapp}`);
  lines.push(`- Active channels: ${report.channels_summary.active}`);
  lines.push("");
  lines.push("## Missing Required");
  lines.push("");
  lines.push(`- Gmail: ${report.runtime.providers.gmail.required_missing.join(", ") || "none"}`);
  lines.push(`- WhatsApp: ${report.runtime.providers.whatsapp.required_missing.join(", ") || "none"}`);
  lines.push("");
  lines.push("## Actions");
  lines.push("");
  lines.push(`- WhatsApp bootstrap attempted: ${report.actions.whatsapp_bootstrap.attempted}`);
  lines.push(`- WhatsApp bootstrap created_or_updated: ${report.actions.whatsapp_bootstrap.created_or_updated}`);
  lines.push(`- Gmail sync attempted: ${report.actions.gmail_sync.attempted}`);
  lines.push(`- Gmail sync ok: ${report.actions.gmail_sync.ok}`);
  lines.push("");
  lines.push("## Artifacts");
  lines.push("");
  lines.push(`- JSON: \`${report.artifacts.json_path}\``);
  lines.push(`- Markdown: \`${report.artifacts.markdown_path}\``);
  return `${lines.join("\n")}\n`;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const env = resolveEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const baseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  assertCondition(baseUrl, "Missing SUPABASE_URL (env/.env/supabase/.env.deploy).");
  assertCondition(serviceKey, "Missing SUPABASE_SERVICE_ROLE_KEY (env/.env/supabase/.env.deploy).");

  const statusRes = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "messaging-channel-oauth",
    body: {
      action: "runtime_status",
    },
  });
  assertCondition(statusRes.status === 200, `runtime_status failed with status ${statusRes.status}`);
  assertCondition(statusRes.data?.ok === true, "runtime_status did not return ok=true");

  const runtime = statusRes.data.runtime || {};
  const channels = Array.isArray(statusRes.data.channels) ? statusRes.data.channels : [];
  const channelsSummary = statusRes.data.channels_summary || { total: channels.length, active: 0 };

  const actions = {
    whatsapp_bootstrap: {
      attempted: false,
      created_or_updated: false,
      channel_id: null,
      error: null,
    },
    gmail_sync: {
      attempted: false,
      ok: false,
      synced: null,
      history_id: null,
      error: null,
    },
  };

  if (args.bootstrapWhatsApp) {
    actions.whatsapp_bootstrap.attempted = true;
    if (runtime.providers?.whatsapp?.capabilities?.outbound_dispatch) {
      const bootstrapRes = await callFunction({
        baseUrl,
        serviceKey,
        functionName: "messaging-channel-oauth",
        body: {
          action: "bootstrap_whatsapp",
        },
      });
      if (bootstrapRes.ok && bootstrapRes.data?.ok) {
        actions.whatsapp_bootstrap.created_or_updated = true;
        actions.whatsapp_bootstrap.channel_id = compact(bootstrapRes.data?.channel?.id) || null;
      } else {
        actions.whatsapp_bootstrap.error = bootstrapRes.data?.error || `HTTP ${bootstrapRes.status}`;
      }
    } else {
      actions.whatsapp_bootstrap.error = "whatsapp runtime is not outbound-ready";
    }
  }

  if (args.syncGmail) {
    actions.gmail_sync.attempted = true;
    const gmailChannel = channels.find((channel) => channel.type === "email" && channel.status === "active");
    if (gmailChannel && runtime.providers?.gmail?.capabilities?.inbound_manual_sync) {
      const syncRes = await callFunction({
        baseUrl,
        serviceKey,
        functionName: "gmail-inbound",
        body: {
          action: "sync",
          channel_id: gmailChannel.id,
        },
      });
      if (syncRes.ok && syncRes.data?.ok) {
        actions.gmail_sync.ok = true;
        actions.gmail_sync.synced = Number(syncRes.data?.synced ?? 0);
        actions.gmail_sync.history_id = compact(syncRes.data?.historyId) || null;
      } else {
        actions.gmail_sync.error = syncRes.data?.error || `HTTP ${syncRes.status}`;
      }
    } else {
      actions.gmail_sync.error = "no active gmail channel or runtime not ready for sync";
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    flags: args,
    runtime,
    channels_summary: channelsSummary,
    channels: channels.map((channel) => ({
      id: channel.id,
      type: channel.type,
      provider: channel.provider,
      status: channel.status,
      is_default: channel.is_default,
      email_address: channel.email_address || null,
      phone_number: channel.phone_number || null,
      last_error: channel.last_error || null,
      updated_at: channel.updated_at || null,
    })),
    actions,
    artifacts: {
      json_path: "docs/runbooks/provider-runtime-smoke.latest.json",
      markdown_path: "docs/runbooks/provider-runtime-smoke.md",
    },
  };

  if (args.strict) {
    assertCondition(
      Boolean(runtime?.summary?.outbound_ready?.gmail),
      `Strict mode failed: Gmail outbound runtime not ready (${(runtime.providers?.gmail?.required_missing || []).join(", ")})`,
    );
    assertCondition(
      Boolean(runtime?.summary?.outbound_ready?.whatsapp),
      `Strict mode failed: WhatsApp outbound runtime not ready (${(runtime.providers?.whatsapp?.required_missing || []).join(", ")})`,
    );
  }

  const runbookDir = path.resolve(projectRoot, "docs/runbooks");
  await mkdir(runbookDir, { recursive: true });
  const jsonPath = path.resolve(runbookDir, "provider-runtime-smoke.latest.json");
  const markdownPath = path.resolve(runbookDir, "provider-runtime-smoke.md");

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, buildMarkdown(report), "utf8");

  console.log(JSON.stringify({
    ok: true,
    artifacts: report.artifacts,
    summary: {
      outbound_ready: runtime.summary?.outbound_ready || {},
      inbound_ready: runtime.summary?.inbound_ready || {},
      active_channels: channelsSummary.active ?? 0,
      whatsapp_bootstrap: actions.whatsapp_bootstrap.created_or_updated,
      gmail_sync_ok: actions.gmail_sync.ok,
    },
  }, null, 2));
}

run().catch((error) => {
  console.error("[smoke-provider-runtime] failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

