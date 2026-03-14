#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const runbooksDir = path.resolve(projectRoot, "docs/runbooks");
const jsonPath = path.resolve(runbooksDir, "ecosystem-readiness.latest.json");
const markdownPath = path.resolve(runbooksDir, "ecosystem-readiness.md");

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

function extractReadinessPayload(result) {
  if (!result || typeof result !== "object") return null;
  if (result.readiness && typeof result.readiness === "object") return result.readiness;
  if (result.data?.readiness && typeof result.data.readiness === "object") return result.data.readiness;
  return null;
}

function toIso(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString();
}

function renderMarkdown(readiness, meta) {
  const records = Array.isArray(readiness.records) ? readiness.records : [];
  const smokes = Array.isArray(readiness.smokes) ? readiness.smokes : [];
  const failures = Array.isArray(readiness.failures) ? readiness.failures : [];
  const governance = readiness.governance_metrics || {};

  const lines = [];
  lines.push("# Ecosystem Readiness");
  lines.push("");
  lines.push(`Generated: ${toIso(readiness.generated_at)}`);
  lines.push(`Version: ${readiness.version || "unknown"}`);
  lines.push(`Overall state: ${String(readiness.overall_state || "unknown").toUpperCase()}`);
  lines.push(`Window: ${meta.windowHours}h`);
  lines.push("");
  lines.push("## Governance");
  lines.push("");
  lines.push(`- Dispatch total: ${governance.dispatch_total ?? 0}`);
  lines.push(`- Blocked total: ${governance.blocked_total ?? 0}`);
  lines.push(`- Approval pending: ${governance.approval_pending_total ?? 0}`);
  lines.push(`- High-risk routed: ${governance.high_risk_routed_total ?? 0}`);
  lines.push(`- Trace coverage: ${((Number(governance.tool_bus_trace_coverage || 0)) * 100).toFixed(2)}%`);
  lines.push("");
  lines.push("## Module States");
  lines.push("");
  lines.push("| module | state | reason_code | last_success_at | route | smoke_case |");
  lines.push("|---|---|---|---|---|---|");
  for (const row of records) {
    lines.push(
      `| ${row.module_key || "—"} | ${row.state || "—"} | ${row.state_reason_code || "—"} | ${toIso(row.last_success_at)} | ${row.route || "—"} | ${row.smoke_case_id || "—"} |`,
    );
  }
  lines.push("");
  lines.push("## Smoke Checks");
  lines.push("");
  lines.push("| smoke_case_id | status | checked_at | evidence_count |");
  lines.push("|---|---|---|---|");
  for (const smoke of smokes) {
    lines.push(
      `| ${smoke.smoke_case_id || "—"} | ${smoke.status || "—"} | ${toIso(smoke.checked_at)} | ${smoke.evidence_count ?? 0} |`,
    );
  }
  lines.push("");
  lines.push("## Failures");
  lines.push("");
  if (failures.length === 0) {
    lines.push("- none");
  } else {
    for (const failure of failures) {
      lines.push(
        `- ${failure.module_key || "unknown"} (${failure.state || "unknown"}) — ${failure.reason || failure.reason_code || "no reason"} → ${failure.remediation_action || "n/a"}`,
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const env = resolveEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const baseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const windowHours = Math.max(1, Math.min(168, Number(process.env.READINESS_WINDOW_HOURS || 24)));
  const orgId = process.env.READINESS_ORG_ID || null;

  if (!baseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const response = await fetch(`${baseUrl}/functions/v1/control-plane`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({
      action: "ecosystem_readiness",
      org_id: orgId,
      window_hours: windowHours,
    }),
  });

  const raw = await response.text();
  let json = {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Invalid JSON from control-plane: ${raw.slice(0, 200)}`);
  }

  if (!response.ok) {
    const message = json?.error || json?.message || `HTTP ${response.status}`;
    throw new Error(`control-plane ecosystem_readiness failed: ${message}`);
  }

  const readiness = extractReadinessPayload(json);
  if (!readiness) {
    throw new Error("Readiness payload missing in control-plane response.");
  }

  if (!existsSync(runbooksDir)) mkdirSync(runbooksDir, { recursive: true });

  writeFileSync(jsonPath, JSON.stringify(readiness, null, 2));
  const markdown = renderMarkdown(readiness, { windowHours });
  writeFileSync(markdownPath, markdown);

  console.log(JSON.stringify({
    ok: true,
    overall_state: readiness.overall_state,
    records: Array.isArray(readiness.records) ? readiness.records.length : 0,
    failures: Array.isArray(readiness.failures) ? readiness.failures.length : 0,
    artifacts: {
      json_path: "docs/runbooks/ecosystem-readiness.latest.json",
      markdown_path: "docs/runbooks/ecosystem-readiness.md",
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
