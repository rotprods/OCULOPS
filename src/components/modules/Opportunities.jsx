// ═══════════════════════════════════════════════════
// OCULOPS — Opportunities Scanner
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { useOpportunities } from '../../hooks/useOpportunities'
import VaultAgentPanel from '../ui/VaultAgentPanel'
import ModuleSkeleton from '../ui/ModuleSkeleton'

const STATUSES = [
    { value: 'identified', label: 'Identified', color: 'var(--color-info)', symbol: '' },
    { value: 'evaluating', label: 'Evaluating', color: 'var(--color-warning)', symbol: '' },
    { value: 'pursuing', label: 'Pursuing', color: 'var(--accent-primary)', symbol: '' },
    { value: 'won', label: 'Won', color: 'var(--color-success)', symbol: '' },
    { value: 'passed', label: 'Passed', color: 'var(--text-tertiary)', symbol: '' },
]

const emptyForm = { title: '', description: '', potential_value: '', source: '', urgency: 'medium' }

function formatCurrency(val) {
    if (!val) return '$0'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

function Opportunities() {
    const { opportunities, loading, addOpportunity, updateOpportunity, removeOpportunity, byStatus } = useOpportunities()
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!form.title.trim()) return
        setSaving(true)
        await addOpportunity({ ...form, status: 'identified', date: new Date().toISOString().split('T')[0], potential_value: parseFloat(form.potential_value) || 0 })
        setForm(emptyForm)
        setSaving(false)
    }

    const advanceStatus = async (opp) => {
        const order = ['identified', 'evaluating', 'pursuing', 'won']
        const idx = order.indexOf(opp.status)
        if (idx < order.length - 1) await updateOpportunity(opp.id, { status: order[idx + 1] })
    }

    if (loading) return <ModuleSkeleton variant="kpi" rows={4} />

    return (
        <div className="fade-in module-wrap">
            {/* ── HEADER ── */}
            <div className="module-header-bar">
                <div>
                    <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--accent-primary)', margin: 0 }}>Opportunities</h1>
                    <span className="mono text-xs text-tertiary">Signal evaluation and pursuit log</span>
                </div>
            </div>

            <div className="module-scroll">

                {/* ── KPI STRIP ── */}
                <div className="kpi-strip kpi-strip-5">
                    {STATUSES.map(s => (
                        <div key={s.value} className="kpi-strip-cell" style={{ gap: '8px' }}>
                            <div className="mono text-2xs" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
                            <div className="mono" style={{ fontSize: '20px', fontWeight: 'bold', color: s.color }}>
                                {(byStatus[s.value] || []).length}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── SIGNAL LIST ── */}
                <div className="section-box">
                    <div className="section-header">
                        Opportunities ({opportunities.length})
                    </div>
                    {opportunities.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                            No opportunities detected yet.
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead style={{ background: 'var(--surface-inset)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Name / Details</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Source</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Value</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {opportunities.sort((a, b) => (b.potential_value || 0) - (a.potential_value || 0)).map((opp, idx) => {
                                    const statusObj = STATUSES.find(s => s.value === opp.status) || STATUSES[0]
                                    return (
                                        <tr key={opp.id} style={{ borderBottom: idx < opportunities.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : 'var(--surface-inset)' }}>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{String(opp.id).slice(0, 6)}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{opp.title}</div>
                                                {opp.description && <div style={{ color: 'var(--text-tertiary)', fontSize: '9px', marginTop: '4px' }}>{opp.description}</div>}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--accent-primary)' }}>{opp.source || 'Unknown'}</td>
                                            <td style={{ padding: '12px 16px', color: 'var(--color-success)', fontWeight: 'bold' }}>{opp.potential_value > 0 ? formatCurrency(opp.potential_value) : '—'}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '4px 8px', border: `1px solid ${statusObj.color}`, color: statusObj.color, background: 'transparent' }} onClick={() => advanceStatus(opp)}>
                                                    {statusObj.label} &rarr;
                                                </button>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--text-tertiary)', color: 'var(--text-tertiary)' }} onClick={() => updateOpportunity(opp.id, { status: 'passed' })}>Pass</button>
                                                <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => removeOpportunity(opp.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── INPUT MATRIX ── */}
                <div className="section-box">
                    <div className="section-header">
                        New Opportunity
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) 120px', gap: '12px' }}>
                            <div className="input-group">
                                <label className="mono text-2xs text-tertiary">Name</label>
                                <input className="input-terminal" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Opportunity name" />
                            </div>
                            <div className="input-group">
                                <label className="mono text-2xs text-tertiary">Est. Value ($)</label>
                                <input className="input-terminal" type="number" style={{ color: 'var(--color-success)' }} value={form.potential_value} onChange={e => setForm(f => ({ ...f, potential_value: e.target.value }))} placeholder="0.00" />
                            </div>
                            <div className="input-group">
                                <label className="mono text-2xs text-tertiary">Source</label>
                                <input className="input-terminal" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Referral, social..." />
                            </div>
                            <div className="input-group">
                                <label className="mono text-2xs text-tertiary">Urgency</label>
                                <select className="input-terminal" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="mono text-2xs text-tertiary">Description (optional)</label>
                            <textarea className="input-terminal" rows="2" style={{ resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details..." />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button className="btn btn-primary mono" style={{ fontSize: '10px', padding: '10px 24px', borderRadius: 0 }} onClick={handleAdd} disabled={saving}>
                                {saving ? 'Saving...' : 'Add Opportunity'}
                            </button>
                        </div>
                    </div>
                </div>

                <VaultAgentPanel title="Market Intelligence" namespaces={['research', 'product']} />

            </div>
        </div>
    )
}

export default Opportunities
