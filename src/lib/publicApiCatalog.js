export const PUBLIC_APIS_SOURCE_REPO = 'public-apis/public-apis'
export const PUBLIC_APIS_README_URL = 'https://raw.githubusercontent.com/public-apis/public-apis/master/README.md'

const AUTH_MAP = {
  No: 'none',
  apiKey: 'api_key',
  OAuth: 'oauth2',
  'X-Mashape-Key': 'api_key',
  'User-Agent': 'header',
}

const HTTPS_MAP = {
  Yes: 'Yes',
  YES: 'Yes',
  No: 'No',
}

const CORS_MAP = {
  Yes: 'Yes',
  No: 'No',
  Unknown: 'Unknown',
  Unkown: 'Unknown',
}

function normalizeCellValue(value = '') {
  return String(value)
    .trim()
    .replace(/^`+|`+$/g, '')
    .trim()
}

export const MODULE_TARGET_MAP = {
  Geocoding: ['prospector'],
  Email: ['prospector', 'automation'],
  Social: ['prospector', 'automation'],
  'Open Data': ['prospector', 'watchtower', 'finance', 'knowledge'],
  News: ['watchtower', 'world_monitor'],
  Government: ['watchtower', 'finance', 'world_monitor'],
  Weather: ['watchtower', 'world_monitor'],
  Transportation: ['watchtower', 'world_monitor'],
  Jobs: ['watchtower'],
  Finance: ['finance', 'world_monitor'],
  Development: ['automation', 'knowledge'],
  'Documents & Productivity': ['automation', 'knowledge'],
  'Text Analysis': ['automation'],
  'Machine Learning': ['knowledge'],
}

export const MODULE_AGENT_TARGET_MAP = {
  prospector: ['atlas', 'hunter'],
  watchtower: ['atlas', 'strategist'],
  finance: ['strategist', 'cortex'],
  automation: ['cortex', 'outreach'],
  knowledge: ['strategist', 'cortex'],
  world_monitor: ['atlas', 'cortex'],
}

export const API_INTELLIGENCE_SECTIONS = [
  {
    key: 'macro_rates',
    label: 'Macro & Rates',
    shortLabel: 'Macro',
    description: 'Central banks, treasury data, FX proxies, and market-sensitive feeds.',
    color: '#22C55E',
    secondaryColor: '#B6F09C',
    categories: ['Finance'],
    moduleTargets: ['finance', 'world_monitor'],
  },
  {
    key: 'news_media',
    label: 'News & Media',
    shortLabel: 'Media',
    description: 'Editorial APIs, publication search, and briefing inputs.',
    color: '#2563EB',
    secondaryColor: '#7DD3FC',
    categories: ['News'],
    moduleTargets: ['watchtower', 'world_monitor'],
  },
  {
    key: 'government_open',
    label: 'Government & Open Data',
    shortLabel: 'Open Data',
    description: 'Public records, civic datasets, and institutional intelligence.',
    color: '#F97316',
    secondaryColor: '#FACC15',
    categories: ['Government', 'Open Data'],
    moduleTargets: ['watchtower', 'finance', 'knowledge', 'prospector'],
  },
  {
    key: 'weather_climate',
    label: 'Weather & Climate',
    shortLabel: 'Weather',
    description: 'Forecasts, observations, and operational weather telemetry.',
    color: '#0EA5E9',
    secondaryColor: '#67E8F9',
    categories: ['Weather'],
    moduleTargets: ['watchtower', 'world_monitor'],
  },
  {
    key: 'jobs_labor',
    label: 'Jobs & Labor',
    shortLabel: 'Jobs',
    description: 'Hiring demand and labor-market movement.',
    color: '#A855F7',
    secondaryColor: '#F0ABFC',
    categories: ['Jobs'],
    moduleTargets: ['watchtower'],
  },
  {
    key: 'maps_mobility',
    label: 'Maps & Mobility',
    shortLabel: 'Geo',
    description: 'Geocoding, routing, and territory movement.',
    color: '#EF4444',
    secondaryColor: '#FDA4AF',
    categories: ['Geocoding', 'Transportation'],
    moduleTargets: ['prospector', 'world_monitor'],
  },
  {
    key: 'social_outreach',
    label: 'Social & Outreach',
    shortLabel: 'Audience',
    description: 'Audience signals, messaging, and outreach tooling.',
    color: '#EC4899',
    secondaryColor: '#FDBA74',
    categories: ['Social', 'Email'],
    moduleTargets: ['prospector', 'automation'],
  },
  {
    key: 'research_dev',
    label: 'Research & Dev Tools',
    shortLabel: 'Dev',
    description: 'Developer infrastructure, schema discovery, and model tooling.',
    color: '#14B8A6',
    secondaryColor: '#86EFAC',
    categories: ['Development', 'Machine Learning', 'Text Analysis'],
    moduleTargets: ['automation', 'knowledge'],
  },
  {
    key: 'docs_productivity',
    label: 'Documents & Productivity',
    shortLabel: 'Docs',
    description: 'Documents, structured content, and productivity APIs.',
    color: '#F59E0B',
    secondaryColor: '#FDE68A',
    categories: ['Documents & Productivity'],
    moduleTargets: ['automation', 'knowledge'],
  },
  {
    key: 'business_commerce',
    label: 'Business & Commerce',
    shortLabel: 'Business',
    description: 'Operational company data, commercial signals, and transaction APIs.',
    color: '#8B5CF6',
    secondaryColor: '#C4B5FD',
    categories: ['Business'],
    moduleTargets: ['prospector', 'finance'],
  },
  {
    key: 'utility_long_tail',
    label: 'Utility & Long Tail',
    shortLabel: 'Utility',
    description: 'Everything outside the core operating stack, still searchable and design-ready.',
    color: '#5B9EFF',
    secondaryColor: '#93C5FD',
    categories: [],
    moduleTargets: [],
  },
]

export const API_ACCESS_GROUPS = [
  {
    key: 'open_access',
    label: 'No Auth',
    description: 'No account, no approval, direct docs-first activation.',
    color: '#22C55E',
  },
  {
    key: 'api_key_easy',
    label: 'API Key Easy',
    description: 'Usually just sign up, generate a key, and wire the secret.',
    color: '#F59E0B',
  },
  {
    key: 'oauth_review',
    label: 'OAuth / Review',
    description: 'Usually needs app registration, OAuth flow, headers, or provider approval.',
    color: '#EF4444',
  },
]

const TARGET_CATEGORIES = new Set(Object.keys(MODULE_TARGET_MAP))
const ENTERTAINMENT_CATEGORIES = new Set([
  'Anime',
  'Animals',
  'Books',
  'Entertainment',
  'Games & Comics',
  'Music',
  'Photography',
  'Video',
])

const BUSINESS_KEYWORDS = [
  'address',
  'ads',
  'analytics',
  'automation',
  'business',
  'commerce',
  'company',
  'content',
  'currency',
  'data',
  'document',
  'economic',
  'email',
  'finance',
  'forecast',
  'geocod',
  'government',
  'job',
  'language',
  'lead',
  'macro',
  'market',
  'monitor',
  'news',
  'openapi',
  'productivity',
  'route',
  'search',
  'series',
  'social',
  'stock',
  'text',
  'transport',
  'treasury',
  'vat',
  'weather',
  'website',
]

const API_SECTION_MAP = new Map(
  API_INTELLIGENCE_SECTIONS.flatMap((section, index) => section.categories.map(category => [
    category,
    { ...section, rank: index },
  ]))
)

const API_SECTION_FALLBACK = {
  ...API_INTELLIGENCE_SECTIONS[API_INTELLIGENCE_SECTIONS.length - 1],
  rank: API_INTELLIGENCE_SECTIONS.length - 1,
}

const ACTIVATION_BONUS_MAP = {
  live: 36,
  adapter_ready: 24,
  candidate: 14,
  catalog_only: 0,
}

const THUMBNAIL_MODES = ['signal', 'grid', 'constellation', 'spectrum']
const AGENT_TARGET_CACHE = new Map()

export function normalizeAuthValue(value = '') {
  const normalizedValue = normalizeCellValue(value)
  return AUTH_MAP[normalizedValue] || 'unknown'
}

export function normalizeHttpsValue(value = '') {
  const normalizedValue = normalizeCellValue(value)
  return HTTPS_MAP[normalizedValue] || 'Unknown'
}

export function normalizeCorsValue(value = '') {
  const normalizedValue = normalizeCellValue(value)
  return CORS_MAP[normalizedValue] || 'Unknown'
}

export function parseMarkdownLink(markdown = '') {
  const match = markdown.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
  if (!match) {
    return { label: markdown.trim(), url: '' }
  }

  return {
    label: match[1].trim(),
    url: match[2].trim(),
  }
}

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function hashString(value = '') {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

function hexToRgb(hex = '') {
  const normalized = hex.replace('#', '')

  if (normalized.length !== 6) {
    return null
  }

  const value = Number.parseInt(normalized, 16)

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function rgba(hex, alpha) {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(255, 255, 255, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

function humanizeToken(value = '') {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))]
}

function buildPreviewMetric(entry = {}) {
  if (entry.health_status === 'live' || entry.activation_tier === 'live') return 'Live node'
  if (entry.is_installed) return 'Installed'
  if (entry.activation_tier === 'adapter_ready') return 'Adapter ready'
  if (entry.auth_type === 'none') return 'Open access'
  if (entry.auth_type === 'api_key') return 'API key'
  return `${entry.business_fit_score || 0} fit`
}

function buildThumbnailBackground(mode, primaryColor, secondaryColor) {
  const baseLayer = `linear-gradient(145deg, ${rgba(primaryColor, 0.22)} 0%, rgba(5, 5, 8, 0.88) 58%, ${rgba(secondaryColor, 0.18)} 100%)`

  if (mode === 'grid') {
    return [
      `radial-gradient(circle at 18% 18%, ${rgba(primaryColor, 0.42)} 0%, transparent 30%)`,
      `radial-gradient(circle at 82% 10%, ${rgba(secondaryColor, 0.24)} 0%, transparent 32%)`,
      `repeating-linear-gradient(90deg, ${rgba('#FFFFFF', 0.06)} 0 1px, transparent 1px 28px)`,
      `repeating-linear-gradient(0deg, ${rgba('#FFFFFF', 0.05)} 0 1px, transparent 1px 24px)`,
      baseLayer,
    ].join(', ')
  }

  if (mode === 'constellation') {
    return [
      `radial-gradient(circle at 20% 28%, ${rgba(primaryColor, 0.38)} 0%, transparent 24%)`,
      `radial-gradient(circle at 78% 18%, ${rgba(secondaryColor, 0.28)} 0%, transparent 20%)`,
      `radial-gradient(circle at 68% 78%, ${rgba(primaryColor, 0.16)} 0%, transparent 26%)`,
      `linear-gradient(120deg, transparent 0 36%, ${rgba('#FFFFFF', 0.05)} 36% 37%, transparent 37% 100%)`,
      baseLayer,
    ].join(', ')
  }

  if (mode === 'spectrum') {
    return [
      `linear-gradient(90deg, ${rgba(primaryColor, 0.2)} 0 10%, transparent 10% 20%, ${rgba(secondaryColor, 0.16)} 20% 30%, transparent 30% 40%, ${rgba(primaryColor, 0.12)} 40% 50%, transparent 50% 100%)`,
      `radial-gradient(circle at 76% 24%, ${rgba(secondaryColor, 0.3)} 0%, transparent 24%)`,
      `radial-gradient(circle at 18% 76%, ${rgba(primaryColor, 0.24)} 0%, transparent 28%)`,
      baseLayer,
    ].join(', ')
  }

  return [
    `radial-gradient(circle at 18% 18%, ${rgba(primaryColor, 0.48)} 0%, transparent 28%)`,
    `radial-gradient(circle at 82% 22%, ${rgba(secondaryColor, 0.24)} 0%, transparent 22%)`,
    `linear-gradient(135deg, transparent 0 42%, ${rgba('#FFFFFF', 0.05)} 42% 43%, transparent 43% 100%)`,
    baseLayer,
  ].join(', ')
}

export function slugify(value = '') {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getDocsHostname(url = '') {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'unknown-host'
  }
}

export function getApiIntelligenceSection(entry = {}) {
  if (API_SECTION_MAP.has(entry.category)) {
    return API_SECTION_MAP.get(entry.category)
  }

  const moduleTargets = new Set(entry.module_targets || [])
  let bestSection = API_SECTION_FALLBACK
  let bestScore = -1

  for (const [index, rawSection] of API_INTELLIGENCE_SECTIONS.entries()) {
    if (rawSection.key === API_SECTION_FALLBACK.key) continue

    const overlap = rawSection.moduleTargets.reduce((score, target) => (
      moduleTargets.has(target) ? score + 10 : score
    ), 0)

    const categoryBias = normalizeText(`${entry.category} ${entry.description}`).includes(normalizeText(rawSection.shortLabel))
      ? 2
      : 0

    const score = overlap + categoryBias - (index * 0.01)

    if (score > bestScore) {
      bestScore = score
      bestSection = { ...rawSection, rank: index }
    }
  }

  return bestScore > 0 ? bestSection : API_SECTION_FALLBACK
}

export function scoreApiIntelligenceEntry(entry = {}) {
  const activationTier = entry.health_status === 'live' ? 'live' : (entry.activation_tier || 'catalog_only')
  let score = entry.business_fit_score || 0

  score += ACTIVATION_BONUS_MAP[activationTier] || 0
  score += Math.min((entry.module_targets || []).length * 4, 12)

  if (entry.is_installed) score += 12
  if (entry.https_only) score += 4
  if (entry.auth_type === 'none') score += 6
  if (entry.auth_type === 'api_key') score += 2
  if (entry.auth_type === 'unknown') score -= 4

  return clamp(score, 0, 160)
}

export function buildApiIntelligencePresentation(entry = {}) {
  const section = getApiIntelligenceSection(entry)
  const featuredScore = scoreApiIntelligenceEntry(entry)
  const docsHost = getDocsHostname(entry.docs_url)
  const visualSeed = hashString(entry.slug || `${entry.name}-${docsHost}`)
  const thumbnailMode = THUMBNAIL_MODES[visualSeed % THUMBNAIL_MODES.length]
  const cardVariant = featuredScore >= 104 ? 'hero' : featuredScore >= 74 ? 'standard' : 'compact'
  const watermark = docsHost === 'unknown-host'
    ? slugify(entry.name || 'public-api').toUpperCase()
    : docsHost.replace(/\./g, ' · ').toUpperCase()

  return {
    section_key: section.key,
    section_label: section.label,
    section_rank: section.rank,
    featured_score: featuredScore,
    thumbnail_mode: thumbnailMode,
    thumbnail_url: null,
    visual_seed: visualSeed,
    brand_hint: docsHost,
    card_variant: cardVariant,
    preview_metric: buildPreviewMetric(entry),
    thumbnail: {
      backgroundImage: buildThumbnailBackground(thumbnailMode, section.color, section.secondaryColor),
      accentColor: section.color,
      accentSoft: rgba(section.color, 0.14),
      secondaryColor: section.secondaryColor,
      secondarySoft: rgba(section.secondaryColor, 0.16),
      statusLabel: entry.health_status === 'live'
        ? 'LIVE'
        : entry.is_installed
          ? 'INSTALLED'
          : entry.activation_tier === 'adapter_ready'
            ? 'INSTALLABLE'
            : entry.activation_tier === 'candidate'
              ? 'CANDIDATE'
              : 'CATALOG',
      eyebrow: section.shortLabel.toUpperCase(),
      watermark,
      authLabel: humanizeToken(entry.auth_type || 'unknown'),
      metricLabel: buildPreviewMetric(entry),
    },
  }
}

export function summarizeApiIntelligenceSections(entries = []) {
  const counts = Object.fromEntries(API_INTELLIGENCE_SECTIONS.map(section => [section.key, 0]))

  for (const entry of entries) {
    const section = getApiIntelligenceSection(entry)
    counts[section.key] = (counts[section.key] || 0) + 1
  }

  return API_INTELLIGENCE_SECTIONS.map((section, index) => ({
    ...section,
    rank: index,
    count: counts[section.key] || 0,
  }))
}

export function groupApiIntelligenceEntries(entries = []) {
  const buckets = new Map(
    API_INTELLIGENCE_SECTIONS.map((section, index) => [section.key, { ...section, rank: index, entries: [] }])
  )

  for (const entry of entries) {
    const decoratedEntry = {
      ...entry,
      ...buildApiIntelligencePresentation(entry),
    }
    const section = buckets.get(decoratedEntry.section_key) || buckets.get(API_SECTION_FALLBACK.key)
    section.entries.push(decoratedEntry)
  }

  return [...buckets.values()]
    .map(section => ({
      ...section,
      entries: section.entries.sort((left, right) => {
        if ((right.featured_score || 0) !== (left.featured_score || 0)) {
          return (right.featured_score || 0) - (left.featured_score || 0)
        }
        return left.name.localeCompare(right.name)
      }),
    }))
}

export function getApiAccessGroup(entry = {}) {
  if (entry.auth_type === 'none') {
    return API_ACCESS_GROUPS[0]
  }

  if (entry.auth_type === 'api_key' || entry.auth_type === 'header') {
    return API_ACCESS_GROUPS[1]
  }

  return API_ACCESS_GROUPS[2]
}

export function groupCatalogEntriesByAccessBurden(entries = []) {
  const buckets = new Map(
    API_ACCESS_GROUPS.map(group => [group.key, { ...group, entries: [] }])
  )

  for (const entry of entries) {
    const decoratedEntry = {
      ...entry,
      ...buildApiIntelligencePresentation(entry),
    }
    const group = getApiAccessGroup(entry)
    buckets.get(group.key)?.entries.push(decoratedEntry)
  }

  return API_ACCESS_GROUPS.map(group => {
    const bucket = buckets.get(group.key) || { ...group, entries: [] }

    return {
      ...bucket,
      entries: bucket.entries.sort((left, right) => {
        if ((right.featured_score || 0) !== (left.featured_score || 0)) {
          return (right.featured_score || 0) - (left.featured_score || 0)
        }
        return left.name.localeCompare(right.name)
      }),
    }
  })
}

export function buildCatalogSlug(category, name, docsUrl) {
  const hostname = getDocsHostname(docsUrl)
  return slugify(`${category}-${name}-${hostname}`)
}

export function getModuleTargetsForCategory(category = '') {
  return [...(MODULE_TARGET_MAP[category] || [])]
}

export function getAgentTargetsForEntry(entry = {}) {
  if (Array.isArray(entry.agent_targets) && entry.agent_targets.length > 0) {
    return entry.agent_targets
  }

  const cacheKey = entry.slug || `${entry.category || ''}|${entry.name || ''}|${entry.description || ''}|${(entry.module_targets || []).join(',')}`
  if (AGENT_TARGET_CACHE.has(cacheKey)) {
    return AGENT_TARGET_CACHE.get(cacheKey)
  }

  const moduleTargets = entry.module_targets?.length
    ? entry.module_targets
    : getModuleTargetsForCategory(entry.category)

  const directTargets = moduleTargets.flatMap(target => MODULE_AGENT_TARGET_MAP[target] || [])
  const keywordTargets = []

  if (directTargets.length === 0) {
    const haystack = normalizeText(`${entry.name || ''} ${entry.description || ''} ${entry.category || ''}`)

    if (haystack.includes('report') || haystack.includes('brief') || haystack.includes('news')) {
      keywordTargets.push('strategist')
    }

    if (haystack.includes('alert') || haystack.includes('monitor') || haystack.includes('weather')) {
      keywordTargets.push('atlas')
    }

    if (haystack.includes('email') || haystack.includes('social') || haystack.includes('lead')) {
      keywordTargets.push('hunter')
    }
  }

  const targets = unique([
    ...(entry.agent_targets || []),
    ...directTargets,
    ...keywordTargets,
  ])

  AGENT_TARGET_CACHE.set(cacheKey, targets)
  return targets
}

export function scoreBusinessFit(entry) {
  let score = 0
  const haystack = normalizeText(`${entry.name} ${entry.description} ${entry.category}`)

  if (TARGET_CATEGORIES.has(entry.category)) score += 30
  if (BUSINESS_KEYWORDS.some(keyword => haystack.includes(keyword))) score += 20

  if (entry.auth_type === 'none') score += 15
  if (entry.auth_type === 'api_key') score += 10
  if (entry.auth_type === 'oauth2' || entry.auth_type === 'header') score += 5
  if (!entry.https_only) score -= 40
  if (ENTERTAINMENT_CATEGORIES.has(entry.category) && !BUSINESS_KEYWORDS.some(keyword => haystack.includes(keyword))) {
    score -= 15
  }

  return Math.max(0, Math.min(100, score))
}

export function computeActivationTier(entry, options = {}) {
  const adapterReadySlugs = options.adapterReadySlugs || new Set()

  if (adapterReadySlugs.has(entry.slug)) return 'adapter_ready'
  if (entry.https_only && entry.business_fit_score >= 60) return 'candidate'
  return 'catalog_only'
}

export function parseMarkdownTableRow(line = '') {
  if (!line.trim().startsWith('|')) return null

  const parts = line
    .split('|')
    .map(part => part.trim())

  if (parts[0] === '') parts.shift()
  if (parts[parts.length - 1] === '') parts.pop()

  while (parts.length > 5 && parts[parts.length - 1] === '') {
    parts.pop()
  }

  while (parts.length < 5) {
    parts.push('')
  }

  return parts
}

export function normalizeCatalogEntry(rawEntry, options = {}) {
  const adapterReadySlugs = options.adapterReadySlugs || new Set()
  const internalOnlySlugs = options.internalOnlySlugs || new Set()
  const parsedLink = parseMarkdownLink(rawEntry.api)
  const authType = normalizeAuthValue(rawEntry.auth)
  const httpsOnly = normalizeHttpsValue(rawEntry.https) === 'Yes'
  const corsPolicy = normalizeCorsValue(rawEntry.cors)
  const moduleTargets = getModuleTargetsForCategory(rawEntry.category)
  const agentTargets = getAgentTargetsForEntry({
    name: parsedLink.label,
    category: rawEntry.category,
    description: rawEntry.description,
    module_targets: moduleTargets,
  })
  const slug = buildCatalogSlug(rawEntry.category, parsedLink.label, parsedLink.url)

  const entry = {
    slug,
    name: parsedLink.label,
    category: rawEntry.category,
    docs_url: parsedLink.url,
    description: rawEntry.description.trim(),
    auth_type: authType,
    https_only: httpsOnly,
    cors_policy: corsPolicy,
    module_targets: moduleTargets,
    agent_targets: agentTargets,
    tags: [
      slugify(rawEntry.category),
      authType,
      corsPolicy.toLowerCase(),
      ...moduleTargets,
      ...agentTargets,
      getDocsHostname(parsedLink.url),
    ].filter(Boolean),
    raw_source: {
      api: rawEntry.api,
      description: rawEntry.description,
      auth: rawEntry.auth,
      https: rawEntry.https,
      cors: rawEntry.cors,
      markdown: rawEntry.markdown,
    },
  }

  entry.business_fit_score = scoreBusinessFit(entry)
  entry.activation_tier = computeActivationTier(entry, { adapterReadySlugs })
  entry.is_listed = !internalOnlySlugs.has(slug)

  return entry
}

export function parsePublicApisMarkdown(markdown, options = {}) {
  const lines = markdown.split('\n')
  const entries = []
  let currentCategory = null

  for (const line of lines) {
    const categoryMatch = line.match(/^###\s+(.+)$/)
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim()
      continue
    }

    if (!currentCategory || !line.trim().startsWith('|')) continue
    if (line.includes('API | Description | Auth | HTTPS | CORS')) continue
    if (/^\|[:\-\s|]+\|?$/.test(line.trim())) continue

    const parts = parseMarkdownTableRow(line)
    if (!parts || parts.length < 5) continue

    entries.push(normalizeCatalogEntry({
      category: currentCategory,
      api: parts[0],
      description: parts[1],
      auth: parts[2],
      https: parts[3],
      cors: parts[4],
      markdown: line,
    }, options))
  }

  return entries
}

export function summarizeCatalog(entries) {
  const countsByCategory = {}
  const countsByActivationTier = {}
  const countsByModuleTarget = {}
  const countsByAgentTarget = {}
  const countsByAuthType = {}

  for (const entry of entries) {
    countsByCategory[entry.category] = (countsByCategory[entry.category] || 0) + 1
    countsByActivationTier[entry.activation_tier] = (countsByActivationTier[entry.activation_tier] || 0) + 1
    countsByAuthType[entry.auth_type] = (countsByAuthType[entry.auth_type] || 0) + 1
    for (const target of entry.module_targets) {
      countsByModuleTarget[target] = (countsByModuleTarget[target] || 0) + 1
    }
    for (const target of getAgentTargetsForEntry(entry)) {
      countsByAgentTarget[target] = (countsByAgentTarget[target] || 0) + 1
    }
  }

  return {
    entryCount: entries.length,
    categoryCount: Object.keys(countsByCategory).length,
    countsByCategory,
    countsByActivationTier,
    countsByModuleTarget,
    countsByAgentTarget,
    countsByAuthType,
  }
}

export function buildPublicApiCatalogSnapshot({ readme, repoMeta, templates = [], syncedAt = new Date().toISOString() }) {
  const adapterReadySlugs = new Set(templates.map(template => template.catalogSlug))
  const internalOnlySlugs = new Set(templates.filter(template => template.internalOnly).map(template => template.catalogSlug))
  const entries = parsePublicApisMarkdown(readme, { adapterReadySlugs, internalOnlySlugs })
    .map(entry => ({
      ...entry,
      first_seen_at: syncedAt,
      last_seen_at: syncedAt,
    }))
    .sort((left, right) => {
      if (right.business_fit_score !== left.business_fit_score) {
        return right.business_fit_score - left.business_fit_score
      }
      return left.name.localeCompare(right.name)
    })

  const summary = summarizeCatalog(entries)
  const syncRun = {
    source_repo: repoMeta?.full_name || PUBLIC_APIS_SOURCE_REPO,
    default_branch: repoMeta?.default_branch || 'master',
    repo_pushed_at: repoMeta?.pushed_at || null,
    readme_sha: repoMeta?.readme_sha || null,
    entry_count: summary.entryCount,
    category_count: summary.categoryCount,
    status: 'completed',
    error: null,
    started_at: syncedAt,
    finished_at: syncedAt,
  }

  return {
    generated_at: syncedAt,
    source_repo: syncRun.source_repo,
    sync_run: syncRun,
    stats: summary,
    entries,
  }
}

export function filterCatalogEntries(entries, filters = {}) {
  const search = normalizeText(filters.search || '')
  const moduleTarget = filters.moduleTarget || 'all'
  const agentTarget = filters.agentTarget || 'all'
  const activationTier = filters.activationTier || 'all'
  const category = filters.category || 'all'
  const authType = filters.authType || 'all'
  const isListed = filters.isListed

  return entries.filter(entry => {
    if (search) {
      const haystack = normalizeText([
        entry.name,
        entry.category,
        entry.description,
        ...(entry.tags || []),
        ...(entry.module_targets || []),
        ...(getAgentTargetsForEntry(entry) || []),
      ].join(' '))

      if (!haystack.includes(search)) return false
    }

    if (moduleTarget !== 'all' && !(entry.module_targets || []).includes(moduleTarget)) return false
    if (agentTarget !== 'all' && !getAgentTargetsForEntry(entry).includes(agentTarget)) return false
    if (activationTier !== 'all' && entry.activation_tier !== activationTier) return false
    if (category !== 'all' && entry.category !== category) return false
    if (authType !== 'all' && entry.auth_type !== authType) return false
    if (typeof isListed === 'boolean' && entry.is_listed !== isListed) return false

    return true
  })
}

export function mergeCatalogEntriesWithConnectors(entries, connectors = []) {
  const connectorsBySlug = new Map(connectors.map(connector => [connector.catalog_slug, connector]))

  return entries.map(entry => {
    const connector = connectorsBySlug.get(entry.slug)
    if (!connector) return entry

    return {
      ...entry,
      connector_id: connector.id,
      health_status: connector.health_status,
      is_installed: true,
      agent_targets: unique([
        ...getAgentTargetsForEntry(entry),
        ...((connector.metadata && Array.isArray(connector.metadata.agent_targets)) ? connector.metadata.agent_targets : []),
      ]),
      activation_tier: connector.health_status === 'live' ? 'live' : entry.activation_tier,
    }
  })
}
