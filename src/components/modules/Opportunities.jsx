// ===================================================
// ANTIGRAVITY OS — Opportunities Scanner
// Wired to Supabase via useOpportunities hook
// ===================================================

import { useState } from 'react'
import { useOpportunities } from '../../hooks/useOpportunities'

const STATUSES = [
    { value: 'identified', label: 'Identificada', color: 'var(--info)', icon: '🔍' },
    { value: 'evaluating', label: 'Evaluando', color: 'var(--warning)', icon: '🔄' },
    { value: 'pursuing', label: 'Persiguiendo', color: 'var(--accent-primary)', icon: '🎯' },
    { value: 'won', label: 'Ganada', color: 'var(--success)', icon: '🏆' },
    { value: 'passed', label: 'Descartada', color: 'var(--text-tertiary)', icon: '⏭️' },
]

const emptyForm = { title: '', description: '', potential_value: '', source: '', urgency: 'medium' }

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

    if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>⏳ Cargando oportunidades...</div>

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>Opportunity Scanner</h1>
                <p>Detecta, evalúa y persigue oportunidades de negocio. Click en el estado para avanzar en el funnel.</p>
            </div>

            <div className="grid-5 mb-6">
                {STATUSES.map(s => (
                    <div key={s.value} className="kpi-card">
                        <div style={{ fontSize: '20px' }}>{s.icon}</div>
                        <div className="kpi-value" style={{ color: s.color }}>{(byStatus[s.value] || []).length}</div>
                        <div className="kpi-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="card mb-6">
                <div className="card-header"><div className="card-title">Oportunidades ({opportunities.length})</div></div>
                {opportunities.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📡</div><h3>Sin oportunidades detectadas</h3></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {opportunities.sort((a, b) => (b.potential_value || 0) - (a.potential_value || 0)).map(opp => {
                            const status = STATUSES.find(s => s.value === opp.status) || STATUSES[0]
                            return (
                                <div key={opp.id} className="card" style={{ padding: '14px', borderLeft: `3px solid ${status.color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{opp.title}</div>
                                            {opp.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{opp.description}</div>}
                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{opp.source ? `📌 ${opp.source}` : ''} {opp.date ? `| ${opp.date}` : ''}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            {opp.potential_value > 0 && <span style={{ fontWeight: 800, color: 'var(--success)' }}>€{opp.potential_value.toLocaleString()}</span>}
                                            <span className="badge" style={{ cursor: 'pointer', background: status.color + '22', color: status.color }} onClick={() => advanceStatus(opp)}>
                                                {status.icon} {status.label}
                                            </span>
                                            <button className="btn btn-sm" style={{ color: 'var(--text-tertiary)' }} onClick={() => updateOpportunity(opp.id, { status: 'passed' })}>⏭️</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => removeOpportunity(opp.id)}>✕</button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header"><div className="card-title">Registrar Oportunidad</div></div>
                <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="input-group"><label>Título</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre de la oportunidad" /></div>
                    <div className="input-group"><label>Valor potencial (€)</label><input className="input" type="number" value={form.potential_value} onChange={e => setForm(f => ({ ...f, potential_value: e.target.value }))} placeholder="5000" /></div>
                    <div className="input-group"><label>Fuente</label><input className="input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="LinkedIn, referral, etc." /></div>
                    <div className="input-group"><label>Urgencia</label><select className="input" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Descripción</label><textarea className="input" rows="2" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalles de la oportunidad" /></div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>{saving ? '⏳ Guardando...' : 'Registrar Oportunidad'}</button>
            </div>
        </div>
    )
}

export default Opportunities
