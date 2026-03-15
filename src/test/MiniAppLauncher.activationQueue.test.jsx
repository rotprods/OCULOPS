import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const mockUseApiActivationQueue = vi.fn()
const mockUseApiNetwork = vi.fn()

vi.mock('../hooks/useApiActivationQueue', () => ({
  useApiActivationQueue: (...args) => mockUseApiActivationQueue(...args),
}))

vi.mock('../hooks/useApiNetwork', () => ({
  useApiNetwork: (...args) => mockUseApiNetwork(...args),
}))

import MiniAppLauncher from '../components/miniapps/MiniAppLauncher'

function createActivationQueueReturn(overrides = {}) {
  return {
    entries: [{
      slug: 'weather-open-meteo-open-meteo-com',
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
      business_fit_score: 78,
      activation_tier: 'adapter_ready',
      ecosystem_profile: { integration_priority: 84 },
      is_listed: true,
    }],
    loading: false,
    error: null,
    stats: {
      entryCount: 1,
      installedCount: 0,
      countsByModuleTarget: { watchtower: 1 },
      countsByAgentTarget: { atlas: 1 },
    },
    syncRun: null,
    source: 'seed',
    installedApps: [],
    adapterReadyEntries: [{
      slug: 'weather-open-meteo-open-meteo-com',
      name: 'Open-Meteo',
      category: 'Weather',
      docs_url: 'https://open-meteo.com/',
      description: 'Forecast API',
      auth_type: 'none',
      module_targets: ['watchtower', 'world_monitor'],
      agent_targets: ['atlas', 'cortex'],
      activation_tier: 'adapter_ready',
    }],
    installConnector: vi.fn(),
    reload: vi.fn(),
    refresh: vi.fn(),
    items: [{
      slug: 'weather-open-meteo-open-meteo-com',
      name: 'Open-Meteo',
      description: 'Forecast API',
      authType: 'none',
      activationTier: 'adapter_ready',
      businessFitScore: 78,
      integrationPriority: 84,
      status: 'ready',
      statusDetail: null,
      connectorId: null,
      connectorStatus: null,
      isInstalled: false,
      hasTemplate: true,
      isActionable: true,
      moduleTargets: ['watchtower'],
      agentTargets: ['atlas'],
      entry: {
        slug: 'weather-open-meteo-open-meteo-com',
        name: 'Open-Meteo',
        category: 'Weather',
        docs_url: 'https://open-meteo.com/',
        description: 'Forecast API',
        auth_type: 'none',
        module_targets: ['watchtower', 'world_monitor'],
        agent_targets: ['atlas', 'cortex'],
        activation_tier: 'adapter_ready',
      },
    }],
    queueStats: {
      total: 1,
      actionable: 1,
      ready: 1,
      installing: 0,
      healthchecking: 0,
      live: 0,
      credentials_missing: 0,
      healthcheck_failed: 0,
      needs_template: 0,
    },
    running: false,
    lastRun: null,
    activateBatch: vi.fn(),
    activateOne: vi.fn(),
    retryFailed: vi.fn(),
    ...overrides,
  }
}

describe('MiniAppLauncher activation queue integration', () => {
  beforeEach(() => {
    mockUseApiNetwork.mockReturnValue({
      apps: [{
        id: 'core:google_places',
        name: 'Google Places',
        icon: '📍',
        color: '#34A853',
        type: 'Geo Intelligence',
        description: 'Core geosearch',
        status: 'active',
        source: 'core',
        runMode: 'edge_function',
        endpoint: 'google-maps-search',
        inputSchema: [],
        moduleTargets: ['prospector'],
        agentTargets: ['atlas'],
      }],
      stats: { liveCount: 1, degradedCount: 0 },
      loading: false,
      error: null,
      refresh: vi.fn(),
    })
  })

  it('renders queue controls and triggers batch actions', () => {
    const activateBatch = vi.fn()
    const retryFailed = vi.fn()
    mockUseApiActivationQueue.mockReturnValue(createActivationQueueReturn({
      activateBatch,
      retryFailed,
      queueStats: {
        total: 1,
        actionable: 1,
        ready: 1,
        installing: 0,
        healthchecking: 0,
        live: 0,
        credentials_missing: 1,
        healthcheck_failed: 0,
        needs_template: 0,
      },
    }))

    render(<MiniAppLauncher />)

    fireEvent.click(screen.getByRole('button', { name: /Activation Queue \(1\)/i }))

    fireEvent.click(screen.getByRole('button', { name: /Activate top 10/i }))
    expect(activateBatch).toHaveBeenCalledWith({ scope: 'top', limit: 10 })

    fireEvent.click(screen.getByRole('button', { name: /Activate visible/i }))
    expect(activateBatch).toHaveBeenCalledWith({ scope: 'visible' })

    fireEvent.click(screen.getByRole('button', { name: /Retry failed/i }))
    expect(retryFailed).toHaveBeenCalled()
  })

  it('keeps core/catalog behavior and supports per-row queue actions', () => {
    const activateOne = vi.fn()
    mockUseApiActivationQueue.mockReturnValue(createActivationQueueReturn({ activateOne }))

    render(<MiniAppLauncher />)

    expect(screen.getByRole('button', { name: /Core \(1\)/i })).toBeInTheDocument()
    expect(screen.getByText('Google Places')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Catalog \(1\)/i }))
    expect(screen.getByText('Open-Meteo')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Activation Queue \(1\)/i }))
    fireEvent.click(screen.getByRole('button', { name: /Activate now/i }))
    expect(activateOne).toHaveBeenCalledWith('weather-open-meteo-open-meteo-com')
  })
})
