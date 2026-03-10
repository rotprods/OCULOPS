// ═══════════════════════════════════════════════════
// CEO Score — Niche prioritization algorithm
// Single source of truth for both UI and future backend use
// ═══════════════════════════════════════════════════

/**
 * Compute CEO score for a niche.
 * Weights: impact 1.2, velocity 1.5, scalability 0.5, confidence 1.0
 * Penalty: risk × resource_cost
 * Returns 0–100+
 */
export function computeNicheScore(niche) {
    const norm = v => Math.max(v, 1) / 100
    const num = Math.pow(norm(niche.impact || 50), 1.2) *
                Math.pow(norm(niche.velocity || 50), 1.5) *
                Math.pow(norm(niche.scalability || 50), 0.5) *
                Math.pow(norm(niche.confidence || 50), 1.0)
    const den = norm(niche.risk || 50) * norm(niche.resource_cost || 50)
    return den > 0 ? Math.round((num / den) * 100) : 0
}

/**
 * Compute health score (same formula as daily-snapshot edge function).
 * mrr: monthly recurring revenue
 * pipelineTotal: sum of open deal values
 * completionRate: task completion 0–100
 * activeAlerts: number of active alerts
 * Returns 0–100
 */
export function computeHealthScore({ mrr, pipelineTotal, completionRate, activeAlerts }) {
    const mrrScore      = Math.min(mrr / 200, 100)
    const pipelineScore = Math.min(pipelineTotal / 500, 100)
    const alertPenalty  = Math.max(0, 100 - activeAlerts * 10)
    return Math.round(mrrScore * 0.35 + completionRate * 0.25 + pipelineScore * 0.25 + alertPenalty * 0.15)
}
