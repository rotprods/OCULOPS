import { autoConnectApi } from "./auto-api-connector.ts";

/**
 * Public catalog router for agents.
 * Routes intents through the live connector infrastructure only.
 */
export async function executeDynamicPublicApi(agentCodeName: string, intent: string) {
    const result = await autoConnectApi(intent, {
        agentName: agentCodeName,
        preferFree: false,
    });

    if (!result.ok) {
        throw new Error(result.error || "No live connector could satisfy the request");
    }

    return {
        intent,
        connector_id: result.connector_id,
        connector_name: result.api_used,
        endpoint_name: result.endpoint_name,
        capability: result.capability,
        data: result.data,
        meta: result.meta,
    };
}
