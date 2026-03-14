#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
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

const env = resolveEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SERVICE_ROLE_KEY"]);
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const endpoint = `${SUPABASE_URL}/functions/v1/control-plane`;

async function call(action, body = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE}`,
      "apikey": SERVICE_ROLE,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, body: json };
}

async function main() {
  const parse = await call("goal_parse", {
    goal_spec: {
      goal_text: "Launch a lead discovery campaign for legal firms in Madrid.",
      goal_type: "lead_discovery",
      goal_risk_level: "medium",
    },
  });

  const metrics = await call("metrics", {
    window_hours: 24,
  });

  const readiness = await call("ecosystem_readiness", {
    window_hours: 24,
  });

  const readinessPayload = readiness.body?.data?.readiness || readiness.body?.readiness || null;
  const traceCorrelationId = readinessPayload?.records?.[0]?.correlation_id || null;
  const runTrace = traceCorrelationId
    ? await call("run_trace", {
      correlation_id: traceCorrelationId,
      context: { correlation_id: traceCorrelationId },
    })
    : { status: 200, body: { skipped: true, reason: "no correlation_id from readiness snapshot" } };

  console.log(JSON.stringify({
    ok: parse.status < 300 && metrics.status < 300 && readiness.status < 300 && runTrace.status < 300,
    endpoint,
    actions: {
      goal_parse: parse,
      metrics,
      ecosystem_readiness: readiness,
      run_trace: runTrace,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
