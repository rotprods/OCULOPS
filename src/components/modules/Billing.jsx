// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Billing Module
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { useDeals } from '../../hooks/useDeals'
import { useFinance } from '../../hooks/useFinance'

const INVOICE_STATUS = {
  paid: { label: 'CLEARED', color: 'var(--color-success)' },
  pending: { label: 'PENDING', color: 'var(--text-tertiary)' },
  overdue: { label: 'OVERDUE', color: 'var(--color-danger)' },
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
    name: d.contact?.name || d.company?.name || 'UNIDENTIFIED CLIENT',
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
    <div className="fade-in mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>
      CALCULATING FINANCE MATRIX...
    </div>
  )

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0 }}>FINANCE LEDGER</h1>
          <span className="mono text-xs text-tertiary">RECURRING REVENUE, INWARD FLOW & ACTIVE ACCOUNTS</span>
        </div>
        <button className="btn btn-primary mono text-xs" style={{ borderRadius: 0, padding: '8px 16px' }} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'CANCEL INVOICE' : 'GENERATE INVOICE'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>

        {/* ── KPI STRIP ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-default)', border: '1px solid var(--border-default)' }}>
          <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="mono text-xs text-tertiary">MRR (RECURRING)</span>
              <span style={{ fontSize: '14px', color: 'var(--color-primary)' }}>📈</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-text)' }}>€{mrr.toLocaleString()}</span>
          </div>
          <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="mono text-xs text-tertiary">TOTAL REVENUE</span>
              <span style={{ fontSize: '14px', color: 'var(--color-success)' }}>💰</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-success)' }}>€{totalRevenue.toLocaleString()}</span>
          </div>
          <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="mono text-xs text-tertiary">ACTIVE PORTFOLIO</span>
              <span style={{ fontSize: '14px', color: 'var(--color-info)' }}>👥</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-info)' }}>{clientsMRR.length}</span>
          </div>
          <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="mono text-xs text-tertiary">BURNOUT EXPENSES</span>
              <span style={{ fontSize: '14px', color: 'var(--color-danger)' }}>💸</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-danger)' }}>€{totalExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* ── INVOICE CREATION TERMINAL ── */}
        {showForm && (
          <div style={{ border: '1px solid var(--color-primary)', background: '#000', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--color-primary)', color: '#000' }}>
                        /// EXECUTE NEW INVOICE
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="mono text-xs">CLIENT IDENTIFIER</label>
                  <input className="input mono text-xs" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="EX: ACME CORP" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} />
                </div>
                <div className="input-group">
                  <label className="mono text-xs">SERVICES RENDERED</label>
                  <input className="input mono text-xs" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="EX: MONTHLY AUTOMATION RETAINER" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="mono text-xs">CAPITAL TRANSFER (€)</label>
                  <input className="input mono text-xs" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="5000" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} />
                </div>
                <div className="input-group">
                  <label className="mono text-xs">EXECUTION DATE</label>
                  <input className="input mono text-xs" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button className="btn btn-primary mono text-xs" onClick={handleAddInvoice} disabled={saving} style={{ borderRadius: 0, padding: '12px 24px' }}>
                  {saving ? 'TRANSMITTING...' : 'REGISTER TRANSFER'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '16px' }}>
          {/* ── INVOICE LEDGER ── */}
          <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
            <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// TRANSACTIONS LOG [{invoices.length}]</div>
            {invoices.length === 0 ? (
              <div className="mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>NO INVOICES ON RECORD.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#000', color: 'var(--color-primary)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold' }}>DATE</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold' }}>DESCRIPTOR</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold' }}>VALUE</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold' }}>TYPE</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr key={inv.id} style={{ borderBottom: idx < invoices.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{inv.date}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{inv.description.toUpperCase()}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-success)', fontWeight: 'bold' }}>€{(parseFloat(inv.amount) || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {inv.is_recurring ? (
                          <span style={{ fontSize: '9px', padding: '2px 6px', border: '1px solid var(--color-success)', color: 'var(--color-success)' }}>RECURRING</span>
                        ) : (
                          <span style={{ fontSize: '9px', padding: '2px 6px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>ONE-OFF</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── CLIENT MRR PORTFOLIO ── */}
          <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// ACTIVE PORTFOLIO MRR</div>
            {clientsMRR.length === 0 ? (
              <div className="mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>NO RECURRING CLIENTS SECURED.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {clientsMRR.map((c, idx) => {
                  const mrrPct = mrr > 0 ? Math.round((c.value / mrr) * 100) : 0
                  const maxVal = Math.max(...clientsMRR.map(x => x.value))
                  const barPct = Math.round((c.value / maxVal) * 100)

                  return (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', borderBottom: idx < clientsMRR.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <div className="mono text-sm font-bold" style={{ color: 'var(--color-text)' }}>{c.name.toUpperCase()}</div>
                          <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>{c.company.toUpperCase() || 'N/A'}</div>
                        </div>
                        <div className="mono text-sm font-bold" style={{ color: 'var(--color-success)' }}>€{c.value.toLocaleString()}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, border: '1px solid var(--border-subtle)', background: '#000', height: '6px', position: 'relative' }}>
                          <div style={{ width: `${barPct}%`, height: '100%', background: 'var(--color-primary)' }} />
                        </div>
                        <span className="mono text-xs" style={{ color: 'var(--text-secondary)', width: '30px', textAlign: 'right' }}>{mrrPct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Billing
