// ===================================================
// ANTIGRAVITY OS — Niches Analysis
// Wired to Supabase via useNiches hook
// ===================================================

import { useState } from 'react'
import { useNiches } from '../../hooks/useNiches'
import { Charts } from '../../lib/charts'

const emptyForm = { name: '', impact: 70, velocity: 70, scalability: 70, confidence: 70, risk: 30, resource_cost: 40 }

function Niches() {
    const { loading, addNiche, removeNiche, scored } = useNiches()
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!form.name.trim()) return
        setSaving(true)
        await addNiche({ ...form, status: 'active', impact: parseInt(form.impact), velocity: parseInt(form.velocity), scalability: parseInt(form.scalability), confidence: parseInt(form.confidence), risk: parseInt(form.risk), resource_cost: parseInt(form.resource_cost) })
        setForm(emptyForm)
        setSaving(false)
    }

    if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>⏳ Cargando nichos...</div>

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>Análisis de Nichos</h1>
                <p>CEO Score = (Impact^1.2 × Velocity^1.5 × Scalability^0.5 × Confidence) / (Risk × ResourceCost). Ranking automático.</p>
            </div>

            {/* Niche ranking */}
            <div className="card mb-6">
                <div className="card-header"><div className="card-title">Ranking por CEO Score ({scored.length} nichos)</div></div>
                {scored.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">🧬</div><h3>Sin nichos registrados</h3></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>#</th><th>Nicho</th><th>CEO Score</th><th>Impact</th><th>Velocity</th><th>Scalability</th><th>Confidence</th><th>Risk</th><th>Cost</th><th></th></tr>
                            </thead>
                            <tbody>
                                {scored.map((n, i) => (
                                    <tr key={n.id}>
                                        <td style={{ fontWeight: 800, color: i === 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.name}</td>
                                        <td>
                                            <span style={{ fontWeight: 800, fontSize: '16px', color: n.ceoScore > 60 ? 'var(--success)' : n.ceoScore > 30 ? 'var(--warning)' : 'var(--danger)' }}>{n.ceoScore}</span>
                                        </td>
                                        <td dangerouslySetInnerHTML={{ __html: Charts.scoreRing(n.impact, 100, 32) }} />
                                        <td dangerouslySetInnerHTML={{ __html: Charts.scoreRing(n.velocity, 100, 32) }} />
                                        <td dangerouslySetInnerHTML={{ __html: Charts.scoreRing(n.scalability, 100, 32) }} />
                                        <td dangerouslySetInnerHTML={{ __html: Charts.scoreRing(n.confidence, 100, 32) }} />
                                        <td style={{ color: 'var(--danger)' }}>{n.risk}</td>
                                        <td style={{ color: 'var(--warning)' }}>{n.resource_cost}</td>
                                        <td><button className="btn btn-sm btn-danger" onClick={() => removeNiche(n.id)}>✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add niche */}
            <div className="card">
                <div className="card-header"><div className="card-title">Añadir Nicho</div></div>
                <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="input-group">
                        <label>Nombre del nicho</label>
                        <input className="input" placeholder="Ej: E-commerce" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    {['impact', 'velocity', 'scalability', 'confidence', 'risk', 'resource_cost'].map(field => (
                        <div key={field} className="input-group">
                            <label>{field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')} (0-100)</label>
                            <input className="input" type="number" min="0" max="100" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                        </div>
                    ))}
                </div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>
                    {saving ? '⏳ Guardando...' : 'Añadir Nicho'}
                </button>
            </div>
        </div>
    )
}

export default Niches
