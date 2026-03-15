import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const out = {}
  const content = readFileSync(filePath, 'utf8')
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
    out[key] = value
  }
  return out
}

function loadTargets() {
  const projectRoot = process.cwd()
  const envPrimary = parseEnvFile(path.resolve(projectRoot, '.env'))
  const envDeploy = parseEnvFile(path.resolve(projectRoot, 'supabase/.env.deploy'))

  const rawTargets = [
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
  for (const target of rawTargets) {
    const host = new URL(target.url).host
    if (!deduped.has(host)) {
      deduped.set(host, { ...target, host })
    }
  }
  return Array.from(deduped.values())
}

async function callControlPlane(target, action, payload = {}) {
  const response = await fetch(`${target.url}/functions/v1/control-plane`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${target.key}`,
      apikey: target.key,
    },
    body: JSON.stringify({ action, ...payload }),
  })

  let body = {}
  try {
    body = await response.json()
  } catch {
    body = {}
  }

  if (!response.ok) {
    const message = body?.error || body?.message || `HTTP ${response.status}`
    throw new Error(`[${target.name}] ${action} failed: ${message}`)
  }
  return body
}

function randomToken(prefix) {
  const entropy = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${entropy}`
}

async function disableTransientRequiredConstraints(target) {
  const registry = await callControlPlane(target, 'variable_registry_list', {})
  const constraints = registry?.data?.registry?.constraints || []
  const transientConstraints = constraints.filter((constraint) => {
    const description = String(constraint?.description || '')
    return description.includes('Integration test required-variable hard block') && constraint?.is_active === true
  })

  for (const constraint of transientConstraints) {
    await callControlPlane(target, 'variable_registry_upsert', {
      variable_constraint: {
        constraint_id: constraint.constraint_id,
        expression: constraint.expression,
        severity: constraint.severity,
        fail_mode: constraint.fail_mode,
        is_active: false,
        description: 'Integration test required-variable hard block (disabled)',
      },
    })
  }
}

const targets = loadTargets()
const suite = targets.length > 0 ? describe : describe.skip

suite('control-plane-v2 integration acceptance', () => {
  it.each(targets)('blocks when required variable constraint is missing (%s)', async (target) => {
    const requiredKey = randomToken('it_required_key')
    const constraintId = randomToken('it_required_constraint')

    await callControlPlane(target, 'variable_registry_upsert', {
      variable_constraint: {
        constraint_id: constraintId,
        expression: {
          type: 'required',
          variable_key: requiredKey,
        },
        severity: 'critical',
        fail_mode: 'hard_block',
        is_active: true,
        description: 'Integration test required-variable hard block',
      },
    })

    try {
      const snapshotBuild = await callControlPlane(target, 'variable_snapshot_build', {
        workflow_id: randomToken('it_required_workflow'),
        source_agent: 'nexus',
        risk_class: 'medium',
        context: {
          target_environment: 'staging',
          estimated_cost: 1,
        },
      })

      expect(snapshotBuild.data.constraint_status).toBe('failed_blocking')
      expect(snapshotBuild.data.violation_count).toBeGreaterThan(0)

      const planning = await callControlPlane(target, 'orchestration_v2_plan', {
        workflow_id: randomToken('it_required_plan'),
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
      expect(planId).toBeTruthy()
      expect(snapshotId).toBeTruthy()

      const execution = await callControlPlane(target, 'orchestration_v2_execute', {
        plan_id: planId,
        snapshot_id: snapshotId,
      })

      expect(execution.data.execution.status).toBe('blocked')
      expect(execution.data.execution.reason).toBe('blocking_violations')
    } finally {
      await callControlPlane(target, 'variable_registry_upsert', {
        variable_constraint: {
          constraint_id: constraintId,
          expression: {
            type: 'required',
            variable_key: requiredKey,
          },
          severity: 'critical',
          fail_mode: 'hard_block',
          is_active: false,
          description: 'Integration test required-variable hard block (disabled)',
        },
      })
    }
  }, 120000)

  it.each(targets)('blocks on failed mandatory production simulation (%s)', async (target) => {
    await disableTransientRequiredConstraints(target)

    const workflowId = randomToken('it_mandatory_sim')
    const planning = await callControlPlane(target, 'orchestration_v2_plan', {
      workflow_id: workflowId,
      source_agent: 'nexus',
      risk_class: 'high',
      target_environment: 'production',
      context: {
        target_environment: 'production',
        estimated_cost: 5,
        action: 'send_email',
      },
    })

    const planId = planning.data?.planning?.plan?.plan_id
    const snapshotId = planning.data?.planning?.plan?.snapshot_id
    expect(planId).toBeTruthy()
    expect(snapshotId).toBeTruthy()

    const preflight = await callControlPlane(target, 'simulation_preflight', {
      plan_id: planId,
      risk_class: 'high',
      target_environment: 'production',
      context: {
        target_environment: 'production',
        estimated_cost: 5,
        action: 'send_email',
      },
    })

    expect(preflight.data.preflight.simulation_status).toBe('failed')
    expect(preflight.data.preflight.simulation_required).toBe(true)
    expect(preflight.data.preflight.simulation_mandatory).toBe(true)

    const execution = await callControlPlane(target, 'orchestration_v2_execute', {
      plan_id: planId,
      snapshot_id: snapshotId,
      risk_class: 'high',
      target_environment: 'production',
    })

    expect(execution.data.execution.status).toBe('blocked')
    expect(execution.data.execution.reason).toBe('simulation_blocked')
  }, 120000)

  it.each(targets)('allows synthetic advisory path (%s)', async (target) => {
    const workflowId = randomToken('it_synthetic_advisory')
    const planning = await callControlPlane(target, 'orchestration_v2_plan', {
      workflow_id: workflowId,
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

    const planId = planning.data?.planning?.plan?.plan_id
    const snapshotId = planning.data?.planning?.plan?.snapshot_id
    expect(planId).toBeTruthy()
    expect(snapshotId).toBeTruthy()
    expect(planning.data?.planning?.constraint_status).toBe('failed_advisory')

    const execution = await callControlPlane(target, 'orchestration_v2_execute', {
      plan_id: planId,
      snapshot_id: snapshotId,
      risk_class: 'medium',
      target_environment: 'synthetic',
    })

    expect(execution.data.execution.status).toBe('completed')
    expect(execution.data.execution.constraint_status).toBe('failed_advisory')
  }, 120000)
})
