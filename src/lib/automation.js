import { supabase } from './supabase'

const BASE = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

async function getAccessToken() {
    if (!supabase) return ANON || null
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ANON || null
}

export async function invokeAutomationRunner(payload = {}) {
    if (!BASE) throw new Error('Supabase URL not configured')

    const token = await getAccessToken()
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(`${BASE}/functions/v1/automation-runner`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
        throw new Error(data?.error || `automation-runner failed (${response.status})`)
    }

    return data
}

export async function executeAutomationWorkflow(workflowId, context = {}, options = {}) {
    return invokeAutomationRunner({
        action: 'run',
        workflow_id: workflowId,
        context,
        ...options,
    })
}

export async function triggerAutomationWorkflows(triggerKey, context = {}, options = {}) {
    return invokeAutomationRunner({
        action: 'trigger',
        trigger_key: triggerKey,
        context,
        ...options,
    })
}

