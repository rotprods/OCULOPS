// ═══════════════════════════════════════════════════════════
// ANTIGRAVITY OS — ProspectorHub Mega-Module
// Global API Intelligence Network with interactive map + Outreach
// ═══════════════════════════════════════════════════════════

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useApiCatalog } from '../../hooks/useApiCatalog'
import { useConnectorProxy } from '../../hooks/useConnectorProxy'
import { useProspector } from '../../hooks/useProspector'
import { useGeoSearch } from '../../hooks/useGeoSearch'
import { useAtlasCRM } from '../../hooks/useAtlasCRM'
import { useAppStore } from '../../stores/useAppStore'
import FlightDeck from './FlightDeck'
import './ProspectorHub.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

function useOutreach() {
    const [emails, setEmails] = useState([])
    const [stats, setStats] = useState({ staged: 0, approved: 0, sent: 0, replied: 0, total: 0 })
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState(null)

    const callOutreach = useCallback(async (body) => {
        if (!SUPABASE_URL || !SUPABASE_ANON) {
            return { error: 'Supabase edge functions are not configured', emails: [], stats: null }
        }

        const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-outreach`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON}` },
            body: JSON.stringify(body)
        })
        return res.json()
    }, [])

    const loadEmails = useCallback(async (status = 'staged') => {
        setLoading(true)
        const data = await callOutreach({ action: 'list', status })
        setEmails(data.emails || [])
        setLoading(false)
    }, [callOutreach])

    const loadStats = useCallback(async () => {
        const data = await callOutreach({ action: 'stats' })
        if (data.stats) setStats(data.stats)
    }, [callOutreach])

    const approveEmail = useCallback(async (id) => {
        await callOutreach({ action: 'approve', id })
        setEmails(prev => prev.filter(e => e.id !== id))
        setStats(prev => ({ ...prev, staged: prev.staged - 1, approved: prev.approved + 1 }))
    }, [callOutreach])

    const skipEmail = useCallback(async (id) => {
        await callOutreach({ action: 'skip', id })
        setEmails(prev => prev.filter(e => e.id !== id))
        setStats(prev => ({ ...prev, staged: prev.staged - 1 }))
    }, [callOutreach])

    const batchApprove = useCallback(async (niche) => {
        const data = await callOutreach({ action: 'batch_approve', niche })
        await loadEmails()
        await loadStats()
        return data.approved_count || 0
    }, [callOutreach, loadEmails, loadStats])

    useEffect(() => { loadEmails(); loadStats() }, [loadEmails, loadStats])

    return { emails, stats, loading, preview, setPreview, loadEmails, loadStats, approveEmail, skipEmail, batchApprove }
}

// ── Score Ring ──
function ScoreRing({ score, size = 48 }) {
    const r = (size - 6) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - ((score || 0) / 100) * circ
    const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)'
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 8px ${color}88)` }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            <text x={size / 2} y={size / 2} fill={color} fontSize="12" fontWeight="800"
                textAnchor="middle" dominantBaseline="middle"
                style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>{score || '–'}</text>
        </svg>
    )
}

// ── Static Map Embed (no API key needed) ──
function MapEmbed({ leads, selectedId, onSelectLead }) {
    // Renders a visual dot-grid map representation
    const mapLeads = leads.filter(l => l.lat && l.lng)
    const bounds = useMemo(() => {
        if (mapLeads.length === 0) return { minLat: 36, maxLat: 43.5, minLng: -9.5, maxLng: 4.5 } // Spain default
        const lats = mapLeads.map(l => l.lat)
        const lngs = mapLeads.map(l => l.lng)
        const pad = 0.02
        return {
            minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad,
            minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad,
        }
    }, [mapLeads])

    const toXY = (lat, lng) => ({
        x: ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100,
        y: (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100,
    })

    return (
        <div className="map-embed" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)', position: 'relative', overflow: 'hidden' }}>
            {/* Grid lines */}
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.06 }}>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                    <g key={p}>
                        <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="var(--accent-primary)" strokeWidth="0.5" />
                        <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="var(--accent-primary)" strokeWidth="0.5" />
                    </g>
                ))}
            </svg>

            {/* Map markers */}
            {mapLeads.map(lead => {
                const pos = toXY(lead.lat, lead.lng)
                const isSelected = lead.id === selectedId
                const score = lead.ai_score
                const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : score ? 'var(--danger)' : 'var(--accent-primary)'
                return (
                    <div key={lead.id}
                        onClick={() => onSelectLead(lead.id)}
                        style={{
                            position: 'absolute',
                            left: `${pos.x}%`, top: `${pos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            cursor: 'pointer', zIndex: isSelected ? 10 : 1,
                        }}>
                        {/* Pulse ring */}
                        <div style={{
                            width: isSelected ? 28 : 14, height: isSelected ? 28 : 14,
                            borderRadius: '50%',
                            background: `${color}${isSelected ? '55' : '33'}`,
                            border: `2px solid ${color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? `0 0 20px ${color}44` : 'none',
                        }}>
                            <div style={{
                                width: isSelected ? 8 : 5, height: isSelected ? 8 : 5,
                                borderRadius: '50%', background: color,
                            }} />
                        </div>
                        {isSelected && (
                            <div style={{
                                position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                                borderRadius: '8px', padding: '8px 12px', whiteSpace: 'nowrap',
                                fontSize: '11px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                minWidth: '160px', zIndex: 100,
                            }}>
                                <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '2px' }}>{lead.name}</div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
                                    ⭐ {lead.rating || '–'} · 📍 {(lead.address || '').substring(0, 30)}
                                </div>
                                {lead.ai_score && <div style={{ color, fontWeight: 700, fontSize: '11px', marginTop: '4px' }}>AI Score: {lead.ai_score}</div>}
                            </div>
                        )}
                    </div>
                )
            })}

            {/* Empty state */}
            {mapLeads.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', zIndex: 2 }}>
                    <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🌍</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Mapa de Inteligencia</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>Lanza un scan para ver negocios en el mapa</div>
                </div>
            )}

            {/* Coordinate label */}
            {mapLeads.length > 0 && (
                <div style={{ position: 'absolute', bottom: 8, left: 12, fontSize: '9px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>
                    {mapLeads.length} puntos · {bounds.minLat.toFixed(2)}°N – {bounds.maxLat.toFixed(2)}°N
                </div>
            )}
        </div>
    )
}

// ── API Network Nodes ──
const API_NODES = [
    { id: 'google_places', name: 'Google Places', icon: '📍', color: '#34A853', desc: 'Búsqueda de negocios por categoría y ubicación. Rating, reviews, teléfono, web.', status: 'active', type: 'GeoIntelligence' },
    { id: 'pagespeed', name: 'PageSpeed Insights', icon: '⚡', color: '#4285F4', desc: 'Análisis de rendimiento web: velocidad, SEO score, Core Web Vitals.', status: 'active', type: 'Web Analyzer' },
    { id: 'tech_detect', name: 'Tech Stack Detector', icon: '🔧', color: '#FF6B35', desc: 'Detecta WordPress, Shopify, React, GA, Meta Pixel, Live Chat, etc.', status: 'active', type: 'Web Analyzer' },
    { id: 'social_scan', name: 'Social Scanner', icon: '📱', color: '#E4405F', desc: 'Extrae perfiles de Instagram, Facebook, TikTok, LinkedIn, YouTube.', status: 'active', type: 'Web Analyzer' },
    { id: 'gemini_ai', name: 'Gemini AI Qualifier', icon: '🧠', color: '#886FBF', desc: 'Califica leads con IA: fit score, pain points, valor estimado del deal.', status: 'active', type: 'AI Engine' },
    { id: 'coingecko', name: 'CoinGecko Finance', icon: '📊', color: '#8DC647', desc: 'Live cryptocurrency data and financial tracking.', status: 'active', type: 'Data Enricher' },
    { id: 'genderize', name: 'Genderize AI', icon: '👤', color: '#FF6B6B', desc: 'Determine gender from first name for personalized outreach.', status: 'active', type: 'AI Engine' },
    { id: 'agify', name: 'Agify AI', icon: '🎂', color: '#4ECDC4', desc: 'Estimate demographic age from first name for profiling.', status: 'active', type: 'AI Engine' },
    { id: 'nationalize', name: 'Nationalize AI', icon: '🌍', color: '#FFD166', desc: 'Predict nationality from a name.', status: 'active', type: 'AI Engine' },
    { id: 'universities', name: 'Global Universities', icon: '🎓', color: '#073B4C', desc: 'Search for universities worldwide by name and country.', status: 'active', type: 'Data Enricher' },
    { id: 'meta_ads', name: 'Meta Ad Library', icon: '📸', color: '#1877F2', desc: 'Detecta anuncios activos de competidores y leads en Facebook/Instagram.', status: 'pending', type: 'Social Scanner' },
    { id: 'tiktok_biz', name: 'TikTok Business', icon: '🎵', color: '#010101', desc: 'Tendencias de mercado y análisis de competidores en TikTok.', status: 'pending', type: 'Social Scanner' },
    { id: 'linkedin', name: 'LinkedIn Data', icon: '💼', color: '#0077B5', desc: 'Perfiles de empresa, empleados, crecimiento de plantilla.', status: 'pending', type: 'Social Scanner' },
    { id: 'whois', name: 'Domain WHOIS', icon: '🌐', color: '#6C757D', desc: 'Antigüedad del dominio, registrador, datos de contacto.', status: 'planned', type: 'Data Enricher' },
    { id: 'email_finder', name: 'Email Finder', icon: '📧', color: '#20C997', desc: 'Descubre emails corporativos de decision makers.', status: 'planned', type: 'Data Enricher' },
    { id: 'clearbit', name: 'Company Enrichment', icon: '🏢', color: '#3B7DDD', desc: 'Revenue estimado, tamaño empresa, industria, tecnologías.', status: 'planned', type: 'Data Enricher' },
    { id: 'whatsapp', name: 'WhatsApp Outreach', icon: '💬', color: '#25D366', desc: 'Contacto automatizado con leads cualificados via WhatsApp Cloud API.', status: 'pending', type: 'Execution' },
]

const TABS = [
    { id: 'flight', icon: '✈️', label: 'Airspace' },
    { id: 'map', icon: '🗺️', label: 'Mapa' },
    { id: 'scanner', icon: '🔍', label: 'Scanner' },
    { id: 'leads', icon: '👥', label: 'Leads' },
    { id: 'outreach', icon: '📧', label: 'Outreach' },
    { id: 'network', icon: '🕸️', label: 'API Network' },
]

function ProspectorHub() {
    const { toast } = useAppStore()
    const { leads, scans, loading, byStatus, bySource, avgScore, recordScan, updateLead, qualifyLead: setQualified, pursueLead, dismissLead } = useProspector()
    const { results, scanning, analyzing, qualifying, searchPlaces, analyzeWebsite, qualifyLead: aiQualify } = useGeoSearch()
    const atlasCRM = useAtlasCRM()
    const { installedApps: installedProspectorApps } = useApiCatalog({ moduleTarget: 'prospector' })
    const { execute: executeConnector, data: connectorToolData, loading: connectorToolLoading, error: connectorToolError } = useConnectorProxy({}, { cacheTTL: 30000 })
    const outreach = useOutreach()
    const [outreachFilter, setOutreachFilter] = useState('staged')

    const [tab, setTab] = useState('flight')
    const [form, setForm] = useState({ query: '', location: 'Madrid, España', radius: 5000 })
    const [selectedLead, setSelectedLead] = useState(null)
    const [flightIntel, setFlightIntel] = useState(null)

    const activeLeads = byStatus.active || []
    const selected = leads.find(l => l.id === selectedLead)
    const liveResultsCount = results.length || activeLeads.length
    const liveProspectorApps = installedProspectorApps.filter(app => app.connectorStatus === 'live')
    const connectorActions = useMemo(() => {
        if (!selected) return []

        return liveProspectorApps.flatMap(app => {
            if (app.templateKey === 'microlink' && selected.website) {
                return [{ ...app, actionLabel: '🌐 Preview web', params: { url: selected.website } }]
            }

            if (app.templateKey === 'adresse-data-gouv' && selected.address) {
                return [{ ...app, actionLabel: '📍 Geocodificar', params: { q: selected.address, limit: '3' } }]
            }

            if (app.templateKey === 'administrative-divisions-db') {
                return [{ ...app, actionLabel: '🗺️ Región', params: { country_code: 'ES' } }]
            }

            if (app.templateKey === 'graphhopper' && selected.lat && selected.lng) {
                return [{
                    ...app,
                    actionLabel: '🛣️ Ruta HQ → lead',
                    params: {
                        points: ['37.9922,-1.1307', `${selected.lat},${selected.lng}`],
                        profile: 'car',
                    },
                }]
            }

            return []
        })
    }, [liveProspectorApps, selected])

    const handleScan = async () => {
        if (!form.query.trim()) return
        const data = await searchPlaces({ query: form.query, location: form.location, radius: form.radius })
        if (!data?.error) {
            await recordScan({
                query: form.query.trim(),
                location: form.location,
                radius: Number(form.radius) || 5000,
                source: 'scanner',
                area: data.area || null,
                searchCenter: data.search_center || null,
                results: data.places || [],
                rawPayload: data,
            })
        }
        setFlightIntel(data)
    }

    const handleAirspaceScan = async ({ query, lat, lng, radius }) => {
        const data = await searchPlaces({
            query,
            lat,
            lng,
            radius,
        })
        if (!data?.error) {
            await recordScan({
                query,
                location: data.area?.formatted_address || data.area?.label || form.location,
                radius: Number(radius) || 5000,
                source: 'flight_deck',
                area: data.area || null,
                searchCenter: data.search_center || null,
                results: data.places || [],
                rawPayload: data,
            })
        }
        setFlightIntel(data)
        return data
    }

    const buildAtlasContext = useCallback((overrides = {}) => ({
        query: overrides.query || form.query?.trim() || 'businesses',
        location: overrides.location || form.location,
        areaLabel: overrides.areaLabel || flightIntel?.area?.label || form.location,
        source: overrides.source || 'atlas',
    }), [flightIntel?.area?.label, form.location, form.query])

    const handleResolveLocation = useCallback(async (location) => {
        const data = await searchPlaces({
            query: form.query?.trim() || 'businesses',
            location,
            radius: Number(form.radius) || 5000,
            maxResults: 0,
            resolve_only: true,
        })

        if (!data?.error && data?.search_center) {
            setFlightIntel(data)
            setForm(prev => ({
                ...prev,
                location: data.area?.formatted_address || data.area?.label || location,
            }))
        }

        return data
    }, [form.query, form.radius, searchPlaces])

    const handleImportLeadToCRM = useCallback(async (lead) => {
        const result = await atlasCRM.importLead(lead, buildAtlasContext({ source: 'flight_deck' }))
        if (result?.error) {
            toast(result.error, 'warning')
            return result
        }

        await updateLead(lead.id, {
            status: 'promoted',
            company_id: result.company?.id || null,
            contact_id: result.contact?.id || null,
            deal_id: result.deal?.id || null,
        })
        toast(`${lead.name} sincronizado con CRM`, 'success')
        return result
    }, [atlasCRM, buildAtlasContext, toast, updateLead])

    const handleImportAirspaceToCRM = useCallback(async (leadsToImport) => {
        const result = await atlasCRM.importLeads(leadsToImport, buildAtlasContext({ source: 'flight_deck' }))
        if (result?.imported?.length) {
            await Promise.all(result.imported.map((entry) => updateLead(entry.lead.id, {
                status: 'promoted',
                company_id: entry.company?.id || null,
                contact_id: entry.contact?.id || null,
                deal_id: entry.deal?.id || null,
            })))
        }
        if (result?.failedCount) {
            toast(`Sincronizados ${result.importedCount}; fallaron ${result.failedCount}`, 'warning')
        } else {
            toast(`${result.importedCount} negocios sincronizados al CRM`, 'success')
        }
        return result
    }, [atlasCRM, buildAtlasContext, toast, updateLead])

    const handleLaunchOutreach = useCallback(async (lead, channel) => {
        const result = await atlasCRM.stageOutreach({
            lead,
            channel,
            context: buildAtlasContext({ source: 'flight_deck' }),
        })

        if (result?.error) {
            toast(result.error, 'warning')
            return result
        }

        toast(`Borrador ${channel} guardado en Messaging para ${lead.name}`, 'success')
        return result
    }, [atlasCRM, buildAtlasContext, toast])

    const runConnectorAction = async (action) => {
        await executeConnector({
            connectorId: action.connectorId,
            endpointName: action.endpointName,
            params: action.params,
        })
    }

    return (
        <div className="prospector-hub fade-in">
            {/* ── Header Bar ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>🔭 Prospector Hub</h1>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                        Red global de APIs de inteligencia · {activeLeads.length} leads · {scans.length} scans
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="kpi-card" style={{ padding: '8px 14px', minWidth: '80px' }}>
                        <div className="kpi-value" style={{ fontSize: '18px' }}>{liveResultsCount}</div>
                        <div className="kpi-label">{results.length ? 'Live Targets' : 'Leads'}</div>
                    </div>
                    <div className="kpi-card" style={{ padding: '8px 14px', minWidth: '80px' }}>
                        <div className="kpi-value" style={{ fontSize: '18px', color: 'var(--success)' }}>{byStatus.qualified?.length || 0}</div>
                        <div className="kpi-label">Qualified</div>
                    </div>
                    <div className="kpi-card" style={{ padding: '8px 14px', minWidth: '80px' }}>
                        <div className="kpi-value" style={{ fontSize: '18px', color: 'var(--accent-primary)' }}>{avgScore || '–'}</div>
                        <div className="kpi-label">Avg Score</div>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="prospector-tabs">
                {TABS.map(t => (
                    <button key={t.id} className={`prospector-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {tab === 'flight' && (
                <FlightDeck
                    form={form}
                    setForm={setForm}
                    scanResults={results}
                    scanning={scanning}
                    lastScan={flightIntel}
                    onScanAirspace={handleAirspaceScan}
                    onResolveLocation={handleResolveLocation}
                    onImportLead={handleImportLeadToCRM}
                    onImportAll={handleImportAirspaceToCRM}
                    onStageLeadOutreach={handleLaunchOutreach}
                    crmSyncState={atlasCRM}
                />
            )}

            {/* ═══════════ MAP TAB ═══════════ */}
            {tab === 'map' && (
                <div className="map-container">
                    <MapEmbed leads={activeLeads} selectedId={selectedLead} onSelectLead={setSelectedLead} />
                    <div className="map-sidebar">
                        <div className="map-sidebar-header">
                            <span>📡 {activeLeads.length} leads</span>
                            <button className="btn btn-sm btn-primary" onClick={() => setTab('scanner')} style={{ fontSize: '10px' }}>+ Scan</button>
                        </div>

                        {/* Quick search in map */}
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '6px' }}>
                            <input className="input" style={{ fontSize: '11px', padding: '6px 8px' }}
                                value={form.query} onChange={e => setForm(f => ({ ...f, query: e.target.value }))}
                                placeholder="Buscar negocios..." onKeyDown={e => e.key === 'Enter' && handleScan()} />
                            <button className="btn btn-sm btn-primary" onClick={handleScan} disabled={scanning}
                                style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                                {scanning ? '⏳' : '🔍'}
                            </button>
                        </div>

                        <div className="map-sidebar-list">
                            {activeLeads.length === 0 ? (
                                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔭</div>
                                    Usa el Scanner para detectar leads
                                </div>
                            ) : (
                                activeLeads.map(lead => (
                                    <div key={lead.id}
                                        className={`map-lead-item ${selectedLead === lead.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedLead(lead.id === selectedLead ? null : lead.id)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div className="map-lead-name">{lead.name}</div>
                                            {lead.ai_score && <ScoreRing score={lead.ai_score} size={28} />}
                                        </div>
                                        <div className="map-lead-meta">
                                            <span>⭐ {lead.rating || '–'}</span>
                                            <span>📍 {(lead.city || lead.address || '').substring(0, 20)}</span>
                                            <span className={`badge ${lead.status === 'qualified' ? 'badge-success' : lead.status === 'pursuing' ? 'badge-info' : 'badge-neutral'}`}
                                                style={{ fontSize: '9px', padding: '1px 5px' }}>{lead.status}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ SCANNER TAB ═══════════ */}
            {tab === 'scanner' && (
                <div style={{ overflow: 'auto', flex: 1 }}>
                    <div className="scanner-panel">
                        <div className="card">
                            <div className="card-header"><div className="card-title">🔍 Escanear Mercado</div></div>
                            <div className="scanner-form">
                                <div className="input-group">
                                    <label>Tipo de negocio</label>
                                    <input className="input" value={form.query} onChange={e => setForm(f => ({ ...f, query: e.target.value }))}
                                        placeholder="restaurantes, clínicas dentales, e-commerce..." />
                                </div>
                                <div className="input-group">
                                    <label>Ubicación</label>
                                    <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                                        placeholder="Madrid, Barcelona, Valencia..." />
                                </div>
                                <div className="input-group">
                                    <label>Radio (metros)</label>
                                    <select className="input" value={form.radius} onChange={e => setForm(f => ({ ...f, radius: parseInt(e.target.value) }))}>
                                        <option value={1000}>1 km</option>
                                        <option value={5000}>5 km</option>
                                        <option value={10000}>10 km</option>
                                        <option value={25000}>25 km</option>
                                        <option value={50000}>50 km</option>
                                    </select>
                                </div>
                                <button className="btn btn-primary" onClick={handleScan} disabled={scanning} style={{ marginTop: '8px' }}>
                                    {scanning ? '⏳ Escaneando APIs...' : '🚀 Lanzar Scan'}
                                </button>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header"><div className="card-title">📊 Resultados</div></div>
                            <div style={{ textAlign: 'center', padding: '16px' }}>
                                <div className="scanner-results-count">{liveResultsCount}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                                    {results.length ? 'targets del scan actual' : 'leads detectados'}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {Object.entries(bySource).map(([source, count]) => (
                                    <div key={source} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', fontSize: '12px' }}>
                                        <div style={{ fontWeight: 700 }}>{count}</div>
                                        <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>{source}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent scans */}
                            <div style={{ marginTop: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px' }}>SCANS RECIENTES</div>
                                {scans.slice(0, 5).map(s => (
                                    <div key={s.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                                        <span style={{ fontWeight: 600 }}>{s.query}</span>
                                        <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>📍 {s.location} · {s.results_count} resultados</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ LEADS TAB ═══════════ */}
            {tab === 'leads' && (
                <div style={{ overflow: 'auto', flex: 1 }}>
                    {/* Status pipeline */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                        {[
                            { status: 'detected', label: 'Detectados', count: byStatus.detected?.length || 0, color: 'var(--text-tertiary)' },
                            { status: 'qualified', label: 'Cualificados', count: byStatus.qualified?.length || 0, color: 'var(--success)' },
                            { status: 'pursuing', label: 'En curso', count: byStatus.pursuing?.length || 0, color: 'var(--info)' },
                            { status: 'promoted', label: 'En CRM', count: byStatus.promoted?.length || 0, color: 'var(--accent-primary)' },
                        ].map(s => (
                            <div key={s.status} style={{ flex: 1, padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.count}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Lead detail panel */}
                    {selected ? (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{selected.name}</h3>
                                <button className="btn btn-sm" onClick={() => setSelectedLead(null)}>✕ Cerrar</button>
                            </div>
                            <div className="lead-detail">
                                <div className="lead-detail-section">
                                    <h4>📋 Información</h4>
                                    <div className="lead-field"><span className="lead-field-label">Categoría</span><span className="lead-field-value">{selected.category || '–'}</span></div>
                                    <div className="lead-field"><span className="lead-field-label">Dirección</span><span className="lead-field-value">{selected.address || '–'}</span></div>
                                    <div className="lead-field"><span className="lead-field-label">Teléfono</span><span className="lead-field-value">{selected.phone || '–'}</span></div>
                                    <div className="lead-field"><span className="lead-field-label">Web</span><span className="lead-field-value">{selected.website ? <a href={selected.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>{new URL(selected.website).hostname}</a> : '❌ Sin web'}</span></div>
                                    <div className="lead-field"><span className="lead-field-label">Rating</span><span className="lead-field-value">⭐ {selected.rating || '–'} ({selected.review_count} reviews)</span></div>
                                    <div className="lead-field"><span className="lead-field-label">Fuente</span><span className="lead-field-value">{selected.source}</span></div>
                                </div>

                                <div className="lead-detail-section">
                                    <h4>🧠 AI Analysis</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                        <ScoreRing score={selected.ai_score} size={56} />
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>AI FIT SCORE</div>
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{selected.ai_score ? `${selected.ai_score}/100` : 'Sin evaluar'}</div>
                                            {selected.estimated_deal_value && <div style={{ fontSize: '11px', color: 'var(--success)' }}>€{selected.estimated_deal_value}/mes est.</div>}
                                        </div>
                                    </div>
                                    {selected.ai_reasoning && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{selected.ai_reasoning}</p>}

                                    {/* Tech stack */}
                                    {(selected.tech_stack || []).length > 0 && (
                                        <div style={{ marginTop: '10px' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>TECH STACK</div>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {selected.tech_stack.map((t, i) => <span key={i} className="badge badge-neutral" style={{ fontSize: '10px' }}>{t}</span>)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Social profiles */}
                                    {Object.keys(selected.social_profiles || {}).length > 0 && (
                                        <div style={{ marginTop: '10px' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>REDES SOCIALES</div>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {Object.entries(selected.social_profiles).map(([platform, url]) => (
                                                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="badge badge-info" style={{ fontSize: '10px', textDecoration: 'none' }}>{platform}</a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                {selected.website && (
                                    <button className="btn btn-sm" onClick={() => analyzeWebsite(selected.website, selected.id)} disabled={analyzing === selected.id}>
                                        {analyzing === selected.id ? '⏳ Analizando web...' : '🔧 Analizar Web'}
                                    </button>
                                )}
                                <button className="btn btn-sm" onClick={() => aiQualify(selected.id)} disabled={qualifying === selected.id}>
                                    {qualifying === selected.id ? '⏳ Calificando...' : '🧠 AI Qualify'}
                                </button>
                                {selected.status === 'detected' && <button className="btn btn-sm btn-primary" onClick={() => setQualified(selected.id)}>✓ Cualificar</button>}
                                {selected.status === 'qualified' && <button className="btn btn-sm btn-primary" onClick={() => pursueLead(selected.id)}>🎯 Perseguir</button>}
                                {selected.status === 'pursuing' && <button className="btn btn-sm btn-primary" onClick={() => handleImportLeadToCRM(selected)}>→ CRM</button>}
                                <button className="btn btn-sm btn-danger" onClick={() => dismissLead(selected.id)}>✕ Descartar</button>
                            </div>

                            {connectorActions.length > 0 && (
                                <div className="card" style={{ marginTop: '12px', padding: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 700 }}>🕸️ Connector Tools</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{connectorActions.length} live</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {connectorActions.map(action => (
                                            <button key={`${action.connectorId}-${action.templateKey}`} className="btn btn-sm" onClick={() => runConnectorAction(action)} disabled={connectorToolLoading}>
                                                {connectorToolLoading ? '⏳ Ejecutando...' : action.actionLabel}
                                            </button>
                                        ))}
                                    </div>
                                    {(connectorToolData || connectorToolError) && (
                                        <pre style={{
                                            marginTop: '12px',
                                            padding: '10px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '8px',
                                            fontSize: '10px',
                                            whiteSpace: 'pre-wrap',
                                            color: connectorToolError ? 'var(--danger)' : 'var(--text-secondary)',
                                            fontFamily: 'var(--font-mono)',
                                        }}>
                                            {connectorToolError
                                                ? connectorToolError
                                                : JSON.stringify(connectorToolData?.normalized ?? connectorToolData, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* Leads table */}
                    <div className="card">
                        <div className="card-header"><div className="card-title">📡 Todos los Leads ({activeLeads.length})</div></div>
                        {activeLeads.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔭</div>
                                <h3>Lanza un scan</h3>
                                <p style={{ fontSize: '12px' }}>Ve al tab Scanner para detectar negocios en tu zona</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nombre</th><th>Categoría</th><th>Rating</th>
                                            <th>Web</th><th>AI Score</th><th>Status</th><th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeLeads.map(l => (
                                            <tr key={l.id} onClick={() => setSelectedLead(l.id)} style={{ cursor: 'pointer' }}>
                                                <td style={{ fontWeight: 700 }}>{l.name}</td>
                                                <td><span className="badge badge-neutral">{l.category || '–'}</span></td>
                                                <td>⭐ {l.rating || '–'}</td>
                                                <td>{l.website ? '✅' : '❌'}</td>
                                                <td>{l.ai_score ? <ScoreRing score={l.ai_score} size={24} /> : '–'}</td>
                                                <td><span className={`badge ${l.status === 'qualified' ? 'badge-success' : l.status === 'pursuing' ? 'badge-info' : 'badge-neutral'}`}>{l.status}</span></td>
                                                <td>
                                                    <button className="btn btn-sm" onClick={e => { e.stopPropagation(); aiQualify(l.id) }}
                                                        disabled={qualifying === l.id} style={{ fontSize: '10px' }}>
                                                        {qualifying === l.id ? '⏳' : '🧠'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════ OUTREACH TAB ═══════════ */}
            {tab === 'outreach' && (
                <div style={{ overflow: 'auto', flex: 1 }}>
                    {/* Stats pipeline */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                        {[
                            { status: 'staged', label: '📝 Pendientes', count: outreach.stats.staged, color: 'var(--warning)' },
                            { status: 'approved', label: '✅ Aprobados', count: outreach.stats.approved, color: 'var(--info)' },
                            { status: 'sent', label: '📤 Enviados', count: outreach.stats.sent, color: 'var(--success)' },
                            { status: 'replied', label: '💬 Respondidos', count: outreach.stats.replied, color: 'var(--accent-primary)' },
                        ].map(s => (
                            <div key={s.status}
                                onClick={() => { setOutreachFilter(s.status); outreach.loadEmails(s.status) }}
                                style={{
                                    flex: 1, padding: '12px', background: outreachFilter === s.status ? 'var(--bg-elevated)' : 'var(--bg-card)',
                                    border: `1px solid ${outreachFilter === s.status ? s.color : 'var(--border-subtle)'}`,
                                    borderRadius: '8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.count}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Batch actions */}
                    {outreachFilter === 'staged' && outreach.emails.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                            <button className="btn btn-sm btn-primary" onClick={async () => {
                                const count = await outreach.batchApprove()
                                alert(`✅ ${count} emails aprobados`)
                            }}>✅ Aprobar Todos ({outreach.emails.length})</button>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Nada se envía hasta que configures el workflow en n8n</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '16px' }}>
                        {/* Email list */}
                        <div style={{ flex: 1 }}>
                            {outreach.loading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>⏳ Cargando emails...</div>
                            ) : outreach.emails.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📧</div>
                                    <h3>No hay emails {outreachFilter === 'staged' ? 'pendientes' : outreachFilter}</h3>
                                    <p style={{ fontSize: '12px' }}>HUNTER genera emails automáticamente cada día</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {outreach.emails.map(email => (
                                        <div key={email.id}
                                            onClick={() => outreach.setPreview(email)}
                                            style={{
                                                padding: '14px', background: outreach.preview?.id === email.id ? 'var(--bg-elevated)' : 'var(--bg-card)',
                                                border: `1px solid ${outreach.preview?.id === email.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{email.recipient_name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{email.subject}</div>
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                        <span className="badge badge-neutral" style={{ fontSize: '9px' }}>{email.niche}</span>
                                                        <span className="badge badge-neutral" style={{ fontSize: '9px' }}>{email.template_type}</span>
                                                        {email.prospector_leads?.score && (
                                                            <span className={`badge ${email.prospector_leads.score >= 70 ? 'badge-success' : 'badge-info'}`}
                                                                style={{ fontSize: '9px' }}>Score: {email.prospector_leads.score}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {outreachFilter === 'staged' && (
                                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                        <button className="btn btn-sm btn-primary" style={{ fontSize: '10px', padding: '4px 10px' }}
                                                            onClick={e => { e.stopPropagation(); outreach.approveEmail(email.id) }}>✅</button>
                                                        <button className="btn btn-sm" style={{ fontSize: '10px', padding: '4px 10px' }}
                                                            onClick={e => { e.stopPropagation(); outreach.skipEmail(email.id) }}>✕</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Email preview panel */}
                        {outreach.preview && (
                            <div style={{ width: '45%', flexShrink: 0 }}>
                                <div className="card" style={{ position: 'sticky', top: 0 }}>
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="card-title">👁️ Preview</div>
                                        <button className="btn btn-sm" onClick={() => outreach.setPreview(null)} style={{ fontSize: '10px' }}>✕</button>
                                    </div>
                                    <div style={{ padding: '4px' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Para: {outreach.preview.recipient_name}</div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>{outreach.preview.subject}</div>
                                        <div style={{
                                            borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)',
                                            maxHeight: '500px', overflowY: 'auto'
                                        }}>
                                            <iframe
                                                srcDoc={outreach.preview.html_body}
                                                style={{ width: '100%', height: '450px', border: 'none', background: '#0a0a0a' }}
                                                title="Email Preview"
                                            />
                                        </div>
                                        {outreachFilter === 'staged' && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                <button className="btn btn-primary" style={{ flex: 1 }}
                                                    onClick={() => { outreach.approveEmail(outreach.preview.id); outreach.setPreview(null) }}>
                                                    ✅ Aprobar Email
                                                </button>
                                                <button className="btn" style={{ flex: 1 }}
                                                    onClick={() => { outreach.skipEmail(outreach.preview.id); outreach.setPreview(null) }}>
                                                    ✕ Descartar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════ API NETWORK TAB ═══════════ */}
            {tab === 'network' && (
                <div style={{ overflow: 'auto', flex: 1 }}>
                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>🕸️ Red de APIs Conectadas</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                            {API_NODES.filter(n => n.status === 'active').length} activas · {API_NODES.filter(n => n.status === 'pending').length} pendientes · {API_NODES.filter(n => n.status === 'planned').length} planificadas
                        </p>
                    </div>

                    {/* Group by type */}
                    {['GeoIntelligence', 'Web Analyzer', 'AI Engine', 'Social Scanner', 'Data Enricher', 'Execution'].map(type => {
                        const nodes = API_NODES.filter(n => n.type === type)
                        if (nodes.length === 0) return null
                        return (
                            <div key={type} style={{ marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{type}</h4>
                                <div className="api-network">
                                    {nodes.map(node => (
                                        <div key={node.id} className="api-node">
                                            <div className="api-node-icon" style={{ background: `${node.color}22`, color: node.color }}>{node.icon}</div>
                                            <div className="api-node-info">
                                                <div className="api-node-name">{node.name}</div>
                                                <div className="api-node-desc">{node.desc}</div>
                                                <div className="api-node-status">
                                                    <div className="pulse-dot" style={{
                                                        background: node.status === 'active' ? 'var(--success)' : node.status === 'pending' ? 'var(--warning)' : 'var(--text-tertiary)',
                                                    }} />
                                                    <span style={{ color: node.status === 'active' ? 'var(--success)' : node.status === 'pending' ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                                                        {node.status === 'active' ? 'CONECTADA' : node.status === 'pending' ? 'API KEY REQUERIDA' : 'PLANIFICADA'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {/* Architecture diagram */}
                    <div className="card" style={{ marginTop: '16px', padding: '20px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>📐 Arquitectura de Orquestación</h4>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-tertiary)' }}>
                                {`┌─────────────────────────────────────────────────────┐
│                  ProspectorHub                       │
│                  (React Frontend)                    │
├─────────────┬──────────────┬─────────────────────────┤
│  Map View   │  Scanner     │  Leads Table            │
│  (SVG/API)  │  (Search)    │  (CRUD + Filters)       │
├─────────────┴──────────────┴─────────────────────────┤
│              Supabase Edge Functions                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ google-maps- │ │ web-         │ │ ai-          │  │
│  │ search       │ │ analyzer     │ │ qualifier    │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘  │
│         │                │                │          │
│  Google Places    PageSpeed API    Gemini API        │
│  API (New)        + HTML Scan      + Rules Engine    │
├──────────────────────────────────────────────────────┤
│              Supabase PostgreSQL                      │
│  prospector_leads · prospector_scans · RLS · Realtime │
└──────────────────────────────────────────────────────┘`}
                            </pre>
                        </div>
                    </div>

                    {installedProspectorApps.length > 0 && (
                        <div className="card" style={{ marginTop: '16px', padding: '20px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>🔌 Public Connectors for Prospector</h4>
                            <div className="api-network">
                                {installedProspectorApps.map(app => (
                                    <div key={app.id} className="api-node">
                                        <div className="api-node-icon" style={{ background: `${app.color}22`, color: app.color }}>{app.icon}</div>
                                        <div className="api-node-info">
                                            <div className="api-node-name">{app.name}</div>
                                            <div className="api-node-desc">{app.description}</div>
                                            <div className="api-node-status">
                                                <div className="pulse-dot" style={{ background: app.connectorStatus === 'live' ? 'var(--success)' : 'var(--warning)' }} />
                                                <span style={{ color: app.connectorStatus === 'live' ? 'var(--success)' : 'var(--warning)' }}>
                                                    {app.connectorStatus === 'live' ? 'LIVE VIA API-PROXY' : 'INSTALLED / PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Loading overlay */}
            {loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,10,0.7)', zIndex: 100, borderRadius: '12px' }}>
                    <div style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>⏳ Cargando datos...</div>
                </div>
            )}
        </div>
    )
}

export default ProspectorHub
