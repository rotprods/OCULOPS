// ═══════════════════════════════════════════════════
// OCULOPS — Event Bus Helper
// Insert events into event_log → triggers pg_notify
// ═══════════════════════════════════════════════════

import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Emit an event by inserting into the event_log table.
 * The DB trigger broadcasts it via pg_notify automatically.
 *
 * @param {string} eventType - e.g. 'agent.started', 'deal.stage_changed'
 * @param {object} payload - arbitrary JSON payload
 * @param {object} options - orchestration metadata
 * @returns {Promise<object|null>} the inserted row or null on error
 */
export async function emitEvent(eventType, payload = {}, options = {}) {
    if (!isSupabaseConfigured) return null

    const { data: { user } } = await supabase.auth.getUser()
    const {
        sourceAgent = null,
        orgId = null,
        pipelineRunId = null,
        stepRunId = null,
        correlationId = null,
        status = 'emitted',
        metadata = {},
    } = options

    const { data, error } = await supabase
        .from('event_log')
        .insert({
            event_type: eventType,
            payload,
            user_id: user?.id || null,
            org_id: orgId,
            source_agent: sourceAgent,
            pipeline_run_id: pipelineRunId,
            step_run_id: stepRunId,
            correlation_id: correlationId,
            status,
            metadata,
        })
        .select()
        .single()

    if (error) {
        if (import.meta.env.DEV) console.error('emitEvent error:', error)
        return null
    }

    return data
}
