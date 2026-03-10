// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useCampaigns
// Supabase-connected hook for marketing campaigns + metrics
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, fetchAll, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase'

export function useCampaigns() {
    const [campaigns, setCampaigns] = useState([])
    const [metrics, setMetrics] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchAll('campaigns', {})
            setCampaigns(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [])

    const loadMetrics = useCallback(async (campaignId) => {
        try {
            const { data } = await supabase
                .from('campaign_metrics')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('date', { ascending: false })
            setMetrics(data || [])
        } catch (err) {
            setError(err.message)
        }
    }, [])

    useEffect(() => {
        load()
        const channel = subscribeToTable('campaigns', (payload) => {
            if (payload.eventType === 'INSERT') setCampaigns(prev => [...prev, payload.new])
            else if (payload.eventType === 'UPDATE') setCampaigns(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
            else if (payload.eventType === 'DELETE') setCampaigns(prev => prev.filter(c => c.id !== payload.old.id))
        })
        return () => channel?.unsubscribe()
    }, [load])

    const addCampaign = async (campaign) => {
        const result = await insertRow('campaigns', campaign)
        if (result) setCampaigns(prev => [...prev, result])
        return result
    }

    const updateCampaign = async (id, updates) => {
        const result = await updateRow('campaigns', id, updates)
        if (result) setCampaigns(prev => prev.map(c => c.id === id ? result : c))
        return result
    }

    const removeCampaign = async (id) => {
        const success = await deleteRow('campaigns', id)
        if (success) setCampaigns(prev => prev.filter(c => c.id !== id))
        return success
    }

    const totalSpend = campaigns.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0)

    return { campaigns, metrics, loading, error, addCampaign, updateCampaign, removeCampaign, loadMetrics, reload: load, totalSpend }
}
