import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { buildDeterministicVariableResolution } from '../../supabase/functions/_shared/variable-runtime-v2.ts'

function percentile95(samples) {
  if (samples.length === 0) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1))
  return Number(sorted[index].toFixed(3))
}

function average(samples) {
  if (samples.length === 0) return 0
  const total = samples.reduce((sum, value) => sum + value, 0)
  return Number((total / samples.length).toFixed(3))
}

function nowMs() {
  return performance.now()
}

function buildGraphBenchmark(nodes) {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const adjacency = {}
  const indegree = {}
  for (const node of nodes) {
    adjacency[node.id] = []
    indegree[node.id] = 0
  }
  for (const node of nodes) {
    const dependencies = Array.isArray(node.depends_on) ? node.depends_on : []
    for (const dependencyId of dependencies) {
      if (!nodeIds.has(dependencyId)) continue
      adjacency[dependencyId].push(node.id)
      indegree[node.id] = (indegree[node.id] || 0) + 1
    }
  }
  const queue = Object.keys(indegree).filter((nodeId) => indegree[nodeId] === 0)
  const topologicalOrder = []
  while (queue.length > 0) {
    const current = queue.shift()
    topologicalOrder.push(current)
    for (const dependentId of adjacency[current] || []) {
      indegree[dependentId] -= 1
      if (indegree[dependentId] === 0) {
        queue.push(dependentId)
      }
    }
  }
  return {
    has_cycle: topologicalOrder.length !== nodes.length,
    topological_order: topologicalOrder,
  }
}

describe('control-plane-v2 performance gates', () => {
  it('meets p95 targets for resolver (1k vars) and plan graph build (150 DAG nodes)', async () => {
    const resolverIterations = 40
    const planIterations = 80

    const definitions = Array.from({ length: 1000 }, (_, index) => ({
      variable_key: `perf.var.${index}`,
      default_value: index,
      validation_rules: { required: true },
      updated_at: '2026-03-14T10:00:00.000Z',
    }))

    const bindings = Array.from({ length: 1000 }, (_, index) => ({
      variable_key: `perf.var.${index}`,
      precedence_level: 'org',
      source_ref: 'perf-benchmark',
      value: index + 1,
      effective_from: null,
      effective_to: null,
      updated_at: '2026-03-14T11:00:00.000Z',
    }))

    const resolverDurations = []
    for (let iteration = 0; iteration < resolverIterations; iteration += 1) {
      const startedAt = nowMs()
      await buildDeterministicVariableResolution({
        definitions,
        bindings,
        workflowId: 'perf-workflow',
        agentId: 'perf-agent',
        nowIso: '2026-03-14T12:00:00.000Z',
      })
      resolverDurations.push(nowMs() - startedAt)
    }

    const taskNodes = Array.from({ length: 150 }, (_, index) => ({
      id: `n-${index + 1}`,
      key: `node-${index + 1}`,
      title: `Node ${index + 1}`,
      step_type: 'task',
      depends_on: index === 0 ? [] : [`n-${index}`],
      agent_id: null,
      workflow_id: null,
      tool_id: `tool-${index + 1}`,
      metadata: {},
    }))

    const planDurations = []
    for (let iteration = 0; iteration < planIterations; iteration += 1) {
      const startedAt = nowMs()
      buildGraphBenchmark(taskNodes)
      planDurations.push(nowMs() - startedAt)
    }

    const resolverP95 = percentile95(resolverDurations)
    const planP95 = percentile95(planDurations)
    const report = {
      generated_at: new Date().toISOString(),
      gates: {
        snapshot_build_p95_target_ms: 120,
        plan_build_p95_target_ms: 220,
      },
      snapshot_build: {
        variables: 1000,
        iterations: resolverIterations,
        p95_ms: resolverP95,
        avg_ms: average(resolverDurations),
      },
      plan_build: {
        dag_nodes: 150,
        iterations: planIterations,
        p95_ms: planP95,
        avg_ms: average(planDurations),
      },
      pass: {
        snapshot_build: resolverP95 < 120,
        plan_build: planP95 < 220,
      },
    }

    const reportDir = path.resolve(process.cwd(), 'docs/runbooks')
    mkdirSync(reportDir, { recursive: true })
    writeFileSync(
      path.join(reportDir, 'control-plane-v2-performance.latest.json'),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    )

    expect(resolverP95).toBeLessThan(120)
    expect(planP95).toBeLessThan(220)
  }, 120000)
})
