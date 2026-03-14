import { getTemplateByCatalogSlug } from './publicApiConnectorTemplates.js'
import { getAgentTargetsForEntry, normalizeText } from './publicApiCatalog.js'

const NORMALIZER_OUTPUT_SHAPES = {
  administrative_divisions: 'json.country_divisions[]',
  adresse_search: 'json.suggestions[]',
  graphhopper_route: 'json.routes[0].distance/time/geometry',
  disify_email: 'json.email_validation',
  disify_view: 'json.record',
  microlink_preview: 'json.preview_metadata',
  open_meteo_forecast: 'json.current + json.daily',
  aemet_observations: 'json.observations[]',
  guardian_search: 'json.news_items[]',
  fred_series: 'json.macro_observations[]',
  treasury_rates: 'json.treasury_records[]',
  arbeitnow_jobs: 'json.jobs[]',
  apis_guru_list: 'json.providers[]',
}

const AUTH_BURDEN_HINT = {
  none: 'open',
  api_key: 'secret_required',
  oauth2: 'oauth_flow',
  header: 'header_token',
  unknown: 'manual_review',
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))]
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function byFitThenName(a, b) {
  const leftFit = toNumber(a.business_fit_score)
  const rightFit = toNumber(b.business_fit_score)
  if (leftFit !== rightFit) return rightFit - leftFit
  return String(a.name || '').localeCompare(String(b.name || ''))
}

function classifyBridgeMode({ template, connector }) {
  if (connector?.health_status === 'live') return 'connector_proxy'
  if (template) return 'install_then_connector_proxy'
  return 'docs_only'
}

function getEndpointHint(template) {
  const endpoint = template?.endpoints?.[0] || null
  if (!endpoint) {
    return {
      method: 'GET',
      path: null,
      required_params: [],
      sample_params: {},
      request_format: 'docs_defined',
    }
  }

  const method = String(endpoint.method || 'GET').toUpperCase()
  const requestFormat = ['POST', 'PUT', 'PATCH'].includes(method)
    ? 'json_body + query_params'
    : 'query_params'

  return {
    method,
    path: endpoint.path || null,
    required_params: endpoint.requiredParams || [],
    sample_params: endpoint.sampleParams || {},
    request_format: requestFormat,
  }
}

function getOutputShape(normalizerKey) {
  return NORMALIZER_OUTPUT_SHAPES[normalizerKey] || 'json'
}

export function buildApiBridgeProfile(entry, options = {}) {
  const template = options.template || getTemplateByCatalogSlug(entry.slug)
  const connector = options.connector || null
  const bridgeMode = classifyBridgeMode({ template, connector })
  const endpoint = getEndpointHint(template)
  const normalizerKey = connector?.normalizer_key || template?.normalizerKey || null
  const capabilities = unique(connector?.capabilities || template?.capabilities || [])
  const agentTargets = unique(entry.agent_targets || getAgentTargetsForEntry(entry))

  return {
    bridge_mode: bridgeMode,
    auth_burden: AUTH_BURDEN_HINT[entry.auth_type] || 'manual_review',
    executable_now: bridgeMode === 'connector_proxy',
    endpoint_name: connector?.metadata?.endpoint_name || template?.endpointName || null,
    endpoint,
    normalizer_key: normalizerKey,
    output_shape: getOutputShape(normalizerKey),
    capabilities,
    agent_targets: agentTargets,
    automation: {
      action: bridgeMode === 'connector_proxy' ? 'run_connector' : null,
      can_run_now: bridgeMode === 'connector_proxy',
      requires_install: bridgeMode === 'install_then_connector_proxy',
    },
    n8n: {
      action: 'launch_n8n',
      bridge: bridgeMode === 'connector_proxy'
        ? 'n8n_webhook -> automation-runner -> run_connector'
        : 'n8n_http_request_or_install_connector_first',
    },
    skills: {
      live_access: bridgeMode === 'connector_proxy' ? ['fetch_external_data'] : [],
      catalog_access: ['catalog_api_lookup'],
    },
  }
}

export function buildPublicApiInfrastructureLayer(entries = [], options = {}) {
  const templates = options.templates || []
  const connectors = options.connectors || []
  const templateBySlug = new Map(templates.map(template => [template.catalogSlug, template]))
  const connectorBySlug = new Map(
    connectors
      .filter(connector => connector?.catalog_slug)
      .map(connector => [connector.catalog_slug, connector])
  )

  const bridgeEntries = entries
    .slice()
    .sort(byFitThenName)
    .map(entry => {
      const template = templateBySlug.get(entry.slug) || null
      const connector = connectorBySlug.get(entry.slug) || null
      const bridge_profile = buildApiBridgeProfile(entry, { template, connector })

      return {
        ...entry,
        connector_id: connector?.id || null,
        connector_health_status: connector?.health_status || null,
        template_key: template?.templateKey || null,
        bridge_profile,
      }
    })

  const stats = {
    entry_count: bridgeEntries.length,
    category_count: unique(bridgeEntries.map(entry => entry.category)).length,
    executable_now_count: bridgeEntries.filter(entry => entry.bridge_profile.executable_now).length,
    installable_count: bridgeEntries.filter(entry => entry.bridge_profile.bridge_mode === 'install_then_connector_proxy').length,
    docs_only_count: bridgeEntries.filter(entry => entry.bridge_profile.bridge_mode === 'docs_only').length,
    live_connector_count: bridgeEntries.filter(entry => entry.connector_health_status === 'live').length,
    adapter_ready_count: bridgeEntries.filter(entry => entry.activation_tier === 'adapter_ready').length,
    candidate_count: bridgeEntries.filter(entry => entry.activation_tier === 'candidate').length,
    auth_mix: bridgeEntries.reduce((acc, entry) => {
      const key = entry.auth_type || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}),
  }

  return {
    generated_at: options.generatedAt || new Date().toISOString(),
    source: options.source || 'catalog',
    stats,
    entries: bridgeEntries,
  }
}

export function suggestPublicApisForIntent(intent, entries = [], options = {}) {
  const normalizedIntent = normalizeText(intent || '')
  const tokens = normalizedIntent.split(/[^a-z0-9]+/g).filter(token => token.length >= 3)
  const limit = Math.max(1, Math.min(50, Number(options.limit || 8)))

  const ranked = entries
    .map(entry => {
      const haystack = normalizeText([
        entry.name,
        entry.description,
        entry.category,
        ...(entry.tags || []),
        ...(entry.module_targets || []),
        ...(entry.agent_targets || []),
      ].join(' '))

      let score = toNumber(entry.business_fit_score)
      for (const token of tokens) {
        if (haystack.includes(token)) score += 18
      }
      if (entry.bridge_profile?.executable_now) score += 16
      if (entry.activation_tier === 'adapter_ready') score += 12
      if (entry.auth_type === 'none') score += 6

      return { entry, score }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ entry, score }) => ({
      slug: entry.slug,
      name: entry.name,
      category: entry.category,
      docs_url: entry.docs_url,
      auth_type: entry.auth_type,
      activation_tier: entry.activation_tier,
      bridge_mode: entry.bridge_profile?.bridge_mode || 'docs_only',
      executable_now: Boolean(entry.bridge_profile?.executable_now),
      capabilities: entry.bridge_profile?.capabilities || [],
      score,
    }))

  return {
    intent,
    token_count: tokens.length,
    results: ranked,
  }
}

export function toInfrastructureMarkdown(layer) {
  const lines = []
  lines.push('# Public API Infrastructure Layer')
  lines.push('')
  lines.push(`Generated: ${layer.generated_at}`)
  lines.push(`Source: ${layer.source}`)
  lines.push('')
  lines.push('## Summary')
  lines.push(`- Total APIs: ${layer.stats.entry_count}`)
  lines.push(`- Executable now (live connectors): ${layer.stats.executable_now_count}`)
  lines.push(`- Installable (adapter templates): ${layer.stats.installable_count}`)
  lines.push(`- Docs only: ${layer.stats.docs_only_count}`)
  lines.push(`- Adapter-ready: ${layer.stats.adapter_ready_count}`)
  lines.push(`- Candidate: ${layer.stats.candidate_count}`)
  lines.push('')
  lines.push('## Bridge Modes')
  lines.push('- `connector_proxy`: can run now via `api-proxy` and automation `run_connector`')
  lines.push('- `install_then_connector_proxy`: needs connector install + credentials before execution')
  lines.push('- `docs_only`: docs-level source, usable for research/spec planning until adapter exists')
  lines.push('')
  lines.push('## Skills + Automation')
  lines.push('- Agent live execution skill: `fetch_external_data` (live connectors only)')
  lines.push('- Agent catalog exploration skill: `catalog_api_lookup`')
  lines.push('- Automation action for connectors: `run_connector`')
  lines.push('- n8n bridge action: `launch_n8n`')
  lines.push('')

  return `${lines.join('\n')}\n`
}
