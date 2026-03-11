// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useOpportunities
// Supabase-connected hook for opportunity scanner
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, subscribeDebouncedToTable } from '../lib/supabase'

export function useOpportunities(filters = {}) {
    const [opportunities, setOpportunities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('opportunities', JSON.parse(filtersKey))
            setOpportunities(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeDebouncedToTable('opportunities', (payload) => {
            if (payload.eventType === 'INSERT') setOpportunities(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setOpportunities(prev => prev.map(o => o.id === payload.new.id ? payload.new : o))
            else if (payload.eventType === 'DELETE') setOpportunities(prev => prev.filter(o => o.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addOpportunity = async (opportunity) => {
        const result = await insertRow('opportunities', opportunity)
        if (result) setOpportunities(prev => [result, ...prev])
        return result
    }

    const updateOpportunity = async (id, updates) => {
        const result = await updateRow('opportunities', id, updates)
        if (result) setOpportunities(prev => prev.map(o => o.id === id ? result : o))
        return result
    }

    const removeOpportunity = async (id) => {
        const success = await deleteRow('opportunities', id)
        if (success) setOpportunities(prev => prev.filter(o => o.id !== id))
        return success
    }

    const byStatus = opportunities.reduce((acc, o) => {
        const status = o.status || 'identified'
        if (!acc[status]) acc[status] = []
        acc[status].push(o)
        return acc
    }, {})

    return { opportunities, loading, error, addOpportunity, updateOpportunity, removeOpportunity, reload: load, byStatus }
}
