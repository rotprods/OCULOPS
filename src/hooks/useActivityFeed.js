// ═══════════════════════════════════════════════════
// OCULOPS — useActivityFeed Hook
// Real-time event stream from event_log
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useOrgStore } from '../stores/useOrgStore'

const EVENT_ICONS = {
  'pipeline.created': '🚀',
  'pipeline.started': '▶️',
  'pipeline.step.started': '⚡',
  'pipeline.step.completed': '✅',
  'pipeline.completed': '🏁',
  'pipeline.failed': '❌',
  'scan.completed': '🔭',
  'lead.captured': '🎯',
  'lead.qualified': '⭐',
  'outreach.staged': '📧',
  'message.sent': '📤',
  'agent.error': '🔴',
  'signal.detected': '📡',
  'goal.requested': '🧠',
  'deal.stage_changed': '🔄',
  'user.welcome_email_sent': '👋',
}

function getEventIcon(eventType) {
  const match = Object.entries(EVENT_ICONS).find(([key]) =>
    eventType?.startsWith(key)
  )
  return match ? match[1] : '⚙️'
}

function getEventColor(eventType) {
  if (eventType?.includes('failed') || eventType?.includes('error')) return 'var(--color-danger)'
  if (eventType?.includes('completed')) return 'var(--color-success)'
  if (eventType?.includes('started') || eventType?.includes('running')) return 'var(--color-warning)'
  if (eventType?.includes('lead') || eventType?.includes('qualified')) return 'var(--accent-primary)'
  return 'var(--text-tertiary)'
}

/**
 * Hook providing a live activity feed from event_log.
 * Subscribes to Supabase Realtime for instant event delivery.
 */
export function useActivityFeed(limit = 30) {
  const { currentOrg } = useOrgStore()
  const orgId = currentOrg?.id
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // ── Fetch recent events ──
  const fetchEvents = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const query = supabase
      .from('event_log')
      .select('id, event_type, payload, source_agent, created_at, status, pipeline_run_id')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (orgId) {
      query.or(`org_id.eq.${orgId},org_id.is.null`)
    }

    const { data, error } = await query
    if (!error && data) {
      setEvents(data.map(e => ({
        ...e,
        icon: getEventIcon(e.event_type),
        color: getEventColor(e.event_type),
        label: e.event_type?.replace(/\./g, ' › ').toUpperCase(),
        summary: e.payload?.summary || e.payload?.message || e.payload?.step_key || '',
      })))
    }
    setLoading(false)
  }, [orgId, limit])

  // ── Initial load ──
  useEffect(() => { fetchEvents() }, [fetchEvents])

  // ── Realtime subscription ──
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const channel = supabase
      .channel('activity-feed-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_log',
      }, (payload) => {
        const event = payload.new
        if (orgId && event.org_id && event.org_id !== orgId) return
        
        const enriched = {
          ...event,
          icon: getEventIcon(event.event_type),
          color: getEventColor(event.event_type),
          label: event.event_type?.replace(/\./g, ' › ').toUpperCase(),
          summary: event.payload?.summary || event.payload?.message || event.payload?.step_key || '',
        }
        setEvents(prev => [enriched, ...prev].slice(0, limit))
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, limit])

  const markRead = useCallback(() => setUnreadCount(0), [])

  return {
    events,
    loading,
    unreadCount,
    markRead,
    refresh: fetchEvents,
    getEventIcon,
    getEventColor,
  }
}

export default useActivityFeed
