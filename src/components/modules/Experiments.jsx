// ═══════════════════════════════════════════════════
// OCULOPS — Experiments Lab
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ═══════════════════════════════════════════════════

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

    if (loading) return <div className="fade-in mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>ACCESSING LABORATORY DATA...</div>

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0 }}>R&D OUTPOST</h1>
                    <span className="mono text-xs text-tertiary">GROWTH EXPERIMENTS & HYPOTHESIS TESTING</span>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>

                {/* ── KPI STRIP ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)' }}>
                    <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className="mono text-xs text-tertiary">ACTIVE EXPERIMENTS</span>
                            <span style={{ fontSize: '14px', color: 'var(--color-info)' }}>🔬</span>
                        </div>
                        <span className="mono text-lg font-bold" style={{ color: 'var(--color-text)' }}>{active.length}</span>
                    </div>
                    <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className="mono text-xs text-tertiary">PROVEN HYPOTHESES</span>
                            <span style={{ fontSize: '14px', color: 'var(--color-success)' }}>✅</span>
                        </div>
                        <span className="mono text-lg font-bold" style={{ color: 'var(--color-success)' }}>{concluded.filter(e => e.result === 'success').length}</span>
                    </div>
                    <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className="mono text-xs text-tertiary">REJECTED HYPOTHESES</span>
                            <span style={{ fontSize: '14px', color: 'var(--color-danger)' }}>❌</span>
                        </div>
                        <span className="mono text-lg font-bold" style={{ color: 'var(--color-danger)' }}>{concluded.filter(e => e.result === 'failed').length}</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* ACTIVE EXPERIMENTS */}
                        <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                            <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>/// LIVE DATA STREAMS [{active.length}]</div>
                            {active.length === 0 ? (
                                <div className="mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>NO EXPERIMENTS IN PROGRESS.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {active.map((exp, idx) => (
                                        <div key={exp.id} style={{ padding: '16px', borderBottom: idx < active.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000', borderLeft: '2px solid var(--color-info)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div className="mono font-bold" style={{ color: 'var(--color-text)', fontSize: '14px' }}>{exp.name.toUpperCase()}</div>
                                                    <div className="mono text-xs" style={{ color: 'var(--color-info)', marginTop: '4px' }}>HYP_1: {exp.hypothesis.toUpperCase()}</div>
                                                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                                                        METRIC: <span style={{ color: 'var(--color-text)' }}>{exp.metric.toUpperCase() || 'N/A'}</span> <span style={{ margin: '0 8px' }}>|</span>
                                                        TARGET: <span style={{ color: 'var(--color-success)' }}>{exp.target_value.toUpperCase() || 'N/A'}</span> <span style={{ margin: '0 8px' }}>|</span>
                                                        BASELINE: <span style={{ color: 'var(--color-warning)' }}>{exp.baseline.toUpperCase() || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '4px 8px', borderColor: 'var(--color-success)', color: 'var(--color-success)' }} onClick={() => conclude(exp, 'success')}>MARK SUCCESS</button>
                                                    <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '4px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => conclude(exp, 'failed')}>MARK FAILED</button>
                                                    <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '4px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => removeExperiment(exp.id)}>DEL</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* CONCLUDED EXPERIMENTS */}
                        {concluded.length > 0 && (
                            <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                                <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>/// ARCHIVED RESULTS [{concluded.length}]</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#000', color: 'var(--text-tertiary)' }}>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold' }}>EXPERIMENT</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold' }}>VERDICT</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold' }}>START T-MINUS</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold' }}>END T-MINUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {concluded.map((exp, idx) => (
                                            <tr key={exp.id} style={{ borderBottom: idx < concluded.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000' }}>
                                                <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{exp.name.toUpperCase()}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ fontSize: '9px', padding: '2px 6px', border: `1px solid var(--color-${exp.result === 'success' ? 'success' : 'danger'})`, color: `var(--color-${exp.result === 'success' ? 'success' : 'danger'})` }}>
                                                        {exp.result === 'success' ? 'PROVEN' : 'REJECTED'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{exp.start_date || '—'}</td>
                                                <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{exp.end_date || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ADD EXPERIMENT FORM */}
                    <div style={{ border: '1px solid var(--color-primary)', background: '#000', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--color-primary)', color: '#000' }}>
                            /// INITIALIZE NEW VECTOR
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="input-group">
                                <label className="mono text-xs">VECTOR DESIGNATION</label>
                                <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="EX: A/B EMAIL TEST" />
                            </div>
                            <div className="input-group">
                                <label className="mono text-xs">DURATION (CYCLE DAYS)</label>
                                <input className="input mono text-xs" type="number" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} />
                            </div>

                            <div className="input-group">
                                <label className="mono text-xs">PRIMARY HYPOTHESIS</label>
                                <textarea className="input mono text-xs" rows="3" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px', resize: 'vertical' }} value={form.hypothesis} onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))} placeholder="STATE HYPOTHESIS MATRIX..." />
                            </div>

                            <div className="input-group">
                                <label className="mono text-xs">MEASUREMENT METRIC</label>
                                <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} placeholder="EX: REPLY RATE %" />
                            </div>
                            <div className="input-group">
                                <label className="mono text-xs">BASELINE VALUE</label>
                                <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={form.baseline} onChange={e => setForm(f => ({ ...f, baseline: e.target.value }))} placeholder="EX: 1.2%" />
                            </div>
                            <div className="input-group">
                                <label className="mono text-xs">TARGET VELOCITY</label>
                                <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} placeholder="EX: 3.0%" />
                            </div>

                            <button className="btn btn-primary mono" style={{ marginTop: '16px', borderRadius: 0, padding: '12px' }} onClick={handleAdd} disabled={saving}>
                                {saving ? 'INITIALIZING...' : 'LAUNCH PROTOCOL'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Experiments
