// ===================================================
// ANTIGRAVITY OS — Watchtower (Alerts)
// Wired to Supabase via useAlerts hook
// ===================================================

import { useState } from 'react'
import { useAlerts } from '../../hooks/useAlerts'
import { useApiCatalog } from '../../hooks/useApiCatalog'
import { useConnectorProxy } from '../../hooks/useConnectorProxy'

const SEVERITY_CONFIG = {
    1: { label: 'Crítica', color: 'var(--danger)', icon: '🔴' },
    2: { label: 'Alta', color: 'var(--warning)', icon: '🟡' },
    3: { label: 'Media', color: 'var(--info)', icon: '🔵' },
    4: { label: 'Baja', color: 'var(--text-tertiary)', icon: '⚪' },
}

const emptyForm = { type: 'risk', severity: 2, description: '', title: '' }

function Watchtower() {
    const { alerts, loading, addAlert, resolveAlert } = useAlerts()
    const { installedApps: watchtowerApps } = useApiCatalog({ moduleTarget: 'watchtower' })
    const { execute: executeConnector, data: feedData, loading: feedLoading, error: feedError } = useConnectorProxy({}, { cacheTTL: 30000 })
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [filter, setFilter] = useState('active')
    const liveFeeds = watchtowerApps.filter(app => app.connectorStatus === 'live')

    const handleAdd = async () => {
        if (!form.description.trim()) return
        setSaving(true)
        await addAlert({ ...form, status: 'active' })
        setForm(emptyForm)
        setSaving(false)
    }

    const resolve = async (id) => {
        await resolveAlert(id)
    }

    const runFeed = async (app) => {
        await executeConnector({
            connectorId: app.connectorId,
            endpointName: app.endpointName,
            params: app.sampleParams,
        })
    }

    const filtered = alerts
        .filter(a => filter === 'all' || a.status === filter)
        .sort((a, b) => (a.severity || 4) - (b.severity || 4))

    const activeCount = alerts.filter(a => a.status === 'active').length
    const criticalCount = alerts.filter(a => a.status === 'active' && a.severity === 1).length

    if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>⏳ Cargando alertas...</div>

    return (
        <div className="fade-in">
            <div className="module-header">
                <h1>Watchtower</h1>
                <p>Sistema de alertas y riesgos. Monitoriza señales críticas y toma acción antes de que sea tarde.</p>
            </div>

            <div className="grid-4 mb-6">
                <div className="kpi-card"><div className="kpi-value" style={{ color: activeCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{activeCount}</div><div className="kpi-label">Alertas Activas</div></div>
                <div className="kpi-card"><div className="kpi-value" style={{ color: 'var(--danger)' }}>{criticalCount}</div><div className="kpi-label">Críticas</div></div>
                <div className="kpi-card"><div className="kpi-value" style={{ color: 'var(--success)' }}>{alerts.filter(a => a.status === 'resolved').length}</div><div className="kpi-label">Resueltas</div></div>
                <div className="kpi-card"><div className="kpi-value">{alerts.length}</div><div className="kpi-label">Total</div></div>
            </div>

            {liveFeeds.length > 0 && (
                <div className="card mb-6">
                    <div className="card-header">
                        <div className="card-title">🔌 Live Connector Feeds</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {liveFeeds.map(app => (
                            <button key={app.connectorId} className="btn btn-sm" onClick={() => runFeed(app)} disabled={feedLoading}>
                                {feedLoading ? '⏳' : app.icon} {app.name}
                            </button>
                        ))}
                    </div>
                    {(feedData || feedError) && (
                        <pre style={{
                            padding: '12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            fontSize: '10px',
                            color: feedError ? 'var(--danger)' : 'var(--text-secondary)',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'var(--font-mono)',
                        }}>
                            {feedError ? feedError : JSON.stringify(feedData?.normalized ?? feedData, null, 2)}
                        </pre>
                    )}
                </div>
            )}

            <div className="card mb-6">
                <div className="card-header">
                    <div className="card-title">Alertas ({filtered.length})</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['active', 'resolved', 'all'].map(f => (
                            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : ''}`} onClick={() => setFilter(f)}>
                                {f === 'active' ? '🔥 Activas' : f === 'resolved' ? '✅ Resueltas' : 'Todas'}
                            </button>
                        ))}
                    </div>
                </div>
                {filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">🗼</div><h3>{filter === 'active' ? '¡Sin alertas activas!' : 'Sin alertas'}</h3></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filtered.map(alert => {
                            const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG[4]
                            return (
                                <div key={alert.id} className="card" style={{ padding: '14px', borderLeft: `3px solid ${sev.color}`, opacity: alert.status === 'resolved' ? 0.6 : 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sev.icon} {alert.description}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{alert.type} | {sev.label} | {alert.created_at?.split('T')[0]}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {alert.status === 'active' && <button className="btn btn-sm" style={{ background: 'var(--success)22', color: 'var(--success)' }} onClick={() => resolve(alert.id)}>✅ Resolver</button>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header"><div className="card-title">Nueva Alerta</div></div>
                <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="input-group"><label>Tipo</label><select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="risk">Riesgo</option><option value="opportunity">Oportunidad</option><option value="metric">Métrica</option><option value="deadline">Deadline</option></select></div>
                    <div className="input-group"><label>Severidad</label><select className="input" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: parseInt(e.target.value) }))}><option value={1}>🔴 Crítica</option><option value={2}>🟡 Alta</option><option value={3}>🔵 Media</option><option value={4}>⚪ Baja</option></select></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Título</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre corto de la alerta" /></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Descripción</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="¿Qué está pasando?" /></div>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>{saving ? '⏳ Guardando...' : 'Crear Alerta'}</button>
            </div>
        </div>
    )
}

export default Watchtower
