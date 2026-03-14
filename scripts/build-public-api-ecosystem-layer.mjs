#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_API_ADAPTER_TEMPLATES } from '../src/lib/publicApiConnectorTemplates.js'
import { buildPublicApiInfrastructureLayer } from '../src/lib/publicApiInfrastructure.js'
import {
  buildPublicApiEcosystemLayer,
  toEcosystemArchitectureMarkdown,
} from '../src/lib/publicApiEcosystem.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const SEED_PATH = path.join(ROOT_DIR, 'src/data/publicApiCatalog.seed.json')
const ECOSYSTEM_JSON_PATH = path.join(ROOT_DIR, 'public/public-api-catalog/ecosystem-layer.json')
const RUNBOOK_MD_PATH = path.join(ROOT_DIR, 'docs/runbooks/public-api-ecosystem-architecture.md')
const RUNBOOK_JSON_PATH = path.join(ROOT_DIR, 'docs/runbooks/public-api-ecosystem.latest.json')
const REG_BACKLOG_MD_PATH = path.join(ROOT_DIR, 'docs/runbooks/public-api-registration-backlog.md')
const REG_BACKLOG_JSON_PATH = path.join(ROOT_DIR, 'reports/public-api-registration-backlog.json')
const OPEN_FREE_JSON_PATH = path.join(ROOT_DIR, 'reports/public-api-open-free-candidates.json')
const MATRIX_CSV_PATH = path.join(ROOT_DIR, 'reports/public-api-agent-automation-matrix.csv')

function toPrettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function toCsv(rows = []) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (value) => {
    const text = String(value ?? '')
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replaceAll('"', '""')}"`
    }
    return text
  }

  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(header => esc(row[header])).join(','))
  }
  return `${lines.join('\n')}\n`
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function loadEnvFileAt(filePath, { override = false } = {}) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#') || !line.includes('=')) continue
      const [key, ...rest] = line.split('=')
      const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '')
      const envKey = key.trim()
      if (override || !process.env[envKey]) {
        process.env[envKey] = value
      }
    }
  } catch {
    // optional file
  }
}

async function loadEnvFile() {
  await loadEnvFileAt(path.join(ROOT_DIR, '.env'))
  await loadEnvFileAt(path.join(ROOT_DIR, 'supabase/.env.deploy'), { override: true })
}

function normalizeError(error) {
  if (!error) return 'Unknown error'
  if (error instanceof Error) return error.message
  if (typeof error === 'object') {
    const message = error.message || error.details || error.hint || error.code
    if (message) return String(message)
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

async function loadSeedEntries() {
  const content = await fs.readFile(SEED_PATH, 'utf8')
  const parsed = JSON.parse(content)
  return Array.isArray(parsed.entries) ? parsed.entries : []
}

async function fetchAllRows(queryFactory, pageSize = 1000) {
  const rows = []
  let from = 0

  while (true) {
    const to = from + pageSize - 1
    const result = await queryFactory(from, to)
    if (result.error) throw result.error

    const batch = result.data || []
    rows.push(...batch)
    if (batch.length < pageSize) break
    from += pageSize
  }

  return rows
}

async function loadSupabaseEntriesAndConnectors() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      source: 'seed',
      entries: await loadSeedEntries(),
      connectors: [],
      warning: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing, using seed catalog',
      supabase: null,
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let entries = []
  let connectors = []

  try {
    [entries, connectors] = await Promise.all([
      fetchAllRows((from, to) => supabase
        .from('api_catalog_entries')
        .select('*')
        .order('business_fit_score', { ascending: false })
        .order('name', { ascending: true })
        .range(from, to)),
      fetchAllRows((from, to) => supabase
        .from('api_connectors')
        .select('id,catalog_slug,health_status,is_active,capabilities,endpoints,template_key,normalizer_key,metadata,created_at,last_healthcheck_at')
        .not('catalog_slug', 'is', null)
        .order('created_at', { ascending: false })
        .range(from, to)),
    ])
  } catch (error) {
    return {
      source: 'seed',
      entries: await loadSeedEntries(),
      connectors: [],
      warning: `Supabase query failed (${normalizeError(error)}), using seed catalog`,
      supabase,
    }
  }

  if (entries.length === 0) {
    return {
      source: 'seed',
      entries: await loadSeedEntries(),
      connectors,
      warning: 'Supabase returned empty catalog entries, using seed catalog with live connector state',
      supabase,
    }
  }

  return {
    source: 'supabase',
    entries,
    connectors,
    warning: null,
    supabase,
  }
}

function toBacklogMarkdown(backlog = []) {
  const lines = []
  lines.push('# Public API Registration Backlog')
  lines.push('')
  lines.push(`Total pending entries: ${backlog.length}`)
  lines.push('')
  lines.push('| Priority | API | Category | Auth | Registration URL | Docs URL | Module Targets | Agent Targets |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |')

  for (const row of backlog) {
    const registrationUrl = row.registration_url || row.docs_url || ''
    lines.push(`| ${row.integration_priority} | ${row.name} | ${row.category} | ${row.auth_type} | ${registrationUrl} | ${row.docs_url} | ${(row.module_targets || []).join(', ')} | ${(row.agent_targets || []).join(', ')} |`)
  }

  lines.push('')
  lines.push('Notes:')
  lines.push('- Registration URL points to the best direct known entrypoint (usually provider docs/signup).')
  lines.push('- Payment model is unknown until provider-side plan verification.')
  lines.push('- Execute credentials rollout by priority and re-run health checks after each batch.')
  lines.push('')

  return `${lines.join('\n')}\n`
}

function toIntegrationMatrixRows(entries = []) {
  return entries.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    category: entry.category,
    activation_tier: entry.activation_tier,
    bridge_mode: entry.bridge_profile?.bridge_mode || 'docs_only',
    executable_now: entry.bridge_profile?.executable_now ? 'yes' : 'no',
    access_class: entry.ecosystem_profile?.access_class || 'unknown',
    requires_registration: entry.ecosystem_profile?.requires_registration ? 'yes' : 'no',
    free_candidate: entry.ecosystem_profile?.is_free_public_candidate ? 'yes' : 'no',
    auto_import_eligible: entry.ecosystem_profile?.auto_import_eligible ? 'yes' : 'no',
    integration_priority: entry.ecosystem_profile?.integration_priority || 0,
    module_targets: (entry.ecosystem_profile?.module_targets || []).join('|'),
    agent_targets: (entry.ecosystem_profile?.agent_targets || []).join('|'),
    command_bindings: (entry.ecosystem_profile?.command_bindings || []).join('|'),
    automation_actions: (entry.ecosystem_profile?.automation_actions || []).join('|'),
    n8n_patterns: (entry.ecosystem_profile?.n8n_patterns || []).join('|'),
    docs_url: entry.docs_url,
    registration_url: entry.ecosystem_profile?.registration_url || '',
  }))
}

async function syncIntegrationTables(supabase, layer) {
  if (!supabase) {
    return {
      synced: false,
      reason: 'supabase_not_configured',
    }
  }

  const integrationRows = layer.entries.map((entry) => ({
    catalog_slug: entry.slug,
    docs_url: entry.docs_url,
    registration_url: entry.ecosystem_profile?.registration_url || entry.docs_url,
    auth_type: entry.auth_type,
    access_class: entry.ecosystem_profile?.access_class || 'unknown',
    requires_registration: Boolean(entry.ecosystem_profile?.requires_registration),
    monetization_risk: entry.ecosystem_profile?.monetization_risk || 'unknown',
    free_tier_confidence: entry.ecosystem_profile?.free_tier_confidence || 'unknown',
    payment_status: entry.ecosystem_profile?.payment_status || 'unknown',
    is_free_public_candidate: Boolean(entry.ecosystem_profile?.is_free_public_candidate),
    is_interesting: Boolean(entry.ecosystem_profile?.is_interesting),
    integration_priority: entry.ecosystem_profile?.integration_priority || 0,
    data_formats: entry.ecosystem_profile?.data_formats || [],
    extraction_modes: entry.ecosystem_profile?.extraction_modes || [],
    module_targets: entry.ecosystem_profile?.module_targets || [],
    agent_targets: entry.ecosystem_profile?.agent_targets || [],
    automation_actions: entry.ecosystem_profile?.automation_actions || [],
    command_actions: entry.ecosystem_profile?.command_bindings || [],
    n8n_patterns: entry.ecosystem_profile?.n8n_patterns || [],
    recommended_connector_mode: entry.ecosystem_profile?.recommended_connector_mode || 'docs_only',
    recommended_auth_mode: entry.ecosystem_profile?.recommended_auth_mode || 'unknown',
    profile: entry.ecosystem_profile || {},
    updated_at: new Date().toISOString(),
  }))

  const backlogRows = layer.registration_backlog.map((row) => ({
    catalog_slug: row.slug,
    name: row.name,
    category: row.category,
    docs_url: row.docs_url,
    registration_url: row.registration_url || row.docs_url,
    auth_type: row.auth_type,
    business_fit_score: row.business_fit_score || 0,
    integration_priority: row.integration_priority || 0,
    module_targets: row.module_targets || [],
    agent_targets: row.agent_targets || [],
    status: row.status || 'pending_credentials',
    notes: row.notes || null,
    metadata: {
      generated_by: 'build-public-api-ecosystem-layer',
      generated_at: layer.generated_at,
    },
    updated_at: new Date().toISOString(),
  }))

  const { error: integrationError } = await supabase
    .from('api_catalog_integration_map')
    .upsert(integrationRows, { onConflict: 'catalog_slug' })

  if (integrationError) {
    return {
      synced: false,
      reason: `integration_map_upsert_failed:${normalizeError(integrationError)}`,
    }
  }

  const { error: backlogError } = await supabase
    .from('api_catalog_registration_backlog')
    .upsert(backlogRows, { onConflict: 'catalog_slug' })

  if (backlogError) {
    return {
      synced: false,
      reason: `registration_backlog_upsert_failed:${normalizeError(backlogError)}`,
    }
  }

  return {
    synced: true,
    integration_rows: integrationRows.length,
    backlog_rows: backlogRows.length,
  }
}

async function main() {
  await loadEnvFile()

  const sourceLoad = await loadSupabaseEntriesAndConnectors()
  const generatedAt = new Date().toISOString()

  const infraLayer = buildPublicApiInfrastructureLayer(sourceLoad.entries, {
    generatedAt,
    source: sourceLoad.source,
    templates: PUBLIC_API_ADAPTER_TEMPLATES,
    connectors: sourceLoad.connectors,
  })

  const ecosystemLayer = buildPublicApiEcosystemLayer(infraLayer.entries, {
    generatedAt,
    source: sourceLoad.source,
    templates: PUBLIC_API_ADAPTER_TEMPLATES,
    connectors: sourceLoad.connectors,
  })

  const openFreeCandidates = ecosystemLayer.entries
    .filter(entry => entry.ecosystem_profile?.auto_import_eligible)
    .map(entry => ({
      slug: entry.slug,
      name: entry.name,
      category: entry.category,
      is_listed: entry.is_listed !== false,
      docs_url: entry.docs_url,
      auth_type: entry.auth_type,
      activation_tier: entry.activation_tier,
      integration_priority: entry.ecosystem_profile?.integration_priority || 0,
      module_targets: entry.ecosystem_profile?.module_targets || [],
      agent_targets: entry.ecosystem_profile?.agent_targets || [],
      command_bindings: entry.ecosystem_profile?.command_bindings || [],
      automation_actions: entry.ecosystem_profile?.automation_actions || [],
      n8n_patterns: entry.ecosystem_profile?.n8n_patterns || [],
    }))

  const matrixRows = toIntegrationMatrixRows(ecosystemLayer.entries)

  await Promise.all([
    ensureDir(ECOSYSTEM_JSON_PATH).then(() => fs.writeFile(ECOSYSTEM_JSON_PATH, toPrettyJson(ecosystemLayer), 'utf8')),
    ensureDir(RUNBOOK_JSON_PATH).then(() => fs.writeFile(RUNBOOK_JSON_PATH, toPrettyJson(ecosystemLayer), 'utf8')),
    ensureDir(RUNBOOK_MD_PATH).then(() => fs.writeFile(RUNBOOK_MD_PATH, toEcosystemArchitectureMarkdown(ecosystemLayer), 'utf8')),
    ensureDir(REG_BACKLOG_MD_PATH).then(() => fs.writeFile(REG_BACKLOG_MD_PATH, toBacklogMarkdown(ecosystemLayer.registration_backlog), 'utf8')),
    ensureDir(REG_BACKLOG_JSON_PATH).then(() => fs.writeFile(REG_BACKLOG_JSON_PATH, toPrettyJson(ecosystemLayer.registration_backlog), 'utf8')),
    ensureDir(OPEN_FREE_JSON_PATH).then(() => fs.writeFile(OPEN_FREE_JSON_PATH, toPrettyJson(openFreeCandidates), 'utf8')),
    ensureDir(MATRIX_CSV_PATH).then(() => fs.writeFile(MATRIX_CSV_PATH, toCsv(matrixRows), 'utf8')),
  ])

  const dbSync = await syncIntegrationTables(sourceLoad.supabase, ecosystemLayer)

  console.log('[build-public-api-ecosystem-layer] completed')
  console.log(JSON.stringify({
    source: sourceLoad.source,
    warning: sourceLoad.warning,
    db_sync: dbSync,
    output_json: ECOSYSTEM_JSON_PATH,
    output_runbook: RUNBOOK_MD_PATH,
    output_backlog: REG_BACKLOG_MD_PATH,
    output_open_free: OPEN_FREE_JSON_PATH,
    output_matrix: MATRIX_CSV_PATH,
    summary: ecosystemLayer.summary,
  }, null, 2))
}

main().catch(error => {
  console.error('[build-public-api-ecosystem-layer] failed:', normalizeError(error))
  process.exitCode = 1
})
