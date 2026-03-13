import { useCallback, useEffect, useMemo, useState } from 'react'
import { callSupabaseFunction, subscribeDebouncedToTable, supabase } from '../lib/supabase'

const OUTREACH_STATUSES = ['staged', 'approved', 'sent', 'replied', 'skipped']

function buildStats(rows) {
    return OUTREACH_STATUSES.reduce((acc, status) => {
        acc[status] = rows.filter((row) => row.status === status).length
        return acc
    }, { all: rows.length })
}

export function useOutreachQueue(initialStatus = 'staged') {
    const [rows, setRows] = useState([])
    const [statusFilter, setStatusFilter] = useState(initialStatus)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [busyKey, setBusyKey] = useState(null)

    const loadQueue = useCallback(async () => {
        if (!supabase) {
            setRows([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { data, error: queryError } = await supabase
                .from('outreach_queue')
                .select('*, prospector_leads(id, name, category, ai_score, estimated_deal_value)')
                .order('created_at', { ascending: false })

            if (queryError) throw queryError
            setRows(data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadQueue()
        const channel = subscribeDebouncedToTable('outreach_queue', () => loadQueue())
        return () => channel?.unsubscribe?.()
    }, [loadQueue])

    const runAction = useCallback(async (action, payload = {}, nextBusyKey = action) => {
        setBusyKey(nextBusyKey)
        setError(null)

        try {
            const result = await callSupabaseFunction('agent-outreach', {
                body: { action, ...payload },
            })
            await loadQueue()
            return result
        } catch (err) {
            setError(err.message)
            return { error: err.message }
        } finally {
            setBusyKey(null)
        }
    }, [loadQueue])

    const items = useMemo(() => {
        if (statusFilter === 'all') return rows
        return rows.filter((row) => row.status === statusFilter)
    }, [rows, statusFilter])

    const stats = useMemo(() => buildStats(rows), [rows])

    return {
        items,
        stats,
        statusFilter,
        loading,
        error,
        busyKey,
        setStatusFilter,
        approveItem: (id) => runAction('approve', { id }, `approve:${id}`),
        skipItem: (id) => runAction('skip', { id }, `skip:${id}`),
        sendItem: (id) => runAction('send', { id }, `send:${id}`),
        batchApprove: (niche) => runAction('batch_approve', niche ? { niche } : {}, niche ? `batch:${niche}` : 'batch'),
        reload: loadQueue,
    }
}

export default useOutreachQueue
