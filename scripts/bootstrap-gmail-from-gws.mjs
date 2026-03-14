#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

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
  const merged = {
    ...loadEnvFile(".env"),
    ...loadEnvFile("supabase/.env.deploy"),
    ...process.env,
  };
  const out = {};
  for (const key of keys) out[key] = merged[key] || "";
  return out;
}

function parseArgs(argv) {
  const args = {
    orgId: "",
    channelId: "",
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--org-id" && argv[i + 1]) {
      args.orgId = String(argv[i + 1]).trim();
      i += 1;
    } else if (token === "--channel-id" && argv[i + 1]) {
      args.channelId = String(argv[i + 1]).trim();
      i += 1;
    } else if (token === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

function extractJson(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Could not find JSON payload in gws output");
  }
  return JSON.parse(text.slice(first, last + 1));
}

function normalizeScopes(input) {
  if (Array.isArray(input)) {
    return [...new Set(input.map((entry) => String(entry || "").trim()).filter(Boolean))];
  }
  const text = String(input || "").trim();
  if (!text) return [];
  return [...new Set(text.split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean))];
}

function normalizeTokenExpiry(credentials) {
  const candidates = [
    credentials.expiry_date,
    credentials.expiryDate,
    credentials.expires_at,
    credentials.expiresAt,
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber) && asNumber > 0) {
      const ms = asNumber > 9999999999 ? asNumber : asNumber * 1000;
      const iso = new Date(ms).toISOString();
      if (!Number.isNaN(new Date(iso).getTime())) return iso;
      continue;
    }
    const asDate = new Date(String(raw));
    if (!Number.isNaN(asDate.getTime())) return asDate.toISOString();
  }
  return new Date(Date.now() + 3600 * 1000).toISOString();
}

function sanitizeError(error) {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function fetchGmailProfile(accessToken) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gmail profile fetch failed: HTTP ${response.status}`);
  }
  return payload;
}

async function resolveChannel({ supabase, channelId, orgId }) {
  if (channelId) {
    const { data, error } = await supabase
      .from("messaging_channels")
      .select("*")
      .eq("id", channelId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  let query = supabase
    .from("messaging_channels")
    .select("*")
    .eq("type", "email")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (orgId) query = query.eq("org_id", orgId);
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = resolveEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const exportResult = spawnSync("gws", ["auth", "export"], {
    cwd: projectRoot,
    encoding: "utf8",
    env: process.env,
  });
  if (exportResult.status !== 0) {
    const details = [exportResult.stdout, exportResult.stderr].filter(Boolean).join("\n");
    throw new Error(`gws auth export failed. Run 'npm run gws -- auth login -s gmail' first.\n${details}`.trim());
  }

  const credentials = extractJson(exportResult.stdout || "{}");
  const accessToken = String(credentials.access_token || "").trim();
  const refreshToken = String(credentials.refresh_token || "").trim();
  if (!accessToken || !refreshToken) {
    throw new Error("gws credentials are missing access_token or refresh_token. Re-run gws auth login.");
  }

  const profile = await fetchGmailProfile(accessToken);
  const emailAddress = String(profile.emailAddress || "").trim();
  if (!emailAddress) throw new Error("Gmail profile did not return emailAddress.");

  const scope = normalizeScopes(credentials.scope);
  const tokenExpiresAt = normalizeTokenExpiry(credentials);
  const nowIso = new Date().toISOString();

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const existing = await resolveChannel({
    supabase,
    channelId: args.channelId,
    orgId: args.orgId || "",
  });

  const metadata = {
    ...(existing?.metadata && typeof existing.metadata === "object" ? existing.metadata : {}),
    oauth_state: null,
    source: "gws_cli",
    gws_bootstrapped_at: nowIso,
    email: emailAddress,
  };

  const payload = {
    user_id: existing?.user_id ?? null,
    org_id: args.orgId || existing?.org_id || null,
    name: `Gmail · ${emailAddress}`,
    type: "email",
    provider: "gmail",
    status: "active",
    is_default: true,
    email_address: emailAddress,
    access_token: accessToken,
    refresh_token: refreshToken,
    token_expires_at: tokenExpiresAt,
    scope,
    last_history_id: Number(profile.historyId || 0) || null,
    last_sync_at: nowIso,
    last_error: null,
    metadata,
  };

  if (args.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      mode: "dry_run",
      action: existing ? "update" : "insert",
      target_channel_id: existing?.id || null,
      payload_preview: {
        ...payload,
        access_token: "***redacted***",
        refresh_token: "***redacted***",
      },
    }, null, 2));
    return;
  }

  let channel = null;
  if (existing) {
    const { data, error } = await supabase
      .from("messaging_channels")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    channel = data;
  } else {
    const { data, error } = await supabase
      .from("messaging_channels")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    channel = data;
  }

  console.log(JSON.stringify({
    ok: true,
    mode: "apply",
    action: existing ? "updated" : "inserted",
    channel: {
      id: channel?.id || null,
      org_id: channel?.org_id || null,
      type: channel?.type || null,
      provider: channel?.provider || null,
      status: channel?.status || null,
      email_address: channel?.email_address || null,
      token_expires_at: channel?.token_expires_at || null,
    },
    next: [
      "node scripts/smoke-provider-runtime.mjs --sync-gmail",
      "npm run readiness:gate",
    ],
  }, null, 2));
}

main().catch((error) => {
  console.error("[bootstrap-gmail-from-gws] failed");
  console.error(sanitizeError(error));
  process.exit(1);
});

