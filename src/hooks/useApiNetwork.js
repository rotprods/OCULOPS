import { useCallback, useEffect, useMemo, useState } from 'react'
import { CORE_MINI_APPS } from '../components/miniapps/MiniAppRegistry'
import { supabase } from '../lib/supabase'

const BASE = import.meta.env.VITE_SUPABASE_URL
const REQUEST_TIMEOUT_MS = 12000

function parseResponsePayload(text) {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function formatStatusDetail(app, payload, status, fallbackMessage) {
  if (status === 'planned') return 'Not implemented yet'
  if (status === 'active') return payload?.message || payload?.source || 'Live'
  if (status === 'degraded') {
    return payload?.warning
      || payload?.warnings?.[0]
      || payload?.source
      || fallbackMessage
      || 'Live with limited coverage'
  }

  return fallbackMessage
    || payload?.error
    || payload?.message
    || 'Configuration or deployment still pending'
}

function classifyAppProbe(app, response, payload) {
  if (app.status === 'planned' || app.runMode === 'docs_only' || !app.endpoint) {
    return {
      status: 'planned',
      statusDetail: 'Not implemented yet',
      isDeployed: false,
    }
  }

  const fallbackMessage = payload?.error || payload?.message || response.statusText || null

  if (response.status === 404) {
    return {
      status: 'pending',
      statusDetail: 'Function is not deployed yet',
      isDeployed: false,
    }
  }

  if (!response.ok) {
    return {
      status: 'pending',
      statusDetail: formatStatusDetail(app, payload, 'pending', fallbackMessage),
      isDeployed: true,
    }
  }

  if (payload?.mode === 'mixed' || payload?.mode === 'demo' || payload?.warning || payload?.warnings?.length) {
    return {
      status: 'degraded',
      statusDetail: formatStatusDetail(app, payload, 'degraded', fallbackMessage),
      isDeployed: true,
    }
  }

  return {
    status: 'active',
    statusDetail: formatStatusDetail(app, payload, 'active', fallbackMessage),
    isDeployed: true,
  }
}

async function getSessionToken() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function probeApp(app, token) {
  if (!BASE || !app.endpoint || app.runMode === 'docs_only' || app.status === 'planned') {
    return {
      ...app,
      statusDetail: app.status === 'planned' ? 'Not implemented yet' : 'Supabase URL is not configured',
      isDeployed: false,
      lastCheckedAt: new Date().toISOString(),
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${BASE}/functions/v1/${app.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(app.healthcheckPayload || {}),
      signal: controller.signal,
    })

    const text = await response.text().catch(() => '')
    const payload = parseResponsePayload(text)
    const classification = classifyAppProbe(app, response, payload)

    return {
      ...app,
      ...classification,
      lastCheckedAt: new Date().toISOString(),
      lastPayload: payload,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Healthcheck failed'
    return {
      ...app,
      status: 'pending',
      statusDetail: message,
      isDeployed: false,
      lastCheckedAt: new Date().toISOString(),
      lastPayload: null,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function useApiNetwork() {
  const [apps, setApps] = useState(() => CORE_MINI_APPS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getSessionToken()
      const nextApps = await Promise.all(CORE_MINI_APPS.map(app => probeApp(app, token)))
      setApps(nextApps)
    } catch (err) {
      setApps(CORE_MINI_APPS)
      setError(err instanceof Error ? err.message : 'Unable to refresh API Network health')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const stats = useMemo(() => {
    const liveCount = apps.filter(app => app.status === 'active').length
    const degradedCount = apps.filter(app => app.status === 'degraded').length
    const pendingCount = apps.filter(app => app.status === 'pending').length
    const plannedCount = apps.filter(app => app.status === 'planned').length

    return {
      totalCount: apps.length,
      liveCount,
      degradedCount,
      pendingCount,
      plannedCount,
    }
  }, [apps])

  return {
    apps,
    stats,
    loading,
    error,
    refresh,
  }
}

export default useApiNetwork
