#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════════════════════
// import-vault-agents.mjs — Import agents from ~/agent-vault/ into Supabase
//
// Usage:
//   node scripts/import-vault-agents.mjs                    # import all
//   node scripts/import-vault-agents.mjs research           # import one namespace
//   node scripts/import-vault-agents.mjs --agent seo-specialist  # import one agent
//   node scripts/import-vault-agents.mjs --dry-run          # preview without writing
//
// Reads .md files with YAML frontmatter, extracts system prompt + metadata,
// and upserts into agent_definitions table via Supabase REST API.
// ═══════════════════════════════════════════════════════════════════════════════

import { readdir, readFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const VAULT_PATH = join(process.env.HOME, "agent-vault");
const SKIP_DIRS = ["_aliases", "deprecated", "experimental", "presets", ".DS_Store"];

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ── YAML frontmatter parser (simple, no dependency) ──
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();

    // Handle arrays like [tool1, tool2]
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
    }
    meta[key] = val;
  }

  return { meta, body: match[2].trim() };
}

// ── Determine skills based on namespace ──
function resolveSkills(namespace, meta) {
  const base = [
    "web_search", "fetch_external_data", "fetch_url",
    "recall_memory", "store_memory", "crm_query",
    "generate_content", "audit_log_write", "reasoning_trace_store", "metrics_query",
  ];

  const extras = {
    research: ["create_signal"],
    security: ["create_alert", "incident_create"],
    content: ["generate_content"],
    product: ["crm_write_task"],
    orchestration: ["call_agent"],
    data: ["metrics_query"],
  };

  return [...new Set([...base, ...(extras[namespace] || [])])];
}

// ── Import one agent file ──
function fileToDefinition(filePath, namespace) {
  const { meta, body } = parseFrontmatter(filePath);
  const codeName = meta.name || basename(filePath, extname(filePath));

  return {
    code_name: codeName,
    display_name: meta.name ? meta.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : codeName,
    description: meta.description || null,
    source: "vault",
    vault_path: filePath,
    namespace,
    system_prompt: body,
    goal_template: meta.description || null,
    model: meta.model || "gpt-4o",
    max_rounds: 4,
    timeout_ms: 45000,
    type: namespace === "orchestration" ? "orchestrator" : "domain",
    hierarchy_level: namespace === "orchestration" ? 1 : 2,
    allowed_skills: resolveSkills(namespace, meta),
    restricted_skills: ["rollback_action", "send_notification"],
    tags: [namespace, ...(Array.isArray(meta.tools) ? meta.tools : [])],
    is_active: true,
  };
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const singleAgent = args.includes("--agent") ? args[args.indexOf("--agent") + 1] : null;
  const singleNamespace = args.find((a) => !a.startsWith("--") && a !== singleAgent);

  console.log(`\n🔍 Scanning vault: ${VAULT_PATH}`);
  if (dryRun) console.log("   (dry-run mode — no DB writes)\n");

  const namespaces = (await readdir(VAULT_PATH, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !SKIP_DIRS.includes(d.name))
    .map((d) => d.name);

  const definitions = [];

  for (const ns of namespaces) {
    if (singleNamespace && ns !== singleNamespace) continue;

    const nsPath = join(VAULT_PATH, ns);
    const files = (await readdir(nsPath)).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const codeName = basename(file, ".md");
      if (singleAgent && codeName !== singleAgent) continue;

      const content = await readFile(join(nsPath, file), "utf-8");
      const def = fileToDefinition(content, ns);
      def.code_name = codeName;
      def.vault_path = `${ns}/${file}`;
      definitions.push(def);
    }
  }

  console.log(`📦 Found ${definitions.length} agents to import\n`);

  if (dryRun) {
    for (const d of definitions) {
      console.log(`  [${d.namespace}] ${d.code_name} — ${d.description?.slice(0, 60) || "(no description)"}`);
    }
    console.log(`\n✅ Dry run complete. ${definitions.length} agents would be imported.`);
    return;
  }

  let imported = 0;
  let errors = 0;

  for (const def of definitions) {
    const { error } = await supabase
      .from("agent_definitions")
      .upsert(def, { onConflict: "code_name" });

    if (error) {
      console.error(`  ❌ ${def.code_name}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✅ ${def.code_name}`);
      imported++;
    }
  }

  console.log(`\n📊 Done: ${imported} imported, ${errors} errors, ${definitions.length} total`);
}

main().catch(console.error);
