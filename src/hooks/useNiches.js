// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — React Hook: useNiches
// Supabase-connected hook for niche analysis
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase'
import { computeNicheScore } from '../lib/ceoScore'

export function useNiches(filters = {}) {
    const [niches, setNiches] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('niches', JSON.parse(filtersKey))
            setNiches(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('niches', (payload) => {
            if (payload.eventType === 'INSERT') setNiches(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setNiches(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
            else if (payload.eventType === 'DELETE') setNiches(prev => prev.filter(n => n.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addNiche = async (niche) => {
        const result = await insertRow('niches', niche)
        if (result) setNiches(prev => [result, ...prev])
        return result
    }

    const updateNiche = async (id, updates) => {
        const result = await updateRow('niches', id, updates)
        if (result) setNiches(prev => prev.map(n => n.id === id ? result : n))
        return result
    }

    const removeNiche = async (id) => {
        const success = await deleteRow('niches', id)
        if (success) setNiches(prev => prev.filter(n => n.id !== id))
        return success
    }

    // CEO Score calculation for ranking
    const scored = niches
        .map(n => ({ ...n, ceoScore: computeNicheScore(n) }))
        .sort((a, b) => b.ceoScore - a.ceoScore)

    return { niches, loading, error, addNiche, updateNiche, removeNiche, reload: load, scored }
}
