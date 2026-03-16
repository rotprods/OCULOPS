import { getCurrentSession } from './supabase'
import { loadRuntimeConfig, postJson } from './runtimeClient'

export function asControlPlaneRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export function extractControlPlaneDispatchResult(controlPlaneDispatch, fallback = {}) {
    const controlPlaneData = asControlPlaneRecord(controlPlaneDispatch?.data)
    const dispatchResult = asControlPlaneRecord(controlPlaneData.dispatch_result)
    if (Object.keys(dispatchResult).length === 0) {
        return controlPlaneDispatch
    }

    return {
        ...dispatchResult,
        control_plane: {
            action: controlPlaneDispatch?.action || 'tool_dispatch',
            trace_id: controlPlaneDispatch?.trace_id || null,
            correlation_id: controlPlaneDispatch?.correlation_id || fallback?.correlation_id || null,
        },
    }
}

export async function dispatchGovernedTool({
    action = 'tool_dispatch',
    sourceAgent = 'copilot',
    source = 'ui',
    targetType = 'agent_action',
    targetRef,
    riskClass = 'medium',
    toolCodeName,
    functionName,
    payload = {},
    context = {},
    orgId = null,
    userId,
    correlationId = null,
}) {
    const session = await getCurrentSession()
    const resolvedUserId = userId === undefined ? (session?.user?.id || null) : userId
    
    // Rerouted to use the Gateway Proxy to pass through to Supabase Edge Function 'control-plane'
    // but going through our `api-proxy` or standard `runtimeClient` method
    // Wait, the edge function is 'control-plane'. Did I add that to api-gateway.js? No, I added 'api-proxy'.
    // Let me add 'control-plane' to api-gateway.js too, or just execute fetch.
    const config = loadRuntimeConfig()
    const response = await postJson(`${config.gatewayBase.replace(/\/$/, '')}/api/v1/control-plane`, {
        action,
        org_id: orgId,
        user_id: resolvedUserId,
        source_agent: sourceAgent,
        source,
        target_type: targetType,
        target_ref: targetRef || toolCodeName,
        risk_class: riskClass,
        correlation_id: correlationId,
        context,
        tool_code_name: toolCodeName,
        ...(functionName ? { function_name: functionName } : {}),
        payload,
    }, {
        headers: { 'X-OCULOPS-TOKEN': config.gatewayToken }
    })

    return extractControlPlaneDispatchResult(response, { correlation_id: correlationId })
}
