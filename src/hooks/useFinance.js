// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useFinance
// Supabase-connected hook for finance entries
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, deleteRow, subscribeDebouncedToTable } from '../lib/supabase'

export function useFinance() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('finance_entries', {})
            setEntries(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        load()
        const channel = subscribeDebouncedToTable('finance_entries', (payload) => {
            if (payload.eventType === 'INSERT') setEntries(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setEntries(prev => prev.map(e => e.id === payload.new.id ? payload.new : e))
            else if (payload.eventType === 'DELETE') setEntries(prev => prev.filter(e => e.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addEntry = async (entry) => {
        const result = await insertRow('finance_entries', entry)
        if (result) setEntries(prev => [result, ...prev])
        return result
    }

    const removeEntry = async (id) => {
        const success = await deleteRow('finance_entries', id)
        if (success) setEntries(prev => prev.filter(e => e.id !== id))
        return success
    }

    // Computed metrics
    const revenue = entries.filter(e => e.type === 'revenue')
    const expenses = entries.filter(e => e.type === 'expense')
    const recurring = entries.filter(e => e.is_recurring)
    const mrr = recurring.filter(e => e.type === 'revenue').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    const totalRevenue = revenue.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    const netIncome = totalRevenue - totalExpenses

    return { entries, loading, error, addEntry, removeEntry, reload: load, mrr, totalRevenue, totalExpenses, netIncome }
}
