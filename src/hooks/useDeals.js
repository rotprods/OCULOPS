// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useDeals
// Supabase-connected hook for CRM deals/pipeline
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, insertRow, updateRow, deleteRow, subscribeToTable, getCurrentUserId, scopeUserQuery } from '../lib/supabase'

export function useDeals(filters = {}) {
    const [deals, setDeals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            if (!supabase) {
                setDeals([])
                setLoading(false)
                return
            }

            const userId = await getCurrentUserId()
            let query = supabase
                .from('deals')
                .select('*, company:companies(id, name, website), contact:contacts(id, name, email)')
                .order('created_at', { ascending: false })

            query = scopeUserQuery(query, userId)

            Object.entries(JSON.parse(filtersKey)).forEach(([key, value]) => {
                query = query.eq(key, value)
            })

            const { data, error: queryError } = await query
            if (queryError) throw queryError
            setDeals(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('deals', (payload) => {
            if (payload.eventType === 'DELETE') {
                setDeals(prev => prev.filter(d => d.id !== payload.old.id))
                return
            }

            load()
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addDeal = async (deal) => {
        const result = await insertRow('deals', deal)
        if (result) await load()
        return result
    }

    const updateDeal = async (id, updates) => {
        const result = await updateRow('deals', id, updates)
        if (result) await load()
        return result
    }

    const removeDeal = async (id) => {
        const success = await deleteRow('deals', id)
        if (success) await load()
        return success
    }

    // Group deals by stage for pipeline view
    const pipelineView = deals.reduce((acc, deal) => {
        const stage = deal.stage || 'lead'
        if (!acc[stage]) acc[stage] = []
        acc[stage].push(deal)
        return acc
    }, {})

    const totalValue = deals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
    const weightedValue = deals.reduce((sum, d) => sum + ((parseFloat(d.value) || 0) * (d.probability || 0) / 100), 0)

    return { deals, loading, error, addDeal, updateDeal, removeDeal, reload: load, pipelineView, totalValue, weightedValue }
}
