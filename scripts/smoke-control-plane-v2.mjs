#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

function parseEnvContent(content) {
  const parsed = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator <= 0) continue
    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    parsed[key] = value
  }
  return parsed
}

function loadEnvFile(relativePath) {
  const filePath = path.resolve(projectRoot, relativePath)
  if (!existsSync(filePath)) return {}
  return parseEnvContent(readFileSync(filePath, 'utf8'))
}

function randomToken(prefix) {
  const entropy = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${entropy}`
}

function resolveTargets() {
  const envPrimary = loadEnvFile('.env')
  const envDeploy = loadEnvFile('supabase/.env.deploy')
  const candidates = [
    {
      name: 'vpj',
      url: envPrimary.SUPABASE_URL,
      key: envPrimary.SUPABASE_ANON_KEY || envPrimary.SUPABASE_SERVICE_ROLE_KEY,
    },
    {
      name: 'yxz',
      url: envDeploy.SUPABASE_URL,
      key: envDeploy.SUPABASE_SERVICE_ROLE_KEY || envDeploy.SUPABASE_ANON_KEY,
    },
  ].filter((target) => target.url && target.key)

  const deduped = new Map()
  for (const target of candidates) {
    const host = new URL(target.url).host
    if (!deduped.has(host)) {
      deduped.set(host, { ...target, host })
    }
  }
  return Array.from(deduped.values())
}

async function callControlPlane(target, action, body = {}) {
  const response = await fetch(`${target.url}/functions/v1/control-plane`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${target.key}`,
      apikey: target.key,
    },
    body: JSON.stringify({ action, ...body }),
  })
  const json = await response.json().catch(() => ({}))
  return { status: response.status, body: json }
}

async function assertOk(target, action, body = {}) {
  const result = await callControlPlane(target, action, body)
  if (result.status >= 300) {
    const message = result.body?.error || result.body?.message || `HTTP ${result.status}`
    throw new Error(`[${target.name}] ${action} failed: ${message}`)
  }
  return result.body
}

async function runTargetSmoke(target) {
  const requiredKey = randomToken('smoke_required_key')
  const constraintId = randomToken('smoke_required_constraint')

  await assertOk(target, 'variable_registry_upsert', {
    variable_constraint: {
      constraint_id: constraintId,
      expression: { type: 'required', variable_key: requiredKey },
      severity: 'critical',
      fail_mode: 'hard_block',
      is_active: true,
      description: 'Smoke test required variable hard-block',
    },
  })

  let caseMissingRequired
  try {
    const planning = await assertOk(target, 'orchestration_v2_plan', {
      workflow_id: randomToken('smoke_missing_required'),
      source_agent: 'nexus',
      risk_class: 'medium',
      target_environment: 'staging',
      context: {
        target_environment: 'staging',
        estimated_cost: 1,
      },
    })
    const planId = planning.data?.planning?.plan?.plan_id
    const snapshotId = planning.data?.planning?.plan?.snapshot_id
    const execution = await assertOk(target, 'orchestration_v2_execute', {
      plan_id: planId,
      snapshot_id: snapshotId,
    })
    caseMissingRequired = {
      expected: 'blocked_missing_required',
      plan_constraint_status: planning.data?.planning?.constraint_status || null,
      execute_status: execution.data?.execution?.status || null,
      execute_reason: execution.data?.execution?.reason || null,
      pass:
        planning.data?.planning?.constraint_status === 'failed_blocking' &&
        execution.data?.execution?.status === 'blocked' &&
        execution.data?.execution?.reason === 'blocking_violations',
    }
  } finally {
    await assertOk(target, 'variable_registry_upsert', {
      variable_constraint: {
        constraint_id: constraintId,
        expression: { type: 'required', variable_key: requiredKey },
        severity: 'critical',
        fail_mode: 'hard_block',
        is_active: false,
        description: 'Smoke test required variable hard-block (disabled)',
      },
    })
  }

  const mandatoryPlan = await assertOk(target, 'orchestration_v2_plan', {
    workflow_id: randomToken('smoke_mandatory_sim'),
    source_agent: 'nexus',
    risk_class: 'high',
    target_environment: 'production',
    context: {
      target_environment: 'production',
      estimated_cost: 5,
      action: 'send_email',
    },
  })
  const mandatoryPlanId = mandatoryPlan.data?.planning?.plan?.plan_id
  const mandatorySnapshotId = mandatoryPlan.data?.planning?.plan?.snapshot_id
  const mandatoryPreflight = await assertOk(target, 'simulation_preflight', {
    plan_id: mandatoryPlanId,
    risk_class: 'high',
    target_environment: 'production',
    context: {
      target_environment: 'production',
      estimated_cost: 5,
      action: 'send_email',
    },
  })
  const mandatoryExecution = await assertOk(target, 'orchestration_v2_execute', {
    plan_id: mandatoryPlanId,
    snapshot_id: mandatorySnapshotId,
    risk_class: 'high',
    target_environment: 'production',
  })

  const caseMandatorySimulation = {
    expected: 'blocked_failed_mandatory_simulation',
    preflight_status: mandatoryPreflight.data?.preflight?.simulation_status || null,
    execute_status: mandatoryExecution.data?.execution?.status || null,
    execute_reason: mandatoryExecution.data?.execution?.reason || null,
    pass:
      mandatoryPreflight.data?.preflight?.simulation_status === 'failed' &&
      mandatoryExecution.data?.execution?.status === 'blocked' &&
      mandatoryExecution.data?.execution?.reason === 'simulation_blocked',
  }

  const syntheticPlan = await assertOk(target, 'orchestration_v2_plan', {
    workflow_id: randomToken('smoke_synthetic_advisory'),
    source_agent: 'nexus',
    risk_class: 'medium',
    target_environment: 'synthetic',
    run_override: {
      'runtime.execution.max_retries': 7,
    },
    context: {
      target_environment: 'synthetic',
      estimated_cost: 5,
    },
  })
  const syntheticPlanId = syntheticPlan.data?.planning?.plan?.plan_id
  const syntheticSnapshotId = syntheticPlan.data?.planning?.plan?.snapshot_id
  const syntheticExecution = await assertOk(target, 'orchestration_v2_execute', {
    plan_id: syntheticPlanId,
    snapshot_id: syntheticSnapshotId,
    risk_class: 'medium',
    target_environment: 'synthetic',
  })

  const caseSyntheticAdvisory = {
    expected: 'synthetic_advisory_allowed',
    plan_constraint_status: syntheticPlan.data?.planning?.constraint_status || null,
    execute_status: syntheticExecution.data?.execution?.status || null,
    execute_constraint_status: syntheticExecution.data?.execution?.constraint_status || null,
    pass:
      syntheticPlan.data?.planning?.constraint_status === 'failed_advisory' &&
      syntheticExecution.data?.execution?.status === 'completed',
  }

  const variableMetrics = await assertOk(target, 'variable_metrics', { window_hours: 24 })
  const readiness = await assertOk(target, 'ecosystem_readiness', { window_hours: 24 })
  const readinessRecord = (readiness.data?.readiness?.records || [])
    .find((row) => row.module_key === 'variable_control_plane_v2')

  return {
    target: target.name,
    host: target.host,
    cases: {
      missing_required_blocked: caseMissingRequired,
      mandatory_simulation_blocked: caseMandatorySimulation,
      synthetic_advisory_allowed: caseSyntheticAdvisory,
    },
    metrics: variableMetrics.data?.metrics || {},
    readiness: readinessRecord || null,
  }
}

async function main() {
  const targets = resolveTargets()
  if (targets.length === 0) {
    console.error('Missing environment targets (.env and/or supabase/.env.deploy).')
    process.exit(1)
  }

  const runs = []
  for (const target of targets) {
    runs.push(await runTargetSmoke(target))
  }

  const ok = runs.every((run) =>
    Object.values(run.cases).every((testCase) => testCase.pass === true)
  )

  const output = {
    ok,
    generated_at: new Date().toISOString(),
    runs,
  }

  const reportPath = path.resolve(projectRoot, 'docs/runbooks/control-plane-v2-smoke.latest.json')
  writeFileSync(reportPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(output, null, 2))
  if (!ok) process.exit(1)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
