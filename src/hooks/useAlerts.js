// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useAlerts
// Supabase-connected hook for Watchtower alerts
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, subscribeDebouncedToTable } from '../lib/supabase'

export function useAlerts() {
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('alerts', {})
            setAlerts(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        load()
        const channel = subscribeDebouncedToTable('alerts', (payload) => {
            if (payload.eventType === 'INSERT') setAlerts(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setAlerts(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addAlert = async (alert) => {
        const result = await insertRow('alerts', { ...alert, status: 'active' })
        if (result) setAlerts(prev => [result, ...prev])
        return result
    }

    const resolveAlert = async (id) => {
        const result = await updateRow('alerts', id, {
            status: 'resolved', resolved_at: new Date().toISOString()
        })
        if (result) setAlerts(prev => prev.map(a => a.id === id ? result : a))
        return result
    }

    const active = alerts.filter(a => a.status === 'active')
    const resolved = alerts.filter(a => a.status === 'resolved')
    const critical = active.filter(a => a.severity >= 3)

    return { alerts, active, resolved, critical, loading, error, addAlert, resolveAlert, reload: load }
}
