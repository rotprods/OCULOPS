// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useContacts
// Supabase-connected hook for CRM contacts
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, insertRow, updateRow, deleteRow, subscribeDebouncedToTable, getCurrentUserId, scopeUserQuery } from '../lib/supabase'

export function useContacts(filters = {}) {
    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            if (!supabase) {
                setContacts([])
                setLoading(false)
                return
            }

            const userId = await getCurrentUserId()
            let query = supabase
                .from('contacts')
                .select('*, company:companies(id, name, website, location, status)')
                .order('created_at', { ascending: false })

            query = scopeUserQuery(query, userId)

            Object.entries(JSON.parse(filtersKey)).forEach(([key, value]) => {
                query = query.eq(key, value)
            })

            const { data, error: queryError } = await query
            if (queryError) throw queryError
            setContacts(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    useEffect(() => {
        load()
        const channel = subscribeDebouncedToTable('contacts', (payload) => {
            if (payload.eventType === 'DELETE') {
                setContacts(prev => prev.filter(c => c.id !== payload.old.id))
                return
            }

            load()
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addContact = async (contact) => {
        const result = await insertRow('contacts', contact)
        if (result) await load()
        return result
    }

    const updateContact = async (id, updates) => {
        const result = await updateRow('contacts', id, updates)
        if (result) await load()
        return result
    }

    const removeContact = async (id) => {
        const success = await deleteRow('contacts', id)
        if (success) await load()
        return success
    }

    return { contacts, loading, error, addContact, updateContact, removeContact, reload: load }
}
