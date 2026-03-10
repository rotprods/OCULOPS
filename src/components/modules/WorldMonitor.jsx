// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — World Monitor
// Real geospatial intelligence dashboard powered by Supabase data
// ═══════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApiCatalog } from '../../hooks/useApiCatalog'
import { useConnectorProxy } from '../../hooks/useConnectorProxy'
import { useProspector } from '../../hooks/useProspector'
import { useDeals } from '../../hooks/useDeals'
import { useAlerts } from '../../hooks/useAlerts'
import { useSignals } from '../../hooks/useSignals'
import { useSocialSignals } from '../../hooks/useSocialSignals'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import './WorldMonitor.css'

const LAYERS = [
    { id: 'markets', label: 'Target Markets', icon: '📍', color: '#FFD60A', active: true },
    { id: 'prospects', label: 'Prospects', icon: '🔭', color: '#34A853', active: true },
    { id: 'clients', label: 'Active Clients', icon: '💎', color: '#4285F4', active: false },
    { id: 'competitors', label: 'Competitor Intel', icon: '⚔️', color: '#FF453A', active: false },
    { id: 'signals', label: 'Signals & Alerts', icon: '📡', color: '#FF9F0A', active: true },
    { id: 'opportunities', label: 'Opportunities', icon: '🎯', color: '#30D158', active: true },
]

const TIME_RANGES = ['24h', '7d', '30d', '90d', 'All']
const LAYER_COLORS = Object.fromEntries(LAYERS.map(layer => [layer.id, layer.color]))

function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value)
        return Number.isFinite(parsed) ? parsed : null
    }
    return null
}

function formatRelativeTime(value) {
    if (!value) return 'now'
    const diffMs = Date.now() - new Date(value).getTime()
    const diffMinutes = Math.round(diffMs / 60000)
    if (diffMinutes < 1) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.round(diffHours / 24)
    return `${diffDays}d ago`
}

function matchesTimeRange(value, range) {
    if (!value || range === 'All') return true
    const age = Date.now() - new Date(value).getTime()
    const windows = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
    }
    return age <= (windows[range] || Number.MAX_SAFE_INTEGER)
}

function formatCompactCurrency(value) {
    if (!value) return '—'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value)
}

function getMarkerColor(item) {
    return LAYER_COLORS[item.type] || '#FFD60A'
}

function getIntensityRadius(item) {
    if ((item.score || 0) >= 85 || item.intensity === 'high' || item.urgency === 'high') return 20
    if ((item.score || 0) >= 70 || item.intensity === 'medium' || item.urgency === 'medium') return 14
    return 10
}

function normalizeCoordinates(source) {
    const lat = toNumber(source?.lat ?? source?.latitude ?? source?.search_center?.lat ?? source?.search_center?.latitude)
    const lng = toNumber(source?.lng ?? source?.longitude ?? source?.search_center?.lng ?? source?.search_center?.longitude)
    if (lat == null || lng == null) return null
    return { lat, lng }
}

function buildLayerData({ scans, leads, deals, alerts, signals, socialSignals, timeRange }) {
    const clientCompanyIds = new Set(
        deals
            .filter(deal => ['closed_won', 'onboarding'].includes(deal.stage))
            .map(deal => deal.company_id || deal.company?.id)
            .filter(Boolean)
    )
    const clientDealIds = new Set(
        deals
            .filter(deal => ['closed_won', 'onboarding'].includes(deal.stage))
            .map(deal => deal.id)
            .filter(Boolean)
    )

    const marketItems = scans
        .filter(scan => matchesTimeRange(scan.completed_at || scan.created_at, timeRange))
        .map(scan => {
            const coords = normalizeCoordinates(scan)
            if (!coords) return null

            const resultsCount = Number(scan.results_count || 0)
            return {
                id: `market-${scan.id}`,
                ...coords,
                type: 'markets',
                name: scan.area_label || scan.location || 'Target market',
                details: `${resultsCount} targets · ${scan.source || 'atlas'} · ${formatRelativeTime(scan.completed_at || scan.created_at)}`,
                score: Math.min(100, resultsCount * 4),
                intensity: resultsCount >= 20 ? 'high' : resultsCount >= 8 ? 'medium' : 'low',
                population: null,
                time: formatRelativeTime(scan.completed_at || scan.created_at),
                timestamp: scan.completed_at || scan.created_at,
                raw: scan,
            }
        })
        .filter(Boolean)

    const prospectItems = leads
        .filter(lead => matchesTimeRange(lead.updated_at || lead.created_at, timeRange))
        .map(lead => {
            const coords = normalizeCoordinates(lead)
            if (!coords) return null

            const score = Number(lead.ai_score || lead.score || 0)
            const signal = lead.status === 'pursuing'
                ? '🟢 pursuing'
                : lead.status === 'qualified'
                    ? '🟡 qualified'
                    : lead.status === 'promoted'
                        ? '🔵 promoted'
                        : '⚪ detected'

            return {
                id: `prospect-${lead.id}`,
                ...coords,
                type: 'prospects',
                name: lead.name || lead.business_name || 'Unnamed lead',
                details: [lead.category, lead.address || lead.city, lead.website ? 'website detected' : 'no website'].filter(Boolean).join(' · '),
                score,
                signal,
                status: lead.status,
                time: formatRelativeTime(lead.updated_at || lead.created_at),
                timestamp: lead.updated_at || lead.created_at,
                raw: lead,
            }
        })
        .filter(Boolean)

    const clientItems = prospectItems
        .filter(item => clientCompanyIds.has(item.raw.company_id) || clientDealIds.has(item.raw.deal_id))
        .map(item => ({
            ...item,
            id: `client-${item.raw.id}`,
            type: 'clients',
            details: `${item.name} · active account · ${item.raw.website ? 'website synced' : 'local presence only'}`,
            mrr: item.raw.estimated_deal_value ? formatCompactCurrency(item.raw.estimated_deal_value) : null,
        }))

    const competitorItems = signals
        .filter(signal => signal.category === 'competencia' && matchesTimeRange(signal.updated_at || signal.created_at, timeRange))
        .flatMap(signal => {
            const linkedScan = marketItems.find(item => item.name === signal.source || item.name === signal.title)
            if (!linkedScan) return []
            return [{
                id: `competitor-${signal.id}`,
                lat: linkedScan.lat,
                lng: linkedScan.lng,
                type: 'competitors',
                name: signal.title,
                details: signal.implication || signal.source || 'Competitor intelligence',
                threat: signal.impact >= 75 ? 'high' : signal.impact >= 50 ? 'medium' : 'low',
                score: signal.impact || 0,
                time: formatRelativeTime(signal.updated_at || signal.created_at),
                timestamp: signal.updated_at || signal.created_at,
                raw: signal,
            }]
        })

    const signalItems = [
        ...alerts
            .filter(alert => alert.status === 'active' && matchesTimeRange(alert.created_at, timeRange))
            .flatMap(alert => {
                const linkedScan = marketItems[0]
                if (!linkedScan) return []
                return [{
                    id: `alert-${alert.id}`,
                    lat: linkedScan.lat,
                    lng: linkedScan.lng,
                    type: 'signals',
                    name: alert.title || alert.subject || 'Operational alert',
                    details: alert.description || alert.category || 'Live alert',
                    urgency: Number(alert.severity || 0) >= 3 ? 'high' : Number(alert.severity || 0) >= 2 ? 'medium' : 'low',
                    time: formatRelativeTime(alert.created_at),
                    timestamp: alert.created_at,
                    raw: alert,
                }]
            }),
        ...marketItems
            .filter(item => item.score >= 24)
            .map(item => ({
                id: `scan-signal-${item.raw.id}`,
                lat: item.lat,
                lng: item.lng,
                type: 'signals',
                name: `${item.name} scan spike`,
                details: `${item.raw.results_count || 0} businesses captured in the latest sweep`,
                urgency: item.intensity,
                time: item.time,
                timestamp: item.timestamp,
                raw: item.raw,
            })),
    ]

    const opportunityItems = prospectItems
        .filter(item => (item.score || 0) >= 70 || ['qualified', 'pursuing'].includes(item.status))
        .map(item => ({
            ...item,
            id: `opportunity-${item.raw.id}`,
            type: 'opportunities',
            details: `${item.name} · ${(item.raw.review_count || item.raw.reviews_count || 0)} reviews · ${item.raw.website ? 'ready to enrich' : 'missing website'}`,
            value: formatCompactCurrency(item.raw.estimated_deal_value || Math.max(1200, (item.score || 0) * 35)),
        }))

    const feedItems = [
        ...alerts
            .filter(alert => alert.status === 'active')
            .map(alert => ({
                id: `feed-alert-${alert.id}`,
                name: alert.title || alert.subject || 'Operational alert',
                details: alert.description || alert.category || 'Live alert',
                urgency: Number(alert.severity || 0) >= 3 ? 'high' : Number(alert.severity || 0) >= 2 ? 'medium' : 'low',
                time: formatRelativeTime(alert.created_at),
                timestamp: alert.created_at,
            })),
        ...socialSignals
            .slice(0, 6)
            .map(signal => ({
                id: `feed-social-${signal.id}`,
                name: signal.title,
                details: `${signal.platform} · ${signal.topic} · score ${signal.opportunityScore}`,
                urgency: signal.opportunityScore >= 75 ? 'high' : signal.opportunityScore >= 55 ? 'medium' : 'low',
                time: formatRelativeTime(signal.publishedAt),
                timestamp: signal.publishedAt,
            })),
        ...marketItems.slice(0, 6).map(item => ({
            id: `feed-market-${item.raw.id}`,
            lat: item.lat,
            lng: item.lng,
            name: item.name,
            details: item.details,
            urgency: item.intensity,
            time: item.time,
            timestamp: item.timestamp,
        })),
    ]
        .sort((left, right) => new Date(right.timestamp || 0) - new Date(left.timestamp || 0))
        .slice(0, 10)

    const pipelineValue = opportunityItems.reduce((sum, item) => {
        const rawValue = item.raw.estimated_deal_value || Math.max(1200, (item.score || 0) * 35)
        return sum + rawValue
    }, 0)

    return {
        markets: marketItems,
        prospects: prospectItems,
        clients: clientItems,
        competitors: competitorItems,
        signals: signalItems,
        opportunities: opportunityItems,
        feedItems,
        stats: {
            markers: marketItems.length + prospectItems.length + clientItems.length + competitorItems.length + signalItems.length + opportunityItems.length,
            alerts: alerts.filter(alert => alert.status === 'active').length,
            value: pipelineValue > 0 ? formatCompactCurrency(pipelineValue) : formatCompactCurrency(
                deals
                    .filter(deal => !['closed_won', 'closed_lost'].includes(deal.stage))
                    .reduce((sum, deal) => sum + Number(deal.value || 0), 0)
            ),
        },
    }
}

export default function WorldMonitor() {
    const mapRef = useRef(null)
    const mapInstance = useRef(null)
    const markersRef = useRef([])
    const { installedApps: worldMonitorApps } = useApiCatalog({ moduleTarget: 'world_monitor' })
    const { execute: executeConnector, data: connectorFeedData, loading: connectorFeedLoading, error: connectorFeedError } = useConnectorProxy({}, { cacheTTL: 30000 })
    const { leads, scans, loading: prospectorLoading } = useProspector()
    const { deals } = useDeals()
    const { alerts } = useAlerts()
    const { signals } = useSignals()
    const { items: socialSignals, summary: socialSummary, dataMode: socialDataMode } = useSocialSignals()
    const { status: connectionStatus, isOnline } = useConnectionStatus()
    const [activeLayers, setActiveLayers] = useState(() =>
        LAYERS.reduce((acc, layer) => ({ ...acc, [layer.id]: layer.active }), {})
    )
    const [timeRange, setTimeRange] = useState('7d')
    const [selectedItem, setSelectedItem] = useState(null)
    const [panelExpanded, setPanelExpanded] = useState(true)
    const liveWorldApps = worldMonitorApps.filter(app => app.connectorStatus === 'live')

    const liveData = useMemo(
        () => buildLayerData({ scans, leads, deals, alerts, signals, socialSignals, timeRange }),
        [alerts, deals, leads, scans, signals, socialSignals, timeRange]
    )

    const activeItems = useMemo(() => {
        const items = []
        Object.entries(activeLayers).forEach(([layerId, enabled]) => {
            if (enabled) items.push(...(liveData[layerId] || []))
        })
        return items
    }, [activeLayers, liveData])

    const computedStats = useMemo(() => {
        const visibleSignalAlerts = activeItems.filter(item => item.type === 'signals' && item.urgency === 'high').length
        return {
            markers: activeItems.length,
            alerts: visibleSignalAlerts || liveData.stats.alerts,
            value: liveData.stats.value,
        }
    }, [activeItems, liveData.stats])

    useEffect(() => {
        if (selectedItem && !activeItems.some(item => item.id === selectedItem.id)) {
            setSelectedItem(null)
        }
    }, [activeItems, selectedItem])

    useEffect(() => {
        if (mapInstance.current) return

        const map = L.map(mapRef.current, {
            center: [40.4168, -3.7038],
            zoom: 6,
            zoomControl: false,
            attributionControl: false,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)
        mapInstance.current = map

        return () => {
            map.remove()
            mapInstance.current = null
        }
    }, [])

    useEffect(() => {
        if (!mapInstance.current) return

        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []

        activeItems.forEach(item => {
            if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return
            const color = getMarkerColor(item)
            const radius = getIntensityRadius(item)

            const marker = L.circleMarker([item.lat, item.lng], {
                radius,
                fillColor: color,
                fillOpacity: 0.35,
                color,
                weight: 1.5,
                opacity: 0.8,
            }).addTo(mapInstance.current)

            const core = L.circleMarker([item.lat, item.lng], {
                radius: 4,
                fillColor: color,
                fillOpacity: 1,
                color: '#fff',
                weight: 1,
                opacity: 0.6,
            }).addTo(mapInstance.current)

            marker.bindTooltip(`
                <div style="font-family:Inter,sans-serif;font-size:11px;min-width:180px">
                    <div style="font-weight:700;font-size:12px;margin-bottom:3px;color:${color}">${item.name}</div>
                    <div style="color:#86868B;font-size:10px;line-height:1.4">${item.details || ''}</div>
                </div>
            `, {
                direction: 'top',
                offset: [0, -radius],
                className: 'ag-tooltip',
            })

            marker.on('click', () => setSelectedItem(item))
            markersRef.current.push(marker, core)
        })
    }, [activeItems])

    const toggleLayer = useCallback((layerId) => {
        setActiveLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }))
    }, [])

    const runFeed = useCallback(async (app) => {
        await executeConnector({
            connectorId: app.connectorId,
            endpointName: app.endpointName,
            params: app.sampleParams,
        })
    }, [executeConnector])

    return (
        <div className="wm-container">
            <div ref={mapRef} className="wm-map" />

            <div className="wm-topbar">
                <div className="wm-topbar-left">
                    <span style={{ fontSize: '16px' }}>🌍</span>
                    <span className="wm-topbar-title">WORLD MONITOR</span>
                    <div className="wm-live-badge">
                        <div className="live-dot" style={{ background: isOnline ? undefined : connectionStatus === 'connecting' ? 'var(--warning)' : 'var(--danger)' }} />
                        {isOnline ? 'LIVE' : connectionStatus === 'connecting' ? 'SYNC' : 'OFFLINE'}
                    </div>
                </div>
                <div className="wm-topbar-center">
                    {TIME_RANGES.map(range => (
                        <button
                            key={range}
                            className={`wm-time-btn ${timeRange === range ? 'active' : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
                <div className="wm-topbar-right">
                    <div className="wm-stat">
                        <span className="wm-stat-value">{computedStats.markers}</span>
                        <span className="wm-stat-label">POINTS</span>
                    </div>
                    <div className="wm-stat">
                        <span className="wm-stat-value" style={{ color: computedStats.alerts > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                            {computedStats.alerts}
                        </span>
                        <span className="wm-stat-label">ALERTS</span>
                    </div>
                    <div className="wm-stat">
                        <span className="wm-stat-value" style={{ color: 'var(--success)' }}>{computedStats.value}</span>
                        <span className="wm-stat-label">PIPELINE</span>
                    </div>
                </div>
            </div>

            <div className={`wm-panel ${panelExpanded ? 'expanded' : 'collapsed'}`}>
                <button className="wm-panel-toggle" onClick={() => setPanelExpanded(prev => !prev)}>
                    {panelExpanded ? '◀' : '▶'}
                </button>

                {panelExpanded && (
                    <>
                        <div className="wm-panel-section">
                            <div className="wm-panel-title">DATA LAYERS</div>
                            {LAYERS.map(layer => (
                                <button
                                    key={layer.id}
                                    className={`wm-layer-btn ${activeLayers[layer.id] ? 'active' : ''}`}
                                    onClick={() => toggleLayer(layer.id)}
                                >
                                    <span className="wm-layer-icon">{layer.icon}</span>
                                    <span className="wm-layer-label">{layer.label}</span>
                                    <div
                                        className="wm-layer-dot"
                                        style={{
                                            background: activeLayers[layer.id] ? layer.color : 'var(--text-tertiary)',
                                            boxShadow: activeLayers[layer.id] ? `0 0 6px ${layer.color}60` : 'none',
                                        }}
                                    />
                                    <span className="wm-layer-count">{(liveData[layer.id] || []).length}</span>
                                </button>
                            ))}
                        </div>

                        <div className="wm-panel-section">
                            <div className="wm-panel-title">LIVE FEED</div>
                            <div className="wm-feed">
                                {liveData.feedItems.length === 0 && (
                                    <div className="wm-feed-item">
                                        <div className="wm-feed-content">
                                            <div className="wm-feed-name">No live events yet</div>
                                            <div className="wm-feed-time">Run scans, alerts, or social collectors to populate this feed.</div>
                                        </div>
                                    </div>
                                )}
                                {liveData.feedItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="wm-feed-item"
                                        onClick={() => {
                                            setSelectedItem(item)
                                            if (typeof item.lat === 'number' && typeof item.lng === 'number') {
                                                mapInstance.current?.flyTo([item.lat, item.lng], 12, { duration: 1 })
                                            }
                                        }}
                                    >
                                        <div
                                            className="wm-feed-urgency"
                                            style={{
                                                background: item.urgency === 'high'
                                                    ? 'var(--danger)'
                                                    : item.urgency === 'medium'
                                                        ? 'var(--warning)'
                                                        : 'var(--text-tertiary)',
                                            }}
                                        />
                                        <div className="wm-feed-content">
                                            <div className="wm-feed-name">{item.name}</div>
                                            <div className="wm-feed-time">{item.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '14px', fontSize: '10px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                                Prospector: {prospectorLoading ? 'syncing' : `${leads.length} leads · ${scans.length} scans`}
                                <br />
                                Social: {socialDataMode === 'live' ? `${socialSummary.trackedCount} live signals` : 'waiting for live social rows'}
                            </div>

                            {liveWorldApps.length > 0 && (
                                <div style={{ marginTop: '14px' }}>
                                    <div className="wm-panel-title" style={{ marginBottom: '8px' }}>CONNECTOR FEEDS</div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        {liveWorldApps.map(app => (
                                            <button key={app.connectorId} className="wm-time-btn" onClick={() => runFeed(app)}>
                                                {connectorFeedLoading ? '⏳' : app.icon} {app.name}
                                            </button>
                                        ))}
                                    </div>
                                    {(connectorFeedData || connectorFeedError) && (
                                        <pre style={{
                                            margin: 0,
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.04)',
                                            borderRadius: '10px',
                                            fontSize: '10px',
                                            color: connectorFeedError ? 'var(--danger)' : 'var(--text-secondary)',
                                            whiteSpace: 'pre-wrap',
                                            fontFamily: 'var(--font-mono)',
                                            maxHeight: '180px',
                                            overflow: 'auto',
                                        }}>
                                            {connectorFeedError
                                                ? connectorFeedError
                                                : JSON.stringify(connectorFeedData?.normalized ?? connectorFeedData, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {selectedItem && (
                <div className="wm-detail-card fade-in">
                    <div className="wm-detail-header">
                        <div>
                            <div className="wm-detail-type" style={{ color: getMarkerColor(selectedItem) }}>
                                {(selectedItem.type || 'event').toUpperCase()}
                            </div>
                            <div className="wm-detail-name">{selectedItem.name}</div>
                        </div>
                        <button className="wm-detail-close" onClick={() => setSelectedItem(null)}>✕</button>
                    </div>
                    <div className="wm-detail-body">{selectedItem.details || 'No detail available yet.'}</div>
                    {selectedItem.score != null && (
                        <div className="wm-detail-row">
                            <span>AI Score</span>
                            <span style={{
                                color: selectedItem.score > 80 ? 'var(--success)' : selectedItem.score > 60 ? 'var(--warning)' : 'var(--danger)',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                            }}>{selectedItem.score}/100</span>
                        </div>
                    )}
                    {selectedItem.signal && (
                        <div className="wm-detail-row">
                            <span>Status</span>
                            <span>{selectedItem.signal}</span>
                        </div>
                    )}
                    {selectedItem.mrr && (
                        <div className="wm-detail-row">
                            <span>MRR</span>
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{selectedItem.mrr}</span>
                        </div>
                    )}
                    {selectedItem.value && (
                        <div className="wm-detail-row">
                            <span>Estimated Value</span>
                            <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{selectedItem.value}</span>
                        </div>
                    )}
                    {selectedItem.threat && (
                        <div className="wm-detail-row">
                            <span>Threat Level</span>
                            <span style={{
                                color: selectedItem.threat === 'high' ? 'var(--danger)' : selectedItem.threat === 'medium' ? 'var(--warning)' : 'var(--success)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                            }}>{selectedItem.threat}</span>
                        </div>
                    )}
                    {selectedItem.time && (
                        <div className="wm-detail-row">
                            <span>Detected</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedItem.time}</span>
                        </div>
                    )}
                    <div className="wm-detail-actions">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                                if (typeof selectedItem.lat === 'number' && typeof selectedItem.lng === 'number') {
                                    mapInstance.current?.flyTo([selectedItem.lat, selectedItem.lng], 14, { duration: 1.2 })
                                }
                            }}
                            disabled={typeof selectedItem.lat !== 'number' || typeof selectedItem.lng !== 'number'}
                        >
                            🎯 Focus
                        </button>
                    </div>
                </div>
            )}

            <div className="wm-legend">
                {LAYERS.filter(layer => activeLayers[layer.id]).map(layer => (
                    <div key={layer.id} className="wm-legend-item">
                        <div className="wm-legend-dot" style={{ background: layer.color }} />
                        <span>{layer.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
