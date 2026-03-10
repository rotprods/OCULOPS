// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useCompanies
// Supabase-connected hook for CRM companies
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, insertRow, updateRow, deleteRow, subscribeToTable, getCurrentUserId, scopeUserQuery } from '../lib/supabase'

export function useCompanies(filters = {}) {
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            if (!supabase) {
                setCompanies([])
                setLoading(false)
                return
            }

            const userId = await getCurrentUserId()
            let query = supabase.from('companies').select('*').order('created_at', { ascending: false })
            query = scopeUserQuery(query, userId)
            Object.entries(JSON.parse(filtersKey)).forEach(([key, value]) => {
                query = query.eq(key, value)
            })

            const { data, error: queryError } = await query
            if (queryError) throw queryError
            setCompanies(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('companies', (payload) => {
            if (payload.eventType === 'DELETE') {
                setCompanies(prev => prev.filter(c => c.id !== payload.old.id))
                return
            }

            load()
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addCompany = async (company) => {
        const result = await insertRow('companies', company)
        if (result) await load()
        return result
    }

    const updateCompany = async (id, updates) => {
        const result = await updateRow('companies', id, updates)
        if (result) await load()
        return result
    }

    const removeCompany = async (id) => {
        const success = await deleteRow('companies', id)
        if (success) await load()
        return success
    }

    return { companies, loading, error, addCompany, updateCompany, removeCompany, reload: load }
}
