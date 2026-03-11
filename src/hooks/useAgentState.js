// ═══════════════════════════════════════════════════
// OCULOPS — useAgentState Hook
// Live agent status, health, and run tracking
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useOrgStore } from '../stores/useOrgStore'

/**
 * Hook that provides real-time agent state from the orchestration layer.
 * 
 * Returns live status (idle/running/error) per agent, recent runs,
 * and subscribes to Supabase Realtime for instant updates.
 */
export function useAgentState() {
  const { currentOrg } = useOrgStore()
  const orgId = currentOrg?.id
  const [agentStates, setAgentStates] = useState([])
  const [recentRuns, setRecentRuns] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Fetch agent states ──
  const fetchStates = useCallback(async () => {
    if (!isSupabaseConfigured || !orgId) return
    const { data, error } = await supabase
      .from('agent_registry')
      .select(`
        id, code_name, name, status, role, description,
        run_mode, consumes_events, emits_events, tool_scopes
      `)
      .or(`org_id.eq.${orgId},org_id.is.null`)
      .order('name')

    if (!error && data) {
      setAgentStates(data)
    }
    setLoading(false)
  }, [orgId])

  // ── Fetch recent runs ──
  const fetchRuns = useCallback(async (limit = 20) => {
    if (!isSupabaseConfigured || !orgId) return
    const { data, error } = await supabase
      .from('pipeline_step_runs')
      .select(`
        id, step_key, agent_code_name, status, error,
        started_at, completed_at, pipeline_run_id
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!error && data) {
      setRecentRuns(data)
    }
  }, [orgId])

  // ── Initial load ──
  useEffect(() => {
    fetchStates()
    fetchRuns()
  }, [fetchStates, fetchRuns])

  // ── Realtime subscriptions ──
  useEffect(() => {
    if (!isSupabaseConfigured || !orgId) return

    const channel = supabase
      .channel('agent-state-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pipeline_step_runs',
        filter: `org_id=eq.${orgId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRecentRuns(prev => [payload.new, ...prev].slice(0, 30))
        } else if (payload.eventType === 'UPDATE') {
          setRecentRuns(prev =>
            prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r)
          )
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId])

  // ── Derived: running agents ──
  const runningAgents = recentRuns
    .filter(r => r.status === 'running')
    .map(r => r.agent_code_name)
    .filter(Boolean)

  const agentHealth = agentStates.reduce((acc, agent) => {
    const agentRuns = recentRuns.filter(r => r.agent_code_name === agent.code_name)
    const errors = agentRuns.filter(r => r.status === 'failed').length
    const total = agentRuns.length
    const score = total === 0 ? 100 : Math.round(((total - errors) / total) * 100)
    acc[agent.code_name] = {
      ...agent,
      isRunning: runningAgents.includes(agent.code_name),
      healthScore: score,
      totalRuns: total,
      totalErrors: errors,
      lastRun: agentRuns[0] || null,
    }
    return acc
  }, {})

  return {
    agentStates,
    agentHealth,
    recentRuns,
    runningAgents,
    loading,
    refresh: () => { fetchStates(); fetchRuns() },
  }
}

export default useAgentState
