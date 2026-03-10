// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useLeads
// Canonical lead intake via prospector_leads
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
    deleteRow,
    getCurrentUserId,
    insertRow,
    scopeUserQuery,
    subscribeToTable,
    supabase,
    updateRow,
} from '../lib/supabase'

function normalizeLead(lead) {
    return {
        ...lead,
        company: lead.business_name || lead.company || lead.name || '',
        buySignal: lead.ai_reasoning || lead.notes || lead.category || '',
        confidence: lead.ai_score ?? lead.score ?? 50,
        linkedin: lead.linkedin_url || lead.data?.linkedin || '',
    }
}

function mapLeadInput(lead = {}, { partial = false } = {}) {
    const confidence = Number(lead.confidence ?? lead.ai_score ?? 50) || 0
    const payload = {}

    if (!partial || lead.name || lead.contact_name) payload.name = lead.name || lead.contact_name || 'Untitled lead'
    if (!partial || lead.company || lead.business_name || lead.name) payload.business_name = lead.company || lead.business_name || lead.name || 'Untitled lead'
    if ('name' in lead || 'contact_name' in lead || !partial) payload.contact_name = lead.name || lead.contact_name || null
    if ('email' in lead || !partial) payload.email = lead.email || null
    if ('role' in lead || !partial) payload.role = lead.role || null
    if ('source' in lead || !partial) payload.source = lead.source || 'gtm'
    if ('status' in lead || !partial) payload.status = lead.status || 'raw'
    if ('confidence' in lead || 'ai_score' in lead || !partial) {
        payload.ai_score = confidence
        payload.score = confidence
    }
    if ('buySignal' in lead || 'ai_reasoning' in lead || !partial) payload.ai_reasoning = lead.buySignal || lead.ai_reasoning || null
    if (!partial) {
        payload.raw_payload = { ...lead, origin: 'gtm' }
        payload.data = { ...lead, origin: 'gtm' }
    }

    return payload
}

export function useLeads() {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            if (!supabase) {
                setLeads([])
                setLoading(false)
                return
            }

            const userId = await getCurrentUserId()
            let query = supabase
                .from('prospector_leads')
                .select('*')
                .order('created_at', { ascending: false })

            query = scopeUserQuery(query, userId)

            const { data, error: queryError } = await query
            if (queryError) throw queryError
            setLeads((data || []).map(normalizeLead))
            setError(null)
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        load()

        const channel = subscribeToTable('prospector_leads', () => {
            load()
        })

        return () => channel?.unsubscribe?.()
    }, [load])

    const addLead = async (lead) => {
        const result = await insertRow('prospector_leads', mapLeadInput(lead))
        if (result) {
            await load()
            return normalizeLead(result)
        }
        return null
    }

    const updateLead = async (id, updates) => {
        const result = await updateRow('prospector_leads', id, mapLeadInput(updates, { partial: true }))
        if (result) {
            await load()
            return normalizeLead(result)
        }
        return null
    }

    const removeLead = async (id) => {
        const success = await deleteRow('prospector_leads', id)
        if (success) await load()
        return success
    }

    return { leads, loading, error, addLead, updateLead, removeLead, reload: load }
}
