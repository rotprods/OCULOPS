#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const TRIGGER_PACK_PATH = path.join(rootDir, "reports", "n8n-api-trigger-pack.json");
const INJECTION_REPORT_PATH = path.join(rootDir, "reports", "n8n-api-context-injection.smoke.json");
const SUMMARY_PATH = path.join(rootDir, "reports", "project-apis-n8n-bridge-smoke.latest.json");
const BUILD_OUTPUT_FILES = [
  path.join(rootDir, "docs", "APIs_PROYECTO.md"),
  path.join(rootDir, "reports", "project-apis.usable-now.json"),
  path.join(rootDir, "reports", "project-apis.pending-registration.json"),
  TRIGGER_PACK_PATH,
];

const REQUIRED_EVENT_KEYS = [
  "lead.qualified",
  "outreach.step_due",
  "content.requested",
  "strategy.requested",
  "signal.detected",
  "agent.completed",
];

function asBoolean(value, fallback = false) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function run(command, args, label, extraEnv = {}) {
  console.log(`[smoke:project-apis-bridge] ${label}`);
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "pipe",
    env: { ...process.env, ...extraEnv },
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 1}`);
  }
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function countTotalEntries(eventPacks) {
  return Object.values(eventPacks).reduce((sum, value) => {
    const pack = asRecord(value);
    const totals = asRecord(pack.totals);
    return sum + Number(totals.matching_entries || 0);
  }, 0);
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function captureFileSnapshot(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return { exists: true, content };
  } catch {
    return { exists: false, content: null };
  }
}

async function restoreFileSnapshot(filePath, snapshot) {
  if (snapshot?.exists) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, snapshot.content || "", "utf8");
    return;
  }
  try {
    await fs.rm(filePath);
  } catch {
    // best effort
  }
}

async function main() {
  const hasSupabaseCreds = Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const applyMode = asBoolean(process.env.PROJECT_APIS_BRIDGE_SMOKE_APPLY, false);
  const injectionLimit = Number(process.env.PROJECT_APIS_BRIDGE_SMOKE_LIMIT || 250);
  const startedAt = new Date().toISOString();
  const baselineSnapshots = new Map();
  for (const outputFile of BUILD_OUTPUT_FILES) {
    baselineSnapshots.set(outputFile, await captureFileSnapshot(outputFile));
  }
  const injectionReportBaseline = await captureFileSnapshot(INJECTION_REPORT_PATH);

  try {
    run("npm", ["run", "build:project-apis"], "build:project-apis");

    const triggerPack = await readJson(TRIGGER_PACK_PATH);
    const eventPacks = asRecord(triggerPack.event_packs);
    const eventKeys = Object.keys(eventPacks);
    const missingEventKeys = REQUIRED_EVENT_KEYS.filter((key) => !eventKeys.includes(key));
    if (missingEventKeys.length > 0) {
      throw new Error(
        `trigger pack missing required event keys: ${missingEventKeys.join(", ")}`,
      );
    }

    const totalEntries = countTotalEntries(eventPacks);
    if (totalEntries <= 0) {
      throw new Error("trigger pack contains zero matching entries across all events.");
    }

    const summary = {
      generated_at: new Date().toISOString(),
      started_at: startedAt,
      mode: applyMode ? "apply" : "dry_run",
      checks: {
        trigger_pack: {
          ok: true,
          file: path.relative(rootDir, TRIGGER_PACK_PATH),
          event_keys: eventKeys.length,
          matching_entries_total: totalEntries,
        },
        injection: {
          ok: true,
          status: "skipped",
          reason: "missing_supabase_credentials",
          file: path.relative(rootDir, INJECTION_REPORT_PATH),
        },
      },
    };

    if (hasSupabaseCreds) {
      const injectArgs = [
        "run",
        "inject:n8n-api-context",
        "--",
        "--output",
        INJECTION_REPORT_PATH,
        "--limit",
        String(injectionLimit),
      ];
      if (applyMode) injectArgs.push("--apply");

      run("npm", injectArgs, applyMode ? "inject:n8n-api-context --apply" : "inject:n8n-api-context (dry-run)");

      const injectionReport = await readJson(INJECTION_REPORT_PATH);
      const reportSummary = asRecord(injectionReport.summary);
      const scanned = Number(reportSummary.workflows_scanned || 0);
      const failedUpdates = Number(reportSummary.failed_updates || 0);
      if (scanned < 0 || failedUpdates < 0) {
        throw new Error("invalid n8n injection report summary values.");
      }
      if (failedUpdates > 0) {
        throw new Error(`n8n injection report has failed_updates=${failedUpdates}.`);
      }

      summary.checks.injection = {
        ok: true,
        status: "executed",
        mode: injectionReport.mode || (applyMode ? "apply" : "dry_run"),
        file: path.relative(rootDir, INJECTION_REPORT_PATH),
        workflows_scanned: scanned,
        updated: Number(reportSummary.updated || 0),
        dry_run_would_update: Number(reportSummary.dry_run_would_update || 0),
        failed_updates: failedUpdates,
      };
    }

    await fs.mkdir(path.dirname(SUMMARY_PATH), { recursive: true });
    await fs.writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

    console.log("[smoke:project-apis-bridge] completed");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    for (const [outputFile, snapshot] of baselineSnapshots.entries()) {
      await restoreFileSnapshot(outputFile, snapshot);
    }
    await restoreFileSnapshot(INJECTION_REPORT_PATH, injectionReportBaseline);
  }
}

main().catch(async (error) => {
  const failure = {
    generated_at: new Date().toISOString(),
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
  try {
    await fs.mkdir(path.dirname(SUMMARY_PATH), { recursive: true });
    await fs.writeFile(SUMMARY_PATH, `${JSON.stringify(failure, null, 2)}\n`, "utf8");
  } catch {
    // best effort
  }
  console.error("[smoke:project-apis-bridge] failed:", failure.error);
  process.exitCode = 1;
});
