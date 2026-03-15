#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const token = process.argv[i];
  if (!token.startsWith("--")) continue;
  const key = token.slice(2);
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) {
    args.set(key, "true");
  } else {
    args.set(key, next);
    i += 1;
  }
}

const mode = String(args.get("mode") || process.env.READINESS_GATE_MODE || "synthetic").toLowerCase();
const readinessFile = String(
  args.get("file") ||
    process.env.READINESS_GATE_FILE ||
    "docs/runbooks/ecosystem-readiness.latest.json",
);
const maxAgeHours = Math.max(1, Math.min(240, Number(args.get("max-age-hours") || process.env.READINESS_MAX_AGE_HOURS || 36)));

const VALID_STATES = new Set(["connected", "simulated", "degraded", "offline", "planned"]);
const BASE_MODULE_KEYS = [
  "control_tower",
  "governance",
  "orchestration",
  "automation",
  "variable_control_plane_v2",
  "api_catalog",
  "n8n_catalog",
  "simulation",
  "messaging",
  "connector_proxy",
  "marketplace",
];
const DEFAULT_PRODUCTION_CRITICAL_MODULES = [
  "control_tower",
  "governance",
  "orchestration",
  "connector_proxy",
  "variable_control_plane_v2",
];
const DEFAULT_PRODUCTION_NON_CRITICAL_STATES = ["connected", "simulated", "degraded", "planned"];

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function parseCsvList(raw, fallback = []) {
  if (!raw || String(raw).trim() === "") return [...fallback];
  const items = String(raw)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(items));
}

function parseAllowedStates(raw, fallback = []) {
  const states = parseCsvList(raw, fallback)
    .filter((state) => VALID_STATES.has(state));
  if (states.length === 0) return [...fallback];
  return states;
}

function compactString(value) {
  const normalized = value === undefined || value === null ? "" : String(value);
  const trimmed = normalized.trim();
  return trimmed.length > 0 ? trimmed : "";
}

const productionCriticalModules = parseCsvList(
  args.get("critical-modules") || process.env.READINESS_PRODUCTION_CRITICAL_MODULES,
  DEFAULT_PRODUCTION_CRITICAL_MODULES,
);
const productionNonCriticalStates = parseAllowedStates(
  args.get("production-non-critical-states") || process.env.READINESS_PRODUCTION_NON_CRITICAL_STATES,
  DEFAULT_PRODUCTION_NON_CRITICAL_STATES,
);
const productionStrictAllConnected = parseBoolean(
  args.get("production-strict-all-connected") || process.env.READINESS_PRODUCTION_STRICT_ALL_CONNECTED,
  false,
);
const productionExpectedOrgId = compactString(args.get("org-id") || process.env.READINESS_ORG_ID);

const productionRequiredModules = Object.fromEntries(
  BASE_MODULE_KEYS.map((moduleKey) => {
    if (productionStrictAllConnected) return [moduleKey, ["connected"]];
    if (productionCriticalModules.includes(moduleKey)) return [moduleKey, ["connected"]];
    return [moduleKey, productionNonCriticalStates];
  }),
);
for (const moduleKey of productionCriticalModules) {
  productionRequiredModules[moduleKey] = ["connected"];
}

const policyByMode = {
  synthetic: {
    disallowOverall: [],
    requiredSmokes: [
      "hard_block_routing",
      "ag2_c6_synthetic",
      "governor_runtime",
    ],
    requiredModules: {
      control_tower: ["connected", "degraded"],
      governance: ["connected", "degraded"],
      orchestration: ["connected", "simulated", "degraded"],
      automation: ["connected", "simulated", "degraded"],
      variable_control_plane_v2: ["connected", "simulated", "degraded", "planned"],
      api_catalog: ["connected", "simulated", "degraded"],
      n8n_catalog: ["connected", "simulated", "degraded"],
      simulation: ["connected", "simulated", "degraded"],
      messaging: ["connected", "simulated", "degraded", "offline"],
      connector_proxy: ["connected", "simulated", "degraded", "offline"],
      marketplace: ["connected", "simulated", "degraded", "offline"],
    },
    minRecordCount: 8,
  },
  production: {
    disallowOverall: ["red"],
    requiredSmokes: [
      "hard_block_routing",
      "ag2_c6_synthetic",
      "governor_runtime",
    ],
    requiredModules: productionRequiredModules,
    minRecordCount: 10,
  },
};

if (!Object.prototype.hasOwnProperty.call(policyByMode, mode)) {
  console.error(`Unsupported gate mode: ${mode}`);
  process.exit(1);
}

const policy = policyByMode[mode];
const absoluteFile = path.resolve(projectRoot, readinessFile);
if (!existsSync(absoluteFile)) {
  console.error(`Readiness artifact not found: ${absoluteFile}`);
  process.exit(1);
}

let readiness = null;
try {
  readiness = JSON.parse(readFileSync(absoluteFile, "utf8"));
} catch (error) {
  console.error(`Failed to parse readiness artifact: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const failures = [];
const warnings = [];
const records = Array.isArray(readiness?.records) ? readiness.records : [];
const smokes = Array.isArray(readiness?.smokes) ? readiness.smokes : [];
const recordsByKey = new Map(records.map((row) => [String(row.module_key || ""), row]));
const smokeById = new Map(smokes.map((row) => [String(row.smoke_case_id || ""), row]));
const governanceOrgId = compactString(readiness?.governance_metrics?.org_id);

if (!readiness?.generated_at) {
  failures.push("missing generated_at");
} else {
  const generatedEpoch = new Date(readiness.generated_at).getTime();
  if (!Number.isFinite(generatedEpoch)) {
    failures.push("generated_at is not a valid timestamp");
  } else {
    const ageMs = Date.now() - generatedEpoch;
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    if (ageMs > maxAgeMs) {
      failures.push(`artifact is stale (${(ageMs / 3600000).toFixed(2)}h > ${maxAgeHours}h)`);
    }
  }
}

if (records.length < policy.minRecordCount) {
  failures.push(`record count too low (${records.length} < ${policy.minRecordCount})`);
}

const overallState = String(readiness?.overall_state || "").toLowerCase();
if (policy.disallowOverall.includes(overallState)) {
  failures.push(`overall_state=${overallState} is not allowed in ${mode} mode`);
}

for (const smokeId of policy.requiredSmokes) {
  const smoke = smokeById.get(smokeId);
  if (!smoke) {
    failures.push(`missing smoke case: ${smokeId}`);
    continue;
  }
  const status = String(smoke.status || "").toLowerCase();
  if (status !== "pass") {
    failures.push(`smoke ${smokeId} not passing (status=${status || "unknown"})`);
  }
}

for (const [moduleKey, allowedStates] of Object.entries(policy.requiredModules)) {
  const row = recordsByKey.get(moduleKey);
  if (!row) {
    failures.push(`missing readiness record: ${moduleKey}`);
    continue;
  }
  const state = String(row.state || "").toLowerCase();
  if (!allowedStates.includes(state)) {
    failures.push(`${moduleKey} state ${state || "unknown"} not allowed (${allowedStates.join(", ")})`);
  }
}

if (mode === "production") {
  if (!productionExpectedOrgId) {
    failures.push("READINESS_ORG_ID is required in production mode");
  } else if (!governanceOrgId) {
    failures.push("artifact governance_metrics.org_id is missing (advisory scope not allowed in production mode)");
  } else if (governanceOrgId !== productionExpectedOrgId) {
    failures.push(`artifact org scope mismatch (artifact=${governanceOrgId}, expected=${productionExpectedOrgId})`);
  }
}

if (mode === "synthetic") {
  const advisoryModules = ["control_tower", "governance"];
  for (const moduleKey of advisoryModules) {
    const row = recordsByKey.get(moduleKey);
    if (!row) continue;
    if (String(row.state || "").toLowerCase() === "degraded" && !String(row.state_reason_code || "").includes("governance")) {
      warnings.push(`${moduleKey} degraded with non-governance reason (${row.state_reason_code || "unknown"})`);
    }
  }
}

const result = {
  ok: failures.length === 0,
  mode,
  policy: {
    production: mode === "production"
      ? {
        strict_all_connected: productionStrictAllConnected,
        expected_org_id: productionExpectedOrgId || null,
        critical_modules: productionCriticalModules,
        non_critical_allowed_states: productionNonCriticalStates,
      }
      : null,
  },
  file: readinessFile,
  generated_at: readiness?.generated_at || null,
  overall_state: readiness?.overall_state || null,
  record_count: records.length,
  smoke_count: smokes.length,
  failures,
  warnings,
};

console.log(JSON.stringify(result, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
