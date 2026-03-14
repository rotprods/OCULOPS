import { describe, it, expect } from 'vitest'
import { buildCatalogSlug } from '../lib/publicApiCatalog'
import { PUBLIC_API_ADAPTER_TEMPLATES } from '../lib/publicApiConnectorTemplates'
import {
  buildApiBridgeProfile,
  buildPublicApiInfrastructureLayer,
  suggestPublicApisForIntent,
  toInfrastructureMarkdown,
} from '../lib/publicApiInfrastructure'

const OPEN_METEO_SLUG = buildCatalogSlug('Weather', 'Open-Meteo', 'https://open-meteo.com/')

describe('publicApiInfrastructure bridge profiles', () => {
  it('classifies bridge mode correctly for live connector vs docs-only', () => {
    const weatherEntry = {
      slug: OPEN_METEO_SLUG,
      name: 'Open-Meteo',
      category: 'Weather',
      docs_url: 'https://open-meteo.com/',
      description: 'Forecast API',
      auth_type: 'none',
      https_only: true,
      cors_policy: 'Unknown',
      module_targets: ['watchtower', 'world_monitor'],
      agent_targets: ['atlas'],
      business_fit_score: 82,
      activation_tier: 'adapter_ready',
      tags: [],
    }

    const docsOnlyEntry = {
      slug: 'fun-api-example-org',
      name: 'Fun API',
      category: 'Entertainment',
      docs_url: 'https://example.org/fun',
      description: 'Memes and trivia',
      auth_type: 'none',
      https_only: true,
      cors_policy: 'Unknown',
      module_targets: [],
      agent_targets: [],
      business_fit_score: 8,
      activation_tier: 'catalog_only',
      tags: [],
    }

    const liveProfile = buildApiBridgeProfile(weatherEntry, {
      template: PUBLIC_API_ADAPTER_TEMPLATES.find(template => template.catalogSlug === OPEN_METEO_SLUG),
      connector: {
        id: 'connector-open-meteo',
        health_status: 'live',
        normalizer_key: 'open_meteo_forecast',
        capabilities: ['weather', 'forecast'],
      },
    })

    const docsProfile = buildApiBridgeProfile(docsOnlyEntry, { template: null, connector: null })

    expect(liveProfile.bridge_mode).toBe('connector_proxy')
    expect(liveProfile.executable_now).toBe(true)
    expect(liveProfile.automation.action).toBe('run_connector')
    expect(liveProfile.output_shape).toBe('json.current + json.daily')

    expect(docsProfile.bridge_mode).toBe('docs_only')
    expect(docsProfile.executable_now).toBe(false)
    expect(docsProfile.automation.action).toBe(null)
  })
})

describe('publicApiInfrastructure layer + intent suggestions', () => {
  it('builds stats and suggests best API for a weather intent', () => {
    const entries = [
      {
        slug: OPEN_METEO_SLUG,
        name: 'Open-Meteo',
        category: 'Weather',
        docs_url: 'https://open-meteo.com/',
        description: 'Forecast API with current and daily weather',
        auth_type: 'none',
        https_only: true,
        cors_policy: 'Unknown',
        module_targets: ['watchtower'],
        agent_targets: ['atlas'],
        business_fit_score: 82,
        activation_tier: 'adapter_ready',
        tags: ['weather', 'forecast'],
      },
      {
        slug: 'news-example',
        name: 'Generic News Feed',
        category: 'News',
        docs_url: 'https://example.com/news',
        description: 'Headlines and media stories',
        auth_type: 'api_key',
        https_only: true,
        cors_policy: 'Unknown',
        module_targets: ['watchtower'],
        agent_targets: ['strategist'],
        business_fit_score: 64,
        activation_tier: 'candidate',
        tags: ['news'],
      },
    ]

    const connectors = [{
      id: 'connector-open-meteo',
      catalog_slug: OPEN_METEO_SLUG,
      health_status: 'live',
      capabilities: ['weather', 'forecast'],
      endpoints: [{ name: 'forecast', sampleParams: { latitude: '40.4', longitude: '-3.7' } }],
      normalizer_key: 'open_meteo_forecast',
      metadata: {},
      is_active: true,
    }]

    const layer = buildPublicApiInfrastructureLayer(entries, {
      templates: PUBLIC_API_ADAPTER_TEMPLATES,
      connectors,
      source: 'test',
      generatedAt: '2026-03-14T00:00:00.000Z',
    })

    expect(layer.stats.entry_count).toBe(2)
    expect(layer.stats.live_connector_count).toBe(1)
    expect(layer.stats.executable_now_count).toBe(1)
    expect(layer.entries.find(entry => entry.slug === OPEN_METEO_SLUG)?.bridge_profile.bridge_mode).toBe('connector_proxy')

    const suggestion = suggestPublicApisForIntent('weather forecast in madrid', layer.entries, { limit: 1 })
    expect(suggestion.results[0]?.slug).toBe(OPEN_METEO_SLUG)

    const markdown = toInfrastructureMarkdown(layer)
    expect(markdown).toContain('Total APIs: 2')
    expect(markdown).toContain('connector_proxy')
  })
})
