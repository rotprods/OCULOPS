// ═══════════════════════════════════════════════════
// OCULOPS — Finance Module
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { useFinance } from '../../hooks/useFinance'
import { useFinanceStore } from '../../stores/useFinanceStore'
import VaultAgentPanel from '../ui/VaultAgentPanel'
import ModuleSkeleton from '../ui/ModuleSkeleton'

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

  if (loading) return <ModuleSkeleton variant="kpi" rows={4} />

  return (
    <div className="fade-in module-wrap">
      {/* ── HEADER ── */}
      <div className="module-header-bar">
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--accent-primary)', margin: 0 }}>Cashflow</h1>
          <span className="mono text-xs text-tertiary">Revenue, expenses and margin overview</span>
        </div>
      </div>

      <div className="module-scroll">

        {/* ── KPI STRIP ── */}
        <div className="kpi-strip kpi-strip-4">
          <div className="kpi-strip-cell">
            <div className="kpi-strip-cell-header">
              <span className="mono text-xs text-tertiary">Revenue</span>
              <span style={{ fontSize: '14px', color: 'var(--color-success)' }}>💰</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-success)' }}>€{revenue.toLocaleString()}</span>
          </div>
          <div className="kpi-strip-cell">
            <div className="kpi-strip-cell-header">
              <span className="mono text-xs text-tertiary">Expenses</span>
              <span style={{ fontSize: '14px', color: 'var(--color-danger)' }}>💸</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-danger)' }}>€{expenses.toLocaleString()}</span>
          </div>
          <div className="kpi-strip-cell">
            <div className="kpi-strip-cell-header">
              <span className="mono text-xs text-tertiary">Net Profit</span>
              <span style={{ fontSize: '14px', color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>📊</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>€{profit.toLocaleString()}</span>
          </div>
          <div className="kpi-strip-cell">
            <div className="kpi-strip-cell-header">
              <span className="mono text-xs text-tertiary">Margin</span>
              <span style={{ fontSize: '14px', color: 'var(--accent-primary)' }}>📈</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{margin}%</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div className="section-box">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Transactions ({filtered.length})</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'revenue', 'expense'].map(f => (
                  <button key={f} className="mono" style={{ fontSize: '9px', padding: '4px 8px', background: filter === f ? 'var(--accent-primary)' : 'transparent', color: filter === f ? 'var(--surface-base)' : 'var(--text-primary)', border: filter === f ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setFilter(f)}>
                    {f === 'all' ? 'All' : f === 'revenue' ? 'Revenue' : 'Expenses'}
                  </button>
                ))}
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>No transactions yet.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id}>
                      <td style={{ color: 'var(--text-tertiary)' }}>{e.date}</td>
                      <td style={{ fontWeight: 'bold' }}>{e.description || ''}</td>
                      <td>
                        <span style={{ fontSize: '9px', padding: '2px 6px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{e.category || ''}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '9px', padding: '2px 6px', border: `1px solid var(--color-${e.type === 'revenue' ? 'success' : 'danger'})`, color: `var(--color-${e.type === 'revenue' ? 'success' : 'danger'})` }}>
                          {e.type === 'revenue' ? 'Revenue' : 'Expense'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: e.type === 'revenue' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        €{(parseFloat(e.amount) || 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => removeEntry(e.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="section-box--gold" style={{ height: 'fit-content' }}>
            <div className="section-header--gold mono text-xs font-bold" style={{ padding: '12px 16px' }}>
                        New Transaction
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="mono text-xs">DIRECTIONAL VECTOR</label>
                <select className="input-terminal" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="revenue">INFLOW (REVENUE)</option>
                  <option value="expense">BURN (EXPENSE)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="mono text-xs">INTERNAL CLASSIFICATION</label>
                <select className="input-terminal" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="servicio">SERVICE RETAINER</option>
                  <option value="producto">PRODUCT SALES</option>
                  <option value="herramienta">SaaS INFRASTRUCTURE</option>
                  <option value="marketing">ADVERTISING / MKT</option>
                  <option value="equipo">HUMAN CAPITAL</option>
                  <option value="admin">LEGAL / ADMIN</option>
                  <option value="otro">UNCLASSIFIED</option>
                </select>
              </div>
              <div className="input-group">
                <label className="mono text-xs">DESCRIPTOR</label>
                <input className="input-terminal" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="EX: V0 SERVER COSTS" />
              </div>
              <div className="input-group">
                <label className="mono text-xs">CAPITAL COMMITTED (€)</label>
                <input className="input-terminal" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="500" />
              </div>
              <div className="input-group">
                <label className="mono text-xs">EXECUTION DATE</label>
                <input className="input-terminal" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="mono text-xs">AUTO-RENEWAL</label>
                <select className="input-terminal" value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
                  <option value="one_time">STATIC (ONE-OFF)</option>
                  <option value="monthly">MONTHLY CYCLE</option>
                  <option value="weekly">WEEKLY CYCLE</option>
                </select>
              </div>
              <button className="btn btn-primary mono" style={{ marginTop: '16px', borderRadius: 0, padding: '12px' }} onClick={handleAdd} disabled={saving}>
                {saving ? 'COMMITTING...' : 'REGISTER TRANSFER'}
              </button>
            </div>
          </div>

        </div>

        <VaultAgentPanel title="FINANCE INTELLIGENCE" namespaces={['data', 'product']} />

      </div>
    </div>
  )
}

export default Finance
