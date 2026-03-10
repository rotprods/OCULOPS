// ═══════════════════════════════════════════════════
// OCULOPS — React Hook: useAutomation
// Supabase-connected hook for automation workflows + runs
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, insertRow, updateRow, deleteRow, subscribeToTable } from '../lib/supabase'
import { executeAutomationWorkflow, triggerAutomationWorkflows } from '../lib/automation'

export function useAutomation() {
    const [workflows, setWorkflows] = useState([])
    const [runs, setRuns] = useState([])
    const [activeWorkflowId, setActiveWorkflowId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [runningWorkflowId, setRunningWorkflowId] = useState(null)
    const [triggeringKey, setTriggeringKey] = useState(null)

    const loadWorkflows = useCallback(async () => {
        setLoading(true)
        try {
            if (!supabase) {
                setWorkflows([])
                setLoading(false)
                return
            }

            const { data, error: queryError } = await supabase
                .from('automation_workflows')
                .select('*')
                .order('created_at', { ascending: false })

            if (queryError) throw queryError
            setWorkflows(data || [])
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }, [])

    const loadRuns = useCallback(async (workflowId) => {
        setActiveWorkflowId(workflowId || null)
        try {
            if (!supabase || !workflowId) {
                setRuns([])
                return
            }

            const { data } = await supabase
                .from('automation_runs')
                .select('*')
                .eq('workflow_id', workflowId)
                .order('started_at', { ascending: false })
                .limit(20)
            setRuns(data || [])
        } catch (err) {
            setError(err.message)
        }
    }, [])

    useEffect(() => {
        loadWorkflows()
        const channels = [
            subscribeToTable('automation_workflows', (payload) => {
                if (payload.eventType === 'DELETE') {
                    setWorkflows(prev => prev.filter(w => w.id !== payload.old.id))
                    return
                }

                loadWorkflows()
            }),
            subscribeToTable('automation_runs', () => {
                if (activeWorkflowId) loadRuns(activeWorkflowId)
                loadWorkflows()
            }),
        ]

        return () => {
            channels.forEach(channel => channel?.unsubscribe())
        }
    }, [activeWorkflowId, loadRuns, loadWorkflows])

    const addWorkflow = async (workflow) => {
        const result = await insertRow('automation_workflows', { ...workflow, is_active: false, run_count: 0 })
        if (result) await loadWorkflows()
        return result
    }

    const toggleWorkflow = async (id) => {
        const wf = workflows.find(w => w.id === id)
        if (!wf) return
        const result = await updateRow('automation_workflows', id, { is_active: !wf.is_active })
        if (result) await loadWorkflows()
        return result
    }

    const removeWorkflow = async (id) => {
        const success = await deleteRow('automation_workflows', id)
        if (success) await loadWorkflows()
        return success
    }

    const runWorkflow = useCallback(async (workflowId, options = {}) => {
        setRunningWorkflowId(workflowId)
        setError(null)

        try {
            const result = await executeAutomationWorkflow(workflowId, options.context || {}, {
                send_live: Boolean(options.sendLive),
                source: options.source || 'automation_ui',
            })
            await loadWorkflows()
            await loadRuns(workflowId)
            return result
        } catch (err) {
            setError(err.message)
            return { error: err.message }
        } finally {
            setRunningWorkflowId(null)
        }
    }, [loadRuns, loadWorkflows])

    const triggerByKey = useCallback(async (triggerKey, context = {}, options = {}) => {
        setTriggeringKey(triggerKey)
        setError(null)

        try {
            const result = await triggerAutomationWorkflows(triggerKey, context, {
                send_live: Boolean(options.sendLive),
                source: options.source || 'automation_trigger',
            })
            await loadWorkflows()
            return result
        } catch (err) {
            setError(err.message)
            return { error: err.message }
        } finally {
            setTriggeringKey(null)
        }
    }, [loadWorkflows])

    const activeCount = workflows.filter(w => w.is_active).length
    const totalRuns = workflows.reduce((sum, w) => sum + (w.run_count || 0), 0)

    return {
        workflows,
        runs,
        loading,
        error,
        runningWorkflowId,
        triggeringKey,
        addWorkflow,
        toggleWorkflow,
        removeWorkflow,
        runWorkflow,
        triggerByKey,
        loadRuns,
        reload: loadWorkflows,
        activeCount,
        totalRuns,
    }
}
