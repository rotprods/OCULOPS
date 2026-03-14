#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import {
  PUBLIC_API_ADAPTER_TEMPLATES,
  buildConnectorInstallPayload,
} from '../src/lib/publicApiConnectorTemplates.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const DEFAULT_REPORT_PATH = path.join(ROOT_DIR, 'reports/public-api-bootstrap.json')

const TEMPLATE_API_KEY_ALIASES = {
  graphhopper: ['GRAPHHOPPER_API_KEY'],
  aemet: ['AEMET_API_KEY'],
  'the-guardian': ['GUARDIAN_API_KEY', 'THE_GUARDIAN_API_KEY'],
  fred: ['FRED_API_KEY'],
}

function parseArgs(argv = []) {
  const args = {
    apply: false,
    healthcheck: false,
    includeInternal: false,
    strict: false,
    output: DEFAULT_REPORT_PATH,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--apply') {
      args.apply = true
    } else if (arg === '--healthcheck') {
      args.healthcheck = true
    } else if (arg === '--include-internal') {
      args.includeInternal = true
    } else if (arg === '--strict') {
      args.strict = true
    } else if (arg === '--output' && argv[index + 1]) {
      args.output = path.isAbsolute(argv[index + 1])
        ? argv[index + 1]
        : path.join(ROOT_DIR, argv[index + 1])
      index += 1
    }
  }

  return args
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

function toPrettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))]
}

function compact(value) {
  if (typeof value === 'string') return value.trim()
  if (value == null) return ''
  return String(value).trim()
}

function toEnvPrefix(templateKey = '') {
  return String(templateKey).toUpperCase().replace(/[^A-Z0-9]+/g, '_')
}

function buildCandidateEnvKeys(template, field) {
  const prefix = toEnvPrefix(template.templateKey)
  const normalizedField = String(field).toUpperCase()
  const aliases = field === 'api_key'
    ? (TEMPLATE_API_KEY_ALIASES[template.templateKey] || [])
    : []

  return unique([
    `CONNECTOR_${prefix}_${normalizedField}`,
    `${prefix}_${normalizedField}`,
    ...aliases,
  ])
}

function resolveFieldValue(template, field, existingAuthConfig = {}) {
  const existing = compact(existingAuthConfig[field])
  if (existing) return { value: existing, source: 'existing' }

  const candidates = buildCandidateEnvKeys(template, field)
  for (const envKey of candidates) {
    const envValue = compact(process.env[envKey])
    if (envValue) return { value: envValue, source: envKey }
  }

  return { value: '', source: null }
}

async function loadEnvFile() {
  const envPath = path.join(ROOT_DIR, '.env')
  try {
    const content = await fs.readFile(envPath, 'utf8')
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#') || !line.includes('=')) continue
      const [key, ...rest] = line.split('=')
      const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value
      }
    }
  } catch {
    // optional
  }
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function invokeHealthcheck({ supabaseUrl, serviceRoleKey, connector, template }) {
  const response = await fetch(`${supabaseUrl}/functions/v1/api-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connector_id: connector.id,
      endpoint_name: template.endpointName,
      params: template.healthcheckEndpoint?.sampleParams || {},
      healthcheck: true,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  return { response, payload }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  await loadEnvFile()

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null

  const templates = PUBLIC_API_ADAPTER_TEMPLATES.filter(template => args.includeInternal || !template.internalOnly)
  const catalogSlugs = templates.map(template => template.catalogSlug)
  const canUseSupabase = Boolean(supabaseUrl && serviceRoleKey)

  let admin = null
  let catalogBySlug = new Map()
  let connectorBySlug = new Map()
  let supabaseBlockedReason = null

  if (canUseSupabase) {
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const [catalogRowsResult, connectorsResult] = await Promise.all([
      admin
        .from('api_catalog_entries')
        .select('*')
        .in('slug', catalogSlugs),
      admin
        .from('api_connectors')
        .select('*')
        .in('catalog_slug', catalogSlugs),
    ])

    if (catalogRowsResult.error || connectorsResult.error) {
      supabaseBlockedReason = normalizeError(catalogRowsResult.error || connectorsResult.error)
      if (args.apply) {
        throw new Error(`Supabase is required in apply mode (${supabaseBlockedReason})`)
      }
      admin = null
    } else {
      catalogBySlug = new Map((catalogRowsResult.data || []).map(entry => [entry.slug, entry]))
      connectorBySlug = new Map((connectorsResult.data || []).map(connector => [connector.catalog_slug, connector]))
    }
  } else if (args.apply) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in apply mode')
  } else {
    supabaseBlockedReason = 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing'
  }

  const rows = []
  const summary = {
    total_templates: templates.length,
    installed_connectors: 0,
    existing_connectors: 0,
    updated_credentials: 0,
    healthcheck_ok: 0,
    healthcheck_failed: 0,
    missing_required_keys: 0,
  }

  for (const template of templates) {
    const catalogEntry = catalogBySlug.get(template.catalogSlug) || null
    const row = {
      template_key: template.templateKey,
      catalog_slug: template.catalogSlug,
      connector_id: null,
      status: 'pending',
      activation_tier: catalogEntry?.activation_tier || null,
      required_fields: template.authRequirements?.requiredFields || [],
      missing_fields: [],
      env_sources: {},
      healthcheck: null,
      errors: [],
    }

    if (!catalogEntry && admin) {
      row.status = 'error'
      row.errors.push('Catalog entry not found')
      rows.push(row)
      continue
    } else if (!catalogEntry && !admin) {
      row.status = 'offline_dry_run'
      row.activation_tier = template.internalOnly ? 'internal_only' : 'adapter_ready'
    }

    let connector = connectorBySlug.get(template.catalogSlug) || null
    row.connector_id = connector?.id || null

    if (!connector) {
      if (!args.apply || !admin) {
        row.status = 'would_install'
      } else {
        const payload = buildConnectorInstallPayload(catalogEntry, template)
        const insertResult = await admin
          .from('api_connectors')
          .insert(payload)
          .select('*')
          .single()

        if (insertResult.error) {
          row.status = 'error'
          row.errors.push(`Install failed: ${normalizeError(insertResult.error)}`)
          rows.push(row)
          continue
        }

        connector = insertResult.data
        connectorBySlug.set(template.catalogSlug, connector)
        row.connector_id = connector.id
        row.status = 'installed'
        summary.installed_connectors += 1
      }
    } else {
      summary.existing_connectors += 1
      row.status = row.status === 'would_install' ? 'would_install' : 'existing'
    }

    const baseAuthConfig = {
      ...(template.authConfigDefaults || {}),
      ...((connector?.auth_config && typeof connector.auth_config === 'object') ? connector.auth_config : {}),
    }
    const nextAuthConfig = { ...baseAuthConfig }

    for (const field of template.authRequirements?.requiredFields || []) {
      const resolution = resolveFieldValue(template, field, baseAuthConfig)
      if (resolution.value) {
        nextAuthConfig[field] = resolution.value
      } else {
        row.missing_fields.push(field)
      }
      if (resolution.source) {
        row.env_sources[field] = resolution.source
      }
    }

    summary.missing_required_keys += row.missing_fields.length

    if (args.apply && admin && connector && row.missing_fields.length === 0) {
      const authConfigChanged = JSON.stringify(nextAuthConfig) !== JSON.stringify(connector.auth_config || {})
      if (authConfigChanged) {
        const updateResult = await admin
          .from('api_connectors')
          .update({
            auth_config: nextAuthConfig,
            health_status: 'pending',
            last_healthcheck_at: null,
          })
          .eq('id', connector.id)
          .select('*')
          .single()

        if (updateResult.error) {
          row.errors.push(`Credential update failed: ${normalizeError(updateResult.error)}`)
          row.status = 'error'
        } else {
          connector = updateResult.data
          summary.updated_credentials += 1
          row.status = row.status === 'installed' ? 'installed_and_configured' : 'configured'
        }
      } else if (!row.status.startsWith('installed')) {
        row.status = 'configured_existing'
      }
    }

    if (args.apply && admin && args.healthcheck && connector && row.missing_fields.length === 0) {
      const health = await invokeHealthcheck({ supabaseUrl, serviceRoleKey, connector, template })
      row.healthcheck = {
        http_status: health.response.status,
        ok: Boolean(health.payload?.ok),
        error: health.payload?.error || null,
      }

      if (health.payload?.ok) {
        summary.healthcheck_ok += 1
      } else {
        summary.healthcheck_failed += 1
        row.errors.push(`Healthcheck failed (${health.response.status}): ${health.payload?.error || 'unknown error'}`)
        if (row.status !== 'error') row.status = 'healthcheck_failed'
      }
    }

    if (row.missing_fields.length > 0 && !row.status.startsWith('error')) {
      row.status = args.apply ? 'missing_keys' : 'would_require_keys'
    }

    rows.push(row)
  }

  const report = {
    generated_at: new Date().toISOString(),
    mode: args.apply ? 'apply' : 'dry_run',
    supabase_available: Boolean(admin),
    supabase_warning: supabaseBlockedReason,
    options: {
      healthcheck: args.healthcheck,
      include_internal: args.includeInternal,
      strict: args.strict,
    },
    summary,
    rows,
  }

  await ensureDir(args.output)
  await fs.writeFile(args.output, toPrettyJson(report), 'utf8')

  console.log(`[bootstrap-public-api-connectors] wrote report: ${args.output}`)
  console.table(rows.map(row => ({
    template: row.template_key,
    status: row.status,
    connector: row.connector_id || '-',
    missing: row.missing_fields.join(',') || '-',
    healthcheck: row.healthcheck ? `${row.healthcheck.ok ? 'ok' : 'fail'} (${row.healthcheck.http_status})` : '-',
  })))
  console.log(JSON.stringify(summary, null, 2))

  if (args.strict) {
    const hardFailures = rows.filter(row => row.status === 'error' || row.status === 'missing_keys')
    if (hardFailures.length > 0) {
      process.exitCode = 1
    }
  }
}

main().catch(error => {
  console.error('[bootstrap-public-api-connectors] failed:', normalizeError(error))
  process.exitCode = 1
})
