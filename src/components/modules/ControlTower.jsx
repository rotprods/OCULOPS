// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — System Intelligence Panel
// Live dashboard with agent status strip
// ═══════════════════════════════════════════════════

import { useMemo, useEffect } from 'react'
import { computeHealthScore } from '../../lib/ceoScore'
import { useDeals } from '../../hooks/useDeals'
import { useAlerts } from '../../hooks/useAlerts'
import { useTasks } from '../../hooks/useTasks'
import { useSignals } from '../../hooks/useSignals'
import { useBets } from '../../hooks/useBets'
import { useNiches } from '../../hooks/useNiches'
import { useSnapshots } from '../../hooks/useSnapshots'
import { useAIAdvisor } from '../../hooks/useAIAdvisor'
import useAgents from '../../hooks/useAgents'
import './ControlTower.css'

// ── Mini SVG Sparkline ──
function Sparkline({ data = [], color = 'var(--accent-primary)', width = 80, height = 24 }) {
    if (data.length < 2) return <span className="sparkline-no-data">—</span>
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ')
    return (
        <svg width={width} height={height} className="sparkline-svg">
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// ── Health Ring ──
function HealthRing({ score, size = 80 }) {
    const r = (size - 8) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (score / 100) * circ
    const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)'
    return (
        <svg width={size} height={size} className="health-ring-svg">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" className="health-ring-circle" />
            <text x={size / 2} y={size / 2} fill={color} fontSize="18" fontWeight="800" textAnchor="middle" dominantBaseline="middle"
                className="health-ring-text">{score}</text>
        </svg>
    )
}

const quickActions = [
    { label: 'Añadir Lead', icon: '➕', module: '/gtm' },
    { label: 'Nueva Señal', icon: '📡', module: '/intelligence' },
    { label: 'Crear Tarea', icon: '📋', module: '/execution' },
    { label: 'Nuevo Experimento', icon: '🧪', module: '/experiments' },
    { label: 'Buscar Leads', icon: '🔭', module: '/prospector' },
    { label: 'Ver Mensajes', icon: '💬', module: '/messaging' },
]

function ControlTower() {
    const { deals, loading: dealsLoading } = useDeals()
    const { alerts, loading: alertsLoading } = useAlerts()
    const { completionRate, currentDay, loading: tasksLoading } = useTasks()
    const { signals, loading: signalsLoading } = useSignals()
    const { active: activeBets } = useBets()
    const { scored: nicheRanking } = useNiches()
    const { mrrHistory, clientHistory, pipelineHistory, healthHistory } = useSnapshots(30)
    const { insights, loading: aiLoading, source: aiSource, fetchInsights } = useAIAdvisor()
    const { agents, stats: agentStats } = useAgents()

    const loading = dealsLoading || alertsLoading || tasksLoading || signalsLoading

    // Auto-fetch AI insights on mount
    useEffect(() => { fetchInsights() }, [fetchInsights])

    // ── Live KPI calculations ──
    const mrr = useMemo(() => {
        return (deals || [])
            .filter(d => ['closed_won', 'onboarding'].includes(d.stage))
            .reduce((sum, d) => sum + (parseFloat(d.monthly_value) || 0), 0)
    }, [deals])

    const clients = useMemo(() => {
        return (deals || []).filter(d => ['closed_won', 'onboarding'].includes(d.stage)).length
    }, [deals])

    const pipelineTotal = useMemo(() => {
        return (deals || [])
            .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
            .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
    }, [deals])

    const activeAlerts = (alerts || []).filter(a => a.status === 'active').length

    // Health score — shared formula with daily-snapshot edge function
    const healthScore = useMemo(
        () => computeHealthScore({ mrr, pipelineTotal, completionRate, activeAlerts }),
        [mrr, pipelineTotal, completionRate, activeAlerts]
    )

    const kpis = [
        { label: 'MRR', value: `€${mrr.toLocaleString()}`, target: '€20k', icon: '💰', trend: mrrHistory, trendColor: 'var(--success)' },
        { label: 'Clientes', value: clients, target: '5', icon: '👥', trend: clientHistory, trendColor: 'var(--info)' },
        { label: 'Pipeline', value: `€${Math.round(pipelineTotal).toLocaleString()}`, target: '€50k', icon: '💎', trend: pipelineHistory, trendColor: 'var(--accent-primary)' },
        { label: 'Alertas', value: activeAlerts, target: '<3', icon: '🔔', trend: null, trendColor: activeAlerts > 3 ? 'var(--danger)' : 'var(--success)' },
        { label: 'Completado', value: `${completionRate}%`, target: '80%', icon: '✅', trend: null, trendColor: 'var(--success)' },
        { label: 'Señales', value: (signals || []).length, target: '10+', icon: '📡', trend: null, trendColor: 'var(--accent-secondary)' },
    ]

    // Recent items for activity feed
    const recentSignals = (signals || []).slice(-3).reverse()
    const recentAlerts = (alerts || []).filter(a => a.status === 'active').slice(0, 3)

    return (
        <div className="control-tower fade-in">
            {/* ── Status Banner ── */}
            <div className="status-banner">
                <div className="banner-content">
                    <div className="banner-icon">⚡</div>
                    <div>
                        <h2 className="banner-title">SYSTEM INTELLIGENCE PANEL</h2>
                        <p className="text-sm text-secondary">
                            {loading ? '⏳ Sincronizando datos...' : `Día ${currentDay} | ${clients} clientes | ${activeAlerts} alertas activas`}
                        </p>
                    </div>
                </div>
                <div className="banner-status">
                    <span className="status-dot" style={{ background: loading ? 'var(--warning)' : 'var(--success)' }}></span>
                    <span className="mono text-xs">{loading ? 'SINCRONIZANDO' : 'EN VIVO'}</span>
                </div>
            </div>

            {/* ── Agent Status Strip ── */}
            <div className="agent-status-strip">
                {(agents || []).slice(0, 8).map(agent => {
                    const statusColor = agent.status === 'online' ? 'var(--success)' : agent.status === 'running' ? 'var(--accent-primary)' : agent.status === 'error' ? 'var(--danger)' : 'var(--text-quaternary)'
                    return (
                        <div key={agent.id || agent.code_name} className="agent-node-dot" title={`${agent.code_name || agent.name}: ${agent.status}`}>
                            <span className="agent-dot" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                            <span className="agent-dot-label">{(agent.code_name || agent.name || '').slice(0, 6).toUpperCase()}</span>
                        </div>
                    )
                })}
                {agents.length === 0 && <span className="text-xs text-tertiary">No agents connected</span>}
                <span className="agent-strip-summary">{agentStats.online} online · {agentStats.running} running</span>
            </div>

            {/* ── Health Score + KPI Grid ── */}
            <section className="section">
                <h3 className="section-title">📊 Métricas Clave</h3>
                <div className="health-score-layout">
                    {/* Health ring */}
                    <div className="health-score-container">
                        <HealthRing score={healthScore} size={100} />
                        <span className="health-score-label">HEALTH SCORE</span>
                        {healthHistory.length > 1 && <Sparkline data={healthHistory} color={healthScore >= 70 ? 'var(--success)' : 'var(--warning)'} width={90} height={20} />}
                    </div>

                    {/* KPI Grid */}
                    <div className="kpi-grid">
                        {kpis.map((kpi, i) => (
                            <div key={i} className="kpi-card card">
                                <div className="kpi-header">
                                    <span className="kpi-icon">{kpi.icon}</span>
                                    {kpi.trend && kpi.trend.length > 1 && <Sparkline data={kpi.trend} color={kpi.trendColor} />}
                                </div>
                                <div className="kpi-value">{kpi.value}</div>
                                <div className="kpi-label">{kpi.label}</div>
                                <div className="kpi-target">
                                    <span className="text-xs text-tertiary">Target: {kpi.target}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Quick Actions ── */}
            <section className="section">
                <h3 className="section-title">⚡ Acciones Rápidas</h3>
                <div className="actions-grid">
                    {quickActions.map((action, i) => (
                        <a key={i} href={action.module} className="action-card card">
                            <span className="action-icon">{action.icon}</span>
                            <span className="action-label">{action.label}</span>
                        </a>
                    ))}
                </div>
            </section>

            {/* ── AI Strategy Advisor ── */}
            <section className="section">
                <h3 className="section-title">
                    🧠 AI Strategy Advisor
                    <button className="btn btn-sm action-btn-update" onClick={fetchInsights} disabled={aiLoading}>
                        {aiLoading ? '⏳ Analizando...' : '🔄 Actualizar'}
                    </button>
                    {aiSource && <span className="ai-source-label">vía {aiSource}</span>}
                </h3>
                <div className="ai-advisor-grid">
                    {(insights.length > 0 ? insights : [
                        { type: 'action', title: 'Esperando datos...', description: 'Haz click en Actualizar para obtener insights.', priority: 'low', confidence: 0 },
                    ]).map((insight, i) => {
                        const typeConfig = { risk: { icon: '🔴', color: 'var(--danger)' }, opportunity: { icon: '🟢', color: 'var(--success)' }, action: { icon: '🔵', color: 'var(--accent-primary)' } }
                        const cfg = typeConfig[insight.type] || typeConfig.action
                        return (
                            <div key={i} className="card ai-insight-card" style={{ borderTop: `3px solid ${cfg.color}` }}>
                                <div className="ai-insight-header">
                                    <span className="ai-insight-icon">{cfg.icon}</span>
                                    <span className="ai-insight-title">{insight.title}</span>
                                </div>
                                <p className="ai-insight-description">{insight.description}</p>
                                <div className="ai-insight-footer">
                                    <span className="badge ai-insight-badge" style={{ background: cfg.color + '22', color: cfg.color }}>{insight.type}</span>
                                    {insight.priority && <span className={`badge ai-insight-badge ${insight.priority === 'high' ? 'badge-danger' : insight.priority === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>{insight.priority}</span>}
                                    {insight.confidence > 0 && <span className="badge badge-neutral ai-insight-badge">{insight.confidence}% confident</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* ── Intel Feed ── */}
            <div className="grid-2-col">
                {/* Top Niches */}
                <section className="section">
                    <h3 className="section-title">🧬 Top Nichos</h3>
                    <div className="card">
                        {nicheRanking.length === 0 ? (
                            <div className="empty-state">Sin nichos evaluados</div>
                        ) : (
                            <div className="flex-col-container">
                                {nicheRanking.slice(0, 5).map((n, i) => (
                                    <div key={n.id} className="list-item">
                                        <span className="list-item-rank" style={{ color: i === 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>{i + 1}</span>
                                        <span className="list-item-name">{n.name}</span>
                                        <span className="list-item-score" style={{ color: n.ceoScore > 60 ? 'var(--success)' : 'var(--warning)' }}>{n.ceoScore}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Active Bets */}
                <section className="section">
                    <h3 className="section-title">🎯 Apuestas Activas</h3>
                    <div className="card">
                        {activeBets.length === 0 ? (
                            <div className="empty-state">Sin apuestas activas</div>
                        ) : (
                            <div className="flex-col-container">
                                {activeBets.slice(0, 5).map(bet => (
                                    <div key={bet.id} className="list-item">
                                        <span style={{ fontSize: '12px' }}>{bet.type === 'core' ? '🔵' : '🟢'}</span>
                                        <span className="list-item-name">{bet.name}</span>
                                        <span className="badge badge-info ai-insight-badge">{bet.type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* ── Recent Activity ── */}
            <div className="grid-2-col">
                {recentSignals.length > 0 && (
                    <section className="section">
                        <h3 className="section-title">📡 Últimas Señales</h3>
                        <div className="card">
                            {recentSignals.map(s => (
                                <div key={s.id} className="list-item" style={{ fontSize: '12px' }}>
                                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px', marginTop: '2px' }}>{s.category} | {s.indicator} | impact: {s.impact}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {recentAlerts.length > 0 && (
                    <section className="section">
                        <h3 className="section-title">🔔 Alertas Activas</h3>
                        <div className="card">
                            {recentAlerts.map(a => (
                                <div key={a.id} className="list-item" style={{ fontSize: '12px', borderLeft: `3px solid ${a.severity === 1 ? 'var(--danger)' : 'var(--warning)'}` }}>
                                    <div style={{ fontWeight: 600 }}>{a.description}</div>
                                    {a.action_required && <div style={{ color: 'var(--accent-primary)', fontSize: '10px', marginTop: '2px' }}>🎯 {a.action_required}</div>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* ── System Status ── */}
            <section className="section">
                <h3 className="section-title">🔧 Estado del Sistema</h3>
                <div className="grid-auto">
                    <div className="card">
                        <div className="text-sm text-secondary">Base de Datos</div>
                        <div className="text-lg" style={{ color: 'var(--success)' }}>✅ Conectada (Supabase)</div>
                        <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-2)' }}>
                            28 tablas · RLS activo · Realtime habilitado
                        </p>
                    </div>
                    <div className="card">
                        <div className="text-sm text-secondary">Edge Functions</div>
                        <div className="text-lg" style={{ color: 'var(--success)' }}>✅ 2 activas</div>
                        <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-2)' }}>
                            daily-snapshot · ai-advisor
                        </p>
                    </div>
                    <div className="card">
                        <div className="text-sm text-secondary">Modo</div>
                        <div className="text-lg text-accent">🖥️ Desktop (Electron)</div>
                        <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-2)' }}>
                            Ejecuta con: npm run electron:dev
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default ControlTower
