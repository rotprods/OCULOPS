import { useState, useEffect, useMemo, useCallback } from 'react'
import { getCurrentUser, supabase } from '../lib/supabase'

function compact(value) {
    return value == null ? '' : String(value).trim()
}

function normalizeLead(lead, index = 0) {
    const website = compact(lead.website || lead.website_url) || null
    const name = compact(lead.name || lead.business_name) || `Lead ${index + 1}`
    const address = compact(lead.address || lead.location) || null
    const placeId = compact(lead.place_id || lead.google_maps_id) || null
    const latValue = typeof lead.lat === 'number' ? lead.lat : typeof lead.latitude === 'number' ? lead.latitude : null
    const lngValue = typeof lead.lng === 'number' ? lead.lng : typeof lead.longitude === 'number' ? lead.longitude : null

    return {
        place_id: placeId,
        google_maps_id: placeId,
        name,
        business_name: name,
        address,
        city: compact(lead.city) || null,
        phone: compact(lead.phone) || null,
        website,
        category: compact(lead.category || lead.primary_type) || null,
        rating: typeof lead.rating === 'number' ? lead.rating : lead.rating ? Number(lead.rating) : null,
        review_count: lead.review_count ?? lead.reviews_count ?? lead.user_ratings_total ?? 0,
        reviews_count: lead.review_count ?? lead.reviews_count ?? lead.user_ratings_total ?? 0,
        lat: latValue,
        lng: lngValue,
        latitude: latValue,
        longitude: lngValue,
        status: compact(lead.status) || 'detected',
        source: compact(lead.source) || 'atlas',
        maps_url: compact(lead.maps_url || lead.url) || null,
        business_status: compact(lead.business_status) || null,
        score: typeof lead.ai_score === 'number' ? lead.ai_score : typeof lead.score === 'number' ? lead.score : 0,
        ai_score: typeof lead.ai_score === 'number' ? lead.ai_score : typeof lead.score === 'number' ? lead.score : null,
        ai_reasoning: compact(lead.ai_reasoning) || null,
        estimated_deal_value: lead.estimated_deal_value ?? null,
        social_profiles: lead.social_profiles || {},
        tech_stack: Array.isArray(lead.tech_stack) ? lead.tech_stack : [],
        email: compact(lead.email) || null,
        role: compact(lead.role) || null,
        contact_name: compact(lead.contact_name) || null,
        raw_payload: { original: lead },
        data: { original: lead },
    }
}

function preserveStatus(nextStatus, existingStatus) {
    if (!existingStatus) return nextStatus
    if (['pursuing', 'promoted', 'dismissed'].includes(existingStatus)) return existingStatus
    if (existingStatus === 'qualified' && nextStatus === 'detected') return existingStatus
    return nextStatus
}

async function getScope() {
    const user = await getCurrentUser()
    return user?.id || null
}

function applyScope(query, userId) {
    if (userId) return query.eq('user_id', userId)
    return query.is('user_id', null)
}

function applyScopeOrGlobal(query, userId) {
    if (userId) return query.or(`user_id.eq.${userId},user_id.is.null`)
    return query.is('user_id', null)
}

export function useProspector() {
    const [leads, setLeads] = useState([])
    const [scans, setScans] = useState([])
    const [loading, setLoading] = useState(true)

    const loadData = useCallback(async () => {
        if (!supabase) {
            setLeads([])
            setScans([])
            setLoading(false)
            return
        }

        setLoading(true)
        const userId = await getScope()

        const [leadsRes, scansRes] = await Promise.all([
            applyScopeOrGlobal(
                supabase.from('prospector_leads').select('*').order('created_at', { ascending: false }),
                userId
            ),
            applyScopeOrGlobal(
                supabase.from('prospector_scans').select('*').order('created_at', { ascending: false }).limit(50),
                userId
            ),
        ])

        setLeads(leadsRes.data || [])
        setScans(scansRes.data || [])
        setLoading(false)
    }, [])

    useEffect(() => {
        loadData()

        if (!supabase) return undefined

        const leadsChannel = supabase
            .channel('prospector_leads_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prospector_leads' }, loadData)
            .subscribe()

        const scansChannel = supabase
            .channel('prospector_scans_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prospector_scans' }, loadData)
            .subscribe()

        return () => {
            supabase.removeChannel(leadsChannel)
            supabase.removeChannel(scansChannel)
        }
    }, [loadData])

    const updateLead = useCallback(async (id, updates) => {
        if (!supabase) return null
        const { data, error } = await supabase
            .from('prospector_leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        if (error) return null
        await loadData()
        return data
    }, [loadData])

    const qualifyLead = useCallback((id) => updateLead(id, { status: 'qualified' }), [updateLead])
    const pursueLead = useCallback((id) => updateLead(id, { status: 'pursuing' }), [updateLead])
    const promoteLead = useCallback((id, relations = {}) => updateLead(id, { status: 'promoted', ...relations }), [updateLead])
    const dismissLead = useCallback((id) => updateLead(id, { status: 'dismissed' }), [updateLead])

    const deleteLead = useCallback(async (id) => {
        if (!supabase) return false
        const { error } = await supabase.from('prospector_leads').delete().eq('id', id)
        if (error) return false
        await loadData()
        return true
    }, [loadData])

    const recordScan = useCallback(async ({ query, location, radius, source = 'atlas', area = null, searchCenter = null, results = [], rawPayload = null }) => {
        if (!supabase) return { scan: null, leads: [] }

        const userId = await getScope()
        const { data: scan, error: scanError } = await supabase
            .from('prospector_scans')
            .insert({
                user_id: userId,
                query,
                location: location || area?.formatted_address || area?.label || null,
                radius: radius || null,
                results_count: results.length,
                status: 'completed',
                source,
                area_label: area?.label || location || null,
                area: area || {},
                search_center: searchCenter || {},
                raw_payload: rawPayload || {},
                data: rawPayload || {},
                completed_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (scanError) return { scan: null, leads: [], error: scanError.message }

        const persistedLeads = []

        for (const [index, result] of results.entries()) {
            const normalized = normalizeLead(result, index)
            let existing = null

            if (normalized.place_id) {
                let existingQuery = supabase
                    .from('prospector_leads')
                    .select('*')
                    .eq('place_id', normalized.place_id)
                    .limit(1)

                existingQuery = applyScope(existingQuery, userId)
                const { data } = await existingQuery
                existing = data?.[0] || null
            }

            if (!existing && normalized.name) {
                let existingQuery = supabase
                    .from('prospector_leads')
                    .select('*')
                    .eq('name', normalized.name)
                    .limit(1)

                if (normalized.address) existingQuery = existingQuery.eq('address', normalized.address)
                existingQuery = applyScope(existingQuery, userId)
                const { data } = await existingQuery
                existing = data?.[0] || null
            }

            const payload = {
                ...normalized,
                user_id: userId,
                scan_id: scan.id,
                status: preserveStatus(normalized.status, existing?.status),
            }

            if (existing) {
                const { data } = await supabase
                    .from('prospector_leads')
                    .update({
                        ...payload,
                        company_id: existing.company_id || null,
                        contact_id: existing.contact_id || null,
                        deal_id: existing.deal_id || null,
                    })
                    .eq('id', existing.id)
                    .select()
                    .single()
                if (data) persistedLeads.push(data)
            } else {
                const { data } = await supabase
                    .from('prospector_leads')
                    .insert(payload)
                    .select()
                    .single()
                if (data) persistedLeads.push(data)
            }
        }

        await loadData()
        return { scan, leads: persistedLeads }
    }, [loadData])

    const byStatus = useMemo(() => ({
        detected: leads.filter(lead => lead.status === 'detected'),
        qualified: leads.filter(lead => lead.status === 'qualified'),
        pursuing: leads.filter(lead => lead.status === 'pursuing'),
        promoted: leads.filter(lead => lead.status === 'promoted'),
        active: leads.filter(lead => lead.status !== 'dismissed'),
    }), [leads])

    const bySource = useMemo(() => {
        const map = {}
        leads.forEach(lead => {
            const source = lead.source || 'unknown'
            map[source] = (map[source] || 0) + 1
        })
        return map
    }, [leads])

    const avgScore = useMemo(() => {
        const scored = leads.filter(lead => lead.ai_score != null)
        return scored.length
            ? Math.round(scored.reduce((sum, lead) => sum + lead.ai_score, 0) / scored.length)
            : 0
    }, [leads])

    return {
        leads,
        scans,
        loading,
        byStatus,
        bySource,
        avgScore,
        recordScan,
        updateLead,
        qualifyLead,
        pursueLead,
        promoteLead,
        dismissLead,
        deleteLead,
        reload: loadData,
    }
}
