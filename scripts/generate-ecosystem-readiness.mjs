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

function renderMarkdown(readiness) {
  const services = readiness.services || {};
  const capabilities = readiness.capabilities || {};
  const policies = readiness.policies || {};
  const exposure = readiness.exposure || {};

  const lines = [];
  lines.push("# Ecosystem Readiness (Canonical)");
  lines.push("");
  lines.push(`Generated: ${toIso(readiness.timestamp)}`);
  lines.push(`Overall state: ${String(readiness.global_status || "unknown").toUpperCase()}`);
  lines.push(`System: ${readiness.system || "unknown"}`);
  lines.push(`Network: ${readiness.network || "unknown"}`);
  lines.push("");
  lines.push("## Services");
  lines.push("");
  lines.push("| service | status |");
  lines.push("|---|---|");
  for (const [key, value] of Object.entries(services)) {
    lines.push(`| ${key} | ${value} |`);
  }
  lines.push("");
  lines.push("## Capabilities");
  lines.push("");
  for (const [key, value] of Object.entries(capabilities)) {
    lines.push(`- **${key}**: ${value}`);
  }
  lines.push("");
  lines.push("## Policies");
  lines.push("");
  for (const [key, value] of Object.entries(policies)) {
    lines.push(`- **${key}**: ${value}`);
  }
  lines.push("");
  lines.push("## Exposure");
  lines.push("");
  lines.push(`- Public Ingress Enabled: ${exposure.public_ingress_enabled}`);
  lines.push(`- Status: ${exposure.public_ingress_status}`);
  if (exposure.public_base_url) {
    lines.push(`- URL: ${exposure.public_base_url}`);
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const canonicalJsonPath = path.resolve(process.env.HOME || "/Users/rotech", "AGENCY_OS/CONTEXT/ecosystem-readiness.latest.json");
  if (!existsSync(canonicalJsonPath)) {
    throw new Error(`Canonical readiness artifact not found at ${canonicalJsonPath}`);
  }
  
  const raw = readFileSync(canonicalJsonPath, "utf8");
  let readiness = {};
  try {
    readiness = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Invalid JSON from canonical artifact: ${raw.slice(0, 200)}`);
  }

  if (!existsSync(runbooksDir)) mkdirSync(runbooksDir, { recursive: true });

  const windowHours = Math.max(1, Math.min(168, Number(process.env.READINESS_WINDOW_HOURS || 24)));
  const markdown = renderMarkdown(readiness, { windowHours });
  writeFileSync(markdownPath, markdown);

  console.log(JSON.stringify({
    ok: true,
    overall_state: readiness.overall_state,
    records: Array.isArray(readiness.records) ? readiness.records.length : 0,
    failures: Array.isArray(readiness.failures) ? readiness.failures.length : 0,
    artifacts: {
      json_path: canonicalJsonPath,
      markdown_path: "docs/runbooks/ecosystem-readiness.md",
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
