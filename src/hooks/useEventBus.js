// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — useEventBus Hook
// Cross-cutting realtime event bus via Supabase broadcast
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { emitEvent } from '../lib/eventBus'

/**
 * Hook for subscribing to cross-cutting events via Supabase Realtime broadcast.
 *
 * Usage:
 *   const { lastEvent, subscribe, emit } = useEventBus()
 *
 *   // Subscribe to specific event types
 *   useEffect(() => {
 *       const unsub = subscribe('agent.completed', (payload) => {
 *           console.log('Agent done:', payload)
 *       })
 *       return unsub
 *   }, [subscribe])
 *
 *   // Emit an event
 *   emit('agent.started', { agentId: '123' })
 */
export function useEventBus() {
    const [lastEvent, setLastEvent] = useState(null)
    const listenersRef = useRef(new Map())

    useEffect(() => {
        if (!isSupabaseConfigured) return

        const channel = supabase
            .channel('antigravity:events')
            .on('broadcast', { event: 'event' }, ({ payload }) => {
                if (!payload) return
                setLastEvent(payload)

                // Notify type-specific listeners
                const eventType = payload.event_type
                const callbacks = listenersRef.current.get(eventType)
                if (callbacks) {
                    callbacks.forEach((cb) => cb(payload))
                }

                // Notify wildcard listeners
                const wildcards = listenersRef.current.get('*')
                if (wildcards) {
                    wildcards.forEach((cb) => cb(payload))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const subscribe = useCallback((eventType, callback) => {
        const listeners = listenersRef.current
        if (!listeners.has(eventType)) {
            listeners.set(eventType, new Set())
        }
        listeners.get(eventType).add(callback)

        // Return unsubscribe function
        return () => {
            const cbs = listeners.get(eventType)
            if (cbs) {
                cbs.delete(callback)
                if (cbs.size === 0) listeners.delete(eventType)
            }
        }
    }, [])

    const emit = useCallback(async (eventType, payload = {}) => {
        // Persist to event_log (triggers pg_notify on server)
        const row = await emitEvent(eventType, payload)

        // Also broadcast directly for instant client-to-client delivery
        if (isSupabaseConfigured) {
            supabase.channel('antigravity:events').send({
                type: 'broadcast',
                event: 'event',
                payload: {
                    event_type: eventType,
                    payload,
                    id: row?.id || null,
                    created_at: row?.created_at || new Date().toISOString(),
                },
            })
        }

        return row
    }, [])

    return { lastEvent, subscribe, emit }
}

export default useEventBus
