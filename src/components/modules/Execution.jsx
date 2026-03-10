// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Execution Module
// 100-Year UX: rigorous objective pipeline
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useAppStore } from '../../stores/useAppStore'
import { useTaskStore } from '../../stores/useTaskStore'

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
    'done': { icon: '[✓]', color: 'var(--color-success)', label: 'VERIFIED' },
    'in_progress': { icon: '[///]', color: 'var(--color-warning)', label: 'ACTIVE' },
    'pending': { icon: '[ ]', color: 'var(--text-tertiary)', label: 'PENDING' }
  }

  if (loading) return <div className="fade-in mono text-xs" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-primary)' }}>/// ACCESSING EXECUTION MATRIX...</div>

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0, fontSize: '28px' }}>EXECUTION OS</h1>
          <p className="mono text-xs text-tertiary" style={{ marginTop: '8px' }}>30-DAY ESCALATION PROTOCOL: 0 TO $20K/MO. SELECT DIRECTIVE TO UPDATE STATUS.</p>
        </div>
      </div>

      {/* ── Progress KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <div style={{ background: '#000', padding: '16px' }}>
          <div className="mono text-2xs text-tertiary" style={{ marginBottom: '8px' }}>CURRENT VECTOR</div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: 'var(--color-primary)' }}>DAY {currentDay}</div>
        </div>
        <div style={{ background: '#000', padding: '16px' }}>
          <div className="mono text-2xs text-tertiary" style={{ marginBottom: '8px' }}>COMPLETION TRAJECTORY</div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: 'var(--color-success)' }}>{completionRate}%</div>
        </div>
        <div style={{ background: '#000', padding: '16px' }}>
          <div className="mono text-2xs text-tertiary" style={{ marginBottom: '8px' }}>ACTIVE PARALLEL PROCESSES</div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: 'var(--color-warning)' }}>{tasks.filter(t => t.status === 'in_progress').length}</div>
        </div>
      </div>

      {/* ── MAIN POOL ── */}
      <div style={{ flex: 1, border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="mono text-xs font-bold" style={{ color: 'var(--color-primary)' }}>/// DIRECTIVE MATRIX ({filtered.length} LOGGED)</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'in_progress', 'done'].map(f => (
              <button
                key={f}
                className="btn btn-ghost mono text-2xs"
                style={{
                  padding: '6px 12px',
                  background: filterStatus === f ? 'var(--color-primary)' : 'transparent',
                  color: filterStatus === f ? '#000' : 'var(--text-secondary)',
                  border: filterStatus === f ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)'
                }}
                onClick={() => setFilterStatus(f)}
              >
                {f === 'all' ? 'ALL' : statusMap[f].label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#000', height: '2px', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ width: `${completionRate}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.5s ease' }} />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.length === 0 && !loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: '24px', marginBottom: '16px' }}>[ NULL POINTER ]</div>
              <h3 className="mono font-bold text-sm" style={{ color: 'var(--color-primary)', marginBottom: '8px' }}>EXECUTION MATRIX UNINITIALIZED</h3>
              <p className="mono text-xs" style={{ marginBottom: '24px' }}>AWAITING PROTOCOL INJECTION (0 TO 20K PLAN).</p>
              <button className="btn btn-ghost mono" style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '16px' }} onClick={seedDefaultPlan} disabled={seeding}>
                {seeding ? '[ INJECTING... ]' : '[ INITIALIZE PROTOCOL ]'}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)' }} className="mono text-xs">
              [ NO DIRECTIVES FOUND IN CURRENT CONTEXT ]
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.map(task => {
                const isDone = task.status === 'done'
                const sm = statusMap[task.status] || statusMap['pending']

                return (
                  <div
                    key={task.id}
                    onClick={() => toggleStatus(task)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px',
                      background: isDone ? 'rgba(0,0,0,0.5)' : '#000',
                      border: `1px solid ${isDone ? 'var(--border-subtle)' : 'var(--border-default)'}`,
                      borderLeft: `3px solid ${sm.color}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <span className="mono" style={{ fontSize: '12px', color: sm.color, width: '32px', flexShrink: 0 }}>{sm.icon}</span>
                    <span className="mono font-bold" style={{ fontSize: '11px', color: 'var(--color-primary)', width: '32px', flexShrink: 0 }}>D{String(task.day).padStart(2, '0')}</span>
                    <span className="mono" style={{ flex: 1, color: isDone ? 'var(--text-tertiary)' : 'var(--color-text)', textDecoration: isDone ? 'line-through' : 'none', fontSize: '12px', textTransform: 'uppercase' }}>
                      {task.task || task.title}
                    </span>
                    {task.gate && (
                      <span className="mono" style={{ fontSize: '9px', padding: '4px 8px', background: 'var(--warning-bg)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)', textTransform: 'uppercase' }}>GATE: {task.gate}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Execution
