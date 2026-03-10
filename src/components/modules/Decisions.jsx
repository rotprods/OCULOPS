// ===================================================
// ANTIGRAVITY OS — Decision Log
// Wired to Supabase via useDecisions hook
// ===================================================

import { useState } from 'react'
import { useDecisions } from '../../hooks/useDecisions'

const emptyForm = { title: '', context: '', options: '', rationale: '', expected_outcome: '', review_date: '' }

function Decisions() {
    const { decisions, loading, addDecision, updateDecision, removeDecision, pendingReview } = useDecisions()
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!form.title.trim()) return
        setSaving(true)
        await addDecision({ ...form, status: 'active', decision_date: new Date().toISOString().split('T')[0] })
        setForm(emptyForm)
        setSaving(false)
    }

    if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>⏳ Cargando decisiones...</div>

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>Decision Log</h1>
                <p>Documenta cada decisión estratégica con contexto, opciones, razón y fecha de revisión. Evita repetir errores.</p>
            </div>

            <div className="grid-3 mb-6">
                <div className="kpi-card"><div className="kpi-value">{decisions.length}</div><div className="kpi-label">Total Decisiones</div></div>
                <div className="kpi-card"><div className="kpi-value" style={{ color: 'var(--warning)' }}>{pendingReview.length}</div><div className="kpi-label">Pendientes Revisión</div></div>
                <div className="kpi-card"><div className="kpi-value" style={{ color: 'var(--success)' }}>{decisions.filter(d => d.status === 'reviewed').length}</div><div className="kpi-label">Revisadas</div></div>
            </div>

            {pendingReview.length > 0 && (
                <div className="card mb-6" style={{ borderLeft: '3px solid var(--warning)' }}>
                    <div className="card-header"><div className="card-title">⚠️ Pendientes de Revisión</div></div>
                    {pendingReview.map(d => (
                        <div key={d.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{d.title}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Decisión: {d.decision_date || d.created_at?.split('T')[0]} | Revisión: {d.review_date || '—'}</div>
                            </div>
                            <button className="btn btn-sm btn-primary" onClick={() => updateDecision(d.id, { status: 'reviewed' })}>✅ Marcar revisada</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="card mb-6">
                <div className="card-header"><div className="card-title">Historial de Decisiones ({decisions.length})</div></div>
                {decisions.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">⚖️</div><h3>Sin decisiones registradas</h3></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {decisions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).map(d => (
                            <div key={d.id} className="card" style={{ padding: '14px', borderLeft: `3px solid ${d.status === 'reviewed' ? 'var(--success)' : 'var(--accent-primary)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 700 }}>{d.title}</div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <span className="badge badge-neutral mono" style={{ fontSize: '10px' }}>{d.date}</span>
                                        <button className="btn btn-sm btn-danger" onClick={() => removeDecision(d.id)}>✕</button>
                                    </div>
                                </div>
                                {d.context && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>📋 {d.context}</div>}
                                {d.rationale && <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginTop: '4px' }}>💡 {d.rationale}</div>}
                                {d.expected_outcome && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>🎯 Resultado esperado: {d.expected_outcome}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header"><div className="card-title">Registrar Decisión</div></div>
                <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="input-group"><label>Decisión</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="¿Qué decidiste?" /></div>
                    <div className="input-group"><label>Fecha de revisión</label><input className="input" type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} /></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Contexto</label><textarea className="input" rows="2" value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="¿Cuál era la situación?" /></div>
                    <div className="input-group"><label>Opciones consideradas</label><input className="input" value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} placeholder="Opción A vs B vs C" /></div>
                    <div className="input-group"><label>Razón</label><input className="input" value={form.rationale} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))} placeholder="¿Por qué esta opción?" /></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Resultado esperado</label><input className="input" value={form.expected_outcome} onChange={e => setForm(f => ({ ...f, expected_outcome: e.target.value }))} placeholder="¿Qué esperas lograr?" /></div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>{saving ? '⏳ Guardando...' : 'Registrar Decisión'}</button>
            </div>
        </div>
    )
}

export default Decisions
