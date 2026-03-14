import { getAgentTargetsForEntry, normalizeText } from './publicApiCatalog.js'
import { getTemplateByCatalogSlug } from './publicApiConnectorTemplates.js'
import { buildApiBridgeProfile } from './publicApiInfrastructure.js'

const CATEGORY_EXTRACTION_MAP = {
  Geocoding: ['address_lookup', 'reverse_geocode', 'territory_normalization'],
  Transportation: ['route_planning', 'distance_time_estimation', 'mobility_signal'],
  Weather: ['forecast_timeseries', 'weather_observation', 'alert_context'],
  News: ['headline_feed', 'article_metadata', 'topic_tracking'],
  Finance: ['macro_timeseries', 'rates_curve', 'economic_indicator'],
  Government: ['public_record_lookup', 'policy_dataset', 'institutional_signal'],
  'Open Data': ['dataset_ingestion', 'reference_enrichment', 'public_signal'],
  Email: ['deliverability_validation', 'disposable_detection', 'outreach_quality'],
  Social: ['audience_signal', 'engagement_snapshot', 'brand_monitoring'],
  Jobs: ['hiring_signal', 'labor_market_feed', 'vacancy_tracking'],
  Development: ['schema_discovery', 'api_inventory', 'integration_support'],
  'Documents & Productivity': ['document_enrichment', 'structured_record_ingestion', 'knowledge_capture'],
  'Text Analysis': ['text_enrichment', 'classification', 'entity_extraction'],
  'Machine Learning': ['model_metadata', 'inference_support', 'ai_dataset_context'],
}

const CATEGORY_N8N_PATTERNS = {
  Geocoding: ['n8n_http_request_geocode', 'n8n_lead_enrichment_step'],
  Transportation: ['n8n_route_enrichment_step', 'n8n_visit_planning_flow'],
  Weather: ['n8n_scheduled_weather_ingest', 'n8n_operational_alerts_flow'],
  News: ['n8n_news_digest_pipeline', 'n8n_entity_extraction_chain'],
  Finance: ['n8n_macro_snapshot_pipeline', 'n8n_rate_watchlist_flow'],
  Government: ['n8n_open_data_sync', 'n8n_public_record_monitoring'],
  'Open Data': ['n8n_dataset_ingestion', 'n8n_reference_data_refresh'],
  Email: ['n8n_email_validation_gate', 'n8n_outreach_quality_check'],
  Social: ['n8n_social_signal_collector', 'n8n_content_trigger_flow'],
  Jobs: ['n8n_jobs_signal_feed', 'n8n_labor_snapshot_flow'],
  Development: ['n8n_openapi_discovery', 'n8n_connector_generation_assist'],
  'Documents & Productivity': ['n8n_document_enrichment', 'n8n_knowledge_ingestion'],
  'Text Analysis': ['n8n_text_analysis_chain', 'n8n_content_labeling_flow'],
  'Machine Learning': ['n8n_ml_feature_feed', 'n8n_model_signal_monitoring'],
}

const PRIMARY_OCULOPS_MODULES = new Set(['prospector', 'watchtower', 'finance', 'automation', 'knowledge', 'world_monitor'])

function unique(values = []) {
  return [...new Set(values.filter(Boolean))]
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function includesAny(haystack = '', needles = []) {
  return needles.some(needle => haystack.includes(needle))
}

function inferDataFormats(entry = {}) {
  const text = normalizeText([
    entry.name,
    entry.description,
    entry.docs_url,
    entry.raw_source?.description,
  ].join(' '))

  const formats = new Set(['json'])

  if (['Geocoding', 'Transportation'].includes(entry.category)) {
    formats.add('geojson')
  }
  if (text.includes('openapi') || text.includes('swagger')) {
    formats.add('openapi')
  }
  if (text.includes('graphql')) {
    formats.add('graphql')
  }
  if (text.includes('csv')) {
    formats.add('csv')
  }
  if (text.includes('xml')) {
    formats.add('xml')
  }
  if (text.includes('rss')) {
    formats.add('rss')
  }
  if (text.includes('html')) {
    formats.add('html')
  }
  if (text.includes('pdf')) {
    formats.add('pdf')
  }

  return [...formats]
}

function inferExtractionModes(entry = {}) {
  const byCategory = CATEGORY_EXTRACTION_MAP[entry.category] || ['generic_data_pull', 'reference_lookup']
  return unique(byCategory)
}

function classifyAccess(entry = {}) {
  const authType = String(entry.auth_type || 'unknown')
  const docs = normalizeText(entry.docs_url || '')
  const text = normalizeText(`${entry.name || ''} ${entry.description || ''}`)
  const looksRapidApi = docs.includes('rapidapi.com')
  const hasPricingHint = includesAny(text, ['pricing', 'subscription', 'paid'])
  const monetizationRisk = looksRapidApi || hasPricingHint
    ? 'elevated'
    : authType === 'none'
      ? 'low'
      : 'medium'

  if (authType === 'none') {
    return {
      access_class: 'open_no_auth',
      requires_registration: false,
      payment_status: 'unknown',
      free_tier_confidence: 'high',
      monetization_risk: monetizationRisk,
      is_free_public_candidate: true,
      auth_complexity: 'none',
    }
  }

  if (authType === 'api_key') {
    return {
      access_class: 'registration_api_key',
      requires_registration: true,
      payment_status: 'unknown',
      free_tier_confidence: looksRapidApi ? 'low' : 'unknown',
      monetization_risk: looksRapidApi ? 'elevated' : 'medium',
      is_free_public_candidate: false,
      auth_complexity: 'low',
    }
  }

  if (authType === 'oauth2' || authType === 'header') {
    return {
      access_class: 'registration_oauth_or_header',
      requires_registration: true,
      payment_status: 'unknown',
      free_tier_confidence: 'low',
      monetization_risk: 'medium',
      is_free_public_candidate: false,
      auth_complexity: 'high',
    }
  }

  return {
    access_class: 'unknown_access',
    requires_registration: true,
    payment_status: 'unknown',
    free_tier_confidence: 'unknown',
    monetization_risk: 'unknown',
    is_free_public_candidate: false,
    auth_complexity: 'unknown',
  }
}

function deriveRegistrationUrl(entry = {}) {
  const docsUrl = String(entry.docs_url || '').trim()
  if (!docsUrl) return null
  return docsUrl
}

function deriveCommandBindings(entry, bridgeProfile, access) {
  const commands = ['catalog_api_lookup', 'launch_n8n']

  if (bridgeProfile.executable_now) {
    commands.push('run_connector')
  }

  if (!bridgeProfile.executable_now && access.access_class === 'open_no_auth') {
    commands.push('run_api')
  }

  if (bridgeProfile.bridge_mode === 'install_then_connector_proxy') {
    commands.push('install_connector')
  }

  return unique(commands)
}

function deriveAutomationActions(entry, bridgeProfile, access) {
  const moduleTargets = unique(entry.module_targets || [])
  const actions = ['launch_n8n']

  if (bridgeProfile.executable_now) {
    actions.push('run_connector')
  }

  if (!bridgeProfile.executable_now && access.access_class === 'open_no_auth') {
    actions.push('run_api')
  }

  if (moduleTargets.includes('prospector')) {
    actions.push('run_agent', 'create_deal', 'compose_message')
  }

  if (moduleTargets.some(target => ['watchtower', 'finance', 'knowledge', 'world_monitor'].includes(target))) {
    actions.push('run_agent', 'notify')
  }

  if (moduleTargets.includes('automation')) {
    actions.push('run_agent')
  }

  return unique(actions)
}

function deriveN8nPatterns(entry, bridgeProfile, access) {
  const patterns = new Set(CATEGORY_N8N_PATTERNS[entry.category] || ['n8n_http_request_generic'])

  if (bridgeProfile.executable_now) {
    patterns.add('n8n_webhook_to_automation_runner_run_connector')
  } else if (bridgeProfile.bridge_mode === 'install_then_connector_proxy') {
    patterns.add('n8n_install_connector_then_run')
  }

  if (access.access_class === 'open_no_auth') {
    patterns.add('n8n_http_request_direct_public_api')
  }

  return [...patterns]
}

function computeIntegrationPriority(entry, context) {
  const businessFit = toNumber(entry.business_fit_score)
  const moduleTargets = context.moduleTargets || []
  const access = context.access
  const bridgeProfile = context.bridgeProfile

  let score = businessFit

  score += moduleTargets.reduce((acc, target) => acc + (PRIMARY_OCULOPS_MODULES.has(target) ? 8 : 3), 0)
  score += access.is_free_public_candidate ? 12 : 0
  score += bridgeProfile.executable_now ? 18 : 0
  score += bridgeProfile.bridge_mode === 'install_then_connector_proxy' ? 8 : 0
  score -= entry.https_only === false ? 25 : 0
  score -= access.monetization_risk === 'elevated' ? 10 : 0

  return clamp(Math.round(score), 0, 100)
}

function isInterestingForOculops(entry, profile) {
  const moduleTargets = profile.module_targets || []
  if (moduleTargets.some(target => PRIMARY_OCULOPS_MODULES.has(target))) {
    return true
  }

  return toNumber(entry.business_fit_score) >= 60 || profile.integration_priority >= 62
}

export function buildApiEcosystemProfile(entry = {}, options = {}) {
  const template = options.template || getTemplateByCatalogSlug(entry.slug)
  const connector = options.connector || null
  const bridgeProfile = options.bridgeProfile || buildApiBridgeProfile(entry, { template, connector })
  const access = classifyAccess(entry)

  const moduleTargets = unique(entry.module_targets || [])
  const agentTargets = unique(entry.agent_targets?.length ? entry.agent_targets : getAgentTargetsForEntry(entry))
  const dataFormats = inferDataFormats(entry)
  const extractionModes = inferExtractionModes(entry)
  const commandBindings = deriveCommandBindings(entry, bridgeProfile, access)
  const automationActions = deriveAutomationActions(entry, bridgeProfile, access)
  const n8nPatterns = deriveN8nPatterns(entry, bridgeProfile, access)
  const integrationPriority = computeIntegrationPriority(entry, {
    moduleTargets,
    access,
    bridgeProfile,
  })

  const profile = {
    access_class: access.access_class,
    requires_registration: access.requires_registration,
    payment_status: access.payment_status,
    free_tier_confidence: access.free_tier_confidence,
    monetization_risk: access.monetization_risk,
    is_free_public_candidate: access.is_free_public_candidate,
    auth_complexity: access.auth_complexity,
    auto_import_eligible: access.is_free_public_candidate && entry.https_only !== false,
    registration_url: deriveRegistrationUrl(entry),
    data_formats: dataFormats,
    extraction_modes: extractionModes,
    module_targets: moduleTargets,
    agent_targets: agentTargets,
    command_bindings: commandBindings,
    automation_actions: automationActions,
    n8n_patterns: n8nPatterns,
    recommended_connector_mode: bridgeProfile.bridge_mode,
    recommended_auth_mode: entry.auth_type || 'unknown',
    integration_priority: integrationPriority,
    is_interesting: false,
  }

  profile.is_interesting = isInterestingForOculops(entry, profile)

  return profile
}

function summarizeProfiles(entries = []) {
  const countsByAccessClass = {}
  const countsByPaymentStatus = {}
  const countsByFormat = {}
  const countsByCommand = {}
  const countsByAutomationAction = {}

  for (const entry of entries) {
    const profile = entry.ecosystem_profile || {}

    countsByAccessClass[profile.access_class || 'unknown'] = (countsByAccessClass[profile.access_class || 'unknown'] || 0) + 1
    countsByPaymentStatus[profile.payment_status || 'unknown'] = (countsByPaymentStatus[profile.payment_status || 'unknown'] || 0) + 1

    for (const format of profile.data_formats || []) {
      countsByFormat[format] = (countsByFormat[format] || 0) + 1
    }

    for (const command of profile.command_bindings || []) {
      countsByCommand[command] = (countsByCommand[command] || 0) + 1
    }

    for (const action of profile.automation_actions || []) {
      countsByAutomationAction[action] = (countsByAutomationAction[action] || 0) + 1
    }
  }

  return {
    countsByAccessClass,
    countsByPaymentStatus,
    countsByFormat,
    countsByCommand,
    countsByAutomationAction,
  }
}

function sortByPriorityThenName(left, right) {
  const leftPriority = toNumber(left.ecosystem_profile?.integration_priority)
  const rightPriority = toNumber(right.ecosystem_profile?.integration_priority)
  if (leftPriority !== rightPriority) return rightPriority - leftPriority
  return String(left.name || '').localeCompare(String(right.name || ''))
}

export function buildRegistrationBacklog(entries = [], options = {}) {
  const includeAllAuth = options.includeAllAuth === true

  return entries
    .filter(entry => {
      const profile = entry.ecosystem_profile || {}
      if (!profile.requires_registration) return false
      if (includeAllAuth) return true
      return profile.is_interesting
    })
    .map(entry => ({
      slug: entry.slug,
      name: entry.name,
      category: entry.category,
      auth_type: entry.auth_type,
      docs_url: entry.docs_url,
      registration_url: entry.ecosystem_profile?.registration_url || entry.docs_url,
      business_fit_score: toNumber(entry.business_fit_score),
      integration_priority: toNumber(entry.ecosystem_profile?.integration_priority),
      module_targets: entry.module_targets || [],
      agent_targets: entry.ecosystem_profile?.agent_targets || entry.agent_targets || [],
      status: 'pending_credentials',
      notes: 'Requires signup/credential before production use',
    }))
    .sort((left, right) => {
      if (left.integration_priority !== right.integration_priority) {
        return right.integration_priority - left.integration_priority
      }
      return String(left.name || '').localeCompare(String(right.name || ''))
    })
}

export function buildPublicApiEcosystemLayer(entries = [], options = {}) {
  const templatesBySlug = new Map((options.templates || []).map(template => [template.catalogSlug, template]))
  const connectorsBySlug = new Map(
    (options.connectors || [])
      .filter(connector => connector?.catalog_slug)
      .map(connector => [connector.catalog_slug, connector]),
  )

  const enrichedEntries = entries
    .map(entry => {
      const template = templatesBySlug.get(entry.slug) || null
      const connector = connectorsBySlug.get(entry.slug) || null
      const bridgeProfile = entry.bridge_profile || buildApiBridgeProfile(entry, { template, connector })
      const ecosystemProfile = buildApiEcosystemProfile(entry, {
        template,
        connector,
        bridgeProfile,
      })

      return {
        ...entry,
        template_key: entry.template_key || template?.templateKey || null,
        connector_id: entry.connector_id || connector?.id || null,
        connector_health_status: entry.connector_health_status || connector?.health_status || null,
        bridge_profile: bridgeProfile,
        ecosystem_profile: ecosystemProfile,
      }
    })
    .sort(sortByPriorityThenName)

  const registrationBacklog = buildRegistrationBacklog(enrichedEntries)
  const openFreeEntries = enrichedEntries.filter(entry => entry.ecosystem_profile?.auto_import_eligible)
  const executableNowEntries = enrichedEntries.filter(entry => entry.bridge_profile?.executable_now)
  const interestingEntries = enrichedEntries.filter(entry => entry.ecosystem_profile?.is_interesting)

  const profileSummary = summarizeProfiles(enrichedEntries)

  return {
    generated_at: options.generatedAt || new Date().toISOString(),
    source: options.source || 'catalog',
    summary: {
      total_catalog_entries: enrichedEntries.length,
      listed_entries: enrichedEntries.filter(entry => entry.is_listed !== false).length,
      unlisted_entries: enrichedEntries.filter(entry => entry.is_listed === false).length,
      open_no_auth_entries: enrichedEntries.filter(entry => entry.ecosystem_profile?.access_class === 'open_no_auth').length,
      requires_registration_entries: enrichedEntries.filter(entry => entry.ecosystem_profile?.requires_registration).length,
      free_public_candidate_entries: openFreeEntries.length,
      interesting_entries: interestingEntries.length,
      executable_now_entries: executableNowEntries.length,
      registration_backlog_entries: registrationBacklog.length,
      adapter_ready_entries: enrichedEntries.filter(entry => entry.activation_tier === 'adapter_ready').length,
      live_connector_entries: enrichedEntries.filter(entry => entry.activation_tier === 'live' || entry.connector_health_status === 'live').length,
      candidate_entries: enrichedEntries.filter(entry => entry.activation_tier === 'candidate').length,
      catalog_only_entries: enrichedEntries.filter(entry => entry.activation_tier === 'catalog_only').length,
      bridge_profiles: {
        connector_proxy: enrichedEntries.filter(entry => entry.bridge_profile?.bridge_mode === 'connector_proxy').length,
        install_then_connector_proxy: enrichedEntries.filter(entry => entry.bridge_profile?.bridge_mode === 'install_then_connector_proxy').length,
        docs_only: enrichedEntries.filter(entry => entry.bridge_profile?.bridge_mode === 'docs_only').length,
      },
      ...profileSummary,
    },
    entries: enrichedEntries,
    registration_backlog: registrationBacklog,
  }
}

export function toEcosystemArchitectureMarkdown(layer) {
  const lines = []
  lines.push('# Public API Ecosystem Architecture')
  lines.push('')
  lines.push(`Generated: ${layer.generated_at}`)
  lines.push(`Source: ${layer.source}`)
  lines.push('')
  lines.push('## Coverage')
  lines.push(`- Total catalog entries: ${layer.summary.total_catalog_entries}`)
  lines.push(`- Listed (marketplace): ${layer.summary.listed_entries}`)
  lines.push(`- Unlisted/internal: ${layer.summary.unlisted_entries}`)
  lines.push(`- Open no-auth entries: ${layer.summary.open_no_auth_entries}`)
  lines.push(`- Requires registration: ${layer.summary.requires_registration_entries}`)
  lines.push(`- Free-public auto-import candidates: ${layer.summary.free_public_candidate_entries}`)
  lines.push(`- Interesting for OCULOPS: ${layer.summary.interesting_entries}`)
  lines.push(`- Executable now (live connectors): ${layer.summary.executable_now_entries}`)
  lines.push(`- Registration backlog: ${layer.summary.registration_backlog_entries}`)
  lines.push('')
  lines.push('## Integration Modes')
  lines.push(`- connector_proxy: ${layer.summary.bridge_profiles.connector_proxy}`)
  lines.push(`- install_then_connector_proxy: ${layer.summary.bridge_profiles.install_then_connector_proxy}`)
  lines.push(`- docs_only: ${layer.summary.bridge_profiles.docs_only}`)
  lines.push('')
  lines.push('## Command Bindings')
  for (const [command, count] of Object.entries(layer.summary.countsByCommand || {})) {
    lines.push(`- ${command}: ${count}`)
  }
  lines.push('')
  lines.push('## Automation Actions')
  for (const [action, count] of Object.entries(layer.summary.countsByAutomationAction || {})) {
    lines.push(`- ${action}: ${count}`)
  }
  lines.push('')
  lines.push('## Delivery Notes')
  lines.push('- Open no-auth APIs are the first activation wave (no credentials required).')
  lines.push('- Registration backlog includes high-value APIs that need signup/API keys before production execution.')
  lines.push('- All entries are mapped to module + agent + command + n8n bridge patterns for phased rollout.')
  lines.push('')

  return `${lines.join('\n')}\n`
}
