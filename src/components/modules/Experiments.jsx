// ===================================================
// ANTIGRAVITY OS — Experiments Lab
// Wired to Supabase via useExperiments hook
// ===================================================

import { useState } from 'react'
import { useExperiments } from '../../hooks/useExperiments'

const emptyForm = { name: '', hypothesis: '', metric: '', baseline: '', target_value: '', duration_days: 14 }

function Experiments() {
    const { loading, addExperiment, updateExperiment, removeExperiment, active, concluded } = useExperiments()
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!form.name.trim() || !form.hypothesis.trim()) return
        setSaving(true)
        await addExperiment({ ...form, status: 'active', start_date: new Date().toISOString().split('T')[0], duration_days: parseInt(form.duration_days) })
        setForm(emptyForm)
        setSaving(false)
    }

    const conclude = async (exp, result) => {
        await updateExperiment(exp.id, { status: 'concluded', result, end_date: new Date().toISOString().split('T')[0] })
    }

    if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>⏳ Cargando experimentos...</div>

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>Laboratorio de Experimentos</h1>
                <p>Prueba hipótesis con datos. Cada experimento tiene métricas, baseline y target claros.</p>
            </div>

            <div className="grid-3 mb-6">
                <div className="kpi-card"><div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>{active.length}</div><div className="kpi-label">Activos</div></div>
                <div className="kpi-card"><div className="kpi-value" style={{ color: 'var(--success)' }}>{concluded.filter(e => e.result === 'success').length}</div><div className="kpi-label">Éxitos</div></div>
                <div className="kpi-card"><div className="kpi-value" style={{ color: 'var(--danger)' }}>{concluded.filter(e => e.result === 'failed').length}</div><div className="kpi-label">Fallidos</div></div>
            </div>

            {/* Active experiments */}
            {active.length > 0 && (
                <div className="card mb-6">
                    <div className="card-header"><div className="card-title">🔬 Experimentos Activos</div></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {active.map(exp => (
                            <div key={exp.id} className="card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{exp.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>💡 {exp.hypothesis}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>📏 {exp.metric || '-'} | Base: {exp.baseline || '-'} → Target: {exp.target_value || '-'} | {exp.duration_days || 14} días</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button className="btn btn-sm" style={{ background: 'var(--success)22', color: 'var(--success)' }} onClick={() => conclude(exp, 'success')}>✅ Éxito</button>
                                        <button className="btn btn-sm" style={{ background: 'var(--danger)22', color: 'var(--danger)' }} onClick={() => conclude(exp, 'failed')}>❌ Fallido</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => removeExperiment(exp.id)}>🗑️</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Concluded experiments */}
            {concluded.length > 0 && (
                <div className="card mb-6">
                    <div className="card-header"><div className="card-title">📊 Experimentos Concluidos</div></div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Experimento</th><th>Hipótesis</th><th>Resultado</th><th>Inicio</th><th>Fin</th></tr></thead>
                            <tbody>
                                {concluded.map(exp => (
                                    <tr key={exp.id}>
                                        <td style={{ fontWeight: 600 }}>{exp.name}</td>
                                        <td style={{ fontSize: '11px', maxWidth: '250px' }}>{exp.hypothesis}</td>
                                        <td><span className={`badge ${exp.result === 'success' ? 'badge-success' : 'badge-danger'}`}>{exp.result === 'success' ? '✅ Éxito' : '❌ Fallido'}</span></td>
                                        <td className="mono text-xs">{exp.start_date || '-'}</td>
                                        <td className="mono text-xs">{exp.end_date || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add experiment */}
            <div className="card">
                <div className="card-header"><div className="card-title">Nuevo Experimento</div></div>
                <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="input-group"><label>Nombre</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Test outreach LinkedIn vs Email" /></div>
                    <div className="input-group"><label>Duración (días)</label><input className="input" type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} /></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Hipótesis</label><textarea className="input" rows="2" value={form.hypothesis} onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))} placeholder="¿Qué crees y por qué?" /></div>
                    <div className="input-group"><label>Métrica</label><input className="input" value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} placeholder="Ej: response rate" /></div>
                    <div className="input-group"><label>Baseline</label><input className="input" value={form.baseline} onChange={e => setForm(f => ({ ...f, baseline: e.target.value }))} placeholder="Valor actual" /></div>
                    <div className="input-group"><label>Target</label><input className="input" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} placeholder="Valor objetivo" /></div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>{saving ? '⏳ Guardando...' : 'Crear Experimento'}</button>
            </div>
        </div>
    )
}

export default Experiments
