import { compact } from "./http.ts";
import { admin } from "./supabase.ts";

export interface JsonRecord {
  [key: string]: unknown;
}

export type GovernanceDecision = "allow" | "soft_block" | "hard_block" | "escalate";
export type GovernanceSeverity = "low" | "medium" | "high" | "critical";

export interface GovernanceCheckInput {
  targetType: "goal" | "pipeline" | "pipeline_step" | "agent_action";
  targetId?: string | null;
  targetRef?: string | null;
  orgId?: string | null;
  userId?: string | null;
  sourceAgent?: string | null;
  source?: string | null;
  riskClass?: GovernanceSeverity | null;
  context?: JsonRecord;
  plannedStepCount?: number;
}

export interface GovernanceCheckResult {
  allowed: boolean;
  decision: GovernanceDecision;
  reason: string;
  risk_class: GovernanceSeverity;
  matched_kill_switches: JsonRecord[];
  matched_guardrails: JsonRecord[];
  matched_policies: JsonRecord[];
  recommendations: string[];
}

export interface GovernanceEscalationInput {
  orgId?: string | null;
  title: string;
  description: string;
  severity?: GovernanceSeverity;
  category?: "operational" | "financial" | "compliance" | "reputational" | "security" | "agent";
  sourceAgent?: string | null;
  incidentId?: string | null;
  metadata?: JsonRecord;
}

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value: unknown) {
  return compact(value).toLowerCase();
}

function normalizeRiskClass(value: unknown): GovernanceSeverity {
  const normalized = normalizeText(value);
  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function riskRank(risk: GovernanceSeverity) {
  switch (risk) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function appliesToTarget(appliesTo: unknown, targetType: string) {
  const entries = asArray(appliesTo).map((item) => normalizeText(item));
  if (entries.length === 0) return true;
  return entries.includes("all") || entries.includes(normalizeText(targetType));
}

async function loadActiveKillSwitches(orgId: string) {
  const { data, error } = await admin
    .from("kill_switches")
    .select("id, target_type, target_id, reason, activated_at")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("activated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as JsonRecord[];
}

async function loadActiveGuardrails(orgId: string) {
  const { data, error } = await admin
    .from("guardrails")
    .select("id, code_name, type, config, applies_to, is_active")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as JsonRecord[];
}

async function loadActivePolicies(orgId: string) {
  const { data, error } = await admin
    .from("governance_policies")
    .select("id, code_name, category, enforcement, rules, applies_to, is_active")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as JsonRecord[];
}

async function countRecentRuns(orgId: string, targetType: "goal" | "pipeline", windowMinutes: number) {
  const minWindow = Math.max(1, Math.min(240, Number(windowMinutes || 60)));
  const sinceIso = new Date(Date.now() - (minWindow * 60_000)).toISOString();
  if (targetType === "goal") {
    const { count, error } = await admin
      .from("goals")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", sinceIso);
    if (error) throw error;
    return Number(count || 0);
  }

  const { count, error } = await admin
    .from("pipeline_runs")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gte("created_at", sinceIso);
  if (error) throw error;
  return Number(count || 0);
}

function matchesKillSwitch(input: GovernanceCheckInput, row: JsonRecord) {
  const targetType = normalizeText(row.target_type);
  const targetId = compact(row.target_id);
  if (targetType === "all") return true;
  if (targetType === "automation" && input.targetType === "pipeline") return true;
  if (targetType === "agent") {
    if (!targetId) return true;
    return targetId === compact(input.targetRef) || targetId === compact(input.sourceAgent);
  }
  if (targetType === normalizeText(input.targetType)) {
    if (!targetId) return true;
    return targetId === compact(input.targetId) || targetId === compact(input.targetRef);
  }
  return false;
}

function evaluatePolicyRules(input: GovernanceCheckInput, policy: JsonRecord, riskClass: GovernanceSeverity) {
  if (!appliesToTarget(policy.applies_to, input.targetType)) return null;
  const rules = asArray(policy.rules).map((rule) => asRecord(rule));
  if (rules.length === 0) return null;

  for (const rule of rules) {
    const kind = normalizeText(rule.kind || rule.type);
    if (kind === "risk_max") {
      const maxRisk = normalizeRiskClass(rule.value || rule.max || "low");
      if (riskRank(riskClass) > riskRank(maxRisk)) {
        return {
          id: policy.id,
          code_name: policy.code_name,
          enforcement: policy.enforcement,
          reason: `Risk '${riskClass}' exceeds max '${maxRisk}'`,
        };
      }
    }
    if (kind === "require_approval_above") {
      const threshold = normalizeRiskClass(rule.value || "medium");
      const approvalGranted = asRecord(input.context?.policy).approval_granted === true;
      if (riskRank(riskClass) > riskRank(threshold) && !approvalGranted) {
        return {
          id: policy.id,
          code_name: policy.code_name,
          enforcement: policy.enforcement,
          reason: `Approval required for risk above '${threshold}'`,
        };
      }
    }
    if (kind === "deny_source") {
      const deniedSource = normalizeText(rule.value);
      if (deniedSource && deniedSource === normalizeText(input.source)) {
        return {
          id: policy.id,
          code_name: policy.code_name,
          enforcement: policy.enforcement,
          reason: `Source '${input.source}' is denied by governance policy`,
        };
      }
    }
  }
  return null;
}

function evaluateGuardrail(
  input: GovernanceCheckInput,
  guardrail: JsonRecord,
  riskClass: GovernanceSeverity,
  recentRuns: number,
) {
  if (!appliesToTarget(guardrail.applies_to, input.targetType)) return null;
  const type = normalizeText(guardrail.type);
  const config = asRecord(guardrail.config);

  if (type === "approval_required") {
    const threshold = normalizeRiskClass(config.risk_threshold || "medium");
    const approvalGranted = asRecord(input.context?.policy).approval_granted === true;
    if (riskRank(riskClass) > riskRank(threshold) && !approvalGranted) {
      return {
        id: guardrail.id,
        code_name: guardrail.code_name,
        type,
        reason: `Approval required for risk '${riskClass}' by guardrail '${compact(guardrail.code_name)}'.`,
      };
    }
  }

  if (type === "budget_limit") {
    const maxSteps = Number(config.max_steps_per_run || 0);
    if (maxSteps > 0 && Number(input.plannedStepCount || 0) > maxSteps) {
      return {
        id: guardrail.id,
        code_name: guardrail.code_name,
        type,
        reason: `Planned steps (${input.plannedStepCount}) exceed limit (${maxSteps}).`,
      };
    }
  }

  if (type === "rate_limit") {
    const maxRuns = Number(config.max_runs_per_window || config.max_runs_per_hour || 0);
    if (maxRuns > 0 && recentRuns >= maxRuns) {
      return {
        id: guardrail.id,
        code_name: guardrail.code_name,
        type,
        reason: `Run rate limit reached (${recentRuns}/${maxRuns}).`,
      };
    }
  }

  if (type === "scope_restriction") {
    const deniedTemplates = asArray(config.denied_templates).map((entry) => normalizeText(entry));
    const templateCode = normalizeText(asRecord(input.context?.workflow).template_code_name || input.targetRef);
    if (templateCode && deniedTemplates.includes(templateCode)) {
      return {
        id: guardrail.id,
        code_name: guardrail.code_name,
        type,
        reason: `Template '${templateCode}' blocked by scope restriction.`,
      };
    }
  }

  return null;
}

export async function evaluateGovernanceGate(input: GovernanceCheckInput): Promise<GovernanceCheckResult> {
  const orgId = compact(input.orgId) || null;
  const riskClass = normalizeRiskClass(input.riskClass || asRecord(input.context).risk_class);

  const baseResult: GovernanceCheckResult = {
    allowed: true,
    decision: "allow",
    reason: "No governance restrictions matched.",
    risk_class: riskClass,
    matched_kill_switches: [],
    matched_guardrails: [],
    matched_policies: [],
    recommendations: [],
  };

  if (!orgId) {
    return {
      ...baseResult,
      recommendations: ["No org scope provided; governance checks executed in advisory mode only."],
    };
  }

  try {
    const [killSwitches, guardrails, policies, recentRuns] = await Promise.all([
      loadActiveKillSwitches(orgId),
      loadActiveGuardrails(orgId),
      loadActivePolicies(orgId),
      countRecentRuns(orgId, input.targetType === "goal" ? "goal" : "pipeline", 60),
    ]);

    const matchedKillSwitches = killSwitches.filter((row) => matchesKillSwitch(input, row));
    if (matchedKillSwitches.length > 0) {
      return {
        ...baseResult,
        allowed: false,
        decision: "hard_block",
        reason: compact(matchedKillSwitches[0].reason) || "Kill switch is active for this target.",
        matched_kill_switches: matchedKillSwitches,
        recommendations: ["Deactivate or scope kill switch to resume execution."],
      };
    }

    const matchedGuardrails = guardrails
      .map((guardrail) => evaluateGuardrail(input, guardrail, riskClass, recentRuns))
      .filter(Boolean) as JsonRecord[];
    const matchedPolicies = policies
      .map((policy) => evaluatePolicyRules(input, policy, riskClass))
      .filter(Boolean) as JsonRecord[];

    if (matchedGuardrails.length === 0 && matchedPolicies.length === 0) {
      return baseResult;
    }

    const hasHardPolicy = matchedPolicies.some((entry) => normalizeText(entry.enforcement) === "hard_block");
    if (hasHardPolicy) {
      return {
        ...baseResult,
        allowed: false,
        decision: "hard_block",
        reason: compact(matchedPolicies[0].reason) || "Blocked by governance policy.",
        matched_guardrails: matchedGuardrails,
        matched_policies: matchedPolicies,
        recommendations: ["Adjust policy rules or lower risk profile before retry."],
      };
    }

    const shouldEscalate = riskClass === "high" || riskClass === "critical";
    return {
      ...baseResult,
      allowed: false,
      decision: shouldEscalate ? "escalate" : "soft_block",
      reason: compact(matchedGuardrails[0]?.reason) || compact(matchedPolicies[0]?.reason) || "Governance gate requires review.",
      matched_guardrails: matchedGuardrails,
      matched_policies: matchedPolicies,
      recommendations: shouldEscalate
        ? ["Escalate to operator/governor for explicit approval."]
        : ["Review guardrail/policy and retry."],
    };
  } catch {
    return {
      ...baseResult,
      recommendations: ["Governance tables unavailable; gate executed in fail-open mode."],
    };
  }
}

export async function createGovernanceEscalation(input: GovernanceEscalationInput) {
  const orgId = compact(input.orgId) || null;
  if (!orgId) {
    return {
      created: false,
      risk_case_id: null,
      reason: "org_id missing; escalation persisted only in runtime response.",
    };
  }

  try {
    const { data, error } = await admin
      .from("risk_cases")
      .insert({
        org_id: orgId,
        title: input.title,
        description: input.description,
        category: input.category || "operational",
        severity: input.severity || "high",
        probability: "possible",
        status: "identified",
        source_agent: compact(input.sourceAgent) || null,
        incident_id: compact(input.incidentId) || null,
        metadata: input.metadata || {},
      })
      .select("id, status, severity, created_at")
      .single();

    if (error) throw error;
    return {
      created: true,
      risk_case_id: compact(data?.id) || null,
      record: data || null,
    };
  } catch {
    return {
      created: false,
      risk_case_id: null,
      reason: "risk_cases insert failed",
    };
  }
}
