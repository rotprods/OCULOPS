// ===================================================
// ANTIGRAVITY OS — Portfolio (Strategic Bets)
// Wired to Supabase via useBets hook
// ===================================================

import { useState } from 'react'
import { useBets } from '../../hooks/useBets'

const emptyForm = { name: '', type: 'core', hypothesis: '', kpi: '', kill_criteria: '', pivot_path: '', resources: '' }

function Portfolio() {
    const { bets, loading, addBet, updateBet, removeBet, byType, active } = useBets()
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [view, setView] = useState('all')

    const handleAdd = async () => {
        if (!form.name.trim() || !form.hypothesis.trim()) return
        setSaving(true)
        await addBet({ ...form, status: 'active' })
        setForm(emptyForm)
        setSaving(false)
    }

    const toggleStatus = async (bet) => {
        const next = bet.status === 'active' ? 'paused' : bet.status === 'paused' ? 'killed' : 'active'
        await updateBet(bet.id, { status: next })
    }

    const filtered = view === 'all' ? bets : bets.filter(b => b.type === view)
    const statusColor = s => s === 'active' ? 'var(--success)' : s === 'paused' ? 'var(--warning)' : 'var(--danger)'
    const statusIcon = s => s === 'active' ? '🟢' : s === 'paused' ? '🟡' : '🔴'

    if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>⏳ Cargando portfolio...</div>

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>Portfolio de Apuestas</h1>
                <p>Apuestas estratégicas (Core 70% / Explore 30%). Click en el estado para cambiar: Active → Paused → Killed.</p>
            </div>

            <div className="grid-3 mb-6">
                <div className="kpi-card">
                    <div className="kpi-value">{active.length}</div>
                    <div className="kpi-label">Apuestas Activas</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{(byType.core || []).length}</div>
                    <div className="kpi-label">Core Bets</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{(byType.explore || []).length}</div>
                    <div className="kpi-label">Explore Bets</div>
                </div>
            </div>

            <div className="card mb-6">
                <div className="card-header">
                    <div className="card-title">Bets ({filtered.length})</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['all', 'core', 'explore'].map(f => (
                            <button key={f} className={`btn btn-sm ${view === f ? 'btn-primary' : ''}`} onClick={() => setView(f)}>
                                {f === 'all' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                {filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">🎰</div><h3>Sin apuestas</h3></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filtered.map(bet => (
                            <div key={bet.id} className="card" style={{ padding: '16px', borderLeft: `3px solid ${statusColor(bet.status)}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{bet.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>💡 {bet.hypothesis}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className="badge" style={{ cursor: 'pointer', background: statusColor(bet.status) + '22', color: statusColor(bet.status) }} onClick={() => toggleStatus(bet)}>
                                            {statusIcon(bet.status)} {bet.status}
                                        </span>
                                        <span className="badge badge-info">{bet.type}</span>
                                        {bet.resources && <span className="badge badge-neutral">{bet.resources}</span>}
                                        <button className="btn btn-sm btn-danger" onClick={() => removeBet(bet.id)}>✕</button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '11px' }}>
                                    <div><span style={{ color: 'var(--text-tertiary)' }}>KPI:</span> <span style={{ color: 'var(--success)' }}>{bet.kpi || '-'}</span></div>
                                    <div><span style={{ color: 'var(--text-tertiary)' }}>Kill:</span> <span style={{ color: 'var(--danger)' }}>{bet.kill_criteria || '-'}</span></div>
                                    <div><span style={{ color: 'var(--text-tertiary)' }}>Pivot:</span> <span style={{ color: 'var(--warning)' }}>{bet.pivot_path || '-'}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header"><div className="card-title">Nueva Apuesta</div></div>
                <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="input-group"><label>Nombre</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Automatización para e-commerce" /></div>
                    <div className="input-group"><label>Tipo</label><select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="core">Core (70%)</option><option value="explore">Explore (30%)</option></select></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Hipótesis</label><textarea className="input" rows="2" value={form.hypothesis} onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))} placeholder="¿Qué crees y por qué?" /></div>
                    <div className="input-group"><label>KPI</label><input className="input" value={form.kpi} onChange={e => setForm(f => ({ ...f, kpi: e.target.value }))} placeholder="Ej: 3 clientes en 30 días" /></div>
                    <div className="input-group"><label>Kill Criteria</label><input className="input" value={form.kill_criteria} onChange={e => setForm(f => ({ ...f, kill_criteria: e.target.value }))} placeholder="Cuándo matar esta apuesta" /></div>
                    <div className="input-group"><label>Pivot Path</label><input className="input" value={form.pivot_path} onChange={e => setForm(f => ({ ...f, pivot_path: e.target.value }))} placeholder="Plan B si falla" /></div>
                    <div className="input-group"><label>Recursos</label><input className="input" value={form.resources} onChange={e => setForm(f => ({ ...f, resources: e.target.value }))} placeholder="Ej: 50%" /></div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>{saving ? '⏳ Guardando...' : 'Crear Apuesta'}</button>
            </div>
        </div>
    )
}

export default Portfolio
