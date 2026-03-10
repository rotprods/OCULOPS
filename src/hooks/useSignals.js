// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — React Hook: useSignals
// Supabase-connected hook for market signals
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase'

export function useSignals(filters = {}) {
    const [signals, setSignals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('signals', JSON.parse(filtersKey))
            setSignals(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('signals', (payload) => {
            if (payload.eventType === 'INSERT') setSignals(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setSignals(prev => prev.map(s => s.id === payload.new.id ? payload.new : s))
            else if (payload.eventType === 'DELETE') setSignals(prev => prev.filter(s => s.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addSignal = async (signal) => {
        const result = await insertRow('signals', signal)
        if (result) setSignals(prev => [result, ...prev])
        return result
    }

    const updateSignal = async (id, updates) => {
        const result = await updateRow('signals', id, updates)
        if (result) setSignals(prev => prev.map(s => s.id === id ? result : s))
        return result
    }

    const removeSignal = async (id) => {
        const success = await deleteRow('signals', id)
        if (success) setSignals(prev => prev.filter(s => s.id !== id))
        return success
    }

    const byCategory = signals.reduce((acc, s) => {
        const cat = s.category || 'other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(s)
        return acc
    }, {})

    const activeSignals = signals.filter(s => s.status === 'active')

    return { signals, loading, error, addSignal, updateSignal, removeSignal, reload: load, byCategory, activeSignals }
}
