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

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
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

async function run() {
  const env = resolveEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const baseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  assertCondition(baseUrl, "Missing SUPABASE_URL (env/.env/supabase/.env.deploy).");
  assertCondition(serviceKey, "Missing SUPABASE_SERVICE_ROLE_KEY (env/.env/supabase/.env.deploy).");

  const orgQuery = await fetch(
    `${baseUrl}/rest/v1/organizations?select=id&order=created_at.asc&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  );
  const orgRows = await orgQuery.json();
  const orgId = Array.isArray(orgRows) ? String(orgRows[0]?.id || "") : "";
  assertCondition(Boolean(orgId), "Could not resolve org_id from organizations table.");

  const runId = crypto.randomUUID();
  const summary = {
    org_id: orgId,
    governor_check: {},
    governor_metrics: {},
    governor_escalate: {},
  };

  console.log("[smoke-governor] 1/3 governor_check");
  const checkResult = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "orchestration-engine",
    body: {
      action: "governor_check",
      org_id: orgId,
      target_type: "pipeline_step",
      target_id: `smoke-governor-step-${runId}`,
      target_ref: "smoke_governor_runtime",
      source: "smoke-governor-runtime",
      source_agent: "smoke-governor-runtime",
      risk_class: "high",
      context: {
        policy: {
          approval_granted: false,
        },
      },
    },
  });
  assertCondition(checkResult.status === 200, `governor_check failed with status ${checkResult.status}`);
  assertCondition(checkResult.data?.ok === true, "governor_check response did not return ok=true");
  assertCondition(
    checkResult.data?.governance?.allowed === false,
    "governor_check should block high-risk run without approval",
  );
  summary.governor_check = {
    allowed: checkResult.data.governance.allowed,
    decision: checkResult.data.governance.decision,
    reason: checkResult.data.governance.reason,
  };

  console.log("[smoke-governor] 2/3 governor_metrics");
  const metricsResult = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "orchestration-engine",
    body: {
      action: "governor_metrics",
      org_id: orgId,
      window_hours: 24,
    },
  });
  assertCondition(metricsResult.status === 200, `governor_metrics failed with status ${metricsResult.status}`);
  assertCondition(metricsResult.data?.ok === true, "governor_metrics response did not return ok=true");
  assertCondition(
    metricsResult.data?.metrics?.org_id === orgId,
    "governor_metrics returned unexpected org_id",
  );
  summary.governor_metrics = {
    active_guardrails: metricsResult.data.metrics.counts?.active_guardrails ?? null,
    active_policies: metricsResult.data.metrics.counts?.active_policies ?? null,
    open_risk_cases: metricsResult.data.metrics.backlog?.open_risk_cases ?? null,
    escalations_window: metricsResult.data.metrics.risk?.escalations_window ?? null,
  };

  console.log("[smoke-governor] 3/3 governor_escalate");
  const escalationResult = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "orchestration-engine",
    body: {
      action: "governor_escalate",
      org_id: orgId,
      source_agent: "smoke-governor-runtime",
      severity: "high",
      category: "operational",
      title: "Smoke escalation check",
      description: "Synthetic escalation to validate governor runtime endpoint.",
      metadata: {
        smoke: true,
        run_id: runId,
      },
    },
  });
  assertCondition(escalationResult.status === 200, `governor_escalate failed with status ${escalationResult.status}`);
  assertCondition(escalationResult.data?.ok === true, "governor_escalate response did not return ok=true");
  assertCondition(
    escalationResult.data?.escalation?.created === true,
    "governor_escalate should persist a risk case for valid org scope",
  );
  assertCondition(
    Boolean(escalationResult.data?.escalation?.risk_case_id),
    "governor_escalate did not return risk_case_id",
  );
  summary.governor_escalate = {
    created: escalationResult.data.escalation.created,
    risk_case_id: escalationResult.data.escalation.risk_case_id,
  };

  console.log("[smoke-governor] success");
  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}

run().catch((error) => {
  console.error("[smoke-governor] failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

