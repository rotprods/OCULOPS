import { compact } from "./http.ts";
import { admin } from "./supabase.ts";

export interface JsonRecord {
  [key: string]: unknown;
}

export type SimulationMode = "dry_run" | "shadow" | "replay";
export type RiskClass = "low" | "medium" | "high" | "critical";
export type SimulationStatus = "passed" | "failed";

export interface SimulationFinding {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
  blocking: boolean;
  recommendation?: string;
}

export interface RunSimulationInput {
  mode?: SimulationMode;
  targetType: string;
  targetId?: string | null;
  workflowId?: string | null;
  riskClass?: RiskClass;
  targetEnvironment?: "staging" | "production";
  inputSnapshot?: JsonRecord;
  outputSnapshot?: JsonRecord;
  correlationId?: string | null;
  orgId?: string | null;
  userId?: string | null;
  sourceAgent?: string | null;
  previousSimulationId?: string | null;
}

export interface SimulationResult {
  simulation_id: string;
  mode: SimulationMode;
  target_type: string;
  target_id: string | null;
  risk_class: RiskClass;
  status: SimulationStatus;
  simulation_required: boolean;
  policy_gate_passed: boolean;
  escalation_required: boolean;
  score: number;
  findings: SimulationFinding[];
  recommended_action: "proceed" | "retry_with_fix" | "escalate";
  created_at: string;
}

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function normalizeText(value: unknown) {
  return compact(value).toLowerCase();
}

function normalizeMode(value: unknown): SimulationMode {
  const normalized = normalizeText(value);
  if (normalized === "dry_run") return "dry_run";
  if (normalized === "replay") return "replay";
  return "shadow";
}

function normalizeRiskClass(value: unknown): RiskClass {
  const normalized = normalizeText(value);
  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function normalizeEnvironment(value: unknown): "staging" | "production" {
  return normalizeText(value) === "production" ? "production" : "staging";
}

function isSimulationRequired(riskClass: RiskClass) {
  return riskClass !== "low";
}

function detectExternalAction(snapshot: JsonRecord) {
  const haystack = [
    snapshot.action,
    snapshot.step_key,
    snapshot.target_type,
    snapshot.target,
    snapshot.tool,
    snapshot.tool_id,
    snapshot.channel,
  ].map((v) => normalizeText(v)).join(" ");

  const keywords = [
    "send",
    "email",
    "whatsapp",
    "message",
    "dispatch",
    "payment",
    "stripe",
    "blockchain",
  ];
  return keywords.some((keyword) => haystack.includes(keyword));
}

function buildFindings(input: {
  mode: SimulationMode;
  riskClass: RiskClass;
  targetEnvironment: "staging" | "production";
  inputSnapshot: JsonRecord;
  previousSimulationId?: string | null;
}): SimulationFinding[] {
  const findings: SimulationFinding[] = [];
  const correlationId = compact(input.inputSnapshot.correlation_id);
  const trace = asRecord(input.inputSnapshot.trace);

  if (!correlationId && !compact(trace.correlation_id)) {
    findings.push({
      code: "trace_missing_correlation_id",
      severity: "medium",
      message: "Simulation input has no correlation_id. Traceability is degraded.",
      blocking: false,
      recommendation: "Include correlation_id in task trace envelope.",
    });
  }

  if (
    input.targetEnvironment === "production" &&
    (input.riskClass === "high" || input.riskClass === "critical") &&
    input.mode !== "dry_run"
  ) {
    findings.push({
      code: "production_requires_dry_run",
      severity: "high",
      message: "Production high-risk execution requires dry_run mode simulation.",
      blocking: true,
      recommendation: "Run dry_run simulation before production execution.",
    });
  }

  if (input.mode === "replay" && !compact(input.previousSimulationId)) {
    findings.push({
      code: "replay_missing_previous_simulation",
      severity: "high",
      message: "Replay mode requires previous_simulation_id.",
      blocking: true,
      recommendation: "Provide an existing simulation ID to replay.",
    });
  }

  const hasExternalAction = detectExternalAction(input.inputSnapshot);
  const approvalRequired = input.inputSnapshot.approval_required === true;
  const approvalGranted = input.inputSnapshot.approval_granted === true;
  const approvalId = compact(input.inputSnapshot.approval_id);

  if (hasExternalAction && (input.riskClass === "high" || input.riskClass === "critical")) {
    if (!(approvalGranted || approvalId || approvalRequired)) {
      findings.push({
        code: "external_action_without_approval_gate",
        severity: "high",
        message: "High-risk external action detected without approval gate evidence.",
        blocking: true,
        recommendation: "Create or attach approval_request before execution.",
      });
    }
  }

  const policy = asRecord(input.inputSnapshot.policy);
  if (policy.violation === true) {
    findings.push({
      code: "policy_violation",
      severity: "high",
      message: "Input policy indicates a violation.",
      blocking: true,
      recommendation: "Resolve policy violation before continuing.",
    });
  }

  return findings;
}

function computeScore(findings: SimulationFinding[]) {
  let score = 100;
  for (const finding of findings) {
    if (finding.blocking) {
      score -= 30;
    } else if (finding.severity === "high") {
      score -= 18;
    } else if (finding.severity === "medium") {
      score -= 10;
    } else {
      score -= 4;
    }
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function deriveRecommendation(status: SimulationStatus, escalationRequired: boolean): SimulationResult["recommended_action"] {
  if (status === "passed") return "proceed";
  if (escalationRequired) return "escalate";
  return "retry_with_fix";
}

export async function runSimulation(input: RunSimulationInput): Promise<SimulationResult> {
  const mode = normalizeMode(input.mode);
  const riskClass = normalizeRiskClass(input.riskClass);
  const targetEnvironment = normalizeEnvironment(input.targetEnvironment);
  const inputSnapshot = asRecord(input.inputSnapshot);
  const outputSnapshot = asRecord(input.outputSnapshot);
  const simulationRequired = isSimulationRequired(riskClass);

  const findings = buildFindings({
    mode,
    riskClass,
    targetEnvironment,
    inputSnapshot,
    previousSimulationId: input.previousSimulationId || null,
  });
  const hasBlocking = findings.some((finding) => finding.blocking);
  const status: SimulationStatus = hasBlocking ? "failed" : "passed";
  const policyGatePassed = !simulationRequired || status === "passed";
  const escalationRequired = hasBlocking && (riskClass === "high" || riskClass === "critical");
  const score = computeScore(findings);
  const recommendedAction = deriveRecommendation(status, escalationRequired);

  const { data, error } = await admin
    .from("simulation_runs")
    .insert({
      org_id: compact(input.orgId) || null,
      user_id: compact(input.userId) || null,
      mode,
      target_type: compact(input.targetType),
      target_id: compact(input.targetId) || null,
      workflow_id: compact(input.workflowId) || null,
      risk_class: riskClass,
      target_environment: targetEnvironment,
      status,
      simulation_required: simulationRequired,
      policy_gate_passed: policyGatePassed,
      escalation_required: escalationRequired,
      score,
      findings,
      recommended_action: recommendedAction,
      input_snapshot: inputSnapshot,
      output_snapshot: outputSnapshot,
      correlation_id: compact(input.correlationId) || null,
      source_agent: compact(input.sourceAgent) || null,
      previous_simulation_id: compact(input.previousSimulationId) || null,
    })
    .select("id, created_at")
    .single();

  if (error) throw error;

  return {
    simulation_id: String(data.id),
    mode,
    target_type: compact(input.targetType),
    target_id: compact(input.targetId) || null,
    risk_class: riskClass,
    status,
    simulation_required: simulationRequired,
    policy_gate_passed: policyGatePassed,
    escalation_required: escalationRequired,
    score,
    findings,
    recommended_action: recommendedAction,
    created_at: String(data.created_at),
  };
}

export async function replaySimulation(simulationId: string, sourceAgent?: string | null) {
  const { data, error } = await admin
    .from("simulation_runs")
    .select("*")
    .eq("id", simulationId)
    .single();
  if (error) throw error;

  const replay = await runSimulation({
    mode: "replay",
    targetType: compact(data.target_type),
    targetId: compact(data.target_id) || null,
    workflowId: compact(data.workflow_id) || null,
    riskClass: normalizeRiskClass(data.risk_class),
    targetEnvironment: normalizeEnvironment(data.target_environment),
    inputSnapshot: asRecord(data.input_snapshot),
    outputSnapshot: asRecord(data.output_snapshot),
    correlationId: compact(data.correlation_id) || null,
    orgId: compact(data.org_id) || null,
    userId: compact(data.user_id) || null,
    sourceAgent: compact(sourceAgent) || compact(data.source_agent) || "simulation-engine",
    previousSimulationId: simulationId,
  });

  return replay;
}
