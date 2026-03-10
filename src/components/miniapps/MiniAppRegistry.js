// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Mini-App Registry
// First-party API surface for the API Network dashboard
// ═══════════════════════════════════════════════════

function createCoreApp(definition) {
  return {
    inputSchema: [],
    status: 'active',
    source: 'core',
    runMode: 'edge_function',
    moduleTargets: [],
    agentTargets: [],
    n8nTemplates: [],
    moduleLinks: [],
    requiredSecrets: [],
    healthcheckPayload: null,
    ...definition,
  }
}

export const CORE_MINI_APPS = [
  createCoreApp({
    id: 'google_places',
    name: 'Google Places',
    icon: '📍',
    color: '#34A853',
    mode: 'search',
    type: 'Geo Intelligence',
    endpoint: 'google-maps-search',
    description: 'Search businesses by category and location with website, phone, reviews, and geodata.',
    inputSchema: [
      { key: 'query', label: 'Business Type', type: 'text', placeholder: 'restaurants, dental clinics...' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'Madrid, Barcelona...' },
      {
        key: 'radius',
        label: 'Radius',
        type: 'select',
        options: [
          { value: 1000, label: '1 km' },
          { value: 5000, label: '5 km' },
          { value: 10000, label: '10 km' },
          { value: 25000, label: '25 km' },
        ],
      },
    ],
    docsUrl: 'https://developers.google.com/maps/documentation/places/web-service',
    moduleTargets: ['prospector'],
    agentTargets: ['atlas', 'hunter'],
    n8nTemplates: ['maps-lead-prospector.json', 'atlas-hunter-pipeline.json'],
    moduleLinks: [
      { label: 'Prospector', path: '/prospector' },
      { label: 'Automation', path: '/automation' },
    ],
    requiredSecrets: ['GOOGLE_MAPS_API_KEY'],
    healthcheckPayload: { query: 'restaurants', location: 'Madrid', radius: 1000 },
  }),
  createCoreApp({
    id: 'web_analyzer',
    name: 'Web Analyzer',
    icon: '⚡',
    color: '#4285F4',
    mode: 'analyze',
    type: 'Web Intelligence',
    endpoint: 'web-analyzer',
    description: 'Analyze website structure, SEO metadata, forms, booking flows, and technical signals.',
    inputSchema: [
      { key: 'website', label: 'Website URL', type: 'text', placeholder: 'https://example.com' },
    ],
    docsUrl: 'https://developers.google.com/speed/docs/insights/v5/about',
    moduleTargets: ['prospector', 'knowledge'],
    agentTargets: ['hunter', 'strategist'],
    n8nTemplates: ['atlas-hunter-pipeline.json'],
    moduleLinks: [
      { label: 'Prospector', path: '/prospector' },
      { label: 'Knowledge', path: '/knowledge' },
    ],
    healthcheckPayload: { website: 'https://example.com' },
  }),
  createCoreApp({
    id: 'tech_detect',
    name: 'Tech Detector',
    icon: '🔧',
    color: '#FF6B35',
    mode: 'analyze',
    type: 'Web Intelligence',
    endpoint: 'web-analyzer',
    description: 'Detect WordPress, Shopify, React, analytics pixels, booking tools, and chat providers.',
    inputSchema: [
      { key: 'website', label: 'Website URL', type: 'text', placeholder: 'https://example.com' },
    ],
    docsUrl: 'https://developers.google.com/speed/docs/insights/v5/about',
    moduleTargets: ['prospector'],
    agentTargets: ['hunter'],
    n8nTemplates: ['atlas-hunter-pipeline.json'],
    moduleLinks: [
      { label: 'Prospector', path: '/prospector' },
    ],
    healthcheckPayload: { website: 'https://example.com' },
  }),
  createCoreApp({
    id: 'social_scan',
    name: 'Social Scanner',
    icon: '📱',
    color: '#E4405F',
    mode: 'analyze',
    type: 'Web Intelligence',
    endpoint: 'web-analyzer',
    description: 'Extract Instagram, Facebook, TikTok, LinkedIn, and YouTube profiles from a website.',
    inputSchema: [
      { key: 'website', label: 'Website URL', type: 'text', placeholder: 'https://example.com' },
    ],
    docsUrl: 'https://developers.google.com/speed/docs/insights/v5/about',
    moduleTargets: ['prospector', 'automation'],
    agentTargets: ['hunter', 'outreach'],
    n8nTemplates: ['social-content-factory.json', 'atlas-hunter-pipeline.json'],
    moduleLinks: [
      { label: 'Prospector', path: '/prospector' },
      { label: 'Automation', path: '/automation' },
    ],
    healthcheckPayload: { website: 'https://example.com' },
  }),
  createCoreApp({
    id: 'ai_qualifier',
    name: 'AI Qualifier',
    icon: '🧠',
    color: '#886FBF',
    mode: 'analyze',
    type: 'AI Engine',
    endpoint: 'ai-qualifier',
    description: 'AI-qualify a lead with fit score, pain points, contact hints, and estimated deal value.',
    inputSchema: [
      { key: 'lead_id', label: 'Lead ID', type: 'text', placeholder: 'UUID of the lead' },
    ],
    docsUrl: 'https://platform.openai.com/docs',
    moduleTargets: ['prospector', 'automation'],
    agentTargets: ['hunter', 'strategist'],
    n8nTemplates: ['chatbot-lead-qualifier.json', 'atlas-hunter-pipeline.json'],
    moduleLinks: [
      { label: 'Prospector', path: '/prospector' },
      { label: 'Automation', path: '/automation' },
    ],
    healthcheckPayload: {
      lead: {
        name: 'Example Studio',
        business_name: 'Example Studio',
        website: 'https://example.com',
        category: 'marketing agency',
      },
    },
  }),
  createCoreApp({
    id: 'ai_advisor',
    name: 'AI Strategy Advisor',
    icon: '🎯',
    color: '#FFD60A',
    mode: 'analyze',
    type: 'AI Engine',
    endpoint: 'ai-advisor',
    description: 'Generate strategic recommendations from deals, alerts, market feeds, and social demand signals.',
    docsUrl: 'https://platform.openai.com/docs',
    moduleTargets: ['knowledge', 'automation', 'finance'],
    agentTargets: ['strategist', 'cortex'],
    n8nTemplates: ['strategist-webhook.json', 'weekly-business-report.json'],
    moduleLinks: [
      { label: 'Control Tower', path: '/control-tower' },
      { label: 'Automation', path: '/automation' },
    ],
    healthcheckPayload: {},
  }),
  createCoreApp({
    id: 'market_data',
    name: 'Markets Feed',
    icon: '📈',
    color: '#22C55E',
    mode: 'monitor',
    type: 'Finance Intelligence',
    endpoint: 'market-data',
    description: 'Refresh and persist stock, forex, and crypto snapshots for market monitoring.',
    docsUrl: 'https://www.alphavantage.co/documentation/',
    moduleTargets: ['finance', 'watchtower', 'world_monitor'],
    agentTargets: ['atlas', 'cortex'],
    n8nTemplates: ['competitor-monitor.json', 'weekly-business-report.json'],
    moduleLinks: [
      { label: 'Markets', path: '/markets' },
      { label: 'Automation', path: '/automation' },
    ],
    requiredSecrets: ['ALPHA_VANTAGE_KEY'],
    healthcheckPayload: { persist: true },
  }),
  createCoreApp({
    id: 'social_signals',
    name: 'Social Signals',
    icon: '📡',
    color: '#F97316',
    mode: 'monitor',
    type: 'Demand Intelligence',
    endpoint: 'social-signals',
    description: 'Track Reddit and Hacker News conversations for demand shifts, urgency, and offer opportunities.',
    docsUrl: 'https://developers.reddit.com/docs',
    moduleTargets: ['watchtower', 'knowledge', 'automation'],
    agentTargets: ['atlas', 'cortex', 'strategist'],
    n8nTemplates: ['competitor-monitor.json', 'social-content-factory.json'],
    moduleLinks: [
      { label: 'Intelligence', path: '/intelligence' },
      { label: 'Automation', path: '/automation' },
    ],
    requiredSecrets: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_USER_AGENT'],
    healthcheckPayload: { persist: true },
  }),
  createCoreApp({
    id: 'meta_business',
    name: 'Meta Business Discovery',
    icon: '📸',
    color: '#1877F2',
    mode: 'search',
    type: 'Social Intelligence',
    endpoint: 'meta-business-discovery',
    description: 'Scan Instagram business activity by hashtag and score accounts with buyer intent signals.',
    inputSchema: [
      { key: 'hashtags', label: 'Hashtags (; separated)', type: 'text', placeholder: 'marketing;saas', multiple: true },
      {
        key: 'limit',
        label: 'Limit',
        type: 'select',
        options: [
          { value: 10, label: '10' },
          { value: 25, label: '25' },
          { value: 50, label: '50' },
        ],
      },
    ],
    status: 'pending',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api/guides/hashtag-search',
    moduleTargets: ['prospector', 'watchtower'],
    agentTargets: ['atlas'],
    n8nTemplates: ['competitor-monitor.json'],
    moduleLinks: [
      { label: 'Intelligence', path: '/intelligence' },
      { label: 'Prospector', path: '/prospector' },
    ],
    requiredSecrets: ['META_ACCESS_TOKEN'],
    healthcheckPayload: { hashtags: ['marketing'], limit: 1 },
  }),
  createCoreApp({
    id: 'tiktok_biz',
    name: 'TikTok Business',
    icon: '🎵',
    color: '#010101',
    mode: 'search',
    type: 'Social Intelligence',
    endpoint: 'tiktok-business-search',
    description: 'Query TikTok research data for creator and business demand patterns in specific regions.',
    inputSchema: [
      { key: 'keywords', label: 'Keywords (; separated)', type: 'text', placeholder: 'restaurant marketing;lead gen', multiple: true },
      { key: 'location', label: 'Region Code', type: 'text', placeholder: 'ES, US, GB...' },
      {
        key: 'limit',
        label: 'Limit',
        type: 'select',
        options: [
          { value: 10, label: '10' },
          { value: 20, label: '20' },
          { value: 50, label: '50' },
        ],
      },
    ],
    status: 'pending',
    docsUrl: 'https://developers.tiktok.com/doc/research-api-overview/',
    moduleTargets: ['prospector', 'watchtower'],
    agentTargets: ['atlas'],
    n8nTemplates: ['competitor-monitor.json', 'social-content-factory.json'],
    moduleLinks: [
      { label: 'Intelligence', path: '/intelligence' },
      { label: 'Prospector', path: '/prospector' },
    ],
    requiredSecrets: ['TIKTOK_API_KEY'],
    healthcheckPayload: { keywords: ['saas'], location: 'ES', limit: 1 },
  }),
  createCoreApp({
    id: 'messaging_dispatch',
    name: 'Messaging Dispatch',
    icon: '💬',
    color: '#25D366',
    mode: 'action',
    type: 'Execution',
    endpoint: 'messaging-dispatch',
    description: 'Send Gmail or WhatsApp messages through connected provider channels from a conversation context.',
    inputSchema: [
      { key: 'conversation_id', label: 'Conversation ID', type: 'text', placeholder: 'UUID of the conversation' },
      {
        key: 'channel',
        label: 'Channel',
        type: 'select',
        options: [
          { value: 'email', label: 'Email' },
          { value: 'whatsapp', label: 'WhatsApp' },
        ],
      },
      { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Optional email subject' },
      { key: 'content', label: 'Message Body', type: 'text', placeholder: 'Write the outbound message' },
    ],
    status: 'pending',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp',
    moduleTargets: ['automation', 'prospector'],
    agentTargets: ['outreach', 'herald'],
    n8nTemplates: ['outreach-gmail-sender.json', 'speed-to-lead.json'],
    moduleLinks: [
      { label: 'Messaging', path: '/messaging' },
      { label: 'Automation', path: '/automation' },
    ],
    requiredSecrets: ['WHATSAPP_TOKEN'],
    healthcheckPayload: { conversation_id: 'healthcheck', channel: 'email', content: 'healthcheck' },
  }),
  createCoreApp({
    id: 'manychat_sync',
    name: 'ManyChat Sync',
    icon: '🤖',
    color: '#14B8A6',
    mode: 'sync',
    type: 'Execution',
    endpoint: 'manychat-sync',
    description: 'Import ManyChat subscribers and conversations into the unified messaging layer.',
    inputSchema: [
      {
        key: 'action',
        label: 'Action',
        type: 'select',
        options: [
          { value: 'list_subscribers', label: 'List Subscribers' },
          { value: 'get_subscriber', label: 'Get Subscriber' },
          { value: 'sync_all', label: 'Sync All' },
        ],
      },
      { key: 'subscriber_id', label: 'Subscriber ID', type: 'text', placeholder: 'Required for get_subscriber' },
    ],
    status: 'pending',
    docsUrl: 'https://manychat.github.io/dynamic_block_docs/api/',
    moduleTargets: ['automation', 'messaging'],
    agentTargets: ['outreach', 'herald'],
    n8nTemplates: ['chatbot-lead-qualifier.json'],
    moduleLinks: [
      { label: 'Messaging', path: '/messaging' },
      { label: 'Automation', path: '/automation' },
    ],
    requiredSecrets: ['MANYCHAT_API_KEY'],
    healthcheckPayload: { action: 'list_subscribers', page_size: 1 },
  }),
  createCoreApp({
    id: 'linkedin',
    name: 'LinkedIn Data',
    icon: '💼',
    color: '#0077B5',
    mode: 'search',
    type: 'Social Intelligence',
    endpoint: null,
    description: 'Company profiles, employees, headcount growth, and hiring movements.',
    inputSchema: [
      { key: 'company', label: 'Company Name', type: 'text', placeholder: 'Acme Corp' },
    ],
    status: 'planned',
    runMode: 'docs_only',
    docsUrl: 'https://learn.microsoft.com/linkedin/',
    moduleTargets: ['prospector'],
    agentTargets: ['atlas'],
    n8nTemplates: ['competitor-monitor.json'],
    moduleLinks: [
      { label: 'Prospector', path: '/prospector' },
    ],
  }),
  createCoreApp({
    id: 'whois',
    name: 'Domain WHOIS',
    icon: '🌐',
    color: '#6C757D',
    mode: 'analyze',
    type: 'Data Enricher',
    endpoint: null,
    description: 'Domain age, registrar, ownership hints, and infrastructure provenance.',
    inputSchema: [
      { key: 'domain', label: 'Domain', type: 'text', placeholder: 'example.com' },
    ],
    status: 'planned',
    runMode: 'docs_only',
    docsUrl: 'https://www.iana.org/whois',
    moduleTargets: ['prospector'],
    agentTargets: ['hunter'],
    n8nTemplates: ['atlas-hunter-pipeline.json'],
    moduleLinks: [
      { label: 'Prospector', path: '/prospector' },
    ],
  }),
  createCoreApp({
    id: 'email_finder',
    name: 'Email Finder',
    icon: '📧',
    color: '#20C997',
    mode: 'analyze',
    type: 'Data Enricher',
    endpoint: null,
    description: 'Discover decision-maker emails from company and domain context.',
    inputSchema: [
      { key: 'domain', label: 'Domain', type: 'text', placeholder: 'example.com' },
      { key: 'name', label: 'Person Name', type: 'text', placeholder: 'John Doe' },
    ],
    status: 'planned',
    runMode: 'docs_only',
    docsUrl: 'https://hunter.io/api',
    moduleTargets: ['prospector', 'automation'],
    agentTargets: ['hunter', 'outreach'],
    n8nTemplates: ['outreach-gmail-sender.json'],
    moduleLinks: [
      { label: 'Prospector', path: '/prospector' },
      { label: 'Automation', path: '/automation' },
    ],
  }),
]

function matchesSearch(app, query = '') {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const haystack = [
    app.name,
    app.type,
    app.description,
    ...(app.moduleTargets || []),
    ...(app.agentTargets || []),
    ...(app.n8nTemplates || []),
    ...(app.requiredSecrets || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

export function filterCoreApps(apps = CORE_MINI_APPS, filters = {}) {
  const { search = '', moduleTarget = 'all', agentTarget = 'all' } = filters

  return apps.filter(app => {
    if (!matchesSearch(app, search)) return false
    if (moduleTarget !== 'all' && !(app.moduleTargets || []).includes(moduleTarget)) return false
    if (agentTarget !== 'all' && !(app.agentTargets || []).includes(agentTarget)) return false
    return true
  })
}

export const MINI_APPS = CORE_MINI_APPS

export const getActiveApps = (apps = CORE_MINI_APPS) => apps.filter(app => app.status === 'active')
export const getPendingApps = (apps = CORE_MINI_APPS) => apps.filter(app => app.status === 'pending')
export const getPlannedApps = (apps = CORE_MINI_APPS) => apps.filter(app => app.status === 'planned')
export const getAppById = (id, apps = CORE_MINI_APPS) => apps.find(app => app.id === id)
export const getAppsByType = (type, apps = CORE_MINI_APPS) => apps.filter(app => app.type === type)
export const APP_TYPES = [...new Set(CORE_MINI_APPS.map(app => app.type))]
