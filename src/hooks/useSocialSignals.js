import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useRealtime } from './useRealtime'
import { supabase } from '../lib/supabase'

const BASE = import.meta.env.VITE_SUPABASE_URL

const DEMO_SIGNALS = [
  {
    platform: 'demo',
    external_id: 'demo-ai-marketing-demand',
    topic: 'AI marketing',
    title: 'Founders keep asking for AI-powered lead qualification that plugs into existing CRM workflows',
    body_excerpt: 'Repeated requests point to pain around sales follow-up speed, data cleanup, and pipeline routing.',
    author: 'demo-radar',
    permalink: null,
    published_at: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(),
    engagement: 84,
    comment_count: 16,
    sentiment_score: 38,
    velocity_score: 72,
    opportunity_score: 81,
    metadata: { demo: true },
  },
  {
    platform: 'demo',
    external_id: 'demo-seo-repositioning',
    topic: 'SEO demand',
    title: 'Small businesses are shifting from broad SEO retainers to conversion-focused local visibility packages',
    body_excerpt: 'The language is less about traffic and more about booked calls, reviews, and map ranking.',
    author: 'demo-radar',
    permalink: null,
    published_at: new Date(Date.now() - (5 * 60 * 60 * 1000)).toISOString(),
    engagement: 61,
    comment_count: 11,
    sentiment_score: 24,
    velocity_score: 58,
    opportunity_score: 74,
    metadata: { demo: true },
  },
  {
    platform: 'demo',
    external_id: 'demo-budget-pressure',
    topic: 'Customer acquisition',
    title: 'Operators are openly discussing tighter paid media budgets and asking for faster attribution clarity',
    body_excerpt: 'That pressure usually favors clear reporting, offer testing, and automation that reduces CAC waste.',
    author: 'demo-radar',
    permalink: null,
    published_at: new Date(Date.now() - (8 * 60 * 60 * 1000)).toISOString(),
    engagement: 47,
    comment_count: 7,
    sentiment_score: -12,
    velocity_score: 44,
    opportunity_score: 69,
    metadata: { demo: true },
  },
]

function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeSignal(row) {
  return {
    id: row.id || `${row.platform}:${row.external_id}`,
    platform: row.platform || 'demo',
    externalId: row.external_id || row.externalId || '',
    topic: row.topic || 'General',
    title: row.title || 'Untitled signal',
    bodyExcerpt: row.body_excerpt || row.bodyExcerpt || '',
    author: row.author || null,
    permalink: row.permalink || null,
    publishedAt: row.published_at || row.publishedAt || row.created_at || new Date().toISOString(),
    engagement: toNumber(row.engagement),
    commentCount: toNumber(row.comment_count ?? row.commentCount),
    sentimentScore: toNumber(row.sentiment_score ?? row.sentimentScore),
    velocityScore: toNumber(row.velocity_score ?? row.velocityScore),
    opportunityScore: toNumber(row.opportunity_score ?? row.opportunityScore),
    metadata: typeof row.metadata === 'object' && row.metadata !== null ? row.metadata : {},
  }
}

function deriveState(rows) {
  const items = [...rows].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )

  const totalEngagement = items.reduce((sum, item) => sum + item.engagement, 0)
  const averageOpportunity = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.opportunityScore, 0) / items.length)
    : 0
  const averageSentiment = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.sentimentScore, 0) / items.length)
    : 0

  const platformBreakdown = items.reduce((acc, item) => {
    acc[item.platform] = (acc[item.platform] || 0) + 1
    return acc
  }, {})

  const topicBreakdown = Object.entries(
    items.reduce((acc, item) => {
      acc[item.topic] = (acc[item.topic] || 0) + 1
      return acc
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, count]) => ({ topic, count }))

  return {
    items,
    summary: {
      trackedCount: items.length,
      hotCount: items.filter((item) => item.opportunityScore >= 70).length,
      averageOpportunity,
      averageSentiment,
      totalEngagement,
      lastUpdated: items[0]?.publishedAt || null,
      platformBreakdown,
      topicBreakdown,
    },
  }
}

export function useSocialSignals() {
  const { data, loading: realtimeLoading, error: realtimeError, refetch } = useRealtime('social_signals', {
    orderBy: 'published_at',
    ascending: false,
    limit: 60,
  })
  const [demoRevision, setDemoRevision] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState(null)
  const bootstrappedRef = useRef(false)

  const liveRows = useMemo(() => (data || []).map(normalizeSignal), [data])
  const demoRows = useMemo(
    () => DEMO_SIGNALS.map((row, index) => normalizeSignal({
      ...row,
      engagement: row.engagement + (demoRevision * (index + 2)),
      opportunity_score: Math.min(row.opportunity_score + (demoRevision % 4), 99),
      published_at: new Date(Date.now() - ((index + 2 + demoRevision) * 60 * 60 * 1000)).toISOString(),
    })),
    [demoRevision],
  )

  const usingStoredRows = liveRows.length > 0
  const derived = useMemo(
    () => deriveState(usingStoredRows ? liveRows : demoRows),
    [usingStoredRows, liveRows, demoRows],
  )

  const storedRowsAreDemo = usingStoredRows
    && derived.items.length > 0
    && derived.items.every((item) => item.metadata?.demo)

  const dataMode = usingStoredRows && !storedRowsAreDemo ? 'live' : 'demo'

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setRefreshError(null)

    if (!supabase || !BASE) {
      setDemoRevision((revision) => revision + 1)
      setRefreshing(false)
      return { mode: 'demo-local' }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        if (!usingStoredRows) {
          setDemoRevision((revision) => revision + 1)
        }
        return { mode: usingStoredRows ? 'stored' : 'demo-local' }
      }

      const response = await fetch(`${BASE}/functions/v1/social-signals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ persist: true }),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => `HTTP ${response.status}`)
        throw new Error(message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      await refetch()
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sync social signals'
      setRefreshError(message)
      if (!usingStoredRows) {
        setDemoRevision((revision) => revision + 1)
      }
      return { error: message }
    } finally {
      setRefreshing(false)
    }
  }, [refetch, usingStoredRows])

  useEffect(() => {
    if (!BASE || !supabase || refreshing || realtimeLoading || bootstrappedRef.current) return
    if (dataMode !== 'live') {
      bootstrappedRef.current = true
      refresh()
    }
  }, [dataMode, realtimeLoading, refresh, refreshing])

  return {
    ...derived,
    loading: realtimeLoading && usingStoredRows,
    error: refreshError || realtimeError,
    refreshError,
    refreshing,
    refresh,
    dataMode,
    hasLiveData: usingStoredRows && !storedRowsAreDemo,
    runtimeConfigured: Boolean(supabase && BASE),
  }
}
