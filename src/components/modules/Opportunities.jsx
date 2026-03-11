// ═══════════════════════════════════════════════════
// OCULOPS — Opportunities Scanner
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { useOpportunities } from '../../hooks/useOpportunities'
import VaultAgentPanel from '../ui/VaultAgentPanel'
import ModuleSkeleton from '../ui/ModuleSkeleton'

const STATUSES = [
    { value: 'identified', label: 'IDENTIFIED', color: 'var(--color-info)', symbol: '[?]' },
    { value: 'evaluating', label: 'EVALUATING', color: 'var(--color-warning)', symbol: '[~]' },
    { value: 'pursuing', label: 'PURSUING', color: 'var(--color-primary)', symbol: '[>]' },
    { value: 'won', label: 'WON', color: 'var(--color-success)', symbol: '[+]' },
    { value: 'passed', label: 'PASSED', color: 'var(--text-tertiary)', symbol: '[-]' },
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
                    <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0 }}>OPPORTUNITY MATRIX</h1>
                    <span className="mono text-xs text-tertiary">SIGNAL EVALUATION & PURSUIT LOG</span>
                </div>
            </div>

            <div className="module-scroll">

                {/* ── KPI STRIP ── */}
                <div className="kpi-strip kpi-strip-5">
                    {STATUSES.map(s => (
                        <div key={s.value} className="kpi-strip-cell" style={{ gap: '8px' }}>
                            <div className="mono text-2xs" style={{ color: 'var(--text-tertiary)' }}>{s.symbol} {s.label}</div>
                            <div className="mono" style={{ fontSize: '20px', fontWeight: 'bold', color: s.color }}>
                                {(byStatus[s.value] || []).length}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── SIGNAL LIST ── */}
                <div className="section-box">
                    <div className="section-header">
                        /// DETECTED OPPORTUNITIES [{opportunities.length}]
                    </div>
                    {opportunities.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                            CLEAR SKIES. NO OPPORTUNITIES DETECTED.
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead style={{ background: '#000', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', color: 'var(--color-text-2)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--color-text-2)' }}>DESIGNATION / DETAILS</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--color-text-2)' }}>SOURCE</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--color-text-2)' }}>PROJECTED VAL</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--color-text-2)' }}>STATUS</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-danger)' }}>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {opportunities.sort((a, b) => (b.potential_value || 0) - (a.potential_value || 0)).map((opp, idx) => {
                                    const statusObj = STATUSES.find(s => s.value === opp.status) || STATUSES[0]
                                    return (
                                        <tr key={opp.id} style={{ borderBottom: idx < opportunities.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000' }}>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{String(opp.id).slice(0, 6).toUpperCase()}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{opp.title.toUpperCase()}</div>
                                                {opp.description && <div style={{ color: 'var(--text-tertiary)', fontSize: '9px', marginTop: '4px' }}>{opp.description.toUpperCase()}</div>}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{opp.source ? opp.source.toUpperCase() : 'UNKNOWN'}</td>
                                            <td style={{ padding: '12px 16px', color: 'var(--color-success)', fontWeight: 'bold' }}>{opp.potential_value > 0 ? formatCurrency(opp.potential_value) : '—'}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '4px 8px', border: `1px solid ${statusObj.color}`, color: statusObj.color, background: 'transparent' }} onClick={() => advanceStatus(opp)}>
                                                    {statusObj.label} &rarr;
                                                </button>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--text-tertiary)', color: 'var(--text-tertiary)' }} onClick={() => updateOpportunity(opp.id, { status: 'passed' })}>PASS</button>
                                                <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => removeOpportunity(opp.id)}>DEL</button>
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
                        /// COMPILE NEW OPPORTUNITY DOSSIER
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) 120px', gap: '12px' }}>
                            <div className="input-group">
                                <label className="mono text-2xs text-tertiary">OPP DESIGNATION</label>
                                <input className="input-terminal" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="PROJECT TARGET" />
                            </div>
                            <div className="input-group">
                                <label className="mono text-2xs text-tertiary">PROJECTED VAL ($)</label>
                                <input className="input-terminal" type="number" style={{ color: 'var(--color-success)' }} value={form.potential_value} onChange={e => setForm(f => ({ ...f, potential_value: e.target.value }))} placeholder="0.00" />
                            </div>
                            <div className="input-group">
                                <label className="mono text-2xs text-tertiary">INTEL SOURCE</label>
                                <input className="input-terminal" style={{ color: 'var(--color-primary)' }} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="REFERRAL, SOCIAL..." />
                            </div>
                            <div className="input-group">
                                <label className="mono text-2xs text-tertiary">URGENCY</label>
                                <select className="input-terminal" style={{ color: 'var(--color-warning)' }} value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                                    <option value="low">LOW</option>
                                    <option value="medium">MED</option>
                                    <option value="high">HIGH</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="mono text-2xs text-tertiary">EXPANDED INTEL (OPTIONAL)</label>
                            <textarea className="input-terminal" rows="2" style={{ resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="OPERATIONAL DETAILS..." />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button className="btn btn-primary mono" style={{ fontSize: '10px', padding: '10px 24px', borderRadius: 0 }} onClick={handleAdd} disabled={saving}>
                                {saving ? 'TRANSMITTING...' : 'REGISTER OPP'}
                            </button>
                        </div>
                    </div>
                </div>

                <VaultAgentPanel title="MARKET INTELLIGENCE" namespaces={['research', 'product']} />

            </div>
        </div>
    )
}

export default Opportunities
