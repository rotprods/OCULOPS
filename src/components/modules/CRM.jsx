// ═══════════════════════════════════════════════════
// OCULOPS — Data Hub (CRM)
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ═══════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useContacts } from '../../hooks/useContacts'
import { useCompanies } from '../../hooks/useCompanies'
import { useDeals } from '../../hooks/useDeals'
import { useActivities } from '../../hooks/useActivities'
import { useAtlasCRM } from '../../hooks/useAtlasCRM'
import { useAppStore } from '../../stores/useAppStore'
import { isSupabaseConfigured } from '../../lib/supabase'

const TABS = [
    { id: 'contacts', label: '01. PERSONNEL' },
    { id: 'companies', label: '02. COMPANIES' },
    { id: 'deals', label: '03. DEAL FLOW' },
    { id: 'activities', label: '04. ACTIVITY LOG' },
]

const CONTACT_STATUSES = ['raw', 'contacted', 'qualified', 'nurturing', 'converted', 'lost']
const COMPANY_STATUSES = ['prospected', 'contacted', 'active', 'churned']
const DEAL_STAGES = ['lead', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

function formatCurrency(value) {
    const amount = Number(value) || 0
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatDateTime(value) {
    if (!value) return '—'
    return new Date(value).toLocaleString().toUpperCase()
}

function emptyRow(columns, label) {
    return (
        <tr>
            <td colSpan={columns} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                {label}
            </td>
        </tr>
    )
}

function tabButton(activeTab, tabId) {
    return {
        fontSize: '9px',
        padding: '6px 12px',
        background: activeTab === tabId ? 'var(--color-primary)' : 'transparent',
        color: activeTab === tabId ? '#000' : 'var(--color-text)',
        border: activeTab === tabId ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
        cursor: 'pointer',
    }
}

function deleteButtonStyle() {
    return {
        fontSize: '9px',
        padding: '2px 8px',
        borderColor: 'var(--color-danger)',
        color: 'var(--color-danger)',
    }
}

function rowStyle(index, total, isHovered) {
    return {
        borderBottom: index < total - 1 ? '1px solid var(--border-subtle)' : 'none',
        background: isHovered ? 'rgba(255,212,0,0.05)' : (index % 2 === 0 ? 'transparent' : '#000'),
        cursor: 'pointer',
        transition: 'background 150ms',
    }
}

// ── Shared modal styles ──
const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}
const panelStyle = {
    background: '#000', border: '1px solid var(--color-primary)',
    padding: '24px', width: '560px', maxHeight: '80vh', overflowY: 'auto',
    boxShadow: '0 0 30px rgba(255,212,0,0.1)'
}
const inputStyle = {
    width: '100%', background: '#000', border: '1px solid var(--color-border)',
    color: 'var(--color-text)', padding: '8px 10px', fontSize: '12px',
    fontFamily: 'var(--font-mono)', outline: 'none',
}
const labelStyle = {
    fontSize: '9px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)',
    marginBottom: '4px', display: 'block', letterSpacing: '0.06em',
}
const footerStyle = {
    display: 'flex', justifyContent: 'space-between', marginTop: '20px',
    paddingTop: '16px', borderTop: '1px solid var(--color-border)',
}

// ── Search bar component ──
function SearchBar({ value, onChange, placeholder, onAdd }) {
    return (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
                className="mono"
                style={{ ...inputStyle, flex: 1 }}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
            />
            <button
                className="btn btn-ghost mono"
                style={{ fontSize: '9px', padding: '6px 16px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}
                onClick={onAdd}
            >
                + NEW
            </button>
        </div>
    )
}

// ── Contact Modal ──
function ContactModal({ contact, companies, onSave, onDelete, onClose }) {
    const isNew = !contact.id
    const [form, setForm] = useState({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company_id: contact.company_id || '',
        status: contact.status || 'raw',
        position: contact.position || '',
        notes: contact.notes || '',
    })

    useEffect(() => {
        const handler = e => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const handleSave = () => {
        if (!form.name.trim()) return
        onSave(form)
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={panelStyle} onClick={e => e.stopPropagation()}>
                <div className="mono text-xs font-bold" style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>
                    {isNew ? '/// NEW PERSONNEL RECORD' : `/// EDIT PERSONNEL — ${contact.id?.slice(0, 8).toUpperCase()}`}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={labelStyle}>NAME *</label>
                        <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>EMAIL</label>
                        <input style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>PHONE</label>
                        <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>POSITION</label>
                        <input style={inputStyle} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>COMPANY</label>
                        <select style={inputStyle} value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
                            <option value="">— NONE —</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>STATUS</label>
                        <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                            {CONTACT_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>NOTES</label>
                        <textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                </div>
                <div style={footerStyle}>
                    <div>
                        {!isNew && (
                            <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '6px 12px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => onDelete(contact.id)}>
                                PURGE
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '6px 12px' }} onClick={onClose}>ABORT</button>
                        <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '6px 16px', background: 'var(--color-primary)', color: '#000', border: '1px solid var(--color-primary)' }} onClick={handleSave}>
                            COMMIT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Company Modal ──
function CompanyModal({ company, onSave, onDelete, onClose }) {
    const isNew = !company.id
    const [form, setForm] = useState({
        name: company.name || '',
        website: company.website || '',
        industry: company.industry || '',
        location: company.location || '',
        status: company.status || 'prospected',
        notes: company.notes || '',
    })

    useEffect(() => {
        const handler = e => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const handleSave = () => {
        if (!form.name.trim()) return
        onSave(form)
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={panelStyle} onClick={e => e.stopPropagation()}>
                <div className="mono text-xs font-bold" style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>
                    {isNew ? '/// NEW CORPORATE ENTITY' : `/// EDIT ENTITY — ${company.id?.slice(0, 8).toUpperCase()}`}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={labelStyle}>NAME *</label>
                        <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>WEBSITE</label>
                        <input style={inputStyle} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>INDUSTRY</label>
                        <input style={inputStyle} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>LOCATION</label>
                        <input style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>STATUS</label>
                        <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                            {COMPANY_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>NOTES</label>
                        <textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                </div>
                <div style={footerStyle}>
                    <div>
                        {!isNew && (
                            <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '6px 12px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => onDelete(company.id)}>
                                PURGE
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '6px 12px' }} onClick={onClose}>ABORT</button>
                        <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '6px 16px', background: 'var(--color-primary)', color: '#000', border: '1px solid var(--color-primary)' }} onClick={handleSave}>
                            COMMIT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Deal Modal ──
function DealModal({ deal, companies, onSave, onDelete, onClose }) {
    const isNew = !deal.id
    const [form, setForm] = useState({
        title: deal.title || '',
        company_id: deal.company_id || '',
        value: deal.value || 0,
        stage: deal.stage || 'lead',
        probability: deal.probability || 0,
        expected_close_date: deal.expected_close_date || '',
        notes: deal.notes || '',
    })

    useEffect(() => {
        const handler = e => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const handleSave = () => {
        if (!form.title.trim()) return
        onSave({ ...form, value: Number(form.value) || 0, probability: Number(form.probability) || 0 })
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={panelStyle} onClick={e => e.stopPropagation()}>
                <div className="mono text-xs font-bold" style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>
                    {isNew ? '/// NEW OPERATION' : `/// EDIT OPERATION — ${deal.id?.slice(0, 8).toUpperCase()}`}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>TITLE *</label>
                        <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>COMPANY</label>
                        <select style={inputStyle} value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
                            <option value="">— NONE —</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>VALUE ($)</label>
                        <input style={inputStyle} type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>STAGE</label>
                        <select style={inputStyle} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                            {DEAL_STAGES.map(s => <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>PROBABILITY %</label>
                        <input style={inputStyle} type="number" min="0" max="100" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>EXPECTED CLOSE</label>
                        <input style={inputStyle} type="date" value={form.expected_close_date} onChange={e => setForm(f => ({ ...f, expected_close_date: e.target.value }))} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>NOTES</label>
                        <textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                </div>
                <div style={footerStyle}>
                    <div>
                        {!isNew && (
                            <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '6px 12px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => onDelete(deal.id)}>
                                PURGE
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '6px 12px' }} onClick={onClose}>ABORT</button>
                        <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '6px 16px', background: 'var(--color-primary)', color: '#000', border: '1px solid var(--color-primary)' }} onClick={handleSave}>
                            COMMIT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Hover Row wrapper ──
function HoverRow({ children, index, total, onClick }) {
    const [hovered, setHovered] = useState(false)
    return (
        <tr
            style={rowStyle(index, total, hovered)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
        >
            {children}
        </tr>
    )
}

function CRM() {
    const [activeTab, setActiveTab] = useState('contacts')
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(null) // { type: 'contact'|'company'|'deal', data: {} }
    const toast = useAppStore(s => s.toast)

    const {
        contacts,
        loading: contactsLoading,
        addContact,
        updateContact,
        removeContact,
        reload: reloadContacts,
    } = useContacts()
    const {
        companies,
        loading: companiesLoading,
        addCompany,
        updateCompany,
        removeCompany,
        reload: reloadCompanies,
    } = useCompanies()
    const {
        deals,
        loading: dealsLoading,
        addDeal,
        updateDeal,
        removeDeal,
        reload: reloadDeals,
    } = useDeals()
    const {
        activities,
        loading: activitiesLoading,
        removeActivity,
        reload: reloadActivities,
    } = useActivities()
    const {
        importingLeadId,
        bulkImporting,
        stagingKey,
        error: atlasError,
    } = useAtlasCRM()

    const loading = contactsLoading || companiesLoading || dealsLoading || activitiesLoading
    const syncBusy = bulkImporting || Boolean(importingLeadId) || Boolean(stagingKey)
    const atlasOnline = isSupabaseConfigured
    const systemHealthy = isSupabaseConfigured && !atlasError

    // Filtered data
    const q = search.toLowerCase()
    const filteredContacts = useMemo(() =>
        contacts.filter(c => !q || (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.company?.name || '').toLowerCase().includes(q)),
        [contacts, q]
    )
    const filteredCompanies = useMemo(() =>
        companies.filter(c => !q || c.name.toLowerCase().includes(q) || (c.industry || '').toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q)),
        [companies, q]
    )
    const filteredDeals = useMemo(() =>
        deals.filter(d => !q || (d.title || '').toLowerCase().includes(q) || (d.company?.name || '').toLowerCase().includes(q) || (d.stage || '').toLowerCase().includes(q)),
        [deals, q]
    )
    const filteredActivities = useMemo(() =>
        activities.filter(a => !q || (a.subject || a.description || '').toLowerCase().includes(q) || (a.type || '').toLowerCase().includes(q)),
        [activities, q]
    )

    const handleSyncAtlas = useCallback(async () => {
        await Promise.all([reloadContacts(), reloadCompanies(), reloadDeals(), reloadActivities()])
    }, [reloadContacts, reloadCompanies, reloadDeals, reloadActivities])

    // Modal handlers
    const openNew = useCallback((type) => setModal({ type, data: {} }), [])
    const closeModal = useCallback(() => setModal(null), [])

    const handleContactSave = useCallback(async (form) => {
        if (modal.data.id) {
            await updateContact(modal.data.id, form)
            toast('PERSONNEL UPDATED', 'info')
        } else {
            await addContact(form)
            toast('PERSONNEL CREATED', 'info')
        }
        setModal(null)
    }, [modal, updateContact, addContact, toast])

    const handleContactDelete = useCallback(async (id) => {
        await removeContact(id)
        toast('PERSONNEL PURGED', 'info')
        setModal(null)
    }, [removeContact, toast])

    const handleCompanySave = useCallback(async (form) => {
        if (modal.data.id) {
            await updateCompany(modal.data.id, form)
            toast('ENTITY UPDATED', 'info')
        } else {
            await addCompany(form)
            toast('ENTITY CREATED', 'info')
        }
        setModal(null)
    }, [modal, updateCompany, addCompany, toast])

    const handleCompanyDelete = useCallback(async (id) => {
        await removeCompany(id)
        toast('ENTITY PURGED', 'info')
        setModal(null)
    }, [removeCompany, toast])

    const handleDealSave = useCallback(async (form) => {
        if (modal.data.id) {
            await updateDeal(modal.data.id, form)
            toast('OPERATION UPDATED', 'info')
        } else {
            await addDeal(form)
            toast('OPERATION CREATED', 'info')
        }
        setModal(null)
    }, [modal, updateDeal, addDeal, toast])

    const handleDealDelete = useCallback(async (id) => {
        await removeDeal(id)
        toast('OPERATION PURGED', 'info')
        setModal(null)
    }, [removeDeal, toast])

    // Clear search when switching tabs
    useEffect(() => { setSearch('') }, [activeTab])

    const searchPlaceholder = {
        contacts: 'SEARCH PERSONNEL BY NAME, EMAIL, COMPANY...',
        companies: 'SEARCH ENTITIES BY NAME, INDUSTRY, LOCATION...',
        deals: 'SEARCH OPERATIONS BY TITLE, COMPANY, STAGE...',
        activities: 'SEARCH ACTIVITY BY SUBJECT, TYPE...',
    }

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0 }}>CORTEX CRM VAULT</h1>
                    <span className="mono text-xs text-tertiary">LIVE CONTACTS, COMPANIES, DEALS AND ACTIVITIES</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className="mono"
                            style={tabButton(activeTab, tab.id)}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Status bar */}
            <div style={{ border: '1px solid var(--border-subtle)', background: '#000', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="mono text-xs font-bold" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: systemHealthy ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            SYSTEM LINK: {systemHealthy ? 'SECURE' : 'DEGRADED'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
                        <span style={{ color: atlasOnline ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>
                            ATLAS DB: {atlasOnline ? 'CONNECTED' : 'OFFLINE'}
                        </span>
                    </div>
                    {atlasError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px', color: 'var(--color-danger)' }}>
                            {atlasError.toUpperCase()}
                        </div>
                    )}
                </div>
                <button
                    className="btn btn-ghost btn-sm mono"
                    style={{ fontSize: '9px', padding: '4px 12px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
                    onClick={handleSyncAtlas}
                    disabled={syncBusy}
                >
                    {syncBusy ? 'SYNC BUSY' : 'FORCE DB SYNC'}
                </button>
            </div>

            {/* Search bar */}
            <SearchBar
                value={search}
                onChange={setSearch}
                placeholder={searchPlaceholder[activeTab]}
                onAdd={() => {
                    if (activeTab === 'contacts') openNew('contact')
                    else if (activeTab === 'companies') openNew('company')
                    else if (activeTab === 'deals') openNew('deal')
                }}
            />

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '32px' }}>
                {loading && (
                    <div className="mono text-xs text-tertiary" style={{ padding: '16px 0' }}>
                        SYNCHRONIZING LIVE CRM DATA...
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <div style={{ border: '1px solid var(--border-subtle)', background: '#000', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'rgba(255,212,0,0.05)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--color-primary)' }}>
                            /// IDENTIFIED PERSONNEL [{filteredContacts.length}]
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <thead style={{ background: '#000', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>NAME</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>COMPANY</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>EMAIL</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>PHONE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>STATUS</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-danger)' }}>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map((contact, index) => (
                                    <HoverRow key={contact.id} index={index} total={filteredContacts.length} onClick={() => setModal({ type: 'contact', data: contact })}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{contact.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{(contact.name || 'UNKNOWN').toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-info)' }}>{contact.company?.name ? contact.company.name.toUpperCase() : '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{contact.email ? contact.email.toUpperCase() : '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text-2)' }}>{contact.phone || '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{(contact.status || 'raw').toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button className="btn btn-ghost mono" style={deleteButtonStyle()} onClick={e => { e.stopPropagation(); removeContact(contact.id) }}>DEL</button>
                                        </td>
                                    </HoverRow>
                                ))}
                                {filteredContacts.length === 0 && emptyRow(7, 'NO PERSONNEL RECORDED')}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'companies' && (
                    <div style={{ border: '1px solid var(--border-subtle)', background: '#000', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'rgba(255,212,0,0.05)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--color-primary)' }}>
                            /// CORPORATE ENTITIES [{filteredCompanies.length}]
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <thead style={{ background: '#000', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>NAME</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>WEBSITE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>INDUSTRY</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>LOCATION</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>STATUS</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-danger)' }}>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCompanies.map((company, index) => (
                                    <HoverRow key={company.id} index={index} total={filteredCompanies.length} onClick={() => setModal({ type: 'company', data: company })}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{company.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{company.name.toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{company.website ? company.website.toUpperCase() : '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-info)' }}>{company.industry ? company.industry.toUpperCase() : '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{company.location ? company.location.toUpperCase() : '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{(company.status || 'prospected').toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button className="btn btn-ghost mono" style={deleteButtonStyle()} onClick={e => { e.stopPropagation(); removeCompany(company.id) }}>DEL</button>
                                        </td>
                                    </HoverRow>
                                ))}
                                {filteredCompanies.length === 0 && emptyRow(7, 'NO ENTITIES RECORDED')}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'deals' && (
                    <div style={{ border: '1px solid var(--border-subtle)', background: '#000', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'rgba(255,212,0,0.05)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--color-primary)' }}>
                            /// ONGOING OPERATIONS [{filteredDeals.length}]
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <thead style={{ background: '#000', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>TITLE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>COMPANY</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>VALUE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>STAGE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>PROB</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-danger)' }}>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDeals.map((deal, index) => (
                                    <HoverRow key={deal.id} index={index} total={filteredDeals.length} onClick={() => setModal({ type: 'deal', data: deal })}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{deal.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{(deal.title || 'UNTITLED').toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-info)' }}>{deal.company?.name ? deal.company.name.toUpperCase() : '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-success)', fontWeight: 'bold' }}>{formatCurrency(deal.value)}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-warning)' }}>{(deal.stage || 'lead').toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{deal.probability || 0}%</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button className="btn btn-ghost mono" style={deleteButtonStyle()} onClick={e => { e.stopPropagation(); removeDeal(deal.id) }}>DEL</button>
                                        </td>
                                    </HoverRow>
                                ))}
                                {filteredDeals.length === 0 && emptyRow(7, 'NO OPERATIONS RECORDED')}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'activities' && (
                    <div style={{ border: '1px solid var(--border-subtle)', background: '#000', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'rgba(255,212,0,0.05)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--color-primary)' }}>
                            /// ACTIVITY LOG ENTRY [{filteredActivities.length}]
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <thead style={{ background: '#000', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>TYPE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>SUBJECT</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>LINKED ENTITY</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-2)' }}>CREATED</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-danger)' }}>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActivities.map((activity, index) => (
                                    <HoverRow key={activity.id} index={index} total={filteredActivities.length} onClick={() => { }}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{activity.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{(activity.type || 'note').toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{(activity.subject || activity.description || 'UNTITLED').toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-info)' }}>
                                            {(activity.company?.name || activity.contact?.name || activity.deal?.title || '—').toUpperCase()}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{formatDateTime(activity.created_at)}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button className="btn btn-ghost mono" style={deleteButtonStyle()} onClick={e => { e.stopPropagation(); removeActivity(activity.id) }}>DEL</button>
                                        </td>
                                    </HoverRow>
                                ))}
                                {filteredActivities.length === 0 && emptyRow(6, 'NO ACTIVITY RECORDED')}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {modal?.type === 'contact' && (
                <ContactModal
                    contact={modal.data}
                    companies={companies}
                    onSave={handleContactSave}
                    onDelete={handleContactDelete}
                    onClose={closeModal}
                />
            )}
            {modal?.type === 'company' && (
                <CompanyModal
                    company={modal.data}
                    onSave={handleCompanySave}
                    onDelete={handleCompanyDelete}
                    onClose={closeModal}
                />
            )}
            {modal?.type === 'deal' && (
                <DealModal
                    deal={modal.data}
                    companies={companies}
                    onSave={handleDealSave}
                    onDelete={handleDealDelete}
                    onClose={closeModal}
                />
            )}
        </div>
    )
}

export default CRM
