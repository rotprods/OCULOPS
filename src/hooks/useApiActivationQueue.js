import { useCallback, useMemo, useState } from 'react'
import { useApiCatalog } from './useApiCatalog'
import { useConnectorProxy } from './useConnectorProxy'
import { getTemplateByCatalogSlug } from '../lib/publicApiConnectorTemplates'

const DEFAULT_BATCH_LIMIT = 10
const BATCH_CONCURRENCY = 3
const FAILURE_STATES = new Set(['credentials_missing', 'healthcheck_failed'])
const NON_ACTIONABLE_STATES = new Set(['live', 'installing', 'healthchecking', 'needs_template'])
const CREDENTIAL_ERROR_PATTERN = /missing[^a-z0-9]*(api[_ ]?key|token|username|password)|\b(api[_ ]?key|token|username|password)\b[^a-z0-9]*missing/i

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function extractErrorMessage(result) {
  if (!result) return 'Unknown error'
  if (typeof result === 'string') return result
  if (typeof result.error === 'string') return result.error
  if (typeof result.message === 'string') return result.message
  if (typeof result?.raw?.error === 'string') return result.raw.error
  if (typeof result?.raw?.message === 'string') return result.raw.message
  return 'Unknown error'
}

function normalizeTemplate(template) {
  if (!template || template.internalOnly) return null
  return template
}

export function isCredentialMissingError(message = '') {
  return CREDENTIAL_ERROR_PATTERN.test(String(message || '').toLowerCase())
}

export function isActivationQueueEligible(entry = {}) {
  if (!entry?.slug) return false
  if (entry.activation_tier === 'adapter_ready') return true
  if (entry.activation_tier === 'candidate' && entry.auth_type === 'none') return true
  return false
}

export function getQueueState({ entry, connector, hasTemplate, runtimeStatus }) {
  if (runtimeStatus) return runtimeStatus
  if (connector?.health_status === 'live' || entry?.health_status === 'live' || entry?.activation_tier === 'live') return 'live'
  if (!connector && !hasTemplate) return 'needs_template'
  if (connector?.health_status === 'error') return 'healthcheck_failed'
  return 'ready'
}

export function compareQueueItems(left, right) {
  const leftPriority = toNumber(left.integrationPriority)
  const rightPriority = toNumber(right.integrationPriority)
  if (leftPriority !== rightPriority) return rightPriority - leftPriority

  const leftBusinessFit = toNumber(left.businessFitScore)
  const rightBusinessFit = toNumber(right.businessFitScore)
  if (leftBusinessFit !== rightBusinessFit) return rightBusinessFit - leftBusinessFit

  if (left.authType === 'none' && right.authType !== 'none') return -1
  if (left.authType !== 'none' && right.authType === 'none') return 1

  return String(left.name || '').localeCompare(String(right.name || ''))
}

export function buildActivationQueueItems({
  entries = [],
  connectors = [],
  runtimeStateBySlug = {},
  templateResolver = getTemplateByCatalogSlug,
}) {
  const connectorBySlug = new Map(
    connectors
      .filter(connector => connector?.catalog_slug)
      .map(connector => [connector.catalog_slug, connector])
  )

  return entries
    .filter(isActivationQueueEligible)
    .map(entry => {
      const connector = connectorBySlug.get(entry.slug) || null
      const template = normalizeTemplate(templateResolver(entry.slug))
      const runtime = runtimeStateBySlug[entry.slug] || null
      const hasTemplate = Boolean(template)
      const status = getQueueState({
        entry,
        connector,
        hasTemplate,
        runtimeStatus: runtime?.status,
      })

      return {
        slug: entry.slug,
        name: entry.name,
        description: entry.description,
        authType: entry.auth_type || 'unknown',
        activationTier: connector?.health_status === 'live' ? 'live' : entry.activation_tier,
        businessFitScore: toNumber(entry.business_fit_score),
        integrationPriority: toNumber(entry.ecosystem_profile?.integration_priority),
        status,
        statusDetail: runtime?.message || null,
        connectorId: connector?.id || runtime?.connectorId || null,
        connectorStatus: connector?.health_status || null,
        isInstalled: Boolean(connector),
        hasTemplate,
        isActionable: !NON_ACTIONABLE_STATES.has(status),
        moduleTargets: entry.module_targets || [],
        agentTargets: entry.agent_targets || [],
        entry,
      }
    })
    .sort(compareQueueItems)
}

function summarizeQueue(items = []) {
  const summary = {
    total: items.length,
    actionable: 0,
    ready: 0,
    installing: 0,
    healthchecking: 0,
    live: 0,
    credentials_missing: 0,
    healthcheck_failed: 0,
    needs_template: 0,
  }

  for (const item of items) {
    if (summary[item.status] != null) summary[item.status] += 1
    if (item.isActionable) summary.actionable += 1
  }

  return summary
}

function withQueueMeta(items, scope, limit) {
  if (scope === 'failed') {
    return items.filter(item => FAILURE_STATES.has(item.status))
  }

  if (scope === 'visible') {
    return items.filter(item => item.isActionable)
  }

  return items.filter(item => item.isActionable).slice(0, limit)
}

export function useApiActivationQueue({ search = '', moduleTarget = 'all', agentTarget = 'all' } = {}) {
  const {
    entries,
    loading,
    error: catalogError,
    stats,
    syncRun,
    source,
    connectors,
    installedApps,
    adapterReadyEntries,
    installConnector,
    reload,
  } = useApiCatalog({
    search,
    moduleTarget,
    agentTarget,
    isListed: true,
  })
  const { execute } = useConnectorProxy({}, { cacheTTL: 0 })

  const [runtimeStateBySlug, setRuntimeStateBySlug] = useState({})
  const [runningCount, setRunningCount] = useState(0)
  const [error, setError] = useState(null)
  const [lastRun, setLastRun] = useState(null)

  const setRuntimeState = useCallback((slug, patch) => {
    setRuntimeStateBySlug(prev => ({
      ...prev,
      [slug]: {
        ...(prev[slug] || {}),
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }))
  }, [])

  const items = useMemo(
    () => buildActivationQueueItems({ entries, connectors, runtimeStateBySlug }),
    [entries, connectors, runtimeStateBySlug]
  )
  const queueStats = useMemo(() => summarizeQueue(items), [items])

  const activateEntry = useCallback(async (slug) => {
    const item = items.find(candidate => candidate.slug === slug)
    if (!item) return { status: 'healthcheck_failed', error: 'Queue item not found' }

    if (item.status === 'needs_template') {
      setRuntimeState(slug, { status: 'needs_template', message: 'No install template is available for this API yet.' })
      return { status: 'needs_template', error: 'No install template available' }
    }

    if (item.status === 'live') return { status: 'live', skipped: true }

    setRunningCount(count => count + 1)
    let connectorId = item.connectorId || null

    try {
      if (!connectorId) {
        setRuntimeState(slug, { status: 'installing', message: 'Installing connector...' })
        const installResult = await installConnector(slug)

        if (installResult?.error) {
          setRuntimeState(slug, { status: 'healthcheck_failed', message: installResult.error })
          return { status: 'healthcheck_failed', error: installResult.error }
        }

        connectorId = installResult?.data?.id || null

        if (!connectorId) {
          const message = 'Connector installation did not return an id'
          setRuntimeState(slug, { status: 'healthcheck_failed', message })
          return { status: 'healthcheck_failed', error: message }
        }
      }

      setRuntimeState(slug, { status: 'healthchecking', message: 'Running healthcheck...', connectorId })
      const result = await execute({
        connectorId,
        healthcheck: true,
      })

      if (result?.error || result?.ok === false) {
        const message = extractErrorMessage(result)
        const nextStatus = isCredentialMissingError(message) ? 'credentials_missing' : 'healthcheck_failed'
        setRuntimeState(slug, { status: nextStatus, message, connectorId })
        return { status: nextStatus, error: message }
      }

      setRuntimeState(slug, { status: 'live', message: 'Connector live', connectorId })
      return { status: 'live' }
    } catch (executionError) {
      const message = executionError instanceof Error ? executionError.message : 'Unknown activation error'
      const nextStatus = isCredentialMissingError(message) ? 'credentials_missing' : 'healthcheck_failed'
      setRuntimeState(slug, { status: nextStatus, message, connectorId })
      return { status: nextStatus, error: message }
    } finally {
      setRunningCount(count => Math.max(0, count - 1))
    }
  }, [execute, installConnector, items, setRuntimeState])

  const activateBatch = useCallback(async ({
    scope = 'top',
    limit = DEFAULT_BATCH_LIMIT,
  } = {}) => {
    setError(null)
    const startedAt = new Date().toISOString()
    const targets = withQueueMeta(items, scope, limit)

    if (targets.length === 0) {
      const run = {
        startedAt,
        finishedAt: new Date().toISOString(),
        scope,
        limit,
        processed: 0,
        live: 0,
        credentialsMissing: 0,
        failed: 0,
        skippedNeedsTemplate: 0,
      }
      setLastRun(run)
      return run
    }

    const counters = {
      processed: 0,
      live: 0,
      credentialsMissing: 0,
      failed: 0,
      skippedNeedsTemplate: 0,
    }

    let pointer = 0
    const workerCount = Math.min(BATCH_CONCURRENCY, targets.length)
    const workers = Array.from({ length: workerCount }, async () => {
      while (pointer < targets.length) {
        const index = pointer
        pointer += 1
        const target = targets[index]

        const result = await activateEntry(target.slug)
        counters.processed += 1

        if (result.status === 'live') counters.live += 1
        else if (result.status === 'credentials_missing') counters.credentialsMissing += 1
        else if (result.status === 'needs_template') counters.skippedNeedsTemplate += 1
        else counters.failed += 1
      }
    })

    await Promise.all(workers)
    await reload()

    const run = {
      startedAt,
      finishedAt: new Date().toISOString(),
      scope,
      limit,
      ...counters,
    }
    setLastRun(run)
    return run
  }, [activateEntry, items, reload])

  const activateOne = useCallback(async (slug) => {
    setError(null)
    const result = await activateEntry(slug)
    await reload()
    if (result.error) setError(result.error)
    return result
  }, [activateEntry, reload])

  const retryFailed = useCallback(() => activateBatch({ scope: 'failed' }), [activateBatch])

  const refresh = useCallback(async () => {
    setError(null)
    setRuntimeStateBySlug({})
    await reload()
  }, [reload])

  return {
    entries,
    loading,
    error: error || catalogError,
    stats,
    syncRun,
    source,
    connectors,
    installedApps,
    adapterReadyEntries,
    installConnector,
    reload,
    items,
    queueStats,
    running: runningCount > 0,
    lastRun,
    activateBatch,
    activateOne,
    retryFailed,
    refresh,
  }
}

export default useApiActivationQueue
