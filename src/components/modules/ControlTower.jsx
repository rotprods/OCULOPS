// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Intelligence Terminal Masterpiece (Control Tower)
// 100-Year UX: Military-grade, Bloomberg-style, OLED Black, Gold accents
// ═══════════════════════════════════════════════════

import { useMemo } from 'react'
import { useContacts } from '../../hooks/useContacts'
import { useCompanies } from '../../hooks/useCompanies'
import { useDeals } from '../../hooks/useDeals'
import { useActivities } from '../../hooks/useActivities'
import { useSignals } from '../../hooks/useSignals'
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
    const { contacts, loading: contactsLoading } = useContacts()
    const { companies, loading: companiesLoading } = useCompanies()
    const { deals, loading: dealsLoading, totalValue, weightedValue } = useDeals()
    const { activities, loading: activitiesLoading } = useActivities()
    const { signals, activeSignals, loading: signalsLoading } = useSignals()
    const { agents, stats: agentStats } = useAgents()

    const loading = contactsLoading || companiesLoading || dealsLoading || activitiesLoading || signalsLoading

    const recentActivitiesCount = useMemo(() => {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return (activities || []).filter(a => new Date(a.created_at) >= sevenDaysAgo).length
    }, [activities])

    const avgSignalImpact = useMemo(() => {
        const active = activeSignals || []
        if (active.length === 0) return 0
        return Math.round(active.reduce((sum, s) => sum + (s.impact || 0), 0) / active.length)
    }, [activeSignals])

    const healthScore = useMemo(() => {
        // Composite score: pipeline health + agent uptime + signal coverage
        const pipelineScore = Math.min(totalValue / 500, 100) // 0-100 scaled to €50K target
        const agentUptime = agentStats?.total > 0 ? (agentStats.online / agentStats.total) * 100 : 0
        const signalScore = Math.min((activeSignals || []).length * 10, 100)
        return Math.round((pipelineScore * 0.5) + (agentUptime * 0.3) + (signalScore * 0.2))
    }, [totalValue, agentStats, activeSignals])

    const kpis = [
        { label: 'CONTACTS', value: (contacts || []).length, icon: '⚡', target: '100+' },
        { label: 'COMPANIES', value: (companies || []).length, icon: '🛡️', target: '50+' },
        { label: 'PIPELINE VALUATION', value: `€${Math.round(totalValue).toLocaleString()}`, icon: '💎', target: '€50K' },
        { label: 'WEIGHTED PIPELINE', value: `€${Math.round(weightedValue).toLocaleString()}`, icon: '🎯', trendColor: 'var(--color-success)', target: '€25K' },
        { label: 'ACTIVITIES (7D)', value: recentActivitiesCount, icon: '📊', trendColor: recentActivitiesCount > 0 ? 'var(--color-success)' : 'var(--color-warning)', target: '20+' },
        { label: 'SIGNAL INTERCEPTS', value: (activeSignals || []).length, icon: '📡', trendColor: 'var(--color-primary)', target: '10+', subtitle: `AVG IMP: ${avgSignalImpact}` },
    ]

    const recentSignals = (signals || []).slice(-4).reverse()

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ── COMMAND HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', borderRadius: '0' }}>
                        <span style={{ fontSize: '24px' }}>⚡</span>
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontFamily: 'var(--font-editorial)', fontSize: '28px', color: 'var(--color-primary)', letterSpacing: '0.05em', lineHeight: '1' }}>SYSTEM INTELLIGENCE PANEL</h1>
                        <span className="mono text-xs text-tertiary">ANTIGRAVITY OS CORE TERMINAL // ENCRYPTED CONNECTION</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', padding: '8px 16px' }}>
                    <div className="mono text-xs">
                        <span style={{ color: 'var(--text-tertiary)' }}>SYSTEM STATUS:</span> <span style={{ color: loading ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 'bold', marginLeft: '8px' }}>{loading ? 'SYNCING DATA' : 'OPERATIONAL'}</span>
                    </div>
                    <div className="mono text-xs" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>DEALS:</span> <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginLeft: '8px' }}>{(deals || []).length}</span>
                    </div>
                    <div className="status-dot active"></div>
                </div>
            </div>

            {/* ── CORTEX NETWORK STATUS ── */}
            <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', overflowX: 'auto' }}>
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
                    <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>/// HEALTH TELEMETRY</div>
                        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '84px', fontFamily: 'var(--font-mono)', fontWeight: '800', lineHeight: '1', color: healthScore >= 70 ? 'var(--color-success)' : healthScore >= 40 ? 'var(--color-primary)' : 'var(--color-danger)', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                                {healthScore}
                            </div>
                            <div className="mono text-xs text-tertiary" style={{ marginTop: '16px' }}>AGGREGATE HEALTH SCORE</div>
                        </div>
                    </div>

                    <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>/// CRITICAL SIGNALS</div>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)' }}>
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

                    <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-2)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>/// AGENT HEALTH MATRIX</span>
                            <div className="mono text-xs" style={{ display: 'flex', gap: '16px' }}>
                                <span style={{ color: 'var(--color-success)' }}>{agentStats?.online || 0} ONLINE</span>
                                <span style={{ color: 'var(--color-warning)' }}>{agentStats?.running || 0} RUNNING</span>
                                <span style={{ color: 'var(--color-danger)' }}>{agentStats?.error || 0} ERROR</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                            {(agents || []).length === 0 ? (
                                <div className="mono text-xs text-tertiary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '100px' }}>
                                    NO AGENTS REGISTERED
                                </div>
                            ) : (
                                agents.map((agent, i) => (
                                    <div key={agent.id} style={{ padding: '24px', borderBottom: i < agents.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', gap: '20px', background: i % 2 === 0 ? 'transparent' : '#000' }}>
                                        <div style={{ color: agent.status === 'error' ? 'var(--color-danger)' : agent.status === 'online' ? 'var(--color-success)' : 'var(--color-primary)', fontSize: '24px', marginTop: '4px' }}>
                                            {agent.status === 'error' ? '⚠️' : agent.status === 'online' ? '🎯' : '⚡'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="mono text-md font-bold" style={{ marginBottom: '8px', color: 'var(--color-text)' }}>{(agent.code_name || agent.name || 'UNKNOWN').toUpperCase()}</div>
                                            <div className="mono text-xs text-secondary" style={{ lineHeight: '1.6', opacity: 0.9 }}>{(agent.description || agent.role || 'NO DESCRIPTION').toUpperCase()}</div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                                <span className="mono text-xs" style={{ border: '1px solid var(--border-subtle)', padding: '2px 8px', color: 'var(--text-tertiary)' }}>RUNS: {agent.total_runs || 0}</span>
                                                <span className="mono text-xs" style={{ border: `1px solid ${agent.status === 'error' ? 'var(--color-danger)' : 'var(--color-success)'}`, color: agent.status === 'error' ? 'var(--color-danger)' : 'var(--color-success)', padding: '2px 8px' }}>
                                                    {(agent.status || 'UNKNOWN').toUpperCase()}
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
