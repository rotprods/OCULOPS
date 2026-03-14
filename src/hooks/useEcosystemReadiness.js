import { useCallback, useEffect, useState } from 'react'
import { useEdgeFunction } from './useEdgeFunction'
import { useOrgStore } from '../stores/useOrgStore'

function extractReadinessPayload(result) {
  if (!result || typeof result !== 'object') return null
  if (result.readiness) return result.readiness
  if (result.data?.readiness) return result.data.readiness
  return null
}

function extractRunTracePayload(result) {
  if (!result || typeof result !== 'object') return null
  if (result.run_trace) return result.run_trace
  if (result.data?.run_trace) return result.data.run_trace
  return null
}

export function useEcosystemReadiness({ windowHours = 24, auto = true } = {}) {
  const { currentOrg } = useOrgStore()
  const orgId = currentOrg?.id || null
  const { execute } = useEdgeFunction('control-plane')

  const [readiness, setReadiness] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [runTrace, setRunTrace] = useState(null)
  const [runTraceLoading, setRunTraceLoading] = useState(false)
  const [runTraceError, setRunTraceError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await execute({
        action: 'ecosystem_readiness',
        org_id: orgId,
        window_hours: windowHours,
      })
      const payload = extractReadinessPayload(result)
      if (!payload) {
        throw new Error('Readiness payload unavailable from control-plane.')
      }
      setReadiness(payload)
      return payload
    } catch (err) {
      const message = err?.message || 'Failed to load ecosystem readiness.'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [execute, orgId, windowHours])

  const getRunTrace = useCallback(async (correlationId) => {
    const value = (correlationId || '').trim()
    if (!value) {
      setRunTrace(null)
      setRunTraceError(null)
      return null
    }

    setRunTraceLoading(true)
    setRunTraceError(null)
    try {
      const result = await execute({
        action: 'run_trace',
        org_id: orgId,
        correlation_id: value,
        context: { correlation_id: value },
      })
      const payload = extractRunTracePayload(result)
      if (!payload) {
        throw new Error('Run trace payload unavailable from control-plane.')
      }
      setRunTrace(payload)
      return payload
    } catch (err) {
      const message = err?.message || 'Failed to load run trace.'
      setRunTrace(null)
      setRunTraceError(message)
      return null
    } finally {
      setRunTraceLoading(false)
    }
  }, [execute, orgId])

  const clearRunTrace = useCallback(() => {
    setRunTrace(null)
    setRunTraceError(null)
  }, [])

  useEffect(() => {
    if (!auto) return
    refresh()
  }, [auto, refresh])

  return {
    readiness,
    loading,
    error,
    refresh,
    runTrace,
    runTraceLoading,
    runTraceError,
    getRunTrace,
    clearRunTrace,
  }
}

export default useEcosystemReadiness
