// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — React Hook: useActivities
// Supabase-connected hook for CRM activity timeline
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, insertRow, subscribeToTable } from '../lib/supabase'

export function useActivities(filters = {}) {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            if (!supabase) {
                setActivities([])
                setLoading(false)
                return
            }

            let query = supabase
                .from('crm_activities')
                .select(`
                    *,
                    contact:contacts(id, name, email, phone),
                    company:companies(id, name, website),
                    deal:deals(id, title, stage)
                `)
                .order('created_at', { ascending: false })

            Object.entries(JSON.parse(filtersKey)).forEach(([key, value]) => {
                query = query.eq(key, value)
            })

            const { data, error: queryError } = await query
            if (queryError) throw queryError
            setActivities(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeToTable('crm_activities', (payload) => {
            if (payload.eventType === 'DELETE') {
                setActivities(prev => prev.filter(activity => activity.id !== payload.old.id))
                return
            }

            load()
        })

        return () => channel?.unsubscribe()
    }, [load])

    const addActivity = async (activity) => {
        const result = await insertRow('crm_activities', activity)
        if (result) await load()
        return result
    }

    return { activities, loading, error, addActivity, reload: load }
}
