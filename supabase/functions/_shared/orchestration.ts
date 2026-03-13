import { executeTriggeredWorkflows } from "./automation.ts";
import { evaluateArtifact, type ImpactLevel } from "./evaluation.ts";
import { compact } from "./http.ts";
import { runSimulation } from "./simulation.ts";
import { admin } from "./supabase.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

export interface JsonRecord {
  [key: string]: unknown;
}

interface EventEnvelopeInput {
  eventType: string;
  payload?: JsonRecord;
  userId?: string | null;
  orgId?: string | null;
  sourceAgent?: string | null;
  pipelineRunId?: string | null;
  stepRunId?: string | null;
  correlationId?: string | null;
  status?: "emitted" | "processing" | "delivered" | "failed" | "dead_lettered";
  metadata?: JsonRecord;
}

interface CreatePipelineRunInput {
  templateCodeName: string;
  goal?: string | null;
  context?: JsonRecord;
  initiatedByUserId?: string | null;
  orgId?: string | null;
  source?: string;
  autoExecute?: boolean;
  authHeader?: string | null;
}

interface ExecutePipelineRunInput {
  pipelineRunId: string;
  authHeader?: string | null;
}

type GoalPriority = "low" | "medium" | "high" | "critical";
type GoalRiskClass = "low" | "medium" | "high" | "critical";

interface PlanGoalInput {
  goal: string;
  context?: JsonRecord;
  userId?: string | null;
  orgId?: string | null;
  source?: string;
  priority?: GoalPriority;
  riskClass?: GoalRiskClass;
  preferredTemplateCodeName?: string | null;
}

interface ExecuteGoalInput {
  goalId: string;
  authHeader?: string | null;
  retryLimit?: number;
  autoReplan?: boolean;
}

interface GoalClassification {
  intent: string;
  templateCodeName: string;
  confidence: number;
  rationale: string;
}

interface GoalRoutingRule {
  intent: string;
  templateCodeName: string;
  keywords: string[];
}

const GOAL_ROUTING_RULES: GoalRoutingRule[] = [
  {
    intent: "lead_discovery",
    templateCodeName: "lead_discovery",
    keywords: ["lead", "prospect", "scan", "atlas", "hunter", "businesses", "clientes", "prospeccion"],
  },
  {
    intent: "sales_outreach",
    templateCodeName: "sales_outreach",
    keywords: ["outreach", "cold", "email", "follow up", "follow-up", "campaign", "whatsapp", "mensaje"],
  },
  {
    intent: "marketing_intelligence",
    templateCodeName: "marketing_intelligence",
    keywords: ["market", "intel", "intelligence", "trend", "signal", "social", "competitor", "brief", "analisis"],
  },
  {
    intent: "self_improvement_patch_cycle",
    templateCodeName: "self_improvement_patch_cycle",
    keywords: ["bug", "patch", "fix", "regression", "incident", "improve", "quality", "rollback"],
  },
];

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function nowIso() {
  return new Date().toISOString();
}

function pickSummary(payload: JsonRecord) {
  return compact(
    payload.summary ||
    payload.message ||
    payload.description ||
    payload.recommendation ||
    payload.goal ||
    payload.step_key,
  ) || "Pipeline context update";
}

function normalizeContext(context: JsonRecord | undefined, templateContext: unknown) {
  return {
    ...asRecord(templateContext),
    ...asRecord(context),
  };
}

async function resolveOrgId(explicitOrgId?: string | null, userId?: string | null) {
  if (compact(explicitOrgId)) return compact(explicitOrgId);
  if (!compact(userId)) return null;

  const { data, error } = await admin
    .from("organization_members")
    .select("org_id")
    .eq("user_id", compact(userId))
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return compact(data?.org_id) || null;
}

function normalizeText(value: unknown) {
  return compact(value).toLowerCase();
}

function normalizeImpactLevel(value: unknown): ImpactLevel {
  const normalized = normalizeText(value);
  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function requiresSimulationGate(risk: ImpactLevel) {
  return risk !== "low";
}

function simulationModeForRisk(risk: ImpactLevel) {
  if (risk === "critical" || risk === "high") return "dry_run" as const;
  return "shadow" as const;
}

function simulationEnvironmentFromContext(context: JsonRecord) {
  const environment = normalizeText(
    asRecord(context.policy).target_environment ||
    context.target_environment ||
    asRecord(context.workflow).target_environment,
  );
  return environment === "production" ? "production" as const : "staging" as const;
}

function priorityToNumber(priority?: GoalPriority) {
  switch (priority) {
    case "critical":
      return 3;
    case "high":
      return 2;
    case "medium":
      return 1;
    default:
      return 0;
  }
}

function classifyGoalFromText(
  goal: string,
  preferredTemplateCodeName?: string | null,
): GoalClassification {
  const normalizedGoal = normalizeText(goal);
  if (compact(preferredTemplateCodeName)) {
    return {
      intent: compact(preferredTemplateCodeName),
      templateCodeName: compact(preferredTemplateCodeName),
      confidence: 1,
      rationale: "Template provided explicitly by caller.",
    };
  }

  let selectedRule = GOAL_ROUTING_RULES[0];
  let bestScore = 0;
  for (const rule of GOAL_ROUTING_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (normalizedGoal.includes(keyword)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      selectedRule = rule;
    }
  }

  const confidence = bestScore === 0 ? 0.45 : Math.min(0.95, 0.55 + (bestScore * 0.1));
  return {
    intent: selectedRule.intent,
    templateCodeName: selectedRule.templateCodeName,
    confidence,
    rationale: bestScore === 0
      ? "No strong keyword match found. Defaulting to lead_discovery."
      : `Matched ${bestScore} routing keyword(s) for intent '${selectedRule.intent}'.`,
  };
}

export function eventMatchesPattern(pattern: string, eventType: string) {
  const normalizedPattern = compact(pattern);
  const normalizedType = compact(eventType);
  if (!normalizedPattern || !normalizedType) return false;
  if (normalizedPattern === normalizedType) return true;
  if (normalizedPattern.endsWith("*")) {
    return normalizedType.startsWith(normalizedPattern.slice(0, -1));
  }
  return false;
}

async function callEdgeFunction(
  functionName: string,
  payload: JsonRecord,
  authHeader?: string | null,
) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Supabase runtime env is not configured");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader || `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : `${functionName} failed (${response.status})`);
  }

  return asRecord(data);
}

export async function emitSystemEvent(input: EventEnvelopeInput) {
  const resolvedOrgId = await resolveOrgId(input.orgId || null, input.userId || null);
  const insertRow = {
    event_type: input.eventType,
    payload: input.payload || {},
    user_id: input.userId || null,
    org_id: resolvedOrgId,
    source_agent: input.sourceAgent || null,
    pipeline_run_id: input.pipelineRunId || null,
    step_run_id: input.stepRunId || null,
    correlation_id: input.correlationId || null,
    status: input.status || "emitted",
    metadata: input.metadata || {},
  };

  const { data, error } = await admin
    .from("event_log")
    .insert(insertRow)
    .select()
    .single();

  if (error) throw error;
  return data as JsonRecord;
}

export async function recordMemoryEntry(input: {
  orgId?: string | null;
  userId?: string | null;
  agentCodeName?: string | null;
  scope: "task" | "shared_ops" | "long_term";
  namespace: string;
  entityType?: string | null;
  entityId?: string | null;
  pipelineRunId?: string | null;
  stepRunId?: string | null;
  correlationId?: string | null;
  summary?: string | null;
  content?: JsonRecord;
  importance?: number;
  expiresAt?: string | null;
}) {
  const resolvedOrgId = await resolveOrgId(input.orgId || null, input.userId || null);
  const { data, error } = await admin
    .from("memory_entries")
    .insert({
      org_id: resolvedOrgId,
      user_id: input.userId || null,
      agent_code_name: input.agentCodeName || null,
      scope: input.scope,
      namespace: input.namespace,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      pipeline_run_id: input.pipelineRunId || null,
      step_run_id: input.stepRunId || null,
      correlation_id: input.correlationId || null,
      summary: compact(input.summary) || null,
      content_json: input.content || {},
      importance: input.importance ?? 50,
      expires_at: input.expiresAt || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as JsonRecord;
}

async function loadPipelineTemplate(templateCodeName: string, orgId?: string | null) {
  if (compact(orgId)) {
    const { data, error } = await admin
      .from("pipeline_templates")
      .select("*")
      .eq("code_name", templateCodeName)
      .eq("org_id", compact(orgId))
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    if (data) return data as JsonRecord;
  }

  const { data, error } = await admin
    .from("pipeline_templates")
    .select("*")
    .eq("code_name", templateCodeName)
    .is("org_id", null)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data as JsonRecord | null;
}

async function loadPipelineTemplateSteps(templateId: string) {
  const { data, error } = await admin
    .from("pipeline_template_steps")
    .select("*")
    .eq("template_id", templateId)
    .order("step_number", { ascending: true });

  if (error) throw error;
  return (data || []) as JsonRecord[];
}

function unwrapStepOutput(value: unknown) {
  const record = asRecord(value);
  if (record.output && typeof record.output === "object" && record.output !== null) {
    return asRecord(record.output);
  }
  return record;
}

function mergeContextWithOutput(
  currentContext: JsonRecord,
  stepKey: string,
  rawOutput: JsonRecord,
) {
  const output = unwrapStepOutput(rawOutput);
  const stepOutputs = {
    ...asRecord(currentContext.step_outputs),
    [stepKey]: output,
  };

  const nextContext: JsonRecord = {
    ...currentContext,
    step_outputs: stepOutputs,
    last_step_key: stepKey,
    last_summary: pickSummary(output),
  };

  if (output.scan && typeof output.scan === "object") {
    const scan = asRecord(output.scan);
    if (compact(scan.id)) nextContext.scan_id = compact(scan.id);
  }

  if (compact(output.scan_id)) nextContext.scan_id = compact(output.scan_id);
  if (output.leads) nextContext.latest_leads = output.leads;
  if (output.shortlist) nextContext.shortlist = output.shortlist;
  if (output.stats) nextContext.stats = output.stats;
  if (output.emails) nextContext.outreach_emails = output.emails;
  if (compact(output.summary)) nextContext.summary = compact(output.summary);
  if (compact(output.recommendation)) nextContext.recommendation = compact(output.recommendation);

  return nextContext;
}

function buildStepPayload(run: JsonRecord, step: JsonRecord, stepRunId: string) {
  const inputMapping = asRecord(step.input_mapping);
  const context = asRecord(run.context);

  return {
    ...context,
    ...inputMapping,
    action: compact(step.action) || "cycle",
    user_id: compact(run.initiated_by_user_id) || null,
    org_id: compact(run.org_id) || null,
    pipeline_run_id: run.id,
    step_run_id: stepRunId,
    correlation_id: compact(run.correlation_id) || null,
    skip_telegram: true,
  };
}

async function updatePipelineRunState(pipelineRunId: string, patch: JsonRecord) {
  const { error } = await admin
    .from("pipeline_run_state")
    .update({
      ...patch,
      updated_at: nowIso(),
    })
    .eq("pipeline_run_id", pipelineRunId);

  if (error) throw error;
}

async function markDeliveryFailed(deliveryId: string, eventId: string, orgId: string | null, payload: JsonRecord, errorMessage: string) {
  await admin
    .from("event_deliveries")
    .update({
      status: "dead_lettered",
      last_error: errorMessage,
      last_attempt_at: nowIso(),
      updated_at: nowIso(),
    })
    .eq("id", deliveryId);

  await admin
    .from("event_dead_letters")
    .insert({
      delivery_id: deliveryId,
      event_id: eventId,
      org_id: orgId,
      reason: errorMessage,
      payload,
    });
}

async function resolveTemplateForGoal(classification: GoalClassification, orgId: string | null) {
  const candidates = [
    classification.templateCodeName,
    "lead_discovery",
    "sales_outreach",
    "marketing_intelligence",
  ].filter(Boolean);
  const seen = new Set<string>();
  const orderedCandidates = candidates.filter((candidate) => {
    const normalized = compact(candidate);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  for (const templateCodeName of orderedCandidates) {
    const template = await loadPipelineTemplate(templateCodeName, orgId);
    if (template) {
      return {
        template,
        templateCodeName,
        fallbackUsed: templateCodeName !== classification.templateCodeName,
      };
    }
  }

  throw new Error(`No active pipeline template found for classified intent '${classification.intent}'`);
}

function normalizeGoalStepType(stepType: string) {
  const normalized = normalizeText(stepType);
  if (normalized === "agent") return "agent";
  if (normalized === "workflow" || normalized === "pipeline") return "pipeline";
  if (normalized === "event") return "decision";
  return "manual";
}

function renderGoalStepTitle(step: JsonRecord) {
  const key = compact(step.step_key);
  if (!key) return `Step ${Number(step.step_number) || 0}`;
  const readable = key.replaceAll("_", " ").trim();
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

async function logSupervisionDecision(input: {
  orgId?: string | null;
  goalId?: string | null;
  stepId?: string | null;
  decisionType: "decompose" | "dispatch" | "evaluate" | "replan" | "escalate" | "complete" | "abort";
  rationale: string;
  inputContext?: JsonRecord;
  outputAction?: JsonRecord;
}) {
  await admin
    .from("supervision_log")
    .insert({
      org_id: compact(input.orgId) || null,
      goal_id: compact(input.goalId) || null,
      step_id: compact(input.stepId) || null,
      decision_type: input.decisionType,
      rationale: input.rationale,
      input_context: input.inputContext || {},
      output_action: input.outputAction || {},
    });
}

function getGoalCorrelationId(goal: JsonRecord) {
  const context = asRecord(goal.context);
  const trace = asRecord(context.trace);
  return compact(trace.correlation_id) || compact(context.correlation_id) || crypto.randomUUID();
}

function inferStepDependencies(
  templateSteps: JsonRecord[],
  templateKeyToGoalStepId: Map<string, string>,
  currentIndex: number,
) {
  const currentTemplateStep = templateSteps[currentIndex];
  const metadata = asRecord(currentTemplateStep?.metadata);
  const declaredDepends = Array.isArray(metadata.depends_on)
    ? metadata.depends_on.map((value) => compact(value)).filter(Boolean)
    : [];

  const dependencies = declaredDepends
    .map((key) => templateKeyToGoalStepId.get(key))
    .filter(Boolean) as string[];

  if (dependencies.length > 0) return dependencies;

  if (currentIndex > 0) {
    const previousStep = templateSteps[currentIndex - 1];
    const previousKey = compact(previousStep?.step_key);
    const previousId = previousKey ? templateKeyToGoalStepId.get(previousKey) : null;
    if (previousId) return [previousId];
  }

  return [];
}

function resolveEscalationTarget(context: JsonRecord) {
  const workflow = asRecord(context.workflow);
  const escalation = asRecord(workflow.escalation_policy);
  return compact(escalation.on_failure) || "agent-copilot";
}

export async function planGoal(input: PlanGoalInput) {
  if (!compact(input.goal)) {
    throw new Error("goal is required for plan_goal");
  }

  const resolvedOrgId = await resolveOrgId(input.orgId || null, input.userId || null);
  const classification = classifyGoalFromText(input.goal, input.preferredTemplateCodeName || null);
  const templateResolution = await resolveTemplateForGoal(classification, resolvedOrgId);
  const template = templateResolution.template;
  const templateSteps = await loadPipelineTemplateSteps(String(template.id));

  if (templateSteps.length === 0) {
    throw new Error(`Pipeline template '${templateResolution.templateCodeName}' has no steps`);
  }

  const correlationId = crypto.randomUUID();
  const mergedContext: JsonRecord = {
    ...asRecord(input.context),
    classification,
    workflow: {
      template_code_name: templateResolution.templateCodeName,
      fallback_used: templateResolution.fallbackUsed,
      source: compact(input.source) || "copilot",
      step_count: templateSteps.length,
      escalation_policy: {
        on_failure: "agent-copilot",
      },
    },
    trace: {
      correlation_id: correlationId,
      source: compact(input.source) || "copilot",
      created_at: nowIso(),
    },
    risk_class: input.riskClass || "medium",
  };

  const { data: goal, error: goalError } = await admin
    .from("goals")
    .insert({
      org_id: resolvedOrgId,
      user_id: input.userId || null,
      title: input.goal.slice(0, 140),
      description: input.goal,
      status: "planning",
      priority: priorityToNumber(input.priority),
      source: compact(input.source) || "copilot",
      context: mergedContext,
      result: {},
    })
    .select()
    .single();

  if (goalError) throw goalError;

  const stepRows = templateSteps.map((templateStep) => {
    const normalizedType = normalizeGoalStepType(compact(templateStep.step_type));
    const templateStepKey = compact(templateStep.step_key) || `step_${Number(templateStep.step_number) || 0}`;
    return {
      goal_id: goal.id,
      org_id: resolvedOrgId,
      step_number: Number(templateStep.step_number) || 0,
      title: renderGoalStepTitle(templateStep),
      description: compact(templateStep.description) ||
        `Execute ${templateStepKey} via ${compact(templateStep.agent_code_name) || compact(templateStep.step_type) || "runtime step"}.`,
      step_type: normalizedType,
      agent_code_name: compact(templateStep.agent_code_name) || null,
      pipeline_template: normalizedType === "pipeline"
        ? templateResolution.templateCodeName
        : null,
      action: compact(templateStep.action) || compact(templateStep.step_key) || null,
      input: {
        template_step_id: compact(templateStep.id),
        template_step_key: templateStepKey,
        template_step_type: compact(templateStep.step_type),
        input_mapping: asRecord(templateStep.input_mapping),
        emits_event: compact(templateStep.emits_event) || null,
        retry_limit: Number(templateStep.retry_limit ?? 1),
        timeout_ms: Number(templateStep.timeout_ms ?? 30000),
        attempt_count: 0,
      },
      status: "pending",
      depends_on: null,
    };
  });

  const { data: insertedSteps, error: stepInsertError } = await admin
    .from("goal_steps")
    .insert(stepRows)
    .select("*")
    .order("step_number", { ascending: true });

  if (stepInsertError) throw stepInsertError;

  const sortedSteps = (insertedSteps || []) as JsonRecord[];
  const templateKeyToGoalStepId = new Map<string, string>();
  for (const step of sortedSteps) {
    const templateStepKey = compact(asRecord(step.input).template_step_key);
    if (templateStepKey) {
      templateKeyToGoalStepId.set(templateStepKey, String(step.id));
    }
  }

  const dependencyMap: Record<string, string[]> = {};
  for (let index = 0; index < sortedSteps.length; index += 1) {
    const step = sortedSteps[index];
    const templateStepKey = compact(asRecord(step.input).template_step_key) || compact(step.step_key) || `step_${index + 1}`;
    const dependencies = inferStepDependencies(templateSteps, templateKeyToGoalStepId, index);
    dependencyMap[templateStepKey] = dependencies;
    if (dependencies.length > 0) {
      const { error: depError } = await admin
        .from("goal_steps")
        .update({ depends_on: dependencies, updated_at: nowIso() })
        .eq("id", step.id);
      if (depError) throw depError;
    }
  }

  await admin
    .from("goals")
    .update({
      context: {
        ...mergedContext,
        dependency_map: dependencyMap,
      },
      updated_at: nowIso(),
    })
    .eq("id", goal.id);

  await logSupervisionDecision({
    orgId: resolvedOrgId,
    goalId: String(goal.id),
    decisionType: "decompose",
    rationale: `Goal classified as '${classification.intent}' and decomposed into ${sortedSteps.length} steps using template '${templateResolution.templateCodeName}'.`,
    inputContext: { goal: input.goal, context: asRecord(input.context) },
    outputAction: {
      classification,
      template_code_name: templateResolution.templateCodeName,
      fallback_used: templateResolution.fallbackUsed,
      step_count: sortedSteps.length,
    },
  });

  await emitSystemEvent({
    eventType: "goal.planned",
    payload: {
      goal_id: goal.id,
      goal_title: goal.title,
      classification,
      template_code_name: templateResolution.templateCodeName,
      step_count: sortedSteps.length,
    },
    userId: compact(goal.user_id) || null,
    orgId: resolvedOrgId,
    sourceAgent: "nexus",
    correlationId,
  });

  const { data: refreshedGoal, error: refreshedGoalError } = await admin
    .from("goals")
    .select("*")
    .eq("id", goal.id)
    .single();

  if (refreshedGoalError) throw refreshedGoalError;

  const { data: refreshedSteps, error: refreshedStepsError } = await admin
    .from("goal_steps")
    .select("*")
    .eq("goal_id", goal.id)
    .order("step_number", { ascending: true });

  if (refreshedStepsError) throw refreshedStepsError;

  return {
    ok: true,
    status: "planned",
    goal: refreshedGoal,
    steps: refreshedSteps || [],
    classification,
  };
}

async function executeGoalStep(input: {
  goal: JsonRecord;
  step: JsonRecord;
  correlationId: string;
  authHeader?: string | null;
}) {
  const goalContext = asRecord(input.goal.context);
  const stepInput = asRecord(input.step.input);
  const resolvedOrgId = compact(input.goal.org_id) || null;
  const userId = compact(input.goal.user_id) || null;
  let pipelineRunId: string | null = null;
  let output: JsonRecord = {};

  if (compact(input.step.step_type) === "agent") {
    const agentCodeName = compact(input.step.agent_code_name);
    if (!agentCodeName) {
      throw new Error(`Goal step ${input.step.id} is missing agent_code_name`);
    }

    output = await callEdgeFunction(
      `agent-${agentCodeName}`,
      {
        ...goalContext,
        ...asRecord(stepInput.input_mapping),
        action: compact(input.step.action) || "cycle",
        user_id: userId,
        org_id: resolvedOrgId,
        goal_id: input.goal.id,
        goal_step_id: input.step.id,
        correlation_id: input.correlationId,
        skip_telegram: true,
      },
      input.authHeader,
    );
  } else if (compact(input.step.step_type) === "pipeline") {
    const templateCodeName = compact(input.step.pipeline_template) ||
      compact(asRecord(goalContext.workflow).template_code_name);
    if (!templateCodeName) {
      throw new Error(`Goal step ${input.step.id} has no pipeline_template`);
    }

    output = asRecord(await createPipelineRun({
      templateCodeName,
      goal: compact(input.goal.description) || compact(input.goal.title) || null,
      context: {
        ...goalContext,
        goal_id: input.goal.id,
        goal_step_id: input.step.id,
        correlation_id: input.correlationId,
      },
      initiatedByUserId: userId,
      orgId: resolvedOrgId,
      source: "goal_executor",
      autoExecute: true,
      authHeader: input.authHeader,
    }));

    pipelineRunId = compact(asRecord(output.pipeline_run).id) || null;
  } else {
    output = {
      ok: false,
      status: "waiting_approval",
      summary: "Manual or decision step requires operator action.",
    };
  }

  return { output, pipelineRunId };
}

export async function executeGoal(input: ExecuteGoalInput) {
  const retryLimit = Math.max(0, Math.min(3, input.retryLimit ?? 1));
  const autoReplan = input.autoReplan !== false;

  const { data: goal, error: goalError } = await admin
    .from("goals")
    .select("*")
    .eq("id", input.goalId)
    .single();

  if (goalError) throw goalError;

  const { data: goalSteps, error: goalStepsError } = await admin
    .from("goal_steps")
    .select("*")
    .eq("goal_id", input.goalId)
    .order("step_number", { ascending: true });

  if (goalStepsError) throw goalStepsError;

  if (!(goalSteps || []).length) {
    throw new Error(`Goal ${input.goalId} has no steps to execute`);
  }

  const correlationId = getGoalCorrelationId(goal as JsonRecord);
  const escalationTarget = resolveEscalationTarget(asRecord(goal.context));
  const goalImpactLevel = normalizeImpactLevel(asRecord(goal.context).risk_class);

  await admin
    .from("goals")
    .update({
      status: "executing",
      started_at: goal.started_at || nowIso(),
      updated_at: nowIso(),
    })
    .eq("id", input.goalId);

  await emitSystemEvent({
    eventType: "goal.started",
    payload: {
      goal_id: goal.id,
      goal_title: goal.title,
      total_steps: (goalSteps || []).length,
    },
    userId: compact(goal.user_id) || null,
    orgId: compact(goal.org_id) || null,
    sourceAgent: "nexus",
    correlationId,
  });

  const completedStepIds = new Set<string>();
  for (const step of (goalSteps || []) as JsonRecord[]) {
    if (compact(step.status) === "completed") {
      completedStepIds.add(String(step.id));
      continue;
    }

    const dependsOn = Array.isArray(step.depends_on)
      ? step.depends_on.map((value) => compact(value)).filter(Boolean)
      : [];
    const blocked = dependsOn.some((dependencyId) => !completedStepIds.has(dependencyId));
    if (blocked) {
      continue;
    }

    let stepSimulation: Awaited<ReturnType<typeof runSimulation>> | null = null;
    if (requiresSimulationGate(goalImpactLevel)) {
      const stepInput = asRecord(step.input);
      const goalContext = asRecord(goal.context);
      stepSimulation = await runSimulation({
        mode: simulationModeForRisk(goalImpactLevel),
        targetType: "goal_step",
        targetId: String(step.id),
        workflowId: compact(asRecord(goalContext.workflow).template_code_name) || null,
        riskClass: goalImpactLevel,
        targetEnvironment: simulationEnvironmentFromContext(goalContext),
        inputSnapshot: {
          goal_id: goal.id,
          goal_step_id: step.id,
          step_number: step.step_number,
          step_key: compact(stepInput.template_step_key) || compact(step.action) || null,
          action: compact(step.action) || null,
          step_type: compact(step.step_type),
          agent_code_name: compact(step.agent_code_name) || null,
          correlation_id: correlationId,
          trace: { correlation_id: correlationId },
          policy: asRecord(goalContext.policy),
          approval_required: stepInput.approval_required === true,
          approval_id: compact(stepInput.approval_id) || null,
          approval_granted: stepInput.approval_granted === true,
          target_environment: simulationEnvironmentFromContext(goalContext),
        },
        correlationId,
        orgId: compact(goal.org_id) || null,
        userId: compact(goal.user_id) || null,
        sourceAgent: compact(step.agent_code_name) || "nexus",
      });

      if (!stepSimulation.policy_gate_passed) {
        await admin
          .from("goal_steps")
          .update({
            status: "waiting_approval",
            output: {
              simulation: stepSimulation,
            },
            error: `Simulation gate blocked: ${stepSimulation.recommended_action}`,
            input: {
              ...stepInput,
              pre_execution_simulation_id: stepSimulation.simulation_id,
              pre_execution_simulation_status: stepSimulation.status,
            },
            updated_at: nowIso(),
          })
          .eq("id", step.id);

        await logSupervisionDecision({
          orgId: compact(goal.org_id) || null,
          goalId: String(goal.id),
          stepId: String(step.id),
          decisionType: "evaluate",
          rationale: `Simulation gate blocked goal step ${step.step_number}.`,
          outputAction: {
            simulation_id: stepSimulation.simulation_id,
            status: stepSimulation.status,
            recommended_action: stepSimulation.recommended_action,
          },
        });

        await admin
          .from("goals")
          .update({
            status: "paused",
            result: {
              step_id: step.id,
              reason: "simulation_gate_blocked",
              simulation: stepSimulation,
            },
            updated_at: nowIso(),
          })
          .eq("id", goal.id);

        await emitSystemEvent({
          eventType: "goal.step.simulation_blocked",
          payload: {
            goal_id: goal.id,
            step_id: step.id,
            step_number: step.step_number,
            simulation: stepSimulation,
          },
          userId: compact(goal.user_id) || null,
          orgId: compact(goal.org_id) || null,
          sourceAgent: "nexus",
          correlationId,
          status: "failed",
        });

        return {
          ok: true,
          status: "waiting_approval",
          goal_id: goal.id,
          step_id: step.id,
          simulation: stepSimulation,
          reason: "simulation_gate_blocked",
        };
      }
    }

    await admin
      .from("goal_steps")
      .update({
        status: "running",
        input: {
          ...asRecord(step.input),
          pre_execution_simulation_id: stepSimulation?.simulation_id || null,
          pre_execution_simulation_status: stepSimulation?.status || null,
        },
        started_at: nowIso(),
        updated_at: nowIso(),
      })
      .eq("id", step.id);

    await logSupervisionDecision({
      orgId: compact(goal.org_id) || null,
      goalId: String(goal.id),
      stepId: String(step.id),
      decisionType: "dispatch",
      rationale: `Dispatching goal step '${compact(step.title) || compact(step.id)}'.`,
      inputContext: { step: { id: step.id, step_type: step.step_type, action: step.action } },
    });

    await emitSystemEvent({
      eventType: "goal.step.started",
      payload: {
        goal_id: goal.id,
        step_id: step.id,
        step_number: step.step_number,
        step_type: step.step_type,
        agent_code_name: step.agent_code_name || null,
      },
      userId: compact(goal.user_id) || null,
      orgId: compact(goal.org_id) || null,
      sourceAgent: compact(step.agent_code_name) || "nexus",
      correlationId,
    });

    let attemptCount = Number(asRecord(step.input).attempt_count || 0);
    let completed = false;

    while (!completed) {
      attemptCount += 1;
      let executionOutput: JsonRecord = {};
      let pipelineRunId: string | null = null;

      try {
        const execution = await executeGoalStep({
          goal: goal as JsonRecord,
          step,
          correlationId,
          authHeader: input.authHeader,
        });
        executionOutput = execution.output;
        pipelineRunId = execution.pipelineRunId;

        const stepEvaluation = await evaluateArtifact({
          artifactType: "goal_step_output",
          artifactId: String(step.id),
          artifactPayload: {
            ...executionOutput,
            goal_id: goal.id,
            goal_step_id: step.id,
            pipeline_run_id: pipelineRunId,
            correlation_id: correlationId,
            step_number: step.step_number,
          },
          impactLevel: goalImpactLevel,
          correlationId,
          orgId: compact(goal.org_id) || null,
          userId: compact(goal.user_id) || null,
          pipelineRunId,
          goalId: String(goal.id),
          goalStepId: String(step.id),
          sourceAgent: compact(step.agent_code_name) || "nexus",
          explanationHint: `Goal step ${step.step_number} completion.`,
        });
        executionOutput = {
          ...executionOutput,
          evaluation: stepEvaluation,
        };

        if (stepEvaluation.decision === "retry") {
          throw new Error(`Evaluation retry: ${stepEvaluation.explanation}`);
        }
        if (stepEvaluation.decision === "reject" || stepEvaluation.decision === "escalate") {
          throw new Error(`Evaluation ${stepEvaluation.decision}: ${stepEvaluation.explanation}`);
        }

        const stepStatus = compact(executionOutput.status) === "waiting_approval"
          ? "waiting_approval"
          : "completed";
        const isAwaitingApproval = stepStatus === "waiting_approval";

        await admin
          .from("goal_steps")
          .update({
            status: stepStatus,
            output: executionOutput,
            pipeline_run_id: pipelineRunId,
            completed_at: isAwaitingApproval ? null : nowIso(),
            input: {
              ...asRecord(step.input),
              attempt_count: attemptCount,
            },
            updated_at: nowIso(),
          })
          .eq("id", step.id);

        await logSupervisionDecision({
          orgId: compact(goal.org_id) || null,
          goalId: String(goal.id),
          stepId: String(step.id),
          decisionType: "evaluate",
          rationale: `Step evaluation passed (${stepEvaluation.overall_score}/100).`,
          outputAction: {
            evaluation_id: stepEvaluation.evaluation_id,
            decision: stepEvaluation.decision,
            overall_score: stepEvaluation.overall_score,
          },
        });

        if (isAwaitingApproval) {
          await admin
            .from("goals")
            .update({
              status: "paused",
              updated_at: nowIso(),
              result: {
                step_id: step.id,
                reason: "waiting_approval",
                summary: compact(executionOutput.summary) || "Manual approval required.",
              },
            })
            .eq("id", goal.id);

          await emitSystemEvent({
            eventType: "goal.waiting_approval",
            payload: {
              goal_id: goal.id,
              step_id: step.id,
              step_number: step.step_number,
              summary: compact(executionOutput.summary) || null,
            },
            userId: compact(goal.user_id) || null,
            orgId: compact(goal.org_id) || null,
            sourceAgent: "nexus",
            correlationId,
          });

          return {
            ok: true,
            status: "waiting_approval",
            goal_id: goal.id,
            step_id: step.id,
            output: executionOutput,
          };
        }

        completedStepIds.add(String(step.id));
        await emitSystemEvent({
          eventType: "goal.step.completed",
          payload: {
            goal_id: goal.id,
            step_id: step.id,
            step_number: step.step_number,
            step_type: step.step_type,
            summary: pickSummary(executionOutput),
            pipeline_run_id: pipelineRunId,
          },
          userId: compact(goal.user_id) || null,
          orgId: compact(goal.org_id) || null,
          sourceAgent: compact(step.agent_code_name) || "nexus",
          correlationId,
        });

        completed = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Goal step failed";
        const failureEvaluation = await evaluateArtifact({
          artifactType: "goal_step_failure",
          artifactId: String(step.id),
          artifactPayload: {
            ok: false,
            status: "failed",
            error: message,
            goal_id: goal.id,
            goal_step_id: step.id,
            correlation_id: correlationId,
            step_number: step.step_number,
            attempt_count: attemptCount,
          },
          impactLevel: goalImpactLevel,
          correlationId,
          orgId: compact(goal.org_id) || null,
          userId: compact(goal.user_id) || null,
          goalId: String(goal.id),
          goalStepId: String(step.id),
          sourceAgent: compact(step.agent_code_name) || "nexus",
          explanationHint: `Goal step ${step.step_number} failed.`,
        }).catch(() => null);

        const evaluationHardBlock = failureEvaluation
          ? (failureEvaluation.decision === "reject" || failureEvaluation.decision === "escalate")
          : false;
        const canRetry = autoReplan && attemptCount <= retryLimit && !evaluationHardBlock;

        await admin
          .from("goal_steps")
          .update({
            status: canRetry ? "pending" : "failed",
            error: message,
            output: {
              error: message,
              evaluation: failureEvaluation,
            },
            input: {
              ...asRecord(step.input),
              attempt_count: attemptCount,
            },
            updated_at: nowIso(),
            completed_at: canRetry ? null : nowIso(),
          })
          .eq("id", step.id);

        if (canRetry) {
          await logSupervisionDecision({
            orgId: compact(goal.org_id) || null,
            goalId: String(goal.id),
            stepId: String(step.id),
            decisionType: "evaluate",
            rationale: `Failure evaluated as retry (${failureEvaluation?.overall_score ?? "n/a"}/100).`,
            outputAction: {
              evaluation_id: failureEvaluation?.evaluation_id || null,
              decision: failureEvaluation?.decision || "retry",
            },
          });

          await logSupervisionDecision({
            orgId: compact(goal.org_id) || null,
            goalId: String(goal.id),
            stepId: String(step.id),
            decisionType: "replan",
            rationale: `Step failed on attempt ${attemptCount}. Scheduling retry.`,
            outputAction: { retry_attempt: attemptCount, error: message },
          });

          await emitSystemEvent({
            eventType: "goal.step.retry_scheduled",
            payload: {
              goal_id: goal.id,
              step_id: step.id,
              step_number: step.step_number,
              attempt_count: attemptCount,
              error: message,
            },
            userId: compact(goal.user_id) || null,
            orgId: compact(goal.org_id) || null,
            sourceAgent: "nexus",
            correlationId,
          });
          continue;
        }

        await admin
          .from("goals")
          .update({
            status: "failed",
            completed_at: nowIso(),
            result: {
              failed_step_id: step.id,
              failed_step_number: step.step_number,
              error: message,
              escalation_target: escalationTarget,
            },
            updated_at: nowIso(),
          })
          .eq("id", goal.id);

        await logSupervisionDecision({
          orgId: compact(goal.org_id) || null,
          goalId: String(goal.id),
          stepId: String(step.id),
          decisionType: "evaluate",
          rationale: `Failure evaluation requires escalation (${failureEvaluation?.decision || "failed"}).`,
          outputAction: {
            evaluation_id: failureEvaluation?.evaluation_id || null,
            decision: failureEvaluation?.decision || "escalate",
            overall_score: failureEvaluation?.overall_score || null,
          },
        });

        await logSupervisionDecision({
          orgId: compact(goal.org_id) || null,
          goalId: String(goal.id),
          stepId: String(step.id),
          decisionType: "escalate",
          rationale: `Step failed after ${attemptCount} attempt(s). Escalating to ${escalationTarget}.`,
          outputAction: {
            escalation_target: escalationTarget,
            error: message,
            evaluation_decision: failureEvaluation?.decision || null,
          },
        });

        await emitSystemEvent({
          eventType: "goal.escalated",
          payload: {
            goal_id: goal.id,
            step_id: step.id,
            step_number: step.step_number,
            error: message,
            escalation_target: escalationTarget,
          },
          userId: compact(goal.user_id) || null,
          orgId: compact(goal.org_id) || null,
          sourceAgent: "nexus",
          correlationId,
          status: "failed",
        });

        await emitSystemEvent({
          eventType: "goal.failed",
          payload: {
            goal_id: goal.id,
            failed_step_id: step.id,
            error: message,
          },
          userId: compact(goal.user_id) || null,
          orgId: compact(goal.org_id) || null,
          sourceAgent: "nexus",
          correlationId,
          status: "failed",
        });

        return {
          ok: false,
          status: "failed",
          goal_id: goal.id,
          failed_step_id: step.id,
          error: message,
          escalation_target: escalationTarget,
        };
      }
    }
  }

  await admin
    .from("goals")
    .update({
      status: "completed",
      completed_at: nowIso(),
      result: {
        completed_steps: completedStepIds.size,
        total_steps: (goalSteps || []).length,
        summary: `Completed goal '${compact(goal.title) || goal.id}'.`,
      },
      updated_at: nowIso(),
    })
    .eq("id", goal.id);

  await logSupervisionDecision({
    orgId: compact(goal.org_id) || null,
    goalId: String(goal.id),
    decisionType: "complete",
    rationale: `Goal completed with ${completedStepIds.size} step(s).`,
  });

  await emitSystemEvent({
    eventType: "goal.completed",
    payload: {
      goal_id: goal.id,
      completed_steps: completedStepIds.size,
      total_steps: (goalSteps || []).length,
    },
    userId: compact(goal.user_id) || null,
    orgId: compact(goal.org_id) || null,
    sourceAgent: "nexus",
    correlationId,
    status: "delivered",
  });

  const { data: refreshedGoal, error: refreshedGoalError } = await admin
    .from("goals")
    .select("*")
    .eq("id", goal.id)
    .single();
  if (refreshedGoalError) throw refreshedGoalError;

  const { data: refreshedSteps, error: refreshedStepsError } = await admin
    .from("goal_steps")
    .select("*")
    .eq("goal_id", goal.id)
    .order("step_number", { ascending: true });
  if (refreshedStepsError) throw refreshedStepsError;

  return {
    ok: true,
    status: "completed",
    goal: refreshedGoal,
    steps: refreshedSteps || [],
  };
}

export async function createPipelineRun(input: CreatePipelineRunInput) {
  const resolvedOrgId = await resolveOrgId(input.orgId || null, input.initiatedByUserId || null);
  const template = await loadPipelineTemplate(input.templateCodeName, resolvedOrgId);

  if (!template) {
    throw new Error(`Unknown pipeline template: ${input.templateCodeName}`);
  }

  const steps = await loadPipelineTemplateSteps(String(template.id));
  const correlationId = crypto.randomUUID();
  const runContext = normalizeContext(input.context, template.default_context);

  const { data: pipelineRun, error: pipelineRunError } = await admin
    .from("pipeline_runs")
    .insert({
      org_id: resolvedOrgId,
      template_id: template.id,
      initiated_by_user_id: input.initiatedByUserId || null,
      source: compact(input.source) || "copilot",
      goal: compact(input.goal) || compact(template.goal_prompt) || null,
      status: input.autoExecute === false ? "queued" : "running",
      current_step_number: 0,
      correlation_id: correlationId,
      context: runContext,
      result: {},
    })
    .select()
    .single();

  if (pipelineRunError) throw pipelineRunError;

  const { error: stateError } = await admin
    .from("pipeline_run_state")
    .insert({
      pipeline_run_id: pipelineRun.id,
      org_id: resolvedOrgId,
      metrics: {
        total_steps: steps.length,
        completed_steps: 0,
      },
    });

  if (stateError) throw stateError;

  await emitSystemEvent({
    eventType: "pipeline.created",
    payload: {
      template_code_name: input.templateCodeName,
      goal: compact(input.goal) || compact(template.goal_prompt),
      total_steps: steps.length,
    },
    userId: input.initiatedByUserId || null,
    orgId: resolvedOrgId,
    sourceAgent: "copilot",
    pipelineRunId: String(pipelineRun.id),
    correlationId,
  });

  if (input.autoExecute === false) {
    return {
      ok: true,
      pipeline_run: pipelineRun,
      template,
      steps,
      auto_executed: false,
    };
  }

  return executePipelineRun({
    pipelineRunId: String(pipelineRun.id),
    authHeader: input.authHeader,
  });
}

export async function executePipelineRun(input: ExecutePipelineRunInput) {
  const { data: pipelineRun, error: pipelineRunError } = await admin
    .from("pipeline_runs")
    .select("*, pipeline_templates(*)")
    .eq("id", input.pipelineRunId)
    .single();

  if (pipelineRunError) throw pipelineRunError;

  const template = asRecord(pipelineRun.pipeline_templates);
  const steps = await loadPipelineTemplateSteps(String(pipelineRun.template_id));
  const resolvedOrgId = compact(pipelineRun.org_id) || null;
  const userId = compact(pipelineRun.initiated_by_user_id) || null;
  let runContext = asRecord(pipelineRun.context);
  const pipelineImpactLevel = normalizeImpactLevel(runContext.risk_class);

  await admin
    .from("pipeline_runs")
    .update({
      status: "running",
      started_at: pipelineRun.started_at || nowIso(),
      updated_at: nowIso(),
    })
    .eq("id", pipelineRun.id);

  await emitSystemEvent({
    eventType: "pipeline.started",
    payload: {
      template_code_name: compact(template.code_name),
      goal: compact(pipelineRun.goal),
    },
    userId,
    orgId: resolvedOrgId,
    sourceAgent: "cortex",
    pipelineRunId: String(pipelineRun.id),
    correlationId: compact(pipelineRun.correlation_id) || null,
  });

  for (const step of steps.filter((candidate) => Number(candidate.step_number) > Number(pipelineRun.current_step_number || 0))) {
    const startedAt = nowIso();
    const currentRun = {
      ...pipelineRun,
      context: runContext,
    };
    const { data: stepRun, error: stepRunError } = await admin
      .from("pipeline_step_runs")
      .insert({
        pipeline_run_id: pipelineRun.id,
        template_step_id: step.id,
        org_id: resolvedOrgId,
        step_number: step.step_number,
        step_key: step.step_key,
        agent_code_name: step.agent_code_name || null,
        action: step.action || null,
        status: "queued",
        input: {},
        attempt_count: 1,
      })
      .select()
      .single();

    if (stepRunError) throw stepRunError;

    const stepPayload = buildStepPayload(currentRun, step, String(stepRun.id));

    let stepSimulation: Awaited<ReturnType<typeof runSimulation>> | null = null;
    if (requiresSimulationGate(pipelineImpactLevel)) {
      stepSimulation = await runSimulation({
        mode: simulationModeForRisk(pipelineImpactLevel),
        targetType: "pipeline_step",
        targetId: String(stepRun.id),
        workflowId: compact(template.code_name) || null,
        riskClass: pipelineImpactLevel,
        targetEnvironment: simulationEnvironmentFromContext(runContext),
        inputSnapshot: {
          pipeline_run_id: pipelineRun.id,
          step_run_id: stepRun.id,
          step_number: step.step_number,
          step_key: compact(step.step_key),
          step_type: compact(step.step_type),
          action: compact(step.action) || null,
          agent_code_name: compact(step.agent_code_name) || null,
          correlation_id: compact(pipelineRun.correlation_id) || null,
          trace: { correlation_id: compact(pipelineRun.correlation_id) || null },
          policy: asRecord(runContext.policy),
          approval_required: false,
          target_environment: simulationEnvironmentFromContext(runContext),
        },
        correlationId: compact(pipelineRun.correlation_id) || null,
        orgId: resolvedOrgId,
        userId,
        sourceAgent: compact(step.agent_code_name) || "cortex",
      });

      if (!stepSimulation.policy_gate_passed) {
        await admin
          .from("pipeline_step_runs")
          .update({
            status: "waiting",
            input: {
              ...stepPayload,
              pre_execution_simulation_id: stepSimulation.simulation_id,
              pre_execution_simulation_status: stepSimulation.status,
            },
            output: { simulation: stepSimulation },
            error: `Simulation gate blocked: ${stepSimulation.recommended_action}`,
            updated_at: nowIso(),
          })
          .eq("id", stepRun.id);

        await admin
          .from("pipeline_runs")
          .update({
            status: "paused",
            last_error: `Simulation gate blocked step ${step.step_number}`,
            updated_at: nowIso(),
          })
          .eq("id", pipelineRun.id);

        await updatePipelineRunState(String(pipelineRun.id), {
          current_agent: compact(step.agent_code_name) || null,
          waiting_for_event: "simulation_gate",
          metrics: {
            total_steps: steps.length,
            blocked_step: step.step_key,
            completed_steps: Math.max(Number(step.step_number) - 1, 0),
          },
        });

        await emitSystemEvent({
          eventType: "pipeline.step.simulation_blocked",
          payload: {
            step_key: step.step_key,
            step_number: step.step_number,
            simulation: stepSimulation,
          },
          userId,
          orgId: resolvedOrgId,
          sourceAgent: "cortex",
          pipelineRunId: String(pipelineRun.id),
          stepRunId: String(stepRun.id),
          correlationId: compact(pipelineRun.correlation_id) || null,
          status: "failed",
        });

        return {
          ok: true,
          pipeline_run_id: pipelineRun.id,
          step_run_id: stepRun.id,
          status: "waiting_approval",
          reason: "simulation_gate_blocked",
          simulation: stepSimulation,
        };
      }
    }

    await admin
      .from("pipeline_step_runs")
      .update({
        status: "running",
        started_at: startedAt,
        input: {
          ...stepPayload,
          pre_execution_simulation_id: stepSimulation?.simulation_id || null,
          pre_execution_simulation_status: stepSimulation?.status || null,
        },
        updated_at: nowIso(),
      })
      .eq("id", stepRun.id);

    await updatePipelineRunState(String(pipelineRun.id), {
      current_agent: compact(step.agent_code_name) || null,
      waiting_for_event: compact(step.emits_event) || null,
      metrics: {
        total_steps: steps.length,
        running_step: step.step_key,
        completed_steps: Math.max(Number(step.step_number) - 1, 0),
      },
    });

    await emitSystemEvent({
      eventType: "pipeline.step.started",
      payload: {
        step_key: step.step_key,
        step_number: step.step_number,
        agent_code_name: step.agent_code_name || null,
      },
      userId,
      orgId: resolvedOrgId,
      sourceAgent: compact(step.agent_code_name) || "cortex",
      pipelineRunId: String(pipelineRun.id),
      stepRunId: String(stepRun.id),
      correlationId: compact(pipelineRun.correlation_id) || null,
    });

    try {
      let output: JsonRecord = {};

      if (step.step_type === "agent") {
        const functionName = compact(step.agent_code_name)
          ? `agent-${compact(step.agent_code_name)}`
          : "";
        if (!functionName) throw new Error(`Pipeline step ${step.step_key} has no agent_code_name`);
        output = await callEdgeFunction(functionName, stepPayload, input.authHeader);
      } else if (step.step_type === "workflow") {
        output = await callEdgeFunction("automation-runner", {
          action: "trigger",
          trigger_key: compact(step.action) || compact(step.step_key),
          context: stepPayload,
          source: "pipeline_run",
          send_live: false,
        }, input.authHeader);
      } else if (step.step_type === "event") {
        const emitted = await emitSystemEvent({
          eventType: compact(step.emits_event) || compact(step.action) || compact(step.step_key),
          payload: stepPayload,
          userId,
          orgId: resolvedOrgId,
          sourceAgent: "cortex",
          pipelineRunId: String(pipelineRun.id),
          stepRunId: String(stepRun.id),
          correlationId: compact(pipelineRun.correlation_id) || null,
        });
        output = { event: emitted };
      } else {
        output = { ok: true, skipped: true };
      }

      runContext = mergeContextWithOutput(runContext, compact(step.step_key), output);

      // Trim output for DB storage — keep summary, not full lead arrays
      const trimmedOutput = { ...output };
      if (Array.isArray(trimmedOutput.leads) && trimmedOutput.leads.length > 5) {
        trimmedOutput.leads_count = trimmedOutput.leads.length;
        trimmedOutput.leads = trimmedOutput.leads.slice(0, 5);
        trimmedOutput._truncated = true;
      }

      const stepEvaluation = await evaluateArtifact({
        artifactType: "pipeline_step_output",
        artifactId: String(stepRun.id),
        artifactPayload: {
          ...trimmedOutput,
          pipeline_run_id: pipelineRun.id,
          step_run_id: stepRun.id,
          step_number: step.step_number,
          step_key: step.step_key,
          correlation_id: compact(pipelineRun.correlation_id) || null,
        },
        impactLevel: pipelineImpactLevel,
        correlationId: compact(pipelineRun.correlation_id) || null,
        orgId: resolvedOrgId,
        userId,
        pipelineRunId: String(pipelineRun.id),
        stepRunId: String(stepRun.id),
        sourceAgent: compact(step.agent_code_name) || "cortex",
        explanationHint: `Pipeline step ${step.step_number} completed.`,
      });
      trimmedOutput.evaluation = stepEvaluation;

      await admin
        .from("pipeline_step_runs")
        .update({
          status: "completed",
          output: trimmedOutput,
          completed_at: nowIso(),
          updated_at: nowIso(),
        })
        .eq("id", stepRun.id);

      await admin
        .from("pipeline_runs")
        .update({
          status: "running",
          current_step_number: step.step_number,
          context: runContext,
          updated_at: nowIso(),
        })
        .eq("id", pipelineRun.id);

      await updatePipelineRunState(String(pipelineRun.id), {
        current_agent: compact(step.agent_code_name) || null,
        waiting_for_event: null,
        metrics: {
          total_steps: steps.length,
          completed_steps: step.step_number,
          last_completed_step: step.step_key,
        },
      });

      // Memory + Events — non-critical, don't kill the pipeline on failure
      try {
        await recordMemoryEntry({
          orgId: resolvedOrgId,
          userId,
          agentCodeName: compact(step.agent_code_name) || "cortex",
          scope: "shared_ops",
          namespace: `pipeline:${compact(template.code_name) || "runtime"}`,
          entityType: "pipeline_run",
          entityId: String(pipelineRun.id),
          pipelineRunId: String(pipelineRun.id),
          stepRunId: String(stepRun.id),
          correlationId: compact(pipelineRun.correlation_id) || null,
          summary: pickSummary(unwrapStepOutput(output)),
          content: { summary: pickSummary(unwrapStepOutput(output)) },
          importance: 60,
        });
      } catch (_memErr) { /* non-critical */ }

      try {
        await emitSystemEvent({
          eventType: "pipeline.step.completed",
          payload: {
            step_key: step.step_key,
            step_number: step.step_number,
            agent_code_name: step.agent_code_name || null,
            result_summary: pickSummary(unwrapStepOutput(output)),
          },
          userId,
          orgId: resolvedOrgId,
          sourceAgent: compact(step.agent_code_name) || "cortex",
          pipelineRunId: String(pipelineRun.id),
          stepRunId: String(stepRun.id),
          correlationId: compact(pipelineRun.correlation_id) || null,
        });

        if (compact(step.emits_event)) {
          await emitSystemEvent({
            eventType: compact(step.emits_event),
            payload: {
              step_key: step.step_key,
              summary: pickSummary(unwrapStepOutput(output)),
            },
            userId,
            orgId: resolvedOrgId,
            sourceAgent: compact(step.agent_code_name) || "cortex",
            pipelineRunId: String(pipelineRun.id),
            stepRunId: String(stepRun.id),
            correlationId: compact(pipelineRun.correlation_id) || null,
          });
        }
      } catch (_evtErr) { /* non-critical */ }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error) || "Pipeline step failed";

      const failureEvaluation = await evaluateArtifact({
        artifactType: "pipeline_step_failure",
        artifactId: String(stepRun.id),
        artifactPayload: {
          ok: false,
          status: "failed",
          error: message,
          pipeline_run_id: pipelineRun.id,
          step_run_id: stepRun.id,
          step_number: step.step_number,
          step_key: step.step_key,
          correlation_id: compact(pipelineRun.correlation_id) || null,
        },
        impactLevel: pipelineImpactLevel,
        correlationId: compact(pipelineRun.correlation_id) || null,
        orgId: resolvedOrgId,
        userId,
        pipelineRunId: String(pipelineRun.id),
        stepRunId: String(stepRun.id),
        sourceAgent: compact(step.agent_code_name) || "cortex",
        explanationHint: `Pipeline step ${step.step_number} failed.`,
      }).catch(() => null);

      await admin
        .from("pipeline_step_runs")
        .update({
          status: "failed",
          error: message,
          output: {
            error: message,
            evaluation: failureEvaluation,
          },
          completed_at: nowIso(),
          updated_at: nowIso(),
        })
        .eq("id", stepRun.id);

      await admin
        .from("pipeline_runs")
        .update({
          status: "failed",
          last_error: failureEvaluation
            ? `${message} [evaluation:${failureEvaluation.decision}]`
            : message,
          updated_at: nowIso(),
        })
        .eq("id", pipelineRun.id);

      await updatePipelineRunState(String(pipelineRun.id), {
        current_agent: compact(step.agent_code_name) || null,
        waiting_for_event: null,
        metrics: {
          total_steps: steps.length,
          failed_step: step.step_key,
          completed_steps: Math.max(Number(step.step_number) - 1, 0),
        },
      });

      await emitSystemEvent({
        eventType: compact(step.agent_code_name)
          ? "agent.error"
          : "pipeline.failed",
        payload: {
          step_key: step.step_key,
          step_number: step.step_number,
          agent_code_name: step.agent_code_name || null,
          error: message,
          evaluation: failureEvaluation,
        },
        userId,
        orgId: resolvedOrgId,
        sourceAgent: compact(step.agent_code_name) || "cortex",
        pipelineRunId: String(pipelineRun.id),
        stepRunId: String(stepRun.id),
        correlationId: compact(pipelineRun.correlation_id) || null,
        status: "failed",
      });

      await emitSystemEvent({
        eventType: "pipeline.failed",
        payload: {
          step_key: step.step_key,
          error: message,
          template_code_name: compact(template.code_name),
          evaluation: failureEvaluation,
        },
        userId,
        orgId: resolvedOrgId,
        sourceAgent: "cortex",
        pipelineRunId: String(pipelineRun.id),
        stepRunId: String(stepRun.id),
        correlationId: compact(pipelineRun.correlation_id) || null,
        status: "failed",
      });

      return {
        ok: false,
        pipeline_run_id: pipelineRun.id,
        status: "failed",
        error: message,
      };
    }
  }

  await admin
    .from("pipeline_runs")
    .update({
      status: "completed",
      result: {
        step_outputs: asRecord(runContext.step_outputs),
        summary: pickSummary(runContext),
      },
      completed_at: nowIso(),
      updated_at: nowIso(),
    })
    .eq("id", pipelineRun.id);

  await updatePipelineRunState(String(pipelineRun.id), {
    current_agent: null,
    waiting_for_event: null,
    metrics: {
      total_steps: steps.length,
      completed_steps: steps.length,
      status: "completed",
    },
  });

  await emitSystemEvent({
    eventType: "pipeline.completed",
    payload: {
      template_code_name: compact(template.code_name),
      total_steps: steps.length,
      summary: pickSummary(runContext),
    },
    userId,
    orgId: resolvedOrgId,
    sourceAgent: "cortex",
    pipelineRunId: String(pipelineRun.id),
    correlationId: compact(pipelineRun.correlation_id) || null,
    status: "delivered",
  });

  const { data: refreshedRun, error: refreshedRunError } = await admin
    .from("pipeline_runs")
    .select("*")
    .eq("id", pipelineRun.id)
    .single();

  if (refreshedRunError) throw refreshedRunError;

  const { data: stepRuns, error: stepRunsError } = await admin
    .from("pipeline_step_runs")
    .select("*")
    .eq("pipeline_run_id", pipelineRun.id)
    .order("step_number", { ascending: true });

  if (stepRunsError) throw stepRunsError;

  return {
    ok: true,
    status: "completed",
    pipeline_run: refreshedRun,
    steps: stepRuns || [],
  };
}

export async function getPipelineRunDetails(pipelineRunId: string) {
  const { data: pipelineRun, error: pipelineRunError } = await admin
    .from("pipeline_runs")
    .select("*, pipeline_templates(*)")
    .eq("id", pipelineRunId)
    .single();

  if (pipelineRunError) throw pipelineRunError;

  const { data: stepRuns, error: stepRunsError } = await admin
    .from("pipeline_step_runs")
    .select("*")
    .eq("pipeline_run_id", pipelineRunId)
    .order("step_number", { ascending: true });

  if (stepRunsError) throw stepRunsError;

  const { data: state, error: stateError } = await admin
    .from("pipeline_run_state")
    .select("*")
    .eq("pipeline_run_id", pipelineRunId)
    .maybeSingle();

  if (stateError) throw stateError;

  return {
    pipeline_run: pipelineRun,
    step_runs: stepRuns || [],
    state: state || null,
  };
}

export async function listRecentPipelineRuns(limit = 20) {
  const { data, error } = await admin
    .from("pipeline_runs")
    .select("*, pipeline_templates(name, code_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function deliverEventToSubscriptions(event: JsonRecord) {
  const eventType = compact(event.event_type);
  if (!eventType) return [];

  const { data, error } = await admin
    .from("event_subscriptions")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const subscriptions = (data || []).filter((subscription) => {
    const sameOrg = !compact(subscription.org_id)
      || compact(subscription.org_id) === compact(event.org_id);
    return sameOrg && eventMatchesPattern(compact(subscription.event_pattern), eventType);
  });

  const results = [];

  for (const subscription of subscriptions) {
    const deliveryPayload = {
      event_type: eventType,
      payload: asRecord(event.payload),
      config: asRecord(subscription.config),
    };

    const { data: delivery, error: deliveryError } = await admin
      .from("event_deliveries")
      .insert({
        subscription_id: subscription.id,
        event_id: event.id,
        org_id: compact(event.org_id) || null,
        target_type: subscription.target_type,
        target_ref: subscription.target_ref,
        payload: deliveryPayload,
      })
      .select()
      .single();

    if (deliveryError) throw deliveryError;

    try {
      const subscriptionConfig = asRecord(subscription.config);
      let result: unknown = null;

      if (subscription.target_type === "agent") {
        const action = compact(subscriptionConfig.action) || "cycle";
        const invokeDirectly = subscription.delivery_mode === "sync" || subscriptionConfig.invoke === true;
        const payload = {
          ...asRecord(event.payload),
          action,
          user_id: compact(event.user_id) || null,
          org_id: compact(event.org_id) || null,
          source_event_id: event.id,
          source_event_type: eventType,
          correlation_id: compact(event.correlation_id) || null,
          skip_telegram: true,
        };

        if (invokeDirectly) {
          result = await callEdgeFunction(`agent-${compact(subscription.target_ref)}`, payload);
        } else {
          const { data: task, error: taskError } = await admin
            .from("agent_tasks")
            .insert({
              agent_code_name: compact(subscription.target_ref),
              type: eventType,
              title: `${eventType} subscription`,
              payload,
              status: "queued",
              created_by: "event_dispatcher",
            })
            .select()
            .single();

          if (taskError) throw taskError;
          result = task;
        }
      } else if (subscription.target_type === "workflow") {
        result = await executeTriggeredWorkflows({
          triggerKey: compact(subscription.target_ref) || eventType,
          userId: compact(event.user_id) || null,
          context: asRecord(event.payload),
          source: "event_subscription",
        });
      } else if (subscription.target_type === "pipeline") {
        result = await createPipelineRun({
          templateCodeName: compact(subscription.target_ref),
          goal: `Event trigger: ${eventType}`,
          context: asRecord(event.payload),
          initiatedByUserId: compact(event.user_id) || null,
          orgId: compact(event.org_id) || null,
          source: "event_subscription",
          autoExecute: subscriptionConfig.auto_execute !== false,
        });
      } else if (subscription.target_type === "webhook") {
        const webhookUrl = compact(subscriptionConfig.webhook_url) || compact(subscription.target_ref);
        if (!webhookUrl) {
          throw new Error(`Missing webhook url for subscription ${subscription.id}`);
        }
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
        result = {
          ok: response.ok,
          status: response.status,
        };
        if (!response.ok) {
          throw new Error(`Webhook failed (${response.status})`);
        }
      }

      const deliveredAt = nowIso();
      await admin
        .from("event_deliveries")
        .update({
          status: "delivered",
          attempt_count: (delivery.attempt_count || 0) + 1,
          last_attempt_at: deliveredAt,
          delivered_at: deliveredAt,
          payload: {
            ...deliveryPayload,
            result,
          },
          updated_at: deliveredAt,
        })
        .eq("id", delivery.id);

      results.push({
        subscription_id: subscription.id,
        event_type: eventType,
        target_type: subscription.target_type,
        target_ref: subscription.target_ref,
        status: "delivered",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Event delivery failed";
      await markDeliveryFailed(
        String(delivery.id),
        String(event.id),
        compact(event.org_id) || null,
        deliveryPayload,
        message,
      );

      results.push({
        subscription_id: subscription.id,
        event_type: eventType,
        target_type: subscription.target_type,
        target_ref: subscription.target_ref,
        status: "dead_lettered",
        error: message,
      });
    }
  }

  return results;
}
