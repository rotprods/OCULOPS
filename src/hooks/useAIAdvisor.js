// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useAIAdvisor
// Calls the ai-advisor edge function for strategic insights
// ═══════════════════════════════════════════════════

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAIAdvisor() {
    const [insights, setInsights] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [source, setSource] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(null)

    const fetchInsights = useCallback(async () => {
        if (!import.meta.env.VITE_SUPABASE_URL) return
        setLoading(true)
        setError(null)
        try {
            const { data: { session } } = supabase
                ? await supabase.auth.getSession()
                : { data: { session: null } }

            const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advisor`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                    },
                }
            )

            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            setInsights(data.insights || [])
            setSource(data.source || 'unknown')
            setLastUpdated(data.generated_at || new Date().toISOString())
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [])

    return { insights, loading, error, source, lastUpdated, fetchInsights }
}
