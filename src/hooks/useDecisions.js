// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useDecisions
// Supabase-connected hook for decision log
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase'

export function useDecisions(filters = {}) {
    const [decisions, setDecisions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('decisions', JSON.parse(filtersKey))
            setDecisions(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('decisions', (payload) => {
            if (payload.eventType === 'INSERT') setDecisions(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setDecisions(prev => prev.map(d => d.id === payload.new.id ? payload.new : d))
            else if (payload.eventType === 'DELETE') setDecisions(prev => prev.filter(d => d.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addDecision = async (decision) => {
        const result = await insertRow('decisions', decision)
        if (result) setDecisions(prev => [result, ...prev])
        return result
    }

    const updateDecision = async (id, updates) => {
        const result = await updateRow('decisions', id, updates)
        if (result) setDecisions(prev => prev.map(d => d.id === id ? result : d))
        return result
    }

    const removeDecision = async (id) => {
        const success = await deleteRow('decisions', id)
        if (success) setDecisions(prev => prev.filter(d => d.id !== id))
        return success
    }

    const activeDecisions = decisions.filter(d => d.status === 'active')
    const pendingReview = decisions.filter(d => d.review_date && new Date(d.review_date) <= new Date())

    return { decisions, loading, error, addDecision, updateDecision, removeDecision, reload: load, activeDecisions, pendingReview }
}
