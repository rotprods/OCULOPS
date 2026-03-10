// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useExperiments
// Supabase-connected hook for experiments/lab
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase'

export function useExperiments(filters = {}) {
    const [experiments, setExperiments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('experiments', JSON.parse(filtersKey))
            setExperiments(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('experiments', (payload) => {
            if (payload.eventType === 'INSERT') setExperiments(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setExperiments(prev => prev.map(e => e.id === payload.new.id ? payload.new : e))
            else if (payload.eventType === 'DELETE') setExperiments(prev => prev.filter(e => e.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addExperiment = async (experiment) => {
        const result = await insertRow('experiments', experiment)
        if (result) setExperiments(prev => [result, ...prev])
        return result
    }

    const updateExperiment = async (id, updates) => {
        const result = await updateRow('experiments', id, updates)
        if (result) setExperiments(prev => prev.map(e => e.id === id ? result : e))
        return result
    }

    const removeExperiment = async (id) => {
        const success = await deleteRow('experiments', id)
        if (success) setExperiments(prev => prev.filter(e => e.id !== id))
        return success
    }

    const active = experiments.filter(e => e.status === 'active')
    const concluded = experiments.filter(e => e.status !== 'active')

    return { experiments, loading, error, addExperiment, updateExperiment, removeExperiment, reload: load, active, concluded }
}
