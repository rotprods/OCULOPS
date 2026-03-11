// ═══════════════════════════════════════════════════
// OCULOPS — usePipelineRuns Hook
// Live pipeline execution tracking
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useOrgStore } from '../stores/useOrgStore'
import { useEdgeFunction } from './useEdgeFunction'

/**
 * Hook for live pipeline run tracking.
 * Connects to the orchestration-engine Edge Function
 * and subscribes to real-time pipeline state changes.
 */
export function usePipelineRuns() {
  const { currentOrg } = useOrgStore()
  const orgId = currentOrg?.id
  const [runs, setRuns] = useState([])
  const [activeRun, setActiveRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const { execute } = useEdgeFunction('orchestration-engine')

  // ── Fetch recent pipeline runs ──
  const fetchRuns = useCallback(async (limit = 20) => {
    if (!isSupabaseConfigured || !orgId) return
    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*, pipeline_templates(name, code_name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!error && data) {
      setRuns(data)
      const running = data.find(r => r.status === 'running')
      if (running) setActiveRun(running)
    }
    setLoading(false)
  }, [orgId])

  // ── Launch a pipeline ──
  const launchPipeline = useCallback(async (templateCodeName, opts = {}) => {
    const result = await execute({
      action: 'create_run',
      template_code_name: templateCodeName,
      goal: opts.goal || null,
      context: opts.context || {},
      user_id: opts.userId || null,
      org_id: orgId,
      source: opts.source || 'ui',
      auto_execute: opts.autoExecute !== false,
    })
    if (result) fetchRuns()
    return result
  }, [execute, orgId, fetchRuns])

  // ── Get run details ──
  const getRunDetails = useCallback(async (runId) => {
    return execute({ action: 'get_run', pipeline_run_id: runId })
  }, [execute])

  // ── Initial load ──
  useEffect(() => { fetchRuns() }, [fetchRuns])

  // ── Realtime for pipeline_runs ──
  useEffect(() => {
    if (!isSupabaseConfigured || !orgId) return

    const channel = supabase
      .channel('pipeline-runs-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pipeline_runs',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRuns(prev => [payload.new, ...prev].slice(0, 30))
          if (payload.new.status === 'running') setActiveRun(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          setRuns(prev =>
            prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r)
          )
        if (payload.new.status === 'running') {
            setActiveRun(payload.new)
          } else {
            setActiveRun(prev => prev?.id === payload.new.id ? null : prev)
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId])

  // ── Derived stats ──
  const stats = {
    total: runs.length,
    running: runs.filter(r => r.status === 'running').length,
    completed: runs.filter(r => r.status === 'completed').length,
    failed: runs.filter(r => r.status === 'failed').length,
  }

  return {
    runs,
    activeRun,
    stats,
    loading,
    launchPipeline,
    getRunDetails,
    refresh: fetchRuns,
  }
}

export default usePipelineRuns
