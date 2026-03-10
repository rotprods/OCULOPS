// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useSnapshots
// Supabase-connected hook for daily historical data
// Used by sparklines and trend charts
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function normalizeSnapshotRow(row) {
    const snapshotDate = row.snapshot_date || row.date || row.created_at || null

    return {
        ...row,
        snapshot_date: snapshotDate,
        pipeline_total: row.pipeline_total ?? row.pipeline_value ?? 0,
        active_alerts: row.active_alerts ?? row.alerts_active ?? 0,
        task_completion_pct: row.task_completion_pct ?? row.tasks_completed ?? 0,
    }
}

export function useSnapshots(days = 30) {
    const [snapshots, setSnapshots] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const load = useCallback(async () => {
        if (!supabase) { setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const since = new Date()
            since.setDate(since.getDate() - days)
            const { data, error: err } = await supabase
                .from('daily_snapshots')
                .select('*')
                .order('created_at', { ascending: true })

            if (err) throw err
            const normalized = (data || [])
                .map(normalizeSnapshotRow)
                .filter((snapshot) => snapshot.snapshot_date && snapshot.snapshot_date >= since.toISOString().split('T')[0])
            setSnapshots(normalized)
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [days])

    useEffect(() => { load() }, [load])

    // Extract time series for sparklines
    const mrrHistory = snapshots.map(s => parseFloat(s.mrr) || 0)
    const clientHistory = snapshots.map(s => s.clients || 0)
    const pipelineHistory = snapshots.map(s => s.pipeline_total || 0)
    const healthHistory = snapshots.map(s => s.health_score || 0)
    const dates = snapshots.map(s => s.snapshot_date)

    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null

    return {
        snapshots, loading, error, reload: load,
        mrrHistory, clientHistory, pipelineHistory, healthHistory, dates,
        latest,
    }
}
