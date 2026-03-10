// ===================================================
// ANTIGRAVITY OS — Knowledge Vault
// Wired to Supabase via useKnowledge hook
// ===================================================

import { useState } from 'react'
import { useKnowledge } from '../../hooks/useKnowledge'
import { useKnowledgeStore } from '../../stores/useKnowledgeStore'

const TYPES = [
    { value: 'learning', label: 'Aprendizaje', icon: '📖' },
    { value: 'playbook', label: 'Playbook', icon: '📋' },
    { value: 'template', label: 'Template', icon: '📝' },
    { value: 'research', label: 'Investigación', icon: '🔬' },
    { value: 'case_study', label: 'Caso de estudio', icon: '📊' },
]

const emptyForm = { title: '', type: 'learning', content: '', tags: '' }

function Knowledge() {
    const { entries, loading, addEntry, removeEntry, byType } = useKnowledge()
    const { search, typeFilter: filter, setSearch, setTypeFilter: setFilter } = useKnowledgeStore()
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!form.title.trim()) return
        setSaving(true)
        await addEntry({ ...form, date: new Date().toISOString().split('T')[0], tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
        setForm(emptyForm)
        setSaving(false)
    }

    const filtered = entries
        .filter(e => filter === 'all' || e.type === filter)
        .filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.content?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

    if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>⏳ Cargando conocimiento...</div>

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>Knowledge Vault</h1>
                <p>Base de conocimiento: aprendizajes, playbooks, templates, investigación y casos de estudio.</p>
            </div>

            <div className="grid-5 mb-6">
                {TYPES.map(t => (
                    <div key={t.value} className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setFilter(t.value === filter ? 'all' : t.value)}>
                        <div style={{ fontSize: '24px' }}>{t.icon}</div>
                        <div className="kpi-value">{(byType[t.value] || []).length}</div>
                        <div className="kpi-label">{t.label}</div>
                    </div>
                ))}
            </div>

            <div className="card mb-6">
                <div className="card-header">
                    <div className="card-title">Entradas ({filtered.length})</div>
                    <input className="input" style={{ maxWidth: '250px' }} placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📚</div><h3>Sin entradas</h3><p className="text-muted">Añade conocimiento para construir tu base</p></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filtered.map(entry => (
                            <div key={entry.id} className="card" style={{ padding: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 700 }}>{TYPES.find(t => t.value === entry.type)?.icon || '📖'} {entry.title}</div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <span className="badge badge-info">{entry.type}</span>
                                        <span className="badge badge-neutral mono" style={{ fontSize: '10px' }}>{entry.date}</span>
                                        <button className="btn btn-sm btn-danger" onClick={() => removeEntry(entry.id)}>✕</button>
                                    </div>
                                </div>
                                {entry.content && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', whiteSpace: 'pre-wrap' }}>{entry.content}</div>}
                                {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                                        {entry.tags.map((tag, i) => <span key={i} className="badge" style={{ fontSize: '10px', background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}>#{tag}</span>)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header"><div className="card-title">Añadir Entrada</div></div>
                <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="input-group"><label>Título</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Cómo cerrar un deal en 7 días" /></div>
                    <div className="input-group"><label>Tipo</label><select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}</select></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Contenido</label><textarea className="input" rows="4" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Escribe el contenido..." /></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Tags (separados por coma)</label><input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="ventas, outbound, email" /></div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>{saving ? '⏳ Guardando...' : 'Guardar Entrada'}</button>
            </div>
        </div>
    )
}

export default Knowledge
