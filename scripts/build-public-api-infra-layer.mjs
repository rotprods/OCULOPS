#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_API_ADAPTER_TEMPLATES } from '../src/lib/publicApiConnectorTemplates.js'
import {
  buildPublicApiInfrastructureLayer,
  toInfrastructureMarkdown,
} from '../src/lib/publicApiInfrastructure.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const SEED_PATH = path.join(ROOT_DIR, 'src/data/publicApiCatalog.seed.json')
const JSON_OUTPUT_PATH = path.join(ROOT_DIR, 'public/public-api-catalog/infrastructure-layer.json')
const RUNBOOK_MD_PATH = path.join(ROOT_DIR, 'docs/runbooks/public-api-infra-layer.md')
const RUNBOOK_JSON_PATH = path.join(ROOT_DIR, 'docs/runbooks/public-api-infra-layer.latest.json')

function toPrettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
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
    }
  }

  if (entries.length === 0) {
    return {
      source: 'seed',
      entries: await loadSeedEntries(),
      connectors,
      warning: 'Supabase returned empty catalog entries, using seed catalog with live connector state',
    }
  }

  return {
    source: 'supabase',
    entries,
    connectors,
    warning: null,
  }
}

async function main() {
  await loadEnvFile()

  const sourceLoad = await loadSupabaseEntriesAndConnectors()
  const generatedAt = new Date().toISOString()
  const layer = buildPublicApiInfrastructureLayer(sourceLoad.entries, {
    generatedAt,
    source: sourceLoad.source,
    templates: PUBLIC_API_ADAPTER_TEMPLATES,
    connectors: sourceLoad.connectors,
  })

  await Promise.all([
    ensureDir(JSON_OUTPUT_PATH).then(() => fs.writeFile(JSON_OUTPUT_PATH, toPrettyJson(layer), 'utf8')),
    ensureDir(RUNBOOK_JSON_PATH).then(() => fs.writeFile(RUNBOOK_JSON_PATH, toPrettyJson(layer), 'utf8')),
    ensureDir(RUNBOOK_MD_PATH).then(() => fs.writeFile(RUNBOOK_MD_PATH, toInfrastructureMarkdown(layer), 'utf8')),
  ])

  console.log('[build-public-api-infra-layer] completed')
  console.log(JSON.stringify({
    source: sourceLoad.source,
    warning: sourceLoad.warning,
    output_json: JSON_OUTPUT_PATH,
    output_runbook: RUNBOOK_MD_PATH,
    stats: layer.stats,
  }, null, 2))
}

main().catch(error => {
  console.error('[build-public-api-infra-layer] failed:', normalizeError(error))
  process.exitCode = 1
})
