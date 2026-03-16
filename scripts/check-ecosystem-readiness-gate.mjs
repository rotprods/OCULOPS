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
    "../AGENCY_OS/CONTEXT/ecosystem-readiness.latest.json",
);
const maxAgeHours = Math.max(1, Math.min(240, Number(args.get("max-age-hours") || process.env.READINESS_MAX_AGE_HOURS || 36)));

const VALID_STATES = new Set(["connected", "online", "simulated", "degraded", "planned"]);

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

const policyByMode = {
  synthetic: {
    disallowOverall: [],
    requiredServices: ["n8n", "postgresql", "redis", "qdrant"],
    requiredCapabilities: ["workflow_automation", "semantic_memory"],
    minServiceCount: 8,
  },
  production: {
    disallowOverall: ["offline", "no_go", "red"],
    requiredServices: ["n8n", "postgresql", "redis", "qdrant", "rabbitmq", "dashboard_api", "agent_zero"],
    requiredCapabilities: ["workflow_automation", "semantic_memory", "governed_ai_inference", "dashboard_control_plane"],
    minServiceCount: 10,
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
const services = readiness?.services || {};
const capabilities = readiness?.capabilities || {};

if (!readiness?.timestamp) {
  failures.push("missing timestamp");
} else {
  const generatedEpoch = new Date(readiness.timestamp).getTime();
  if (!Number.isFinite(generatedEpoch)) {
    failures.push("timestamp is not a valid date");
  } else {
    const ageMs = Date.now() - generatedEpoch;
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    if (ageMs > maxAgeMs) {
      failures.push(`artifact is stale (${(ageMs / 3600000).toFixed(2)}h > ${maxAgeHours}h)`);
    }
  }
}

const serviceKeys = Object.keys(services);
if (serviceKeys.length < policy.minServiceCount) {
  failures.push(`service count too low (${serviceKeys.length} < ${policy.minServiceCount})`);
}

const overallState = String(readiness?.global_status || "").toLowerCase();
if (policy.disallowOverall.includes(overallState)) {
  failures.push(`global_status=${overallState} is not allowed in ${mode} mode`);
}

for (const svc of policy.requiredServices) {
  const status = String(services[svc] || "").toLowerCase();
  if (!VALID_STATES.has(status)) {
    failures.push(`critical service ${svc} not online (status=${status || "unknown"})`);
  }
}

for (const cap of policy.requiredCapabilities) {
  const status = String(capabilities[cap] || "").toLowerCase();
  if (!VALID_STATES.has(status)) {
    failures.push(`critical capability ${cap} not connected (status=${status || "unknown"})`);
  }
}

if (mode === "synthetic") {
  const advisoryServices = ["cloudflare_tunnel", "public_ingress"];
  for (const svc of advisoryServices) {
    if (String(services[svc] || "").toLowerCase() === "no_go") {
      warnings.push(`service ${svc} is no_go (tolerated in synthetic)`);
    }
  }
}

const result = {
  ok: failures.length === 0,
  mode,
  file: readinessFile,
  timestamp: readiness?.timestamp || null,
  global_status: readiness?.global_status || null,
  service_count: serviceKeys.length,
  failures,
  warnings,
};

console.log(JSON.stringify(result, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
