#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const OPS_DIR = path.join(ROOT_DIR, 'ops')

const WORKSTREAMS_PATH = path.join(OPS_DIR, 'workstreams.json')
const OUTPUT_MD_PATH = path.join(OPS_DIR, 'control-tower.md')
const OUTPUT_JSON_PATH = path.join(OPS_DIR, 'control-tower.snapshot.json')

const READINESS_PATH = path.join(ROOT_DIR, 'docs/runbooks/ecosystem-readiness.latest.json')
const BOOTSTRAP_PATH = path.join(ROOT_DIR, 'reports/public-api-bootstrap.json')
const N8N_AUDIT_PATH = path.join(ROOT_DIR, 'reports/n8n-workflow-audit.json')
const N8N_RECONCILE_PATH = path.join(ROOT_DIR, 'reports/n8n-oculops-reconcile.json')
const BRIDGE_STATE_PATH = path.join(ROOT_DIR, 'reports/n8n-cloudflare-bridge.json')

function parseArgs(argv = []) {
  return {
    stdout: argv.includes('--stdout'),
    write: !argv.includes('--stdout'),
  }
}

function compact(value) {
  if (value == null) return ''
  return String(value).trim()
}

async function readJson(filePath, fallback = null) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch {
    return fallback
  }
}

function runGit(command) {
  try {
    return execSync(command, { cwd: ROOT_DIR, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function buildGitStatus() {
  const branch = runGit('git rev-parse --abbrev-ref HEAD') || 'unknown'
  const sha = runGit('git rev-parse --short HEAD') || 'unknown'
  const originMain = runGit('git rev-parse --verify origin/main')
  let ahead = 0
  let behind = 0
  if (originMain) {
    const counts = runGit('git rev-list --left-right --count origin/main...HEAD')
    const [left, right] = counts.split(/\s+/).map((entry) => Number(entry || 0))
    behind = Number.isFinite(left) ? left : 0
    ahead = Number.isFinite(right) ? right : 0
  }

  const short = runGit('git status --short')
  const changedFiles = short ? short.split('\n').filter(Boolean) : []
  return {
    branch,
    sha,
    ahead,
    behind,
    dirty: changedFiles.length > 0,
    changedFiles,
  }
}

function buildModuleMap(readiness) {
  const rows = Array.isArray(readiness?.records) ? readiness.records : []
  return new Map(rows.map((row) => [compact(row.module_key), row]))
}

function classifyBlockers({ readiness, bootstrap, n8nAudit, n8nReconcile, gitState }) {
  const blockers = []
  const warnings = []

  const moduleMap = buildModuleMap(readiness)
  const criticalModules = ['control_tower', 'governance', 'orchestration', 'connector_proxy', 'variable_control_plane_v2']

  for (const moduleKey of criticalModules) {
    const row = moduleMap.get(moduleKey)
    if (!row) continue
    const state = compact(row.state).toLowerCase()
    if (state === 'offline' || state === 'degraded') {
      blockers.push(`${moduleKey}: ${compact(row.state_reason_text) || compact(row.state_reason_code)}`)
    } else if (state === 'simulated') {
      warnings.push(`${moduleKey}: simulated mode`)
    }
  }

  const missingKeys = Number(bootstrap?.summary?.missing_required_keys || 0)
  if (missingKeys > 0) {
    blockers.push(`Public API connectors con credenciales pendientes: ${missingKeys}`)
  }

  const n8nBlockedCredentials = Number(n8nAudit?.summary?.blockedByCredentials || 0)
  if (n8nBlockedCredentials > 0) {
    warnings.push(`n8n workflows bloqueados por credenciales: ${n8nBlockedCredentials}`)
  }

  const unresolvedReconcile = Number(n8nReconcile?.summary?.blockedCount || 0)
  if (unresolvedReconcile > 0) {
    warnings.push(`n8n reconcile con workflows bloqueados: ${unresolvedReconcile}`)
  }

  if (gitState.behind > 0) {
    blockers.push(`Repo behind origin/main por ${gitState.behind} commit(s)`)
  }

  if (gitState.dirty) {
    warnings.push(`Working tree con cambios locales: ${gitState.changedFiles.length} archivo(s)`)
  }

  return { blockers, warnings }
}

function safeDate(value) {
  const normalized = compact(value)
  if (!normalized) return 'n/a'
  const parsed = Date.parse(normalized)
  if (!Number.isFinite(parsed)) return normalized
  return new Date(parsed).toISOString()
}

async function fetchGitHubSignals() {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPOSITORY
  if (!token || !repo) {
    return {
      enabled: false,
      reason: 'GITHUB_TOKEN or GITHUB_REPOSITORY missing',
      openPullRequests: null,
      openIssues: null,
    }
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  try {
    const [prRes, issueRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=100`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=100`, { headers }),
    ])

    if (!prRes.ok || !issueRes.ok) {
      return {
        enabled: false,
        reason: `GitHub API not available (${prRes.status}/${issueRes.status})`,
        openPullRequests: null,
        openIssues: null,
      }
    }

    const [prs, issues] = await Promise.all([prRes.json(), issueRes.json()])
    const openPrs = Array.isArray(prs) ? prs.length : 0
    const openIssues = Array.isArray(issues)
      ? issues.filter((item) => !item.pull_request).length
      : 0

    return {
      enabled: true,
      reason: null,
      openPullRequests: openPrs,
      openIssues,
    }
  } catch (error) {
    return {
      enabled: false,
      reason: error instanceof Error ? error.message : String(error),
      openPullRequests: null,
      openIssues: null,
    }
  }
}

function renderMarkdown(snapshot) {
  const lines = []

  lines.push('# Control Tower')
  lines.push('')
  lines.push(`Last updated: ${snapshot.generatedAt}`)
  lines.push(`Branch: \`${snapshot.git.branch}\` · SHA: \`${snapshot.git.sha}\``)
  lines.push('')

  lines.push('## System Pulse')
  lines.push('')
  lines.push('| Signal | Status | Evidence |')
  lines.push('|---|---|---|')
  lines.push(`| Readiness overall | ${snapshot.readiness.overallState} | generated: ${safeDate(snapshot.readiness.generatedAt)} |`)
  lines.push(`| Public API connectors live | ${snapshot.publicApis.healthcheckOk}/${snapshot.publicApis.totalTemplates} | missing keys: ${snapshot.publicApis.missingRequiredKeys} |`)
  lines.push(`| n8n runnable workflows | ${snapshot.n8n.runnableNow}/${snapshot.n8n.totalWorkflows} | blocked credentials: ${snapshot.n8n.blockedByCredentials} |`)
  lines.push(`| n8n reconcile runnable | ${snapshot.n8n.reconcileRunnableNow}/${snapshot.n8n.reconcileTargetCount} | blocked: ${snapshot.n8n.reconcileBlocked} |`)
  lines.push(`| Git sync | ahead ${snapshot.git.ahead} / behind ${snapshot.git.behind} | dirty files: ${snapshot.git.changedFiles.length} |`)

  lines.push('')
  lines.push('## Workstreams')
  lines.push('')
  lines.push('| ID | Priority | Status | Owner | Area | Next action |')
  lines.push('|---|---|---|---|---|---|')
  for (const row of snapshot.workstreams.items) {
    lines.push(`| ${row.id} | ${row.priority} | ${row.status} | ${row.owner} | ${row.area} | ${row.next_action} |`)
  }

  lines.push('')
  lines.push('## Agents And Terminals')
  lines.push('')
  lines.push('| Agent | Terminal | Scope | Status |')
  lines.push('|---|---|---|---|')
  for (const row of snapshot.workstreams.agents) {
    lines.push(`| ${row.name} | ${row.terminal} | ${row.scope} | ${row.status} |`)
  }

  lines.push('')
  lines.push('## Blockers')
  lines.push('')
  if (snapshot.blockers.length === 0) {
    lines.push('- None')
  } else {
    for (const blocker of snapshot.blockers) lines.push(`- ${blocker}`)
  }

  lines.push('')
  lines.push('## Warnings')
  lines.push('')
  if (snapshot.warnings.length === 0) {
    lines.push('- None')
  } else {
    for (const warning of snapshot.warnings) lines.push(`- ${warning}`)
  }

  lines.push('')
  lines.push('## Pending Local Changes')
  lines.push('')
  if (snapshot.git.changedFiles.length === 0) {
    lines.push('- Working tree clean')
  } else {
    for (const file of snapshot.git.changedFiles.slice(0, 50)) lines.push(`- \`${file}\``)
  }

  lines.push('')
  lines.push('## GitHub Signals')
  lines.push('')
  if (snapshot.github.enabled) {
    lines.push(`- Open pull requests: ${snapshot.github.openPullRequests}`)
    lines.push(`- Open issues: ${snapshot.github.openIssues}`)
  } else {
    lines.push(`- Not available in current context (${snapshot.github.reason})`)
  }

  lines.push('')
  lines.push('## Usage Rules')
  lines.push('')
  lines.push('- Any coding agent must read this file before editing code.')
  lines.push('- Update `ops/workstreams.json` when claiming or finishing a stream.')
  lines.push('- Regenerate this dashboard with `npm run control-tower:update`.')

  lines.push('')
  return `${lines.join('\n')}\n`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const [workstreams, readiness, bootstrap, n8nAudit, n8nReconcile, bridge, github] = await Promise.all([
    readJson(WORKSTREAMS_PATH, { meta: {}, agents: [], workstreams: [] }),
    readJson(READINESS_PATH, {}),
    readJson(BOOTSTRAP_PATH, {}),
    readJson(N8N_AUDIT_PATH, {}),
    readJson(N8N_RECONCILE_PATH, {}),
    readJson(BRIDGE_STATE_PATH, {}),
    fetchGitHubSignals(),
  ])

  const gitState = buildGitStatus()
  const publicSummary = bootstrap?.summary || {}
  const n8nAuditSummary = n8nAudit?.summary || {}
  const n8nReconcileSummary = n8nReconcile?.summary || {}
  const { blockers, warnings } = classifyBlockers({
    readiness,
    bootstrap,
    n8nAudit,
    n8nReconcile,
    gitState,
  })

  const snapshot = {
    generatedAt: new Date().toISOString(),
    project: workstreams?.meta?.project || 'OCULOPS',
    git: gitState,
    readiness: {
      overallState: compact(readiness?.overall_state || 'unknown'),
      generatedAt: compact(readiness?.generated_at || null),
      records: Array.isArray(readiness?.records) ? readiness.records : [],
    },
    publicApis: {
      totalTemplates: Number(publicSummary.total_templates || 0),
      healthcheckOk: Number(publicSummary.healthcheck_ok || 0),
      healthcheckFailed: Number(publicSummary.healthcheck_failed || 0),
      missingRequiredKeys: Number(publicSummary.missing_required_keys || 0),
    },
    n8n: {
      totalWorkflows: Number(n8nAuditSummary.totalWorkflowsInN8n || 0),
      runnableNow: Number(n8nAuditSummary.runnableNow || 0),
      blockedByCredentials: Number(n8nAuditSummary.blockedByCredentials || 0),
      blockedByCommunityNodes: Number(n8nAuditSummary.blockedByCommunityNodes || 0),
      reconcileTargetCount: Number(n8nReconcileSummary.targetCount || 0),
      reconcileRunnableNow: Number(n8nReconcileSummary.runnableNowCount || 0),
      reconcileBlocked: Number(n8nReconcileSummary.blockedCount || 0),
      bridgeUrl: compact(bridge?.publicUrl || ''),
      bridgeApiUrl: compact(bridge?.apiUrl || ''),
    },
    workstreams: {
      items: Array.isArray(workstreams?.workstreams) ? workstreams.workstreams : [],
      agents: Array.isArray(workstreams?.agents) ? workstreams.agents : [],
      meta: workstreams?.meta || {},
    },
    blockers,
    warnings,
    github,
  }

  const markdown = renderMarkdown(snapshot)

  if (args.write) {
    await fs.mkdir(OPS_DIR, { recursive: true })
    await fs.writeFile(OUTPUT_JSON_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
    await fs.writeFile(OUTPUT_MD_PATH, markdown, 'utf8')
    console.log(`[control-tower] wrote ${path.relative(ROOT_DIR, OUTPUT_MD_PATH)}`)
    console.log(`[control-tower] wrote ${path.relative(ROOT_DIR, OUTPUT_JSON_PATH)}`)
  } else {
    process.stdout.write(markdown)
  }
}

main().catch((error) => {
  console.error('[control-tower] failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
