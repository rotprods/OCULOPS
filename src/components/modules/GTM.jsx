// ===================================================
// ANTIGRAVITY OS — GTM Machine
// Migrated from legacy/js/gtm.js
// ===================================================

import { useState } from 'react'
import { useAppStore, uid } from '../../stores/useAppStore'

const SCRIPTS = {
    dm: `Hola [Nombre],

Vi que [empresa] está [señal de compra: creciendo / contratando / lanzando nuevo producto].

En [mi agencia] ayudamos a empresas como la tuya a [beneficio principal] usando IA y automatización.

Ejemplo: ayudamos a [referencia similar] a [resultado concreto] en [tiempo].

¿Te interesaría una llamada de 15 min para explorar si tiene sentido?

Un saludo,
[Tu nombre]`,

    email: `Asunto: [Nombre], ¿automatizáis [proceso]?

Hola [Nombre],

Soy [tu nombre] de [agencia]. Ayudamos a [tipo de empresa] a [beneficio] con IA.

Vi que [empresa] está [señal]. Normalmente, las empresas en esta fase pierden [X horas/€] en [proceso manual].

Hemos ayudado a [referencia] a resolver esto en [tiempo] con [solución breve].

¿Tiene sentido agendar 15 min esta semana?

PD: Si no eres la persona correcta, ¿podrías redirigirme?

[Firma]`,

    followup: `Follow-up 1 (3 días después):
"Hola [Nombre], quería asegurarme de que viste mi mensaje. ¿Tiene sentido explorar [beneficio]?"

Follow-up 2 (7 días después):
"[Nombre], ¿cuál es vuestra prioridad ahora con [área]? Quizá podamos ayudar."

Follow-up 3 (14 días después - valor):
"Hola [Nombre], acabo de publicar [recurso/caso de estudio] sobre [tema relevante]. Te lo comparto por si es útil: [link]"

Follow-up 4 (30 días después - break-up):
"[Nombre], entiendo que quizá no es el momento. Si en el futuro necesitáis ayuda con [área], aquí estoy. ¡Éxitos!"`,

    objections: `🔴 "Es muy caro"
→ "Entiendo. ¿Cuánto os cuesta actualmente no tener [solución]? Nuestros clientes recuperan la inversión en [X] meses."

🔴 "Ya tenemos alguien interno"
→ "Genial. ¿Están usando IA específicamente para [caso de uso]? Normalmente complementamos al equipo, no lo sustituimos."

🔴 "No es buen momento"
→ "Lo entiendo. ¿Cuándo sería mejor? Mientras tanto, ¿te envío [recurso] que puede serte útil?"

🔴 "No conozco tu empresa"
→ "Normal, somos una boutique especializada. Aquí tienes [caso de estudio] con [empresa similar]. ¿Lo revisamos juntos?"

🔴 "Necesito consultarlo"
→ "Por supuesto. ¿Quién más participa en la decisión? Puedo preparar un documento específico para ellos."`
}

const SCRIPT_TABS = [
    { key: 'dm', label: 'DM LinkedIn' },
    { key: 'email', label: 'Cold Email' },
    { key: 'followup', label: 'Follow-up' },
    { key: 'objections', label: 'Objeciones' },
]

const SOURCES = ['LinkedIn', 'Referral', 'Web', 'Evento', 'Cold Research', 'Google Maps', 'Meta', 'TikTok']
const STATUS_BADGE = {
    raw: 'badge-neutral', qualified: 'badge-success', contacted: 'badge-info',
    responded: 'badge-accent', meeting: 'badge-warning'
}

function GTM() {
    const { data, updateData, toast } = useAppStore()
    const icp = data.icp || {}
    const leads = data.leads || []
    const [activeScript, setActiveScript] = useState('dm')
    const [showAddLead, setShowAddLead] = useState(false)
    const [form, setForm] = useState({ name: '', company: '', role: '', email: '', linkedin: '', buySignal: '', source: 'LinkedIn', confidence: 60 })

    const saveICP = (field, value) => {
        updateData(d => ({ ...d, icp: { ...d.icp, [field]: value } }))
    }

    const addLead = () => {
        if (!form.name.trim()) return toast('Nombre requerido', 'warning')
        updateData(d => ({
            ...d,
            leads: [...d.leads, { ...form, id: uid(), status: 'raw', timestamp: new Date().toISOString() }]
        }))
        setForm({ name: '', company: '', role: '', email: '', linkedin: '', buySignal: '', source: 'LinkedIn', confidence: 60 })
        setShowAddLead(false)
        toast('Lead añadido', 'success')
    }

    const removeLead = (id) => {
        updateData(d => ({ ...d, leads: d.leads.filter(l => l.id !== id) }))
    }

    const moveToPipeline = (id) => {
        const lead = leads.find(l => l.id === id)
        if (!lead) return
        updateData(d => ({
            ...d,
            leads: d.leads.map(l => l.id === id ? { ...l, status: 'contacted' } : l),
            pipeline: { ...d.pipeline, lead: [...(d.pipeline?.lead || []), { ...lead, pipelineDate: new Date().toISOString() }] }
        }))
        toast(`${lead.name} movido al pipeline`, 'success')
    }

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>GTM Machine</h1>
                <p>Define tu ICP, gestiona leads hipercualificados y usa scripts de outreach probados.</p>
            </div>

            {/* ICP */}
            <div className="card mb-6">
                <div className="card-header">
                    <div className="card-title">🎯 ICP (Ideal Customer Profile)</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
                    {[
                        { key: 'companySize', label: 'Tamaño empresa' },
                        { key: 'decisionMaker', label: 'Decision Maker' },
                        { key: 'painPoints', label: 'Pain Points' },
                        { key: 'techStack', label: 'Tech Stack' },
                        { key: 'budget', label: 'Presupuesto' },
                        { key: 'buySignals', label: 'Señales de compra' },
                    ].map(f => (
                        <div key={f.key} className="input-group">
                            <label>{f.label}</label>
                            <input className="input" value={icp[f.key] || ''} onChange={e => saveICP(f.key, e.target.value)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Leads */}
            <div className="card mb-6">
                <div className="card-header">
                    <div className="card-title">👤 Leads Hipercualificados ({leads.length})</div>
                    <button className="btn btn-primary" onClick={() => setShowAddLead(!showAddLead)}>+ Lead</button>
                </div>

                {showAddLead && (
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                            <div className="input-group"><label>Nombre</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="input-group"><label>Empresa</label><input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                            <div className="input-group"><label>Rol</label><input className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
                            <div className="input-group"><label>Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            <div className="input-group"><label>LinkedIn</label><input className="input" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} /></div>
                            <div className="input-group"><label>Señal de compra</label><input className="input" value={form.buySignal} onChange={e => setForm({ ...form, buySignal: e.target.value })} placeholder="Ej: Acaba de cerrar ronda serie A" /></div>
                            <div className="input-group"><label>Fuente</label>
                                <select className="input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="input-group"><label>Confianza (0-100)</label><input className="input" type="number" value={form.confidence} onChange={e => setForm({ ...form, confidence: parseInt(e.target.value) || 0 })} min="0" max="100" /></div>
                        </div>
                        <button className="btn btn-primary mt-4" onClick={addLead}>Guardar Lead</button>
                    </div>
                )}

                {leads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🎯</div>
                        <h3>Sin leads todavía</h3>
                        <p style={{ fontSize: 'var(--text-sm)' }}>Empieza con 30 leads hipercualificados con señal de compra visible</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Nombre</th>
                                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Empresa</th>
                                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Rol</th>
                                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Señal</th>
                                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Estado</th>
                                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Score</th>
                                    <th style={{ padding: '8px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(l => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{ padding: '8px', fontWeight: 600 }}>{l.name}</td>
                                        <td style={{ padding: '8px' }}>{l.company || '-'}</td>
                                        <td style={{ padding: '8px' }}>{l.role || '-'}</td>
                                        <td style={{ padding: '8px', fontSize: 'var(--text-xs)' }}>{l.buySignal || '-'}</td>
                                        <td style={{ padding: '8px' }}><span className={`badge ${STATUS_BADGE[l.status] || 'badge-neutral'}`}>{l.status}</span></td>
                                        <td style={{ padding: '8px' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid var(--accent-primary)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                                                {l.confidence || 50}
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px', display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => moveToPipeline(l.id)}>→ Pipeline</button>
                                            <button className="btn btn-danger" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => removeLead(l.id)}>✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Outreach Scripts */}
            <div className="card mb-6">
                <div className="card-header"><div className="card-title">📝 Scripts de Outreach</div></div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    {SCRIPT_TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`btn ${activeScript === tab.key ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                            onClick={() => setActiveScript(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div style={{
                    background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4)', fontSize: 'var(--text-sm)', lineHeight: 1.8,
                    whiteSpace: 'pre-wrap', color: 'var(--text-secondary)'
                }}>
                    {SCRIPTS[activeScript]}
                </div>
            </div>
        </div>
    )
}

export default GTM
