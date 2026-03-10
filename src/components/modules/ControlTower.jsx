// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Intelligence Terminal Masterpiece (Control Tower)
// 100-Year UX: Military-grade, Bloomberg-style, OLED Black, Gold accents
// ═══════════════════════════════════════════════════

import { useMemo, useEffect } from 'react'
import { computeHealthScore } from '../../lib/ceoScore'
import { useDeals } from '../../hooks/useDeals'
import { useAlerts } from '../../hooks/useAlerts'
import { useTasks } from '../../hooks/useTasks'
import { useSignals } from '../../hooks/useSignals'
import { useSnapshots } from '../../hooks/useSnapshots'
import { useAIAdvisor } from '../../hooks/useAIAdvisor'
import useAgents from '../../hooks/useAgents'

// ── Ultra-Sharp Sparkline ──
function Sparkline({ data = [], color = 'var(--color-primary)', width = 80, height = 24 }) {
    if (data.length < 2) return <span className="mono text-tertiary">—</span>
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ')
    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline points={points} fill="none" stroke={color} strokeWidth="3" opacity="0.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'blur(2px)' }} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function ControlTower() {
    const { deals, loading: dealsLoading } = useDeals()
    const { alerts, loading: alertsLoading } = useAlerts()
    const { completionRate, currentDay, loading: tasksLoading } = useTasks()
    const { signals, loading: signalsLoading } = useSignals()
    const { mrrHistory, clientHistory, pipelineHistory } = useSnapshots(30)
    const { insights, loading: aiLoading, fetchInsights } = useAIAdvisor()
    const { agents, stats: agentStats } = useAgents()

    const loading = dealsLoading || alertsLoading || tasksLoading || signalsLoading

    useEffect(() => { fetchInsights() }, [fetchInsights])

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

    const healthScore = useMemo(
        () => computeHealthScore({ mrr, pipelineTotal, completionRate, activeAlerts }),
        [mrr, pipelineTotal, completionRate, activeAlerts]
    )

    const kpis = [
        { label: 'GROSS MRR', value: `€${mrr.toLocaleString()}`, icon: '⚡', trend: mrrHistory, target: '€20K' },
        { label: 'ACTIVE DEPLOYMENTS', value: clients, icon: '🛡️', trend: clientHistory, target: '5.0' },
        { label: 'PIPELINE VALUATION', value: `€${Math.round(pipelineTotal).toLocaleString()}`, icon: '💎', trend: pipelineHistory, target: '€50K' },
        { label: 'CRITICAL ALERTS', value: activeAlerts, icon: '⚠️', trendColor: activeAlerts > 0 ? 'var(--color-danger)' : 'var(--color-success)', target: '0' },
        { label: 'COMPLETION RATIO', value: `${completionRate}%`, icon: '🎯', trendColor: 'var(--color-success)', target: '100%' },
        { label: 'SIGNAL INTERCEPTS', value: (signals || []).length, icon: '📡', trendColor: 'var(--color-primary)', target: '10+' },
    ]

    const recentSignals = (signals || []).slice(-4).reverse()

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ── COMMAND HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--color-bg-2)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', borderRadius: '0' }}>
                        <span style={{ fontSize: '24px' }}>⚡</span>
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontFamily: 'var(--font-editorial)', fontSize: '28px', color: 'var(--color-primary)', letterSpacing: '0.05em', lineHeight: '1' }}>SYSTEM INTELLIGENCE PANEL</h1>
                        <span className="mono text-xs text-tertiary">ANTIGRAVITY OS CORE TERMINAL // ENCRYPTED CONNECTION</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--color-bg-2)', border: '1px solid var(--border-default)', padding: '8px 16px' }}>
                    <div className="mono text-xs">
                        <span style={{ color: 'var(--text-tertiary)' }}>SYSTEM STATUS:</span> <span style={{ color: loading ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 'bold', marginLeft: '8px' }}>{loading ? 'SYNCING DATA' : 'OPERATIONAL'}</span>
                    </div>
                    <div className="mono text-xs" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>DAY SEQUENCE:</span> <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginLeft: '8px' }}>T+{currentDay}</span>
                    </div>
                    <div className="status-dot active"></div>
                </div>
            </div>

            {/* ── CORTEX NETWORK STATUS ── */}
            <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-default)', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', overflowX: 'auto' }}>
                <span className="mono text-xs font-bold" style={{ color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>CORTEX NETWORK:</span>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    {(agents || []).slice(0, 10).map(agent => (
                        <div key={agent.id} className="mono" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', background: '#000', padding: '4px 8px', border: '1px solid var(--border-subtle)' }}>
                            <div className={`status-dot ${agent.status === 'online' ? 'active' : agent.status === 'running' ? 'warning pulse' : 'error'}`} style={{ width: '6px', height: '6px' }}></div>
                            <span style={{ color: 'var(--color-text)' }}>{(agent.code_name || agent.name || 'UKNOWN').slice(0, 6).toUpperCase()}</span>
                        </div>
                    ))}
                </div>
                <span className="mono text-xs text-tertiary" style={{ whiteSpace: 'nowrap' }}>{agentStats?.online || 0} SECURE NODES</span>
            </div>

            {/* ── HIGH DENSITY GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2.5fr', gap: '16px', flex: 1, minHeight: 0, paddingBottom: '32px' }}>
                {/* LEFT COLUMN: VITAL STATS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                    <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// HEALTH TELEMETRY</div>
                        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '84px', fontFamily: 'var(--font-mono)', fontWeight: '800', lineHeight: '1', color: healthScore >= 70 ? 'var(--color-success)' : healthScore >= 40 ? 'var(--color-primary)' : 'var(--color-danger)', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                                {healthScore}
                            </div>
                            <div className="mono text-xs text-tertiary" style={{ marginTop: '16px' }}>AGGREGATE HEALTH SCORE</div>
                        </div>
                    </div>

                    <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// CRITICAL SIGNALS</div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
                            {recentSignals.map(s => (
                                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '2px solid var(--color-primary)', paddingLeft: '12px' }}>
                                    <div className="mono text-xs" style={{ color: 'var(--color-text)', fontWeight: '700' }}>{s.title.toUpperCase()}</div>
                                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{s.category.toUpperCase()} | {s.indicator.toUpperCase()} | IMP: {s.impact}</div>
                                </div>
                            ))}
                            {recentSignals.length === 0 && (
                                <div className="mono text-xs text-tertiary" style={{ textAlign: 'center', fontStyle: 'italic', marginTop: '32px' }}>NO INBOUND SIGNALS</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: BIG METRICS & AI ADVISOR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border-default)', border: '1px solid var(--border-default)' }}>
                        {kpis.map((kpi, i) => (
                            <div key={i} style={{ background: 'var(--color-bg-2)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="mono text-xs text-tertiary font-bold">{kpi.label}</span>
                                    <span style={{ fontSize: '18px', filter: 'grayscale(100%) brightness(200%)' }}>{kpi.icon}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <span className="mono" style={{ fontSize: '32px', fontWeight: '800', lineHeight: '1', color: kpi.trendColor || 'var(--color-text)' }}>{kpi.value}</span>
                                    {kpi.trend && kpi.trend.length > 1 && (
                                        <div style={{ marginBottom: '4px' }}>
                                            <Sparkline data={kpi.trend} color={kpi.trendColor || 'var(--color-primary)'} width={60} height={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                    TRG: {kpi.target}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>/// CORTEX ADVISOR PROTOCOL</span>
                            <button className="btn btn-ghost mono" style={{ padding: '4px 12px', fontSize: '9px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }} onClick={fetchInsights} disabled={aiLoading}>
                                {aiLoading ? 'ANALYZING...' : 'RERUN ANALYSIS'}
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                            {(insights || []).length === 0 ? (
                                <div className="mono text-xs text-tertiary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '100px' }}>
                                    AWAITING STRATEGIC DIRECTIVES...
                                </div>
                            ) : (
                                insights.map((insight, i) => (
                                    <div key={i} style={{ padding: '24px', borderBottom: i < insights.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', gap: '20px', background: i % 2 === 0 ? 'transparent' : '#000' }}>
                                        <div style={{ color: insight.type === 'risk' ? 'var(--color-danger)' : insight.type === 'opportunity' ? 'var(--color-success)' : 'var(--color-primary)', fontSize: '24px', marginTop: '4px' }}>
                                            {insight.type === 'risk' ? '⚠️' : insight.type === 'opportunity' ? '🎯' : '⚡'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="mono text-md font-bold" style={{ marginBottom: '8px', color: 'var(--color-text)' }}>{insight.title.toUpperCase()}</div>
                                            <div className="mono text-xs text-secondary" style={{ lineHeight: '1.6', opacity: 0.9 }}>{insight.description.toUpperCase()}</div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                                <span className="mono text-xs" style={{ border: '1px solid var(--border-subtle)', padding: '2px 8px', color: 'var(--text-tertiary)' }}>{insight.type.toUpperCase()}</span>
                                                <span className="mono text-xs" style={{ border: `1px solid ${insight.priority === 'high' ? 'var(--color-danger)' : 'var(--color-warning)'}`, color: insight.priority === 'high' ? 'var(--color-danger)' : 'var(--color-warning)', padding: '2px 8px' }}>
                                                    PRIORITY: {insight.priority.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ControlTower
