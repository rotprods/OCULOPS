// ═══════════════════════════════════════════════════
// OCULOPS — Execution Module
// Premium Ivory/Gold Design System
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useAppStore } from '../../stores/useAppStore'
import { useTaskStore } from '../../stores/useTaskStore'
import VaultAgentPanel from '../ui/VaultAgentPanel'
import ModuleSkeleton from '../ui/ModuleSkeleton'

function Execution() {
  const { tasks, loading, addTask, updateTask, completionRate, currentDay } = useTasks()
  const defaultTasks = useAppStore(s => s.data.execution.tasks)
  const { filter: filterStatus, setFilter: setFilterStatus } = useTaskStore()
  const [seeding, setSeeding] = useState(false)

  const seedDefaultPlan = async () => {
    setSeeding(true)
    for (const t of defaultTasks) {
      await addTask({ day: t.day, task: t.task, status: t.status || 'pending', gate: t.gate || null })
    }
    setSeeding(false)
  }

  const toggleStatus = async (task) => {
    const next = task.status === 'done' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'done'
    await updateTask(task.id, { status: next })
  }

  const filtered = tasks
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .sort((a, b) => (a.day || 0) - (b.day || 0))

  const statusMap = {
    'done': { icon: '[✓]', color: 'var(--color-info)', label: 'VERIFIED' },
    'in_progress': { icon: '\u25C9', color: 'var(--color-warning)', label: 'ACTIVE' },
    'pending': { icon: '[ ]', color: 'var(--text-tertiary)', label: 'PENDING' }
  }

  if (loading) return <ModuleSkeleton variant="table" rows={5} />

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-base)' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--accent-primary)', margin: 0, fontSize: '24px' }}>Execution Matrix</h1>
          <p className="mono font-bold" style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-tertiary)' }}>30-day plan: 0 to $20K/mo. Select a task to update status.</p>
        </div>
      </div>

      {/* ── Progress KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border-subtle)', border: '1px solid var(--border-default)', marginBottom: '24px' }}>
        <div style={{ background: 'var(--surface-raised)', padding: '16px' }}>
          <div className="mono text-2xs font-bold" style={{ marginBottom: '8px', color: 'var(--text-tertiary)' }}>Current Day</div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>Day {currentDay}</div>
        </div>
        <div style={{ background: 'var(--surface-raised)', padding: '16px' }}>
          <div className="mono text-2xs font-bold" style={{ marginBottom: '8px', color: 'var(--text-tertiary)' }}>Completion</div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: 'var(--color-success)' }}>{completionRate}%</div>
        </div>
        <div style={{ background: 'var(--surface-raised)', padding: '16px' }}>
          <div className="mono text-2xs font-bold" style={{ marginBottom: '8px', color: 'var(--text-tertiary)' }}>In Progress</div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: 'var(--color-warning)' }}>{tasks.filter(t => t.status === 'in_progress').length}</div>
        </div>
      </div>

      {/* ── MAIN POOL ── */}
      <div style={{ flex: 1, border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '16px', background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="mono text-xs font-bold" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-primary)' }}>Tasks</span>
            <span style={{ color: 'var(--text-tertiary)' }}>Filter by status</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'in_progress', 'done'].map(f => (
              <button
                key={f}
                className="btn btn-ghost mono text-2xs font-bold"
                style={{
                  padding: '6px 12px',
                  background: filterStatus === f ? 'var(--accent-primary)' : 'transparent',
                  color: filterStatus === f ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                  border: filterStatus === f ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  borderRadius: 0
                }}
                onClick={() => setFilterStatus(f)}
              >
                {f === 'all' ? 'All' : statusMap[f].label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'var(--surface-inset)', height: '1px', width: '100%' }}>
          <div style={{ width: `${completionRate}%`, height: '1px', background: 'var(--accent-primary)', boxShadow: '0 0 5px var(--accent-primary)' }} />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-subtle)' }}>
          {tasks.length === 0 && !loading ? (
            <div style={{ height: '100%', background: 'var(--surface-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px' }}>
              <div className="mono font-bold" style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--color-danger)' }}>ERR: [ NULL POINTER EXCEPTION ]</div>
              <h3 className="mono font-bold" style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '8px' }}>EXECUTION MATRIX UNINITIALIZED</h3>
              <p className="mono font-bold" style={{ fontSize: '10px', marginBottom: '32px' }}>AWAITING ROOT PROTOCOL INJECTION (0 TO 20K PLAN).</p>
              <button className="btn btn-ghost mono font-bold" style={{ border: '1px solid var(--accent-primary)', background: 'var(--accent-primary)', color: 'var(--text-primary)', padding: '12px 24px', borderRadius: 0 }} onClick={seedDefaultPlan} disabled={seeding}>
                {seeding ? './inject --force ...' : 'sudo ./initialize_protocol.sh'}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', background: 'var(--surface-inset)', color: 'var(--text-tertiary)', flex: 1 }} className="mono text-xs font-bold">
              grep: no matches found in current context
            </div>
          ) : (
            filtered.map((task, index) => {
              const isDone = task.status === 'done'
              const sm = statusMap[task.status] || statusMap['pending']

              return (
                <div
                  key={task.id}
                  onClick={() => toggleStatus(task)}
                  className="mono"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px',
                    background: isDone ? 'rgba(0,0,0,0.8)' : 'var(--surface-inset)',
                    borderLeft: `2px solid ${isDone ? 'transparent' : sm.color}`,
                    cursor: 'pointer', transition: 'all 0.1s',
                    opacity: isDone ? 0.5 : 1
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', width: '24px', textAlign: 'right' }}>{(index + 1).toString().padStart(3, '0')}</span>
                  <span style={{ fontSize: '11px', color: sm.color, width: '32px', flexShrink: 0, fontWeight: 'bold' }}>{sm.icon}</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', width: '32px', flexShrink: 0, fontWeight: 'bold' }}>D{String(task.day).padStart(2, '0')}</span>
                  <span style={{ flex: 1, color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {task.task || task.title}
                  </span>
                  {task.gate && (
                    <span style={{ fontSize: '9px', padding: '2px 6px', background: 'var(--surface-raised)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)', textTransform: 'uppercase', fontWeight: 'bold' }}>GATE: {task.gate}</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <VaultAgentPanel title="EXECUTION INTELLIGENCE" namespaces={['orchestration', 'product']} />
      </div>

    </div>
  )
}

export default Execution
