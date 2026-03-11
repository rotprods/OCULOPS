// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useDetectedLeads
// Supabase-connected hook for lead prospector/detector
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { fetchAll, insertRow, updateRow, subscribeDebouncedToTable } from '../lib/supabase'

export function useDetectedLeads(filters = {}) {
    const [leads, setLeads] = useState([])
    const [rules, setRules] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const filtersKey = JSON.stringify(filters)

    const loadLeads = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('detected_leads', JSON.parse(filtersKey))
            setLeads(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [filtersKey])

    const loadRules = useCallback(async () => {
        try {
            const data = await fetchAll('detection_rules', {})
            setRules(data || [])
        } catch (err) {
            setError(err.message)
        }
    }, [])

    useEffect(() => {
        loadLeads()
        loadRules()
        const channel = subscribeDebouncedToTable('detected_leads', (payload) => {
            if (payload.eventType === 'INSERT') setLeads(prev => [payload.new, ...prev])
            else if (payload.eventType === 'UPDATE') setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new : l))
            else if (payload.eventType === 'DELETE') setLeads(prev => prev.filter(l => l.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [loadLeads, loadRules])

    const qualifyLead = async (id) => {
        return await updateRow('detected_leads', id, {
            status: 'qualified', qualified_at: new Date().toISOString()
        })
    }

    const dismissLead = async (id) => {
        return await updateRow('detected_leads', id, { status: 'dismissed' })
    }

    const promoteToCRM = async (id) => {
        const lead = leads.find(l => l.id === id)
        if (!lead) return null
        // Create a contact from the detected lead
        const contact = await insertRow('contacts', {
            name: lead.business_name,
            source: lead.source,
            status: 'raw',
            notes: `Auto-detected from ${lead.source}. ICP Match: ${lead.icp_match_score}%`
        })
        if (contact) {
            await updateRow('detected_leads', id, { status: 'promoted' })
        }
        return contact
    }

    const addRule = async (rule) => {
        const result = await insertRow('detection_rules', rule)
        if (result) setRules(prev => [...prev, result])
        return result
    }

    const stats = {
        total: leads.length,
        detected: leads.filter(l => l.status === 'detected').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        promoted: leads.filter(l => l.status === 'promoted').length,
        avgScore: leads.length > 0 ? Math.round(leads.reduce((s, l) => s + (l.icp_match_score || 0), 0) / leads.length) : 0,
    }

    return { leads, rules, loading, error, qualifyLead, dismissLead, promoteToCRM, addRule, stats, reload: loadLeads }
}
