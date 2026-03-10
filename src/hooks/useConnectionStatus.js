// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — useConnectionStatus Hook
// Tracks Supabase WebSocket connection state
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Returns the current Supabase realtime connection status.
 * @returns {{ status: 'connected'|'connecting'|'disconnected', isOnline: boolean }}
 */
export function useConnectionStatus() {
    const [status, setStatus] = useState(supabase ? 'connecting' : 'disconnected')

    useEffect(() => {
        if (!supabase) {
            setStatus('disconnected')
            return
        }

        // Check initial connection
        const checkConnection = () => {
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
            if (heartbeat) supabase.removeChannel(heartbeat)
        }
    }, [])

    return {
        status,
        isOnline: status === 'connected',
    }
}
