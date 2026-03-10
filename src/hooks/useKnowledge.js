// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useKnowledge
// Supabase-connected hook for knowledge vault
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase'

export function useKnowledge(filters = {}) {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('knowledge_entries', JSON.parse(filtersKey))
            setEntries(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('knowledge_entries', (payload) => {
            if (payload.eventType === 'INSERT') setEntries(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setEntries(prev => prev.map(e => e.id === payload.new.id ? payload.new : e))
            else if (payload.eventType === 'DELETE') setEntries(prev => prev.filter(e => e.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addEntry = async (entry) => {
        const result = await insertRow('knowledge_entries', entry)
        if (result) setEntries(prev => [result, ...prev])
        return result
    }

    const updateEntry = async (id, updates) => {
        const result = await updateRow('knowledge_entries', id, updates)
        if (result) setEntries(prev => prev.map(e => e.id === id ? result : e))
        return result
    }

    const removeEntry = async (id) => {
        const success = await deleteRow('knowledge_entries', id)
        if (success) setEntries(prev => prev.filter(e => e.id !== id))
        return success
    }

    const byType = entries.reduce((acc, e) => {
        const type = e.type || 'learning'
        if (!acc[type]) acc[type] = []
        acc[type].push(e)
        return acc
    }, {})

    return { entries, loading, error, addEntry, updateEntry, removeEntry, reload: load, byType }
}
