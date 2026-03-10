// ===================================================
// ANTIGRAVITY OS — Finance Module
// Wired to Supabase via useFinance hook
// ===================================================

import { useState } from 'react'
import { useFinance } from '../../hooks/useFinance'
import { useFinanceStore } from '../../stores/useFinanceStore'

const emptyForm = { type: 'revenue', category: 'servicio', description: '', amount: '', date: new Date().toISOString().split('T')[0], recurrence: 'one_time' }

function Finance() {
  const { entries, loading, addEntry, removeEntry } = useFinance()
  const { filter, setFilter } = useFinanceStore()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const revenue = entries.filter(e => e.type === 'revenue').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const expenses = entries.filter(e => e.type === 'expense').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const profit = revenue - expenses
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0

  const handleAdd = async () => {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    await addEntry({ ...form, amount: parseFloat(form.amount), is_recurring: form.recurrence !== 'one_time' })
    setForm(emptyForm)
    setSaving(false)
  }

  const filtered = entries
    .filter(e => filter === 'all' || e.type === filter)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

  if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>⏳ Cargando finanzas...</div>

  return (
    <div className="fade-in">
      <div className="module-header">
        <h1>Finanzas</h1>
        <p>Revenue, gastos y margen. Control financiero completo de la agencia.</p>
      </div>

      <div className="grid-4 mb-6">
        <div className="kpi-card"><div className="kpi-icon" style={{ background: 'var(--success)22', color: 'var(--success)' }}>💰</div><div className="kpi-value" style={{ color: 'var(--success)' }}>€{revenue.toLocaleString()}</div><div className="kpi-label">Revenue</div></div>
        <div className="kpi-card"><div className="kpi-icon" style={{ background: 'var(--danger)22', color: 'var(--danger)' }}>💸</div><div className="kpi-value" style={{ color: 'var(--danger)' }}>€{expenses.toLocaleString()}</div><div className="kpi-label">Gastos</div></div>
        <div className="kpi-card"><div className="kpi-icon" style={{ background: profit >= 0 ? 'var(--success)22' : 'var(--danger)22', color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>📊</div><div className="kpi-value" style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>€{profit.toLocaleString()}</div><div className="kpi-label">Beneficio</div></div>
        <div className="kpi-card"><div className="kpi-icon" style={{ background: 'var(--accent-primary)22', color: 'var(--accent-primary)' }}>📈</div><div className="kpi-value">{margin}%</div><div className="kpi-label">Margen</div></div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Movimientos ({filtered.length})</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'revenue', 'expense'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todos' : f === 'revenue' ? '💰 Ingresos' : '💸 Gastos'}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">💳</div><h3>Sin movimientos</h3></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Tipo</th><th>Monto</th><th></th></tr></thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td className="mono text-xs">{e.date}</td>
                    <td style={{ fontWeight: 600 }}>{e.description}</td>
                    <td><span className="badge badge-neutral">{e.category}</span></td>
                    <td><span className={`badge ${e.type === 'revenue' ? 'badge-success' : 'badge-danger'}`}>{e.type === 'revenue' ? '💰 Ingreso' : '💸 Gasto'}</span></td>
                    <td style={{ fontWeight: 800, color: e.type === 'revenue' ? 'var(--success)' : 'var(--danger)' }}>€{(parseFloat(e.amount) || 0).toLocaleString()}</td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => removeEntry(e.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Registrar Movimiento</div></div>
        <div className="grid-2" style={{ gap: '12px' }}>
          <div className="input-group"><label>Tipo</label><select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="revenue">💰 Ingreso</option><option value="expense">💸 Gasto</option></select></div>
          <div className="input-group"><label>Categoría</label><select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}><option value="servicio">Servicio</option><option value="producto">Producto</option><option value="herramienta">Herramienta</option><option value="marketing">Marketing</option><option value="equipo">Equipo</option><option value="admin">Admin</option><option value="otro">Otro</option></select></div>
          <div className="input-group"><label>Descripción</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Setup chatbot cliente X" /></div>
          <div className="input-group"><label>Monto (€)</label><input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="2000" /></div>
          <div className="input-group"><label>Fecha</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div className="input-group"><label>Recurrencia</label><select className="input" value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}><option value="one_time">Único</option><option value="monthly">Mensual</option><option value="weekly">Semanal</option></select></div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>{saving ? '⏳ Guardando...' : 'Registrar'}</button>
      </div>
    </div>
  )
}

export default Finance
