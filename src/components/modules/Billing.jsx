// ===================================================
// ANTIGRAVITY OS — Billing Module
// MRR, facturas de clientes y estado de pagos
// ===================================================

import { useState } from 'react'
import { useDeals } from '../../hooks/useDeals'
import { useFinance } from '../../hooks/useFinance'

const INVOICE_STATUS = {
  paid:     { label: 'Pagado',   className: 'badge-success' },
  pending:  { label: 'Pendiente', className: 'badge-neutral' },
  overdue:  { label: 'Vencida',  className: 'badge-danger' },
}

function Billing() {
  const { pipelineView, loading: dealsLoading } = useDeals()
  const { entries, mrr, totalRevenue, totalExpenses, addEntry, loading: financeLoading } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'pending', client: '' })
  const [saving, setSaving] = useState(false)

  const loading = dealsLoading || financeLoading

  // Build client list from won deals
  const wonDeals = pipelineView['closed_won'] || []
  const clientsMRR = wonDeals.map(d => ({
    id: d.id,
    name: d.contact?.name || d.company?.name || 'Cliente sin nombre',
    company: d.company?.name || '',
    value: parseFloat(d.value) || 0,
    stage: d.stage,
  })).filter(c => c.value > 0)

  // Revenue entries as invoices
  const invoices = entries
    .filter(e => e.type === 'revenue')
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

  const handleAddInvoice = async () => {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    await addEntry({
      type: 'revenue',
      category: 'factura',
      description: form.client ? `[${form.client}] ${form.description}` : form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      is_recurring: false,
    })
    setForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'pending', client: '' })
    setShowForm(false)
    setSaving(false)
  }

  if (loading) return (
    <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-2)' }}>
      Cargando facturacion...
    </div>
  )

  return (
    <div className="fade-in">
      <div className="module-header">
        <h1>Facturacion</h1>
        <p>MRR de clientes activos, facturas y estado de cobros.</p>
      </div>

      <div className="grid-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-primary)22', color: 'var(--color-primary)' }}>📈</div>
          <div className="kpi-value">€{mrr.toLocaleString()}</div>
          <div className="kpi-label">MRR</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-success)22', color: 'var(--color-success)' }}>💰</div>
          <div className="kpi-value">€{totalRevenue.toLocaleString()}</div>
          <div className="kpi-label">Revenue total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-info)22', color: 'var(--color-info)' }}>👥</div>
          <div className="kpi-value">{clientsMRR.length}</div>
          <div className="kpi-label">Clientes activos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-danger)22', color: 'var(--color-danger)' }}>💸</div>
          <div className="kpi-value">€{totalExpenses.toLocaleString()}</div>
          <div className="kpi-label">Gastos</div>
        </div>
      </div>

      {clientsMRR.length > 0 && (
        <div className="card mb-6">
          <div className="card-header"><div className="card-title">Clientes con MRR</div></div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Empresa</th>
                  <th>Valor deal</th>
                  <th>% del MRR total</th>
                </tr>
              </thead>
              <tbody>
                {clientsMRR.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: 'var(--color-text-2)', fontSize: '12px' }}>{c.company || '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>€{c.value.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, background: 'var(--color-bg-3)', borderRadius: '3px', height: '6px' }}>
                          <div style={{ width: `${Math.round((c.value / Math.max(...clientsMRR.map(x => x.value))) * 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-2)', width: '36px' }}>
                          {mrr > 0 ? Math.round((c.value / mrr) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">Facturas ({invoices.length})</div>
          <button className="btn btn-sm btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancelar' : '+ Nueva factura'}
          </button>
        </div>

        {showForm && (
          <div className="grid-2" style={{ gap: '12px', padding: '16px 0', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
            <div className="input-group">
              <label>Cliente</label>
              <input className="input" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Nombre del cliente" />
            </div>
            <div className="input-group">
              <label>Descripcion</label>
              <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Servicio mensual Abril" />
            </div>
            <div className="input-group">
              <label>Monto (€)</label>
              <input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="2000" />
            </div>
            <div className="input-group">
              <label>Fecha</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-primary" onClick={handleAddInvoice} disabled={saving}>
                {saving ? 'Guardando...' : 'Crear factura'}
              </button>
            </div>
          </div>
        )}

        {invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h3>Sin facturas</h3>
            <p>Registra tu primera factura para empezar el seguimiento.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Descripcion</th><th>Monto</th><th>Recurrente</th></tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="mono text-xs">{inv.date}</td>
                    <td style={{ fontWeight: 600 }}>{inv.description}</td>
                    <td style={{ fontWeight: 800, color: 'var(--color-success)' }}>€{(parseFloat(inv.amount) || 0).toLocaleString()}</td>
                    <td>
                      {inv.is_recurring
                        ? <span className="badge badge-success">Recurrente</span>
                        : <span className="badge badge-neutral">Unica</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Billing
