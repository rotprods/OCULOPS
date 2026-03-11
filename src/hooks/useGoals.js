// ═══════════════════════════════════════════════════
// OCULOPS — useGoals Hook
// Goal decomposition and tracking
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useOrgStore } from '../stores/useOrgStore'

/**
 * Hook for the goal decomposition engine.
 * Creates goals, tracks steps, and monitors execution.
 */
export function useGoals() {
  const { currentOrg } = useOrgStore()
  const orgId = currentOrg?.id
  const [goals, setGoals] = useState([])
  const [activeGoal, setActiveGoal] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Fetch goals ──
  const fetchGoals = useCallback(async (limit = 20) => {
    if (!isSupabaseConfigured || !orgId) return
    const { data, error } = await supabase
      .from('goals')
      .select('*, goal_steps(*)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!error && data) {
      setGoals(data)
      const active = data.find(g => g.status === 'active' || g.status === 'executing')
      if (active) setActiveGoal(active)
    }
    setLoading(false)
  }, [orgId])

  // ── Create a new goal ──
  const createGoal = useCallback(async (title, description = '', context = {}) => {
    if (!isSupabaseConfigured || !orgId) return null
    const { data, error } = await supabase
      .from('goals')
      .insert({
        org_id: orgId,
        title,
        description,
        status: 'active',
        context,
        source: 'copilot',
      })
      .select()
      .single()

    if (error) { console.error('Goal creation failed:', error); return null }
    setGoals(prev => [data, ...prev])
    setActiveGoal(data)
    return data
  }, [orgId])

  // ── Add steps to a goal ──
  const addSteps = useCallback(async (goalId, steps) => {
    if (!isSupabaseConfigured || !orgId) return null
    const rows = steps.map((step, i) => ({
      goal_id: goalId,
      org_id: orgId,
      step_number: i + 1,
      title: step.title,
      description: step.description || '',
      step_type: step.type || 'agent',
      agent_code_name: step.agent || null,
      pipeline_template: step.pipeline || null,
      action: step.action || null,
      input: step.input || {},
      status: 'pending',
      depends_on: step.depends_on || null,
    }))

    const { data, error } = await supabase
      .from('goal_steps')
      .insert(rows)
      .select()

    if (error) { console.error('Step creation failed:', error); return null }

    // Update the goal status
    await supabase
      .from('goals')
      .update({ status: 'planning', updated_at: new Date().toISOString() })
      .eq('id', goalId)

    fetchGoals()
    return data
  }, [orgId, fetchGoals])

  // ── Update a step status ──
  const updateStep = useCallback(async (stepId, updates) => {
    if (!isSupabaseConfigured) return
    await supabase
      .from('goal_steps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', stepId)

    fetchGoals()
  }, [fetchGoals])

  // ── Update goal status ──
  const updateGoal = useCallback(async (goalId, updates) => {
    if (!isSupabaseConfigured) return
    await supabase
      .from('goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', goalId)

    fetchGoals()
  }, [fetchGoals])

  // ── Initial load ──
  useEffect(() => { fetchGoals() }, [fetchGoals])

  // ── Realtime for goals ──
  useEffect(() => {
    if (!isSupabaseConfigured || !orgId) return

    const channel = supabase
      .channel('goals-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'goals',
        filter: `org_id=eq.${orgId}`,
      }, () => { fetchGoals() })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'goal_steps',
        filter: `org_id=eq.${orgId}`,
      }, () => { fetchGoals() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, fetchGoals])

  // ── Stats ──
  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active' || g.status === 'executing').length,
    completed: goals.filter(g => g.status === 'completed').length,
    failed: goals.filter(g => g.status === 'failed').length,
  }

  return {
    goals,
    activeGoal,
    stats,
    loading,
    createGoal,
    addSteps,
    updateStep,
    updateGoal,
    refresh: fetchGoals,
  }
}

export default useGoals
