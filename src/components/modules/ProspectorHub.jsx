// /////////////////////////////////////////////////////////////////////////////
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ANTIGRAVITY OS — ProspectorHub Mega-Module
// Bloomberg Terminal / War Room Edition
// /////////////////////////////////////////////////////////////////////////////

import { useState, useMemo } from 'react'
import { useProspector } from '../../hooks/useProspector'
import { useGeoSearch } from '../../hooks/useGeoSearch'

import FlightDeck from './FlightDeck'
import './ProspectorHub.css'


function ScoreRing({ score, size = 40 }) {
    const r = (size - 4) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - ((score || 0) / 100) * circ
    const color = score >= 70 ? 'var(--color-success)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="2" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="2" strokeDasharray={circ} strokeDashoffset={offset} />
            <text x={size / 2} y={size / 2} fill={color} fontSize="10" className="mono" textAnchor="middle" dominantBaseline="middle" style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontWeight: 'bold' }}>{score || '–'}</text>
        </svg>
    )
}

function MapEmbed({ leads, selectedId, onSelectLead }) {
    const mapLeads = leads.filter(l => l.lat && l.lng)
    const bounds = useMemo(() => {
        if (mapLeads.length === 0) return { minLat: 36, maxLat: 43.5, minLng: -9.5, maxLng: 4.5 }
        const lats = mapLeads.map(l => l.lat), lngs = mapLeads.map(l => l.lng), pad = 0.02
        return { minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad, minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad }
    }, [mapLeads])
    const toXY = (lat, lng) => ({ x: ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100, y: (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100 })

    return (
        <div className="map-embed" style={{ background: '#000', position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.1 }}>
                {[...Array(11)].map((_, i) => (
                    <g key={i}>
                        <line x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="var(--color-primary)" strokeWidth="0.5" />
                        <line x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="var(--color-primary)" strokeWidth="0.5" />
                    </g>
                ))}
            </svg>
            {mapLeads.map(lead => {
                const pos = toXY(lead.lat, lead.lng)
                const isSelected = lead.id === selectedId
                const color = lead.ai_score >= 70 ? 'var(--color-success)' : lead.ai_score >= 40 ? 'var(--color-warning)' : lead.ai_score ? 'var(--color-danger)' : 'var(--color-primary)'
                return (
                    <div key={lead.id} onClick={() => onSelectLead(lead.id)} style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: isSelected ? 10 : 1 }}>
                        <div style={{ width: isSelected ? 20 : 10, height: isSelected ? 20 : 10, borderRadius: '0', background: `${color}${isSelected ? '55' : '33'}`, border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            <div style={{ width: 4, height: 4, background: color }} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const API_NODES = [
    { id: 'google_places', name: 'Google Places', status: 'active', type: 'GEO' },
    { id: 'pagespeed', name: 'PageSpeed', status: 'active', type: 'WEB' },
    { id: 'tech_detect', name: 'Tech Stack', status: 'active', type: 'WEB' },
    { id: 'social_scan', name: 'Social Scanner', status: 'active', type: 'WEB' },
    { id: 'gemini_ai', name: 'Gemini Qualify', status: 'active', type: 'AI' }
]

const TABS = [
    { id: 'flight', label: 'FLIGHT DECK' },
    { id: 'map', label: 'GEO MAP' },
    { id: 'scanner', label: 'SCAN TRG' },
    { id: 'leads', label: 'LEADS DB' },
    { id: 'outreach', label: 'OUTREACH' },
    { id: 'network', label: 'API NET' }
]

function ProspectorHub() {
    const { leads, scans, loading, byStatus, avgScore, recordScan } = useProspector()
    const { results, scanning, searchPlaces, qualifyLead: aiQualify, qualifying } = useGeoSearch()

    const [tab, setTab] = useState('flight')
    const [form, setForm] = useState({ query: '', location: 'Madrid, España', radius: 5000 })
    const [selectedLead, setSelectedLead] = useState(null)
    const [flightIntel] = useState(null)

    const activeLeads = byStatus.active || []
    const selected = leads.find(l => l.id === selectedLead)

    const handleScan = async () => {
        if (!form.query.trim()) return
        const data = await searchPlaces(form)
        if (!data?.error) {
            await recordScan({ ...form, source: 'scanner', rawPayload: data, results: data.places || [] })
        }
    }

    return (
        <div className="prospector-hub fade-in">
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0, fontSize: '28px' }}>PROSPECTOR HUB</h1>
                    <p className="mono font-bold" style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px', letterSpacing: '0.1em' }}>GLOBAL INTELLIGENCE NETWORK // {activeLeads.length} LOCATIONS VERIFIED</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ border: '1px solid var(--border-subtle)', padding: '6px 16px' }} className="mono text-xs">
                        <span className="text-tertiary">LIVE: </span><strong className="text-primary">{results.length || activeLeads.length}</strong>
                    </div>
                    <div style={{ border: '1px solid var(--border-subtle)', padding: '6px 16px' }} className="mono text-xs">
                        <span className="text-tertiary">QUAL: </span><strong className="text-success">{byStatus.qualified?.length || 0}</strong>
                    </div>
                    <div style={{ border: '1px solid var(--border-subtle)', padding: '6px 16px' }} className="mono text-xs">
                        <span className="text-tertiary">AVG ID: </span><strong className="text-primary">{avgScore || '-'}</strong>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="prospector-tabs">
                {TABS.map(t => (
                    <button key={t.id} className={`prospector-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── CONTENT BODY ── */}
            <div className="prospector-content">

                {tab === 'flight' && (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <FlightDeck form={form} setForm={setForm} scanResults={results} scanning={scanning} lastScan={flightIntel} />
                    </div>
                )}

                {tab === 'map' && (
                    <div className="map-container">
                        <div className="map-sidebar">
                            <div className="map-sidebar-header">/// MISSION TARGETS</div>
                            <div className="map-sidebar-list">
                                {activeLeads.map(l => (
                                    <div key={l.id} className={`map-lead-item ${selectedLead === l.id ? 'selected' : ''}`} onClick={() => setSelectedLead(l.id)}>
                                        <div className="map-lead-name" style={{ color: l.status === 'qualified' ? 'var(--color-success)' : 'var(--text-primary)' }}>{l.name}</div>
                                        <div className="map-lead-meta">
                                            <span>{l.ai_score ? `AI:${l.ai_score}` : 'UNRANKED'}</span>
                                            <span>{l.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <MapEmbed leads={activeLeads} selectedId={selectedLead} onSelectLead={setSelectedLead} />
                    </div>
                )}

                {tab === 'scanner' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', height: '100%' }}>
                        <div style={{ border: '1px solid var(--border-default)', background: '#000', display: 'flex', flexDirection: 'column' }}>
                            <div className="map-sidebar-header">/// MISSION PARAMETERS</div>
                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="input-group">
                                    <label className="mono" style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>TARGET TYPE</label>
                                    <input className="input mono text-xs" style={{ borderRadius: 0, background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)' }} value={form.query} onChange={e => setForm(f => ({ ...f, query: e.target.value }))} />
                                </div>
                                <div className="input-group">
                                    <label className="mono" style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>LOCATION</label>
                                    <input className="input mono text-xs" style={{ borderRadius: 0, background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)' }} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                                </div>
                                <div className="input-group">
                                    <label className="mono" style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>RADIUS (m)</label>
                                    <input className="input mono text-xs" style={{ borderRadius: 0, background: 'var(--color-bg-2)', border: '1px solid var(--border-subtle)' }} type="number" value={form.radius} onChange={e => setForm(f => ({ ...f, radius: parseInt(e.target.value) }))} />
                                </div>
                                <button className="btn btn-primary mono text-xs mt-4" style={{ borderRadius: 0, padding: '16px', letterSpacing: '0.1em' }} onClick={handleScan} disabled={scanning}>
                                    {scanning ? '[ EXECUTING SCAN... ]' : '[ INITIATE SCAN ]'}
                                </button>
                            </div>
                        </div>
                        <div style={{ border: '1px solid var(--border-default)', padding: '24px', overflowY: 'auto', background: '#000' }}>
                            <div className="mono font-bold text-tertiary mb-6" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>/// DEPLOYMENT HISTORY</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {scans.map(s => (
                                    <div key={s.id} className="mono text-xs" style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-subtle)', padding: '12px 16px', background: 'var(--color-bg-2)' }}>
                                        <span className="text-primary font-bold">{s.query.toUpperCase()}</span>
                                        <span className="text-tertiary">{s.location.toUpperCase()} — {s.results_count} LOGS</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'leads' && (
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(400px, 1.5fr) 1fr', gap: '16px', overflow: 'hidden' }}>
                        <div style={{ border: '1px solid var(--border-default)', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#000' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr className="mono" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--border-subtle)' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)', fontSize: '10px', letterSpacing: '0.1em' }}>TARGET ID</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)', fontSize: '10px', letterSpacing: '0.1em' }}>CLASS</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)', fontSize: '10px', letterSpacing: '0.1em' }}>AI LEVEL</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-primary)', fontSize: '10px', letterSpacing: '0.1em' }}>STATE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeLeads.map(l => (
                                        <tr key={l.id} className="mono" style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', background: selectedLead === l.id ? 'var(--border-subtle)' : 'transparent', fontSize: '11px' }} onClick={() => setSelectedLead(l.id)}>
                                            <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{l.name.toUpperCase()}</td>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{l.category ? l.category.toUpperCase() : '[ NULL ]'}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ color: l.ai_score > 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>{l.ai_score || '[ ? ]'}</span>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: l.status === 'qualified' ? 'var(--color-success)' : 'inherit' }}>{l.status.toUpperCase()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {selected ? (
                            <div style={{ border: '1px solid var(--border-default)', background: '#000', display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
                                <div className="mono text-primary font-bold mb-6" style={{ fontSize: '24px', letterSpacing: '0.05em' }}>{selected.name.toUpperCase()}</div>
                                <div className="mono text-xs mb-3 text-tertiary">LOCATION: <span className="text-secondary">{selected.address || '[ UNKNOWN ]'}</span></div>
                                <div className="mono text-xs mb-3 text-tertiary">INDEX: <span className="text-secondary">{selected.rating || '[ UNKNOWN ]'}</span></div>
                                <div className="mono text-xs mb-6 text-tertiary">WEB LINK: <span className="text-secondary">{selected.website || '[ NULL ]'}</span></div>
                                <button className="btn btn-primary mono text-xs mb-6" style={{ borderRadius: 0, padding: '12px', letterSpacing: '0.1em' }} onClick={() => aiQualify(selected.id)} disabled={qualifying === selected.id}>
                                    {qualifying === selected.id ? '[ DECRYPTING AI LOGS... ]' : '[ AUTHORIZE AI INFILTRATION ]'}
                                </button>
                                <div className="mono font-bold text-primary mb-3" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>/// CORTEX INTELLIGENCE RECORD</div>
                                <div className="mono text-secondary" style={{ fontSize: '11px', lineHeight: 1.8, borderLeft: '2px solid var(--border-subtle)', paddingLeft: '12px', background: 'var(--color-bg-2)', padding: '16px' }}>
                                    {selected.ai_reasoning || 'AWAITING RECONNAISSANCE PACKET.'}
                                </div>
                            </div>
                        ) : (
                            <div style={{ border: '1px solid var(--border-default)', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                                <div className="mono" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>AWAITING TARGET SELECTION.</div>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'network' && (
                    <div className="api-network">
                        {API_NODES.map(app => (
                            <div key={app.id} className="api-node">
                                <div className="api-node-icon">[{app.type[0]}]</div>
                                <div className="api-node-info">
                                    <div className="api-node-name">{app.name}</div>
                                    <div className="api-node-desc">{app.type} PROTOCOL</div>
                                    <div className="api-node-status">{app.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'outreach' && (
                    <div className="mono font-bold text-tertiary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '11px', letterSpacing: '0.1em' }}>
                        OUTREACH MODULE: UI RESTRICTED. FALLBACK TO TERMINAL COMMS.
                    </div>
                )}
            </div>

            {loading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="mono text-primary font-bold" style={{ fontSize: '14px', letterSpacing: '0.2em' }}>SYNCHRONIZING GLOBAL DEPLOYMENT...</div>
                </div>
            )}
        </div>
    )
}

export default ProspectorHub
