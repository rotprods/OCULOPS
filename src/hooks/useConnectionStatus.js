// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — useConnectionStatus Hook
// Tracks Supabase WebSocket connection state
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

/**
 * Returns the current Supabase realtime connection status.
 * @returns {{ status: 'connected'|'connecting'|'disconnected', isOnline: boolean }}
 */
export function useConnectionStatus() {
    const [status, setStatus] = useState(isSupabaseConfigured ? 'connecting' : 'disconnected')

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase || typeof supabase.channel !== 'function') {
            setStatus('disconnected')
            return
        }

        // Check initial connection
        const checkConnection = () => {
            if (typeof supabase.getChannels !== 'function') return
            const channels = supabase.getChannels()
            if (channels.length > 0) {
                setStatus('connected')
            }
        }

        // Monitor connection via a heartbeat channel
        const heartbeat = supabase
            .channel('connection_heartbeat')
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setStatus('connected')
                } else if (status === 'CHANNEL_ERROR') {
                    setStatus('disconnected')
                } else {
                    setStatus('connecting')
                }
            })

        // Check on interval
        const interval = setInterval(checkConnection, 10000)

        return () => {
            clearInterval(interval)
            if (!heartbeat) return
            if (typeof supabase.removeChannel === 'function') {
                supabase.removeChannel(heartbeat)
                return
            }
            heartbeat.unsubscribe?.()
        }
    }, [])

    return {
        status,
        isOnline: status === 'connected',
    }
}
