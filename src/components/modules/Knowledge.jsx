// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Knowledge Vault
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { useKnowledge } from '../../hooks/useKnowledge'
import { useKnowledgeStore } from '../../stores/useKnowledgeStore'

const TYPES = [
    { value: 'learning', label: 'MACHINE LEARNING', icon: '🧠' },
    { value: 'playbook', label: 'OPERATIONAL PLAYBOOK', icon: '📋' },
    { value: 'template', label: 'SECURE TEMPLATE', icon: '📝' },
    { value: 'research', label: 'MARKET RESEARCH', icon: '🔬' },
    { value: 'case_study', label: 'CASE STUDY', icon: '📊' },
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

    if (loading) return <div className="fade-in mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>ACCESSING SECURE VAULT...</div>

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0 }}>KNOWLEDGE VAULT</h1>
                    <span className="mono text-xs text-tertiary">ENCRYPTED CORPORATE MEMORY & OPERATIONAL PLAYBOOKS</span>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>

                {/* ── KPI STRIP ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)' }}>
                    {TYPES.map(t => {
                        const count = (byType[t.value] || []).length
                        const isSelected = filter === t.value
                        return (
                            <div key={t.value} style={{ background: isSelected ? 'var(--color-primary)' : 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setFilter(isSelected ? 'all' : t.value)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span className="mono text-xs font-bold" style={{ color: isSelected ? '#000' : 'var(--text-tertiary)' }}>{t.label}</span>
                                    <span style={{ fontSize: '14px', opacity: isSelected ? 1 : 0.5 }}>{t.icon}</span>
                                </div>
                                <span className="mono text-lg font-bold" style={{ color: isSelected ? '#000' : 'var(--color-primary)' }}>{count}</span>
                            </div>
                        )
                    })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

                    {/* ── MAIN VAULT CONTENT ── */}
                    <div style={{ border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>/// SECURE ENTRIES [{filtered.length}]</span>
                            <div className="input-group" style={{ margin: 0 }}>
                                <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', background: '#000', borderRadius: 0, padding: '4px 8px', color: 'var(--color-primary)', width: '200px' }} placeholder="SEARCH ARCHIVE..." value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-bg-2)', flex: 1, minHeight: '300px' }}>
                            {filtered.length === 0 ? (
                                <div className="mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>NO RECORDS FOUND IN ARCHIVE.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {filtered.map((entry, idx) => (
                                        <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '14px' }}>{TYPES.find(t => t.value === entry.type)?.icon || '📖'}</span>
                                                    <span className="mono font-bold" style={{ color: 'var(--color-text)', fontSize: '14px' }}>{entry.title.toUpperCase()}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span className="mono text-xs" style={{ border: '1px solid var(--border-subtle)', color: 'var(--color-info)', padding: '2px 6px' }}>{entry.type.toUpperCase()}</span>
                                                    <span className="mono text-xs text-tertiary">{entry.date}</span>
                                                    <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => removeEntry(entry.id)}>PURGE</button>
                                                </div>
                                            </div>

                                            {entry.content && (
                                                <div className="mono text-xs" style={{ color: 'var(--color-text-2)', lineHeight: '1.5', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                                                    {entry.content.toUpperCase()}
                                                </div>
                                            )}

                                            {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {entry.tags.map((tag, i) => (
                                                        <span key={i} className="mono" style={{ fontSize: '9px', padding: '2px 6px', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
                                                            #{tag.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── NEW ENTRY TERMINAL ── */}
                    <div style={{ border: '1px solid var(--color-primary)', background: '#000', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--color-primary)', color: '#000' }}>
                            /// ENCRYPT NEW KNOWLEDGE INPUT
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="input-group">
                                <label className="mono text-xs">DESIGNATION TITLE</label>
                                <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="EX: STRATEGIC_ACQUISITION_PROTOCOL" />
                            </div>

                            <div className="input-group">
                                <label className="mono text-xs">CLASSIFICATION TYPE</label>
                                <select className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="mono text-xs">RAW INTELLIGENCE BODY</label>
                                <textarea className="input mono text-xs" rows="8" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px', resize: 'vertical' }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="ENTER SECURE DATA HERE..." />
                            </div>

                            <div className="input-group">
                                <label className="mono text-xs">METADATA TAGS (COMMA SEPARATED)</label>
                                <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="STRATEGY, OUTBOUND, EMAIL" />
                            </div>

                            <button className="btn btn-primary mono" style={{ marginTop: '16px', borderRadius: 0, padding: '12px' }} onClick={handleAdd} disabled={saving}>
                                {saving ? 'ENCRYPTING RECORD...' : 'COMMIT SECURE ENTRY'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Knowledge
