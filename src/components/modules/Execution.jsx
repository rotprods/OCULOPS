// ===================================================
// ANTIGRAVITY OS — Execution Module
// Wired to Supabase via useTasks hook
// ===================================================

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

  const statusIcon = s => s === 'done' ? '✅' : s === 'in_progress' ? '🔄' : '⬜'
  const statusColor = s => s === 'done' ? 'var(--success)' : s === 'in_progress' ? 'var(--warning)' : 'var(--text-tertiary)'

  if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>⏳ Cargando tareas...</div>

  return (
    <div className="fade-in">
      <div className="module-header">
        <h1>Execution OS</h1>
        <p>Plan de 30 días para escalar de 0 a 20k€/mes. Click para cambiar el estado de cada tarea.</p>
      </div>

      {/* Progress KPIs */}
      <div className="grid-3 mb-6">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--accent-primary)22', color: 'var(--accent-primary)' }}>📅</div>
          <div className="kpi-value">Día {currentDay}</div>
          <div className="kpi-label">Progreso actual</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--success)22', color: 'var(--success)' }}>✅</div>
          <div className="kpi-value">{completionRate}%</div>
          <div className="kpi-label">Completado</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--warning)22', color: 'var(--warning)' }}>🔥</div>
          <div className="kpi-value">{tasks.filter(t => t.status === 'in_progress').length}</div>
          <div className="kpi-label">En progreso</div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Plan de Ejecución ({filtered.length} tareas)</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'in_progress', 'done'].map(f => (
              <button key={f} className={`btn btn-sm ${filterStatus === f ? 'btn-primary' : ''}`} onClick={() => setFilterStatus(f)}>
                {f === 'all' ? 'Todas' : f === 'pending' ? '⬜ Pendientes' : f === 'in_progress' ? '🔄 En progreso' : '✅ Completadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', height: '8px', margin: '0 0 16px', overflow: 'hidden' }}>
          <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--success))', borderRadius: '8px', transition: 'width 0.5s ease' }} />
        </div>

        {tasks.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-icon">🚀</div>
            <h3>Plan no inicializado</h3>
            <p className="text-muted">Carga el plan de 30 días para escalar de 0 a 20k€/mes</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={seedDefaultPlan} disabled={seeding}>
              {seeding ? 'Inicializando...' : 'Inicializar Plan de 30 Días'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>Sin tareas en esta categoría</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filtered.map(task => (
              <div
                key={task.id}
                onClick={() => toggleStatus(task)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                  background: task.status === 'done' ? 'rgba(0,210,106,0.05)' : 'transparent',
                  borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s',
                  borderLeft: `3px solid ${statusColor(task.status)}`,
                }}
              >
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{statusIcon(task.status)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)', width: '32px', flexShrink: 0 }}>D{task.day}</span>
                <span style={{ flex: 1, color: task.status === 'done' ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: task.status === 'done' ? 'line-through' : 'none', fontSize: '13px' }}>
                  {task.task || task.title}
                </span>
                {task.gate && (
                  <span className="badge badge-warning" style={{ fontSize: '10px' }}>🚧 {task.gate}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Execution
