import { describe, it, expect } from 'vitest'
import { buildCatalogSlug } from '../lib/publicApiCatalog'
import { PUBLIC_API_ADAPTER_TEMPLATES } from '../lib/publicApiConnectorTemplates'
import {
  buildApiEcosystemProfile,
  buildPublicApiEcosystemLayer,
  buildRegistrationBacklog,
  toEcosystemArchitectureMarkdown,
} from '../lib/publicApiEcosystem'
import { buildPublicApiInfrastructureLayer } from '../lib/publicApiInfrastructure'

const OPEN_METEO_SLUG = buildCatalogSlug('Weather', 'Open-Meteo', 'https://open-meteo.com/')
const FRED_SLUG = buildCatalogSlug('Finance', 'FRED', 'https://fred.stlouisfed.org/docs/api/fred/')

describe('publicApiEcosystem profiles', () => {
  it('marks no-auth entries as free public candidates with auto-import eligibility', () => {
    const entry = {
      slug: OPEN_METEO_SLUG,
      name: 'Open-Meteo',
      category: 'Weather',
      docs_url: 'https://open-meteo.com/',
      description: 'Forecast API with current and daily weather',
      auth_type: 'none',
      https_only: true,
      cors_policy: 'Unknown',
      module_targets: ['watchtower', 'world_monitor'],
      agent_targets: ['atlas', 'cortex'],
      tags: ['weather'],
      business_fit_score: 82,
      activation_tier: 'adapter_ready',
    }

    const profile = buildApiEcosystemProfile(entry)

    expect(profile.access_class).toBe('open_no_auth')
    expect(profile.requires_registration).toBe(false)
    expect(profile.is_free_public_candidate).toBe(true)
    expect(profile.auto_import_eligible).toBe(true)
    expect(profile.command_bindings).toContain('run_api')
    expect(profile.automation_actions).toContain('run_api')
  })

  it('marks api-key entries as registration required and keeps registration URL', () => {
    const entry = {
      slug: FRED_SLUG,
      name: 'FRED',
      category: 'Finance',
      docs_url: 'https://fred.stlouisfed.org/docs/api/fred/',
      description: 'Economic series API',
      auth_type: 'api_key',
      https_only: true,
      cors_policy: 'Unknown',
      module_targets: ['finance', 'world_monitor'],
      agent_targets: ['strategist', 'cortex'],
      tags: ['macro'],
      business_fit_score: 78,
      activation_tier: 'adapter_ready',
    }

    const profile = buildApiEcosystemProfile(entry)

    expect(profile.access_class).toBe('registration_api_key')
    expect(profile.requires_registration).toBe(true)
    expect(profile.registration_url).toBe('https://fred.stlouisfed.org/docs/api/fred/')
    expect(profile.command_bindings).toContain('install_connector')
  })
})

describe('publicApiEcosystem layer + backlog', () => {
  it('builds full layer summary and registration backlog', () => {
    const entries = [
      {
        slug: OPEN_METEO_SLUG,
        name: 'Open-Meteo',
        category: 'Weather',
        docs_url: 'https://open-meteo.com/',
        description: 'Forecast API',
        auth_type: 'none',
        https_only: true,
        cors_policy: 'Unknown',
        module_targets: ['watchtower', 'world_monitor'],
        agent_targets: ['atlas', 'cortex'],
        tags: ['weather'],
        business_fit_score: 82,
        activation_tier: 'adapter_ready',
      },
      {
        slug: FRED_SLUG,
        name: 'FRED',
        category: 'Finance',
        docs_url: 'https://fred.stlouisfed.org/docs/api/fred/',
        description: 'Economic series API',
        auth_type: 'api_key',
        https_only: true,
        cors_policy: 'Unknown',
        module_targets: ['finance', 'world_monitor'],
        agent_targets: ['strategist', 'cortex'],
        tags: ['macro'],
        business_fit_score: 78,
        activation_tier: 'adapter_ready',
      },
    ]

    const infra = buildPublicApiInfrastructureLayer(entries, {
      source: 'test',
      templates: PUBLIC_API_ADAPTER_TEMPLATES,
      connectors: [],
      generatedAt: '2026-03-14T00:00:00.000Z',
    })

    const layer = buildPublicApiEcosystemLayer(infra.entries, {
      source: 'test',
      templates: PUBLIC_API_ADAPTER_TEMPLATES,
      connectors: [],
      generatedAt: '2026-03-14T00:00:00.000Z',
    })

    expect(layer.summary.total_catalog_entries).toBe(2)
    expect(layer.summary.open_no_auth_entries).toBe(1)
    expect(layer.summary.requires_registration_entries).toBe(1)
    expect(layer.registration_backlog).toHaveLength(1)
    expect(layer.registration_backlog[0].slug).toBe(FRED_SLUG)

    const markdown = toEcosystemArchitectureMarkdown(layer)
    expect(markdown).toContain('Total catalog entries: 2')
    expect(markdown).toContain('Registration backlog: 1')
  })

  it('supports backlog generation including all auth-required entries', () => {
    const entries = [
      {
        slug: 'example-one',
        name: 'Example One',
        category: 'Development',
        docs_url: 'https://example.com/one',
        description: 'API one',
        auth_type: 'api_key',
        https_only: true,
        module_targets: ['automation'],
        agent_targets: ['cortex'],
        business_fit_score: 35,
        ecosystem_profile: {
          requires_registration: true,
          is_interesting: false,
          integration_priority: 40,
          registration_url: 'https://example.com/one',
          agent_targets: ['cortex'],
        },
      },
      {
        slug: 'example-two',
        name: 'Example Two',
        category: 'Finance',
        docs_url: 'https://example.com/two',
        description: 'API two',
        auth_type: 'oauth2',
        https_only: true,
        module_targets: ['finance'],
        agent_targets: ['strategist'],
        business_fit_score: 72,
        ecosystem_profile: {
          requires_registration: true,
          is_interesting: true,
          integration_priority: 81,
          registration_url: 'https://example.com/two',
          agent_targets: ['strategist'],
        },
      },
    ]

    const interestingOnly = buildRegistrationBacklog(entries)
    const includeAll = buildRegistrationBacklog(entries, { includeAllAuth: true })

    expect(interestingOnly).toHaveLength(1)
    expect(includeAll).toHaveLength(2)
  })
})
