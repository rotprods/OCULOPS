// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — React Hook: useBets
// Supabase-connected hook for portfolio/bets
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase'

export function useBets(filters = {}) {
    const [bets, setBets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('bets', JSON.parse(filtersKey))
            setBets(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('bets', (payload) => {
            if (payload.eventType === 'INSERT') setBets(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setBets(prev => prev.map(b => b.id === payload.new.id ? payload.new : b))
            else if (payload.eventType === 'DELETE') setBets(prev => prev.filter(b => b.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addBet = async (bet) => {
        const result = await insertRow('bets', bet)
        if (result) setBets(prev => [result, ...prev])
        return result
    }

    const updateBet = async (id, updates) => {
        const result = await updateRow('bets', id, updates)
        if (result) setBets(prev => prev.map(b => b.id === id ? result : b))
        return result
    }

    const removeBet = async (id) => {
        const success = await deleteRow('bets', id)
        if (success) setBets(prev => prev.filter(b => b.id !== id))
        return success
    }

    const byType = bets.reduce((acc, b) => {
        const type = b.type || 'core'
        if (!acc[type]) acc[type] = []
        acc[type].push(b)
        return acc
    }, {})

    const active = bets.filter(b => b.status === 'active')

    return { bets, loading, error, addBet, updateBet, removeBet, reload: load, byType, active }
}
