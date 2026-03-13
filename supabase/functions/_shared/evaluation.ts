import { compact, safeNumber } from "./http.ts";
import { admin } from "./supabase.ts";

export type ImpactLevel = "low" | "medium" | "high" | "critical";
export type EvaluationDecision = "pass" | "retry" | "reject" | "escalate";

export interface JsonRecord {
  [key: string]: unknown;
}

export interface EvaluateArtifactInput {
  artifactType: string;
  artifactPayload: JsonRecord;
  impactLevel: ImpactLevel;
  artifactId?: string | null;
  correlationId?: string | null;
  orgId?: string | null;
  userId?: string | null;
  pipelineRunId?: string | null;
  stepRunId?: string | null;
  goalId?: string | null;
  goalStepId?: string | null;
  sourceAgent?: string | null;
  explanationHint?: string | null;
}

export interface EvaluationResult {
  evaluation_id: string;
  artifact: {
    artifact_type: string;
    artifact_id: string | null;
    correlation_id: string | null;
  };
  impact_level: ImpactLevel;
  scores: {
    quality: number;
    architecture: number;
    risk: number;
    cost: number;
  };
  overall_score: number;
  threshold: number;
  decision: EvaluationDecision;
  retry_recommended: boolean;
  escalation_required: boolean;
  explanation: string;
  actions: string[];
  evaluated_by: string[];
  evaluated_at: string;
}

const EVALUATION_WEIGHTS = {
  quality: 0.35,
  architecture: 0.25,
  risk: 0.25,
  cost: 0.15,
} as const;

const THRESHOLDS: Record<ImpactLevel, number> = {
  low: 70,
  medium: 78,
  high: 85,
  critical: 90,
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function detectTokenUsage(payload: JsonRecord) {
  const metrics = asRecord(payload.metrics);
  const usage = asRecord(payload.usage);
  const directTotal = safeNumber(payload.total_tokens, NaN);
  if (Number.isFinite(directTotal)) return directTotal;

  const metricsTotal = safeNumber(metrics.total_tokens, NaN);
  if (Number.isFinite(metricsTotal)) return metricsTotal;

  const usageTotal = safeNumber(usage.total_tokens, NaN);
  if (Number.isFinite(usageTotal)) return usageTotal;

  return 0;
}

function detectToolCallCount(payload: JsonRecord) {
  const metrics = asRecord(payload.metrics);
  const toolCalls = payload.tool_calls;
  if (Array.isArray(toolCalls)) return toolCalls.length;
  const metricCount = safeNumber(metrics.tool_calls, NaN);
  if (Number.isFinite(metricCount)) return metricCount;
  return 0;
}

function computeQualityScore(payload: JsonRecord) {
  let score = 70;
  if (payload.ok === true) score += 15;
  if (payload.ok === false) score -= 30;

  const status = compact(payload.status).toLowerCase();
  if (["completed", "delivered", "success", "ok", "planned", "running"].includes(status)) score += 8;
  if (["failed", "error", "dead_lettered", "cancelled"].includes(status)) score -= 25;

  if (compact(payload.summary)) score += 8;
  if (!compact(payload.summary) && !compact(payload.message)) score -= 8;
  if (compact(payload.error)) score -= 20;

  return clampScore(score);
}

function computeArchitectureScore(payload: JsonRecord) {
  let score = 72;
  if (compact(payload.correlation_id)) score += 6;
  if (compact(payload.pipeline_run_id)) score += 6;
  if (compact(payload.step_run_id) || compact(payload.goal_step_id)) score += 5;

  const trace = asRecord(payload.trace);
  if (compact(trace.correlation_id)) score += 6;

  const hasContractLikeKeys =
    ("ok" in payload) &&
    ("status" in payload || "summary" in payload || "error" in payload);
  if (hasContractLikeKeys) score += 6;
  if (!hasContractLikeKeys) score -= 12;

  return clampScore(score);
}

function computeRiskScore(payload: JsonRecord, impactLevel: ImpactLevel) {
  const baseByImpact: Record<ImpactLevel, number> = {
    low: 86,
    medium: 80,
    high: 72,
    critical: 66,
  };
  let score = baseByImpact[impactLevel];

  if (compact(payload.error)) score -= 28;
  if (payload.ok === false) score -= 20;

  const policy = asRecord(payload.policy);
  if (policy.violation === true) score -= 40;

  const approvalRequired = payload.approval_required === true || policy.approval_required === true;
  const approvalGranted = payload.approval_granted === true || policy.approval_granted === true;
  if (approvalRequired && !approvalGranted) score -= 20;

  return clampScore(score);
}

function computeCostScore(payload: JsonRecord) {
  let score = 85;
  const tokens = detectTokenUsage(payload);
  const toolCalls = detectToolCallCount(payload);

  if (tokens > 12000) score -= 22;
  else if (tokens > 8000) score -= 14;
  else if (tokens > 4000) score -= 8;

  if (toolCalls > 15) score -= 20;
  else if (toolCalls > 8) score -= 12;
  else if (toolCalls > 4) score -= 6;

  return clampScore(score);
}

function computeDecision(input: {
  overallScore: number;
  threshold: number;
  impactLevel: ImpactLevel;
  scores: EvaluationResult["scores"];
}) {
  if (input.scores.risk < 45) {
    return {
      decision: "escalate" as const,
      retryRecommended: false,
      escalationRequired: true,
    };
  }

  if (input.overallScore >= input.threshold) {
    return {
      decision: "pass" as const,
      retryRecommended: false,
      escalationRequired: false,
    };
  }

  const retryWindow = input.threshold - 10;
  if (input.overallScore >= retryWindow) {
    return {
      decision: "retry" as const,
      retryRecommended: true,
      escalationRequired: input.impactLevel === "critical",
    };
  }

  if (input.impactLevel === "critical" || input.impactLevel === "high") {
    return {
      decision: "escalate" as const,
      retryRecommended: false,
      escalationRequired: true,
    };
  }

  return {
    decision: "reject" as const,
    retryRecommended: false,
    escalationRequired: false,
  };
}

function buildActions(decision: EvaluationDecision) {
  if (decision === "pass") return ["continue"];
  if (decision === "retry") return ["retry_step", "review_inputs"];
  if (decision === "reject") return ["stop_step", "review_contract"];
  return ["escalate_to_operator", "review_policy_gate"];
}

function buildExplanation(input: {
  decision: EvaluationDecision;
  scores: EvaluationResult["scores"];
  overallScore: number;
  threshold: number;
  hint?: string | null;
}) {
  const summary = `Decision=${input.decision}. Score ${input.overallScore}/100 (threshold ${input.threshold}). q=${input.scores.quality}, a=${input.scores.architecture}, r=${input.scores.risk}, c=${input.scores.cost}.`;
  if (compact(input.hint)) return `${summary} ${compact(input.hint)}`;
  return summary;
}

export async function evaluateArtifact(input: EvaluateArtifactInput): Promise<EvaluationResult> {
  const scores = {
    quality: computeQualityScore(input.artifactPayload),
    architecture: computeArchitectureScore(input.artifactPayload),
    risk: computeRiskScore(input.artifactPayload, input.impactLevel),
    cost: computeCostScore(input.artifactPayload),
  };

  const overallRaw =
    (scores.quality * EVALUATION_WEIGHTS.quality) +
    (scores.architecture * EVALUATION_WEIGHTS.architecture) +
    (scores.risk * EVALUATION_WEIGHTS.risk) +
    (scores.cost * EVALUATION_WEIGHTS.cost);
  const overallScore = clampScore(overallRaw);
  const threshold = THRESHOLDS[input.impactLevel];

  const decisionMeta = computeDecision({
    overallScore,
    threshold,
    impactLevel: input.impactLevel,
    scores,
  });

  const evaluatedAt = new Date().toISOString();
  const explanation = buildExplanation({
    decision: decisionMeta.decision,
    scores,
    overallScore,
    threshold,
    hint: input.explanationHint || null,
  });
  const actions = buildActions(decisionMeta.decision);
  const evaluatedBy = ["quality_critic", "architecture_critic", "risk_critic", "cost_critic"];

  const { data, error } = await admin
    .from("evaluation_runs")
    .insert({
      org_id: compact(input.orgId) || null,
      user_id: compact(input.userId) || null,
      artifact_type: compact(input.artifactType),
      artifact_id: compact(input.artifactId) || null,
      impact_level: input.impactLevel,
      scores,
      overall_score: overallScore,
      threshold,
      decision: decisionMeta.decision,
      retry_recommended: decisionMeta.retryRecommended,
      escalation_required: decisionMeta.escalationRequired,
      explanation,
      actions,
      evaluated_by: evaluatedBy,
      correlation_id: compact(input.correlationId) || null,
      pipeline_run_id: compact(input.pipelineRunId) || null,
      step_run_id: compact(input.stepRunId) || null,
      goal_id: compact(input.goalId) || null,
      goal_step_id: compact(input.goalStepId) || null,
      source_agent: compact(input.sourceAgent) || null,
      artifact_payload: input.artifactPayload,
    })
    .select("id")
    .single();

  if (error) throw error;

  return {
    evaluation_id: String(data.id),
    artifact: {
      artifact_type: compact(input.artifactType),
      artifact_id: compact(input.artifactId) || null,
      correlation_id: compact(input.correlationId) || null,
    },
    impact_level: input.impactLevel,
    scores,
    overall_score: overallScore,
    threshold,
    decision: decisionMeta.decision,
    retry_recommended: decisionMeta.retryRecommended,
    escalation_required: decisionMeta.escalationRequired,
    explanation,
    actions,
    evaluated_by: evaluatedBy,
    evaluated_at: evaluatedAt,
  };
}
