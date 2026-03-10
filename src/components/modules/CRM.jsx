// ===================================================
// ANTIGRAVITY OS — CRM Module
// Contacts, companies, deals and outreach connected to Supabase
// ===================================================

import { useMemo, useState } from 'react'
import { useContacts } from '../../hooks/useContacts'
import { useCompanies } from '../../hooks/useCompanies'
import { useDeals } from '../../hooks/useDeals'
import { useActivities } from '../../hooks/useActivities'
import { useAtlasCRM } from '../../hooks/useAtlasCRM'
import { useAppStore } from '../../stores/useAppStore'
import { useLeadStore } from '../../stores/useLeadStore'

const TABS = [
    { key: 'contacts', icon: '👤', label: 'Contactos' },
    { key: 'companies', icon: '🏢', label: 'Empresas' },
    { key: 'deals', icon: '💎', label: 'Deals' },
    { key: 'activities', icon: '📋', label: 'Actividades' },
]

const STAGE_COLORS = {
    lead: 'var(--text-tertiary)',
    contacted: 'var(--info)',
    response: 'var(--accent-primary)',
    meeting: 'var(--warning)',
    proposal: 'var(--accent-secondary, var(--warning))',
    negotiation: 'var(--warning)',
    closed_won: 'var(--success)',
    closed_lost: 'var(--danger)',
    onboarding: 'var(--success)',
}

const STATUS_BADGE = {
    active: 'badge-success',
    prospected: 'badge-info',
    client: 'badge-success',
    churned: 'badge-danger',
    raw: 'badge-neutral',
    qualified: 'badge-success',
    contacted: 'badge-info',
    responded: 'badge-info',
    meeting: 'badge-warning',
    proposal: 'badge-warning',
    closed: 'badge-success',
    lost: 'badge-danger',
}

function formatDate(value) {
    if (!value) return 'Sin fecha'
    return new Date(value).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function CRM() {
    const { toast } = useAppStore()
    const { contacts, loading: contactsLoading, addContact, removeContact, updateContact } = useContacts()
    const { companies, loading: companiesLoading, addCompany, removeCompany } = useCompanies()
    const { deals, loading: dealsLoading, addDeal, removeDeal, totalValue } = useDeals()
    const { activities, loading: activitiesLoading } = useActivities()
    const atlasCRM = useAtlasCRM()

    const search = useLeadStore(s => s.search)
    const setSearch = useLeadStore(s => s.setSearch)
    const [tab, setTab] = useState('contacts')
    const [showForm, setShowForm] = useState(false)

    const [contactForm, setContactForm] = useState({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        linkedin_url: '',
        role: '',
        status: 'raw',
        source: 'manual',
        notes: '',
    })
    const [companyForm, setCompanyForm] = useState({
        name: '',
        industry: '',
        website: '',
        size: '',
        location: '',
        notes: '',
    })
    const [dealForm, setDealForm] = useState({
        title: '',
        company_id: '',
        contact_id: '',
        value: 0,
        monthly_value: 0,
        stage: 'lead',
        probability: 10,
        notes: '',
    })

    const loading = contactsLoading || companiesLoading || dealsLoading || activitiesLoading

    const filteredContacts = useMemo(() =>
        (contacts || []).filter(contact => {
            if (!search) return true
            const needle = search.toLowerCase()
            return [
                contact.name,
                contact.email,
                contact.phone,
                contact.role,
                contact.company?.name,
            ].some(value => value?.toLowerCase().includes(needle))
        }),
    [contacts, search])

    const filteredCompanies = useMemo(() =>
        (companies || []).filter(company => {
            if (!search) return true
            const needle = search.toLowerCase()
            return [
                company.name,
                company.industry,
                company.location,
                company.website,
            ].some(value => value?.toLowerCase().includes(needle))
        }),
    [companies, search])

    const filteredDeals = useMemo(() =>
        (deals || []).filter(deal => {
            if (!search) return true
            const needle = search.toLowerCase()
            return [
                deal.title,
                deal.company?.name,
                deal.contact?.name,
                deal.stage,
            ].some(value => value?.toLowerCase().includes(needle))
        }),
    [deals, search])

    const filteredActivities = useMemo(() =>
        (activities || []).filter(activity => {
            if (!search) return true
            const needle = search.toLowerCase()
            return [
                activity.subject,
                activity.description,
                activity.type,
                activity.contact?.name,
                activity.company?.name,
            ].some(value => value?.toLowerCase().includes(needle))
        }),
    [activities, search])

    const contactsForDealForm = useMemo(
        () => contacts.filter(c => !dealForm.company_id || c.company_id === dealForm.company_id),
        [contacts, dealForm.company_id]
    )

    const contactsByCompany = useMemo(() =>
        (contacts || []).reduce((acc, contact) => {
            if (!contact.company_id) return acc
            acc[contact.company_id] = (acc[contact.company_id] || 0) + 1
            return acc
        }, {}),
    [contacts])

    const ensureCompanyForContact = async (companyName) => {
        if (!companyName.trim()) return null
        const existing = (companies || []).find(company => company.name?.toLowerCase() === companyName.trim().toLowerCase())
        if (existing) return existing

        const created = await addCompany({ name: companyName.trim(), source: 'manual', status: 'prospected' })
        return created || null
    }

    const handleAddContact = async () => {
        if (!contactForm.name.trim()) return toast('Nombre requerido', 'warning')

        const company = await ensureCompanyForContact(contactForm.companyName)
        const created = await addContact({
            name: contactForm.name.trim(),
            company_id: company?.id || null,
            email: contactForm.email || null,
            phone: contactForm.phone || null,
            linkedin_url: contactForm.linkedin_url || null,
            role: contactForm.role || null,
            status: contactForm.status,
            source: contactForm.source || 'manual',
            confidence: 60,
            notes: contactForm.notes || null,
        })

        if (!created) return toast('No se pudo crear el contacto', 'warning')

        setContactForm({
            name: '',
            companyName: '',
            email: '',
            phone: '',
            linkedin_url: '',
            role: '',
            status: 'raw',
            source: 'manual',
            notes: '',
        })
        setShowForm(false)
        toast('Contacto creado', 'success')
    }

    const handleAddCompany = async () => {
        if (!companyForm.name.trim()) return toast('Nombre requerido', 'warning')

        const created = await addCompany({
            name: companyForm.name.trim(),
            industry: companyForm.industry || null,
            website: companyForm.website || null,
            size: companyForm.size || null,
            location: companyForm.location || null,
            notes: companyForm.notes || null,
            source: 'manual',
            status: 'prospected',
        })

        if (!created) return toast('No se pudo crear la empresa', 'warning')

        setCompanyForm({ name: '', industry: '', website: '', size: '', location: '', notes: '' })
        setShowForm(false)
        toast('Empresa creada', 'success')
    }

    const handleAddDeal = async () => {
        if (!dealForm.title.trim()) return toast('Título requerido', 'warning')
        if (!dealForm.company_id) return toast('Selecciona una empresa', 'warning')

        const created = await addDeal({
            title: dealForm.title.trim(),
            company_id: dealForm.company_id,
            contact_id: dealForm.contact_id || null,
            value: dealForm.value || 0,
            monthly_value: dealForm.monthly_value || dealForm.value || 0,
            stage: dealForm.stage,
            probability: dealForm.probability,
            notes: dealForm.notes || null,
        })

        if (!created) return toast('No se pudo crear el deal', 'warning')

        setDealForm({
            title: '',
            company_id: '',
            contact_id: '',
            value: 0,
            monthly_value: 0,
            stage: 'lead',
            probability: 10,
            notes: '',
        })
        setShowForm(false)
        toast('Deal creado', 'success')
    }

    const handleStageOutreach = async (contact, channel) => {
        const result = await atlasCRM.stageOutreach({
            channel,
            contact,
            company: contact.company || null,
            context: {
                source: 'crm',
                areaLabel: contact.company?.location || 'CRM',
                location: contact.company?.location || '',
            },
        })

        if (result?.error) {
            toast(result.error, 'warning')
            return
        }

        if (contact.status === 'raw') {
            await updateContact(contact.id, { status: 'contacted', last_contacted_at: new Date().toISOString() })
        } else {
            await updateContact(contact.id, { last_contacted_at: new Date().toISOString() })
        }

        toast(`Borrador ${channel} guardado en Messaging`, 'success')
    }

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>CRM</h1>
                <p>Contactos, deals, actividades y outreach conectados con Atlas, Messaging y Automation.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'var(--color-info)22', color: 'var(--color-info)' }}>👤</div>
                    <div className="kpi-value">{loading ? '...' : (contacts || []).length}</div>
                    <div className="kpi-label">Contactos</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'var(--color-success)22', color: 'var(--color-success)' }}>🏢</div>
                    <div className="kpi-value">{loading ? '...' : (companies || []).length}</div>
                    <div className="kpi-label">Empresas</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'var(--color-primary)22', color: 'var(--color-primary)' }}>💎</div>
                    <div className="kpi-value">{loading ? '...' : (deals || []).length}</div>
                    <div className="kpi-label">Deals</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ background: 'var(--color-primary)22', color: 'var(--color-primary)' }}>📋</div>
                    <div className="kpi-value">{loading ? '...' : `${(totalValue || 0).toLocaleString()}€`}</div>
                    <div className="kpi-label">Pipeline</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                {TABS.map(item => (
                    <button
                        key={item.key}
                        className={`btn ${tab === item.key ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '13px' }}
                        onClick={() => {
                            setTab(item.key)
                            setShowForm(false)
                            setSearch('')
                        }}
                    >
                        {item.icon} {item.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <input
                    className="input"
                    placeholder={`🔍 Buscar ${tab}...`}
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    style={{ flex: 1 }}
                />
                {tab !== 'activities' && (
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cerrar' : '+ Nuevo'}
                    </button>
                )}
            </div>

            {tab === 'contacts' && (
                <div className="card">
                    {showForm && (
                        <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                                <div className="input-group"><label>Nombre *</label><input className="input" value={contactForm.name} onChange={event => setContactForm({ ...contactForm, name: event.target.value })} /></div>
                                <div className="input-group"><label>Empresa</label><input className="input" value={contactForm.companyName} onChange={event => setContactForm({ ...contactForm, companyName: event.target.value })} /></div>
                                <div className="input-group"><label>Email</label><input className="input" type="email" value={contactForm.email} onChange={event => setContactForm({ ...contactForm, email: event.target.value })} /></div>
                                <div className="input-group"><label>Teléfono</label><input className="input" value={contactForm.phone} onChange={event => setContactForm({ ...contactForm, phone: event.target.value })} /></div>
                                <div className="input-group"><label>LinkedIn</label><input className="input" value={contactForm.linkedin_url} onChange={event => setContactForm({ ...contactForm, linkedin_url: event.target.value })} /></div>
                                <div className="input-group"><label>Rol</label><input className="input" value={contactForm.role} onChange={event => setContactForm({ ...contactForm, role: event.target.value })} /></div>
                                <div className="input-group"><label>Estado</label>
                                    <select className="input" value={contactForm.status} onChange={event => setContactForm({ ...contactForm, status: event.target.value })}>
                                        {['raw', 'qualified', 'contacted', 'responded', 'meeting', 'proposal', 'closed', 'lost'].map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group"><label>Fuente</label><input className="input" value={contactForm.source} onChange={event => setContactForm({ ...contactForm, source: event.target.value })} /></div>
                            </div>
                            <div className="input-group mt-3"><label>Notas</label><textarea className="input" value={contactForm.notes} onChange={event => setContactForm({ ...contactForm, notes: event.target.value })} rows={2} /></div>
                            <button className="btn btn-primary mt-3" onClick={handleAddContact}>Guardar Contacto</button>
                        </div>
                    )}

                    {filteredContacts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>👤</div>
                            <h3>{loading ? 'Cargando...' : 'Sin contactos'}</h3>
                            <p style={{ fontSize: 'var(--text-sm)' }}>{loading ? '' : 'Atlas y el CRM crearán contactos aquí cuando sincronices leads.'}</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        {['Nombre', 'Empresa', 'Email', 'Teléfono', 'Rol', 'Estado', 'Score', 'Outreach', ''].map(header => (
                                            <th key={header} style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredContacts.map(contact => (
                                        <tr key={contact.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '10px 8px', fontWeight: 600 }}>{contact.name}</td>
                                            <td style={{ padding: '10px 8px' }}>{contact.company?.name || '-'}</td>
                                            <td style={{ padding: '10px 8px', fontSize: 'var(--text-xs)' }}>{contact.email || '-'}</td>
                                            <td style={{ padding: '10px 8px', fontSize: 'var(--text-xs)' }}>{contact.phone || '-'}</td>
                                            <td style={{ padding: '10px 8px' }}>{contact.role || '-'}</td>
                                            <td style={{ padding: '10px 8px' }}>
                                                <span className={`badge ${STATUS_BADGE[contact.status] || 'badge-neutral'}`}>{contact.status || 'raw'}</span>
                                            </td>
                                            <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', color: contact.confidence >= 80 ? 'var(--success)' : contact.confidence >= 55 ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                                                {contact.confidence || '-'}
                                            </td>
                                            <td style={{ padding: '10px 8px' }}>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {['email', 'whatsapp', 'linkedin', 'instagram'].map(channel => (
                                                        <button
                                                            key={channel}
                                                            className="btn btn-ghost"
                                                            style={{ fontSize: '10px', padding: '4px 8px' }}
                                                            onClick={() => handleStageOutreach(contact, channel)}
                                                            disabled={atlasCRM.stagingKey === `${channel}:${contact.id}`}
                                                        >
                                                            {channel === 'email' ? 'Gmail' : channel === 'whatsapp' ? 'WA' : channel === 'linkedin' ? 'LinkedIn' : 'IG'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 8px' }}>
                                                <button className="btn btn-danger" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={() => removeContact(contact.id)}>✕</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'companies' && (
                <div className="card">
                    {showForm && (
                        <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                                <div className="input-group"><label>Nombre *</label><input className="input" value={companyForm.name} onChange={event => setCompanyForm({ ...companyForm, name: event.target.value })} /></div>
                                <div className="input-group"><label>Industria</label><input className="input" value={companyForm.industry} onChange={event => setCompanyForm({ ...companyForm, industry: event.target.value })} /></div>
                                <div className="input-group"><label>Web</label><input className="input" value={companyForm.website} onChange={event => setCompanyForm({ ...companyForm, website: event.target.value })} /></div>
                                <div className="input-group"><label>Tamaño</label><input className="input" value={companyForm.size} onChange={event => setCompanyForm({ ...companyForm, size: event.target.value })} /></div>
                                <div className="input-group"><label>Ubicación</label><input className="input" value={companyForm.location} onChange={event => setCompanyForm({ ...companyForm, location: event.target.value })} /></div>
                            </div>
                            <div className="input-group mt-3"><label>Notas</label><textarea className="input" value={companyForm.notes} onChange={event => setCompanyForm({ ...companyForm, notes: event.target.value })} rows={2} /></div>
                            <button className="btn btn-primary mt-3" onClick={handleAddCompany}>Guardar Empresa</button>
                        </div>
                    )}

                    {filteredCompanies.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🏢</div>
                            <h3>{loading ? 'Cargando...' : 'Sin empresas'}</h3>
                            <p style={{ fontSize: 'var(--text-sm)' }}>{loading ? '' : 'Importa negocios desde Atlas o créalos manualmente.'}</p>
                        </div>
                    ) : (
                        <div className="grid-auto">
                            {filteredCompanies.map(company => (
                                <div key={company.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{company.name}</div>
                                        <button className="btn btn-danger" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={() => removeCompany(company.id)}>✕</button>
                                    </div>
                                    {company.industry && <span className="badge badge-neutral" style={{ marginTop: 'var(--space-2)', display: 'inline-block' }}>{company.industry}</span>}
                                    {company.status && <span className={`badge ${STATUS_BADGE[company.status] || 'badge-neutral'}`} style={{ marginTop: 'var(--space-2)', marginLeft: '6px', display: 'inline-block' }}>{company.status}</span>}
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                                        <span>👥 {contactsByCompany[company.id] || 0} contactos</span>
                                        {company.location && <span> · 📍 {company.location}</span>}
                                    </div>
                                    {company.website && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', marginTop: 'var(--space-2)' }}>🔗 {company.website}</div>}
                                    {company.notes && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', lineHeight: 1.5 }}>{company.notes.slice(0, 140)}{company.notes.length > 140 ? '…' : ''}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'deals' && (
                <div>
                    {showForm && (
                        <div className="card mb-4">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
                                <div className="input-group"><label>Título *</label><input className="input" value={dealForm.title} onChange={event => setDealForm({ ...dealForm, title: event.target.value })} /></div>
                                <div className="input-group"><label>Empresa</label>
                                    <select className="input" value={dealForm.company_id} onChange={event => setDealForm({ ...dealForm, company_id: event.target.value, contact_id: '' })}>
                                        <option value="">Selecciona empresa</option>
                                        {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group"><label>Contacto</label>
                                    <select className="input" value={dealForm.contact_id} onChange={event => setDealForm({ ...dealForm, contact_id: event.target.value })}>
                                        <option value="">Sin contacto</option>
                                        {contactsForDealForm.map(contact => (
                                            <option key={contact.id} value={contact.id}>{contact.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group"><label>Valor (€)</label><input className="input" type="number" value={dealForm.value} onChange={event => setDealForm({ ...dealForm, value: parseInt(event.target.value, 10) || 0 })} /></div>
                                <div className="input-group"><label>MRR (€)</label><input className="input" type="number" value={dealForm.monthly_value} onChange={event => setDealForm({ ...dealForm, monthly_value: parseInt(event.target.value, 10) || 0 })} /></div>
                                <div className="input-group"><label>Stage</label>
                                    <select className="input" value={dealForm.stage} onChange={event => setDealForm({ ...dealForm, stage: event.target.value })}>
                                        {['lead', 'contacted', 'response', 'meeting', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'onboarding'].map(stage => (
                                            <option key={stage} value={stage}>{stage}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group"><label>Probabilidad (%)</label><input className="input" type="number" value={dealForm.probability} onChange={event => setDealForm({ ...dealForm, probability: parseInt(event.target.value, 10) || 0 })} min="0" max="100" /></div>
                            </div>
                            <div className="input-group mt-3"><label>Notas</label><textarea className="input" value={dealForm.notes} onChange={event => setDealForm({ ...dealForm, notes: event.target.value })} rows={2} /></div>
                            <button className="btn btn-primary mt-3" onClick={handleAddDeal}>Crear Deal</button>
                        </div>
                    )}

                    {filteredDeals.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>💎</div>
                            <h3>{loading ? 'Cargando...' : 'Sin deals'}</h3>
                            <p style={{ fontSize: 'var(--text-sm)' }}>{loading ? '' : 'Cada sync de Atlas puede abrir un deal en tu pipeline.'}</p>
                        </div>
                    ) : (
                        <div className="card" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        {['Deal', 'Empresa', 'Contacto', 'Valor', 'Stage', 'Prob.', ''].map(header => (
                                            <th key={header} style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDeals.map(deal => (
                                        <tr key={deal.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '10px 8px', fontWeight: 600 }}>{deal.title}</td>
                                            <td style={{ padding: '10px 8px' }}>{deal.company?.name || '-'}</td>
                                            <td style={{ padding: '10px 8px' }}>{deal.contact?.name || '-'}</td>
                                            <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{Number(deal.value || 0).toLocaleString()}€</td>
                                            <td style={{ padding: '10px 8px' }}>
                                                <span className="badge" style={{ background: `${STAGE_COLORS[deal.stage] || 'var(--text-tertiary)'}22`, color: STAGE_COLORS[deal.stage] || 'var(--text-tertiary)', border: `1px solid ${(STAGE_COLORS[deal.stage] || 'var(--text-tertiary)')}44` }}>
                                                    {deal.stage}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)' }}>{deal.probability || 0}%</td>
                                            <td style={{ padding: '10px 8px' }}>
                                                <button className="btn btn-danger" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={() => removeDeal(deal.id)}>✕</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'activities' && (
                <div className="card">
                    {filteredActivities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>📋</div>
                            <h3>{loading ? 'Cargando...' : 'Sin actividades'}</h3>
                            <p style={{ fontSize: 'var(--text-sm)' }}>{loading ? '' : 'Cuando Atlas importe leads o prepares mensajes, aparecerán aquí.'}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {filteredActivities.map(activity => (
                                <div key={activity.id} style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{activity.subject || 'Actividad CRM'}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                                <span className="badge badge-neutral" style={{ fontSize: '9px', marginRight: '6px' }}>{activity.type}</span>
                                                {activity.contact?.name || 'Sin contacto'}
                                                {activity.company?.name && ` · ${activity.company.name}`}
                                                {activity.deal?.title && ` · ${activity.deal.title}`}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{formatDate(activity.created_at)}</div>
                                    </div>
                                    {activity.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>{activity.description}</div>}
                                    {(activity.outcome || activity.completed_at) && (
                                        <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '8px' }}>
                                            {activity.outcome || `Completado: ${formatDate(activity.completed_at)}`}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default CRM
