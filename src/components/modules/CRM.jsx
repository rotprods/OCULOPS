// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Data Hub (CRM)
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { useContacts } from '../../hooks/useContacts'
import { useCompanies } from '../../hooks/useCompanies'
import { useDeals } from '../../hooks/useDeals'
import { useActivities } from '../../hooks/useActivities'
import { useAtlasCRM } from '../../hooks/useAtlasCRM'

const TABS = [
    { id: 'contacts', label: '01. PERSONNEL', icon: '👤' },
    { id: 'companies', label: '02. CORPORATE ENTITIES', icon: '🏢' },
    { id: 'deals', label: '03. ACTIVE OPERATIONS', icon: '💼' },
    { id: 'activities', label: '04. ACTIVITY LOG', icon: '📅' },
]

function formatCurrency(val) {
    if (!val) return '$0'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString()
}

function CRM() {
    const [activeTab, setActiveTab] = useState('contacts')

    const { contacts, deleteContact } = useContacts()
    const { companies, deleteCompany } = useCompanies()
    const { deals, deleteDeal } = useDeals()
    const { activities, deleteActivity } = useActivities()
    const { systemHealthy, atlasOnline, manualSync } = useAtlasCRM()

    const handleSyncAtlas = async () => await manualSync()

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0 }}>CORTEX CRM VAULT</h1>
                    <span className="mono text-xs text-tertiary">SECURE ENTITY DATABASE</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {TABS.map(t => (
                        <button key={t.id} className="mono" style={{ fontSize: '9px', padding: '6px 12px', background: activeTab === t.id ? 'var(--color-primary)' : 'transparent', color: activeTab === t.id ? '#000' : 'var(--color-text)', border: activeTab === t.id ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setActiveTab(t.id)}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── ATLAS SYNC BAR ── */}
            <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="mono text-xs font-bold" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: systemHealthy ? 'var(--color-success)' : 'var(--color-danger)' }}>SYSTEM LINK: {systemHealthy ? 'SECURE' : 'COMPROMISED'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
                        <span style={{ color: atlasOnline ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>ATLAS DB: {atlasOnline ? 'CONNECTED' : 'DISCONNECTED'}</span>
                    </div>
                </div>
                <button className="btn btn-ghost btn-sm mono" style={{ fontSize: '9px', padding: '4px 12px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }} onClick={handleSyncAtlas}>
                    FORCE DB SYNC
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '32px' }}>

                {activeTab === 'contacts' && (
                    <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// IDENTIFIED PERSONNEL [{contacts.length}]</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <thead style={{ background: '#000', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>NAME</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>EMAIL</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>PHONE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>LINK</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-danger)' }}>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((c, idx) => (
                                    <tr key={c.id} style={{ borderBottom: idx < contacts.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000' }}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{c.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{((c.first_name || '') + ' ' + (c.last_name || '')).toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{c.email ? c.email.toUpperCase() : '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-info)' }}>{COMPANY_LINK_MOCK(c.company_id)}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => deleteContact(c.id)}>DEL</button>
                                        </td>
                                    </tr>
                                ))}
                                {contacts.length === 0 && <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>NO PERSONNEL RECORDED</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'companies' && (
                    <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// CORPORATE ENTITIES [{companies.length}]</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <thead style={{ background: '#000', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>NAME</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>DOMAIN</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>INDUSTRY</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-danger)' }}>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((c, idx) => (
                                    <tr key={c.id} style={{ borderBottom: idx < companies.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000' }}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{c.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{c.name.toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-primary)' }}>{c.domain ? c.domain.toUpperCase() : '—'}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-info)' }}>{c.industry ? c.industry.toUpperCase() : '—'}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => deleteCompany(c.id)}>DEL</button>
                                        </td>
                                    </tr>
                                ))}
                                {companies.length === 0 && <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>NO ENTITIES RECORDED</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'deals' && (
                    <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// ONGOING OPERATIONS [{deals.length}]</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <thead style={{ background: '#000', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>DESIGNATION</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>VALUE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>STAGE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>CLOSE T-MINUS</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-danger)' }}>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deals.map((c, idx) => (
                                    <tr key={c.id} style={{ borderBottom: idx < deals.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000' }}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{c.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{c.name.toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-success)', fontWeight: 'bold' }}>{formatCurrency(c.amount)}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-warning)' }}>{c.stage.toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{formatDate(c.expected_close_date)}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => deleteDeal(c.id)}>DEL</button>
                                        </td>
                                    </tr>
                                ))}
                                {deals.length === 0 && <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>NO OPERATIONS RECORDED</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'activities' && (
                    <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// ACTIVITY LOG ENTRY [{activities.length}]</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            <thead style={{ background: '#000', borderBottom: '1px solid var(--border-subtle)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)' }}>ID</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>CLASS</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>SUBJECT / SUMMARY</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>T-MINUS (SYS)</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-danger)' }}>CMD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.map((c, idx) => (
                                    <tr key={c.id} style={{ borderBottom: idx < activities.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: idx % 2 === 0 ? 'transparent' : '#000' }}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{c.id.slice(0, 8).toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ padding: '2px 6px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', fontSize: '9px' }}>{c.type.toUpperCase()}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 'bold' }}>{c.subject.toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{new Date(c.activity_date).toLocaleString().toUpperCase()}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => deleteActivity(c.id)}>DEL</button>
                                        </td>
                                    </tr>
                                ))}
                                {activities.length === 0 && <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>NO ACTIVITY RECORDED</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function COMPANY_LINK_MOCK(id) {
    if (!id) return '—'
    return <span style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--color-info)' }}>LINK_{id.slice(0, 4).toUpperCase()}</span>
}

export default CRM
