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

  const blockedCorrelationId = crypto.randomUUID();
  const passCorrelationId = crypto.randomUUID();
  const evalCorrelationId = crypto.randomUUID();
  const summary = {
    orchestration: {},
    simulation: {},
    evaluation: {},
  };

  console.log("[smoke] 1/4 orchestration taxonomy");
  const listTaxonomy = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "orchestration-engine",
    body: { action: "list_taxonomy", limit: 3 },
  });
  assertCondition(listTaxonomy.status === 200, `list_taxonomy failed with status ${listTaxonomy.status}`);
  assertCondition(listTaxonomy.data?.ok === true, "list_taxonomy response did not return ok=true");
  const entries = Array.isArray(listTaxonomy.data?.entries) ? listTaxonomy.data.entries : [];
  summary.orchestration.entries = entries.length;

  if (entries.length > 0) {
    const firstRunId = entries[0]?.pipeline_run?.id || null;
    assertCondition(Boolean(firstRunId), "First taxonomy entry missing pipeline_run.id");
    const getRunTax = await callFunction({
      baseUrl,
      serviceKey,
      functionName: "orchestration-engine",
      body: { action: "get_run_taxonomy", pipeline_run_id: firstRunId },
    });
    assertCondition(getRunTax.status === 200, `get_run_taxonomy failed with status ${getRunTax.status}`);
    assertCondition(Boolean(getRunTax.data?.taxonomy?.class), "taxonomy.class missing in get_run_taxonomy");
    summary.orchestration.first_run_id = firstRunId;
    summary.orchestration.first_taxonomy_class = getRunTax.data.taxonomy.class;
  } else {
    summary.orchestration.note = "No pipeline runs found; taxonomy detail check skipped.";
  }

  console.log("[smoke] 2/4 simulation blocked gate");
  const blockedSimulation = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "simulation-engine",
    body: {
      action: "run",
      mode: "shadow",
      target_type: "pipeline_step",
      target_id: "smoke-blocked",
      risk_class: "high",
      target_environment: "production",
      correlation_id: blockedCorrelationId,
      source_agent: "ag2-smoke",
      input_snapshot: {
        action: "send_whatsapp_message",
        correlation_id: blockedCorrelationId,
        approval_required: false,
        approval_granted: false,
      },
    },
  });
  assertCondition(blockedSimulation.status === 200, `simulation blocked run failed with status ${blockedSimulation.status}`);
  assertCondition(blockedSimulation.data?.ok === true, "simulation blocked run did not return ok=true");
  assertCondition(blockedSimulation.data?.result?.status === "failed", "blocked simulation should be failed");
  assertCondition(
    blockedSimulation.data?.result?.policy_gate_passed === false,
    "blocked simulation should have policy_gate_passed=false",
  );
  summary.simulation.blocked = {
    simulation_id: blockedSimulation.data.result.simulation_id,
    status: blockedSimulation.data.result.status,
    recommended_action: blockedSimulation.data.result.recommended_action,
  };

  console.log("[smoke] 3/4 simulation pass + replay");
  const passSimulation = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "simulation-engine",
    body: {
      action: "run",
      mode: "dry_run",
      target_type: "pipeline_step",
      target_id: "smoke-pass",
      risk_class: "medium",
      target_environment: "staging",
      correlation_id: passCorrelationId,
      source_agent: "ag2-smoke",
      input_snapshot: {
        action: "inspect_pipeline_state",
        correlation_id: passCorrelationId,
      },
    },
  });
  assertCondition(passSimulation.status === 200, `simulation pass run failed with status ${passSimulation.status}`);
  assertCondition(passSimulation.data?.result?.status === "passed", "pass simulation should be passed");
  assertCondition(
    passSimulation.data?.result?.policy_gate_passed === true,
    "pass simulation should have policy_gate_passed=true",
  );

  const replaySimulation = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "simulation-engine",
    body: {
      action: "replay",
      simulation_id: passSimulation.data.result.simulation_id,
      source_agent: "ag2-smoke",
    },
  });
  assertCondition(replaySimulation.status === 200, `simulation replay failed with status ${replaySimulation.status}`);
  assertCondition(replaySimulation.data?.result?.mode === "replay", "replay should return mode=replay");
  assertCondition(
    ["passed", "failed"].includes(replaySimulation.data?.result?.status),
    "replay should return a valid status",
  );
  summary.simulation.pass = {
    simulation_id: passSimulation.data.result.simulation_id,
    status: passSimulation.data.result.status,
  };
  summary.simulation.replay = {
    simulation_id: replaySimulation.data.result.simulation_id,
    status: replaySimulation.data.result.status,
  };

  console.log("[smoke] 4/4 evaluation critic");
  const evaluation = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "evaluation-engine",
    body: {
      action: "evaluate",
      artifact_type: "smoke_runtime_artifact",
      impact_level: "high",
      correlation_id: evalCorrelationId,
      source_agent: "ag2-smoke",
      artifact_payload: {
        ok: false,
        status: "failed",
        error: "synthetic failure for critic scoring",
        policy: { violation: true },
        metrics: { total_tokens: 15000, tool_calls: 18 },
        summary: "synthetic failed execution",
      },
    },
  });
  assertCondition(evaluation.status === 200, `evaluation run failed with status ${evaluation.status}`);
  assertCondition(evaluation.data?.ok === true, "evaluation run did not return ok=true");
  assertCondition(Boolean(evaluation.data?.result?.evaluation_id), "evaluation_id missing");
  assertCondition(
    ["escalate", "reject", "retry", "pass"].includes(evaluation.data?.result?.decision),
    "evaluation decision is invalid",
  );

  const evaluationId = evaluation.data.result.evaluation_id;
  const getEvaluation = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "evaluation-engine",
    body: { action: "get", evaluation_id: evaluationId },
  });
  assertCondition(getEvaluation.status === 200, `evaluation get failed with status ${getEvaluation.status}`);
  assertCondition(getEvaluation.data?.ok === true, "evaluation get did not return ok=true");

  summary.evaluation = {
    evaluation_id: evaluationId,
    decision: evaluation.data.result.decision,
    overall_score: evaluation.data.result.overall_score,
    threshold: evaluation.data.result.threshold,
  };

  console.log("[smoke] success");
  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}

run().catch((error) => {
  console.error("[smoke] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
