import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const mockUseApiCatalog = vi.fn()
const mockUseConnectorProxy = vi.fn()
const mockGetTemplateByCatalogSlug = vi.fn()
const mockExecute = vi.fn()

vi.mock('../hooks/useApiCatalog', () => ({
  useApiCatalog: (...args) => mockUseApiCatalog(...args),
}))

vi.mock('../hooks/useConnectorProxy', () => ({
  useConnectorProxy: (...args) => mockUseConnectorProxy(...args),
}))

vi.mock('../lib/publicApiConnectorTemplates', () => ({
  getTemplateByCatalogSlug: (...args) => mockGetTemplateByCatalogSlug(...args),
}))

import { buildActivationQueueItems, useApiActivationQueue } from '../hooks/useApiActivationQueue'

function buildCatalogHookReturn(overrides = {}) {
  return {
    entries: [],
    loading: false,
    error: null,
    stats: {
      entryCount: 0,
      installedCount: 0,
      countsByModuleTarget: {},
      countsByAgentTarget: {},
    },
    syncRun: null,
    source: 'seed',
    connectors: [],
    installedApps: [],
    adapterReadyEntries: [],
    installConnector: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  }
}

describe('useApiActivationQueue helpers', () => {
  it('includes adapter-ready + open candidate entries and marks missing templates', () => {
    const items = buildActivationQueueItems({
      entries: [
        {
          slug: 'adapter-with-template',
          name: 'Adapter One',
          auth_type: 'api_key',
          activation_tier: 'adapter_ready',
          business_fit_score: 70,
          ecosystem_profile: { integration_priority: 80 },
        },
        {
          slug: 'open-candidate-no-template',
          name: 'Open Candidate',
          auth_type: 'none',
          activation_tier: 'candidate',
          business_fit_score: 75,
          ecosystem_profile: { integration_priority: 85 },
        },
        {
          slug: 'candidate-auth-required',
          name: 'Blocked Candidate',
          auth_type: 'api_key',
          activation_tier: 'candidate',
          business_fit_score: 99,
          ecosystem_profile: { integration_priority: 99 },
        },
      ],
      connectors: [],
      templateResolver: (slug) => (slug === 'adapter-with-template' ? { templateKey: 'adapter' } : null),
    })

    expect(items.map(item => item.slug)).toEqual([
      'open-candidate-no-template',
      'adapter-with-template',
    ])
    expect(items.find(item => item.slug === 'open-candidate-no-template')?.status).toBe('needs_template')
    expect(items.find(item => item.slug === 'adapter-with-template')?.status).toBe('ready')
  })

  it('sorts by integration priority then business fit then no-auth preference then name', () => {
    const items = buildActivationQueueItems({
      entries: [
        {
          slug: 'zeta',
          name: 'Zeta API',
          auth_type: 'api_key',
          activation_tier: 'adapter_ready',
          business_fit_score: 60,
          ecosystem_profile: { integration_priority: 90 },
        },
        {
          slug: 'alpha-auth-none',
          name: 'Alpha API',
          auth_type: 'none',
          activation_tier: 'adapter_ready',
          business_fit_score: 60,
          ecosystem_profile: { integration_priority: 90 },
        },
      ],
      connectors: [],
      templateResolver: () => ({ templateKey: 'default' }),
    })

    expect(items[0].slug).toBe('alpha-auth-none')
    expect(items[1].slug).toBe('zeta')
  })
})

describe('useApiActivationQueue activation flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseConnectorProxy.mockReturnValue({ execute: mockExecute })
    mockGetTemplateByCatalogSlug.mockImplementation(() => ({ templateKey: 'default' }))
  })

  it('activates an entry via install + healthcheck and marks it live', async () => {
    const installConnector = vi.fn().mockResolvedValue({ data: { id: 'connector-1' }, existing: false })
    const reload = vi.fn().mockResolvedValue(undefined)
    mockExecute.mockResolvedValue({ ok: true, normalized: { total: 1 } })
    mockUseApiCatalog.mockReturnValue(buildCatalogHookReturn({
      entries: [{
        slug: 'weather-open-meteo-open-meteo-com',
        name: 'Open-Meteo',
        description: 'Forecast API',
        auth_type: 'none',
        activation_tier: 'adapter_ready',
        business_fit_score: 78,
        ecosystem_profile: { integration_priority: 84 },
      }],
      installConnector,
      reload,
    }))

    const { result } = renderHook(() => useApiActivationQueue({ search: '' }))

    await act(async () => {
      await result.current.activateOne('weather-open-meteo-open-meteo-com')
    })

    await waitFor(() => {
      expect(result.current.items.find(item => item.slug === 'weather-open-meteo-open-meteo-com')?.status).toBe('live')
    })

    expect(installConnector).toHaveBeenCalledWith('weather-open-meteo-open-meteo-com')
    expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
      connectorId: 'connector-1',
      healthcheck: true,
    }))
    expect(reload).toHaveBeenCalled()
  })

  it('classifies missing credential errors during healthcheck', async () => {
    const installConnector = vi.fn().mockResolvedValue({ data: { id: 'connector-2' }, existing: false })
    const reload = vi.fn().mockResolvedValue(undefined)
    mockExecute.mockResolvedValue({ error: 'Missing api_key' })
    mockUseApiCatalog.mockReturnValue(buildCatalogHookReturn({
      entries: [{
        slug: 'finance-fred-fred-stlouisfed-org',
        name: 'FRED',
        description: 'Macro indicators',
        auth_type: 'api_key',
        activation_tier: 'adapter_ready',
        business_fit_score: 72,
        ecosystem_profile: { integration_priority: 82 },
      }],
      installConnector,
      reload,
    }))

    const { result } = renderHook(() => useApiActivationQueue({ search: '' }))

    await act(async () => {
      await result.current.activateOne('finance-fred-fred-stlouisfed-org')
    })

    await waitFor(() => {
      expect(result.current.items.find(item => item.slug === 'finance-fred-fred-stlouisfed-org')?.status).toBe('credentials_missing')
    })
  })

  it('classifies install failures as healthcheck_failed', async () => {
    const installConnector = vi.fn().mockResolvedValue({ error: 'insert failed' })
    const reload = vi.fn().mockResolvedValue(undefined)
    mockUseApiCatalog.mockReturnValue(buildCatalogHookReturn({
      entries: [{
        slug: 'jobs-arbeitnow-arbeitnow-com',
        name: 'Arbeitnow',
        description: 'Jobs feed',
        auth_type: 'none',
        activation_tier: 'adapter_ready',
        business_fit_score: 65,
        ecosystem_profile: { integration_priority: 70 },
      }],
      installConnector,
      reload,
    }))

    const { result } = renderHook(() => useApiActivationQueue({ search: '' }))

    await act(async () => {
      await result.current.activateOne('jobs-arbeitnow-arbeitnow-com')
    })

    await waitFor(() => {
      expect(result.current.items.find(item => item.slug === 'jobs-arbeitnow-arbeitnow-com')?.status).toBe('healthcheck_failed')
    })
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('returns batch summary counters for mixed outcomes', async () => {
    const installConnector = vi.fn().mockImplementation(async (slug) => {
      if (slug === 'success-api') return { data: { id: 'connector-success' }, existing: false }
      return { data: { id: 'connector-creds' }, existing: false }
    })
    const reload = vi.fn().mockResolvedValue(undefined)
    mockExecute.mockImplementation(async ({ connectorId }) => {
      if (connectorId === 'connector-success') return { ok: true }
      return { error: 'Missing token' }
    })

    mockUseApiCatalog.mockReturnValue(buildCatalogHookReturn({
      entries: [
        {
          slug: 'success-api',
          name: 'Success API',
          description: 'success',
          auth_type: 'none',
          activation_tier: 'adapter_ready',
          business_fit_score: 80,
          ecosystem_profile: { integration_priority: 90 },
        },
        {
          slug: 'credentials-api',
          name: 'Credentials API',
          description: 'needs key',
          auth_type: 'api_key',
          activation_tier: 'adapter_ready',
          business_fit_score: 70,
          ecosystem_profile: { integration_priority: 88 },
        },
      ],
      installConnector,
      reload,
    }))

    const { result } = renderHook(() => useApiActivationQueue({ search: '' }))
    let run
    await act(async () => {
      run = await result.current.activateBatch({ scope: 'visible' })
    })

    expect(run.processed).toBe(2)
    expect(run.live).toBe(1)
    expect(run.credentialsMissing).toBe(1)
    expect(run.failed).toBe(0)
    expect(result.current.lastRun?.processed).toBe(2)
  })
})
