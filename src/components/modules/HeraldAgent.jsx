// ═══════════════════════════════════════════════════
// OCULOPS — HERALD Agent Module
// 100-Year UX: telegram bot orchestrator
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect, Fragment } from 'react'
import { supabase } from '../../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function HeraldAgent() {
    const [agent, setAgent] = useState(null)
    const [briefingData, setBriefingData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [lastResult, setLastResult] = useState(null)
    const [activeTab, setActiveTab] = useState('overview')
    const heraldReady = Boolean(supabase && SUPABASE_URL && SUPABASE_ANON_KEY)

    // Fetch HERALD agent info from registry
    const fetchAgent = useCallback(async () => {
        if (!supabase) {
            setAgent(null)
            return
        }
        const { data } = await supabase
            .from('agent_registry')
            .select('*')
            .eq('code_name', 'herald')
            .single()
        setAgent(data)
    }, [])

    // Fetch latest briefing data
    const fetchBriefingData = useCallback(async () => {
        if (!supabase) {
            setBriefingData(null)
            return
        }
        const { data } = await supabase.rpc('get_daily_briefing_data')
        setBriefingData(data)
    }, [])

    useEffect(() => {
        if (!supabase) {
            setLoading(false)
            return undefined
        }

        Promise.all([fetchAgent(), fetchBriefingData()]).finally(() => setLoading(false))
        const interval = setInterval(() => { fetchAgent(); fetchBriefingData() }, 30000)
        return () => clearInterval(interval)
    }, [fetchAgent, fetchBriefingData])

    // Trigger manual briefing
    const triggerBriefing = useCallback(async () => {
        if (!heraldReady) {
            setLastResult({ success: false, error: 'SUPABASE EDGE FUNCTIONS OFFLINE' })
            return
        }

        setSending(true)
        setLastResult(null)
        try {
            const resp = await fetch(`${SUPABASE_URL}/functions/v1/agent-herald`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ action: 'daily_briefing' })
            })
            const result = await resp.json()
            setLastResult(result)
            await fetchAgent()
        } catch (err) {
            setLastResult({ success: false, error: err.message.toUpperCase() })
        }
        setSending(false)
    }, [fetchAgent, heraldReady])

    const formatTime = (iso) => {
        if (!iso) return '--:--'
        const d = new Date(iso)
        return d.toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()
    }

    if (loading) return (
        <div className="fade-in mono text-xs" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent-primary)' }}>
            /// ESTABLISHING COMMS WITH HERALD...
        </div>
    )

    if (!heraldReady) return (
        <div className="fade-in">
            <div className="module-header" style={{ borderBottom: '1px solid var(--border-danger)', paddingBottom: '16px' }}>
                <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-danger)' }}>HERALD // TELEGRAM BOT</h1>
                <p className="mono text-xs" style={{ color: 'var(--text-tertiary)' }}>MODULE DISABLED. CONFIGURE VITE_SUPABASE_URL TO ACTIVATE.</p>
            </div>
            <div style={{ padding: '32px', border: '1px solid var(--border-danger)', background: 'var(--danger-bg)', marginTop: '24px', textAlign: 'center' }}>
                <div className="mono text-sm" style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>[ OFFLINE ]</div>
                <p className="mono text-xs" style={{ margin: '12px 0 0 0', color: 'var(--text-secondary)' }}>RUNTIME ENVIRONMENT NOT READY FOR DEPLOYMENT.</p>
            </div>
        </div>
    )

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-default)', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--accent-primary)', letterSpacing: '0.05em', margin: 0 }}>HERALD COMMAND</h1>
                    <p className="mono text-xs text-tertiary" style={{ marginTop: '8px' }}>TELEGRAM ORCHESTRATOR // TRANSMITS DAILY OPERATION BRIEFINGS</p>
                </div>
                <button
                    className="btn btn-primary mono"
                    onClick={triggerBriefing}
                    disabled={sending}
                    style={{ whiteSpace: 'nowrap', fontSize: '11px', padding: '12px 24px', letterSpacing: '0.05em' }}
                >
                    {sending ? '[ TRANSMITTING ]' : 'INITIATE BRIEFING'}
                </button>
            </div>

            {/* ── Agent Status Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
                <div style={{ background: '#000', padding: '16px' }}>
                    <div className="mono text-2xs" style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }}>AGENT STATUS</div>
                    <div className="mono font-bold" style={{ fontSize: '16px', color: agent?.status === 'online' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {agent?.status === 'online' ? '[ ONLINE ]' : '[ OFFLINE ]'}
                    </div>
                </div>
                <div style={{ background: '#000', padding: '16px' }}>
                    <div className="mono text-2xs" style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }}>TOTAL RUNS</div>
                    <div className="mono font-bold" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                        {agent?.total_runs || 0}
                    </div>
                </div>
                <div style={{ background: '#000', padding: '16px' }}>
                    <div className="mono text-2xs" style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }}>LAST TRANSMISSION</div>
                    <div className="mono font-bold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {formatTime(agent?.last_run_at)}
                    </div>
                </div>
                <div style={{ background: '#000', padding: '16px' }}>
                    <div className="mono text-2xs" style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }}>NEXT SCHEDULED</div>
                    <div className="mono font-bold" style={{ fontSize: '16px', color: 'var(--color-info)' }}>
                        08:00 AM
                    </div>
                </div>
            </div>

            {/* ── Last Send Result ── */}
            {lastResult && (
                <div style={{ border: `1px solid ${lastResult.success ? 'var(--color-success)' : 'var(--color-danger)'}`, background: 'var(--surface-raised)', marginBottom: '24px' }}>
                    <div className="mono text-xs font-bold" style={{ padding: '8px 12px', background: lastResult.success ? 'var(--color-success)' : 'var(--color-danger)', color: '#000' }}>
                        {lastResult.success ? '/// TRANSMISSION SUCCESSFUL' : '/// TRANSMISSION FAILURE'}
                    </div>
                    <div className="mono text-xs" style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {lastResult.success ? (
                            <>
                                <strong>COMMS:</strong> {String(lastResult.telegram_sent).toUpperCase()} | <strong>PIPE:</strong> ${lastResult.briefing_data?.pipeline_total?.toLocaleString()} | <strong>DEALS:</strong> {lastResult.briefing_data?.deal_count}
                            </>
                        ) : (
                            lastResult.error
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab Navigation ── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                {[
                    { key: 'overview', label: 'LIVE DATA FEED' },
                    { key: 'preview', label: 'PAYLOAD PREVIEW' },
                    { key: 'config', label: 'SYSTEM CONFIG' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className="btn btn-ghost mono"
                        style={{
                            background: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
                            borderColor: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--border-subtle)',
                            color: activeTab === tab.key ? '#000' : 'var(--text-secondary)',
                            fontSize: '10px', padding: '6px 12px'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Live Data Tab ── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'overview' && briefingData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ background: '#000', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="mono text-2xs text-tertiary">GROSS PIPELINE</div>
                                <div className="mono font-bold" style={{ fontSize: '20px', color: 'var(--color-success)' }}>${briefingData.pipeline_total?.toLocaleString()}</div>
                                <div className="mono text-2xs" style={{ color: briefingData.pipeline_change_pct >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {briefingData.pipeline_change_pct >= 0 ? '[+]' : '[-]'}{briefingData.pipeline_change_pct}% VS D-1
                                </div>
                            </div>
                            <div style={{ background: '#000', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="mono text-2xs text-tertiary">ACTIVE DEALS</div>
                                <div className="mono font-bold" style={{ fontSize: '20px', color: 'var(--accent-primary)' }}>{briefingData.deal_count}</div>
                                <div className="mono text-2xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {(briefingData.stale_deals || []).length > 0 ? `[ ERR ] ${(briefingData.stale_deals.length)} STALE` : '[ OK ] ALL NOMINAL'}
                                </div>
                            </div>
                            <div style={{ background: '#000', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="mono text-2xs text-tertiary">RADAR SIGNALS</div>
                                <div className="mono font-bold" style={{ fontSize: '20px', color: 'var(--color-warning)' }}>{briefingData.signal_count}</div>
                                <div className="mono text-2xs" style={{ color: 'var(--color-danger)' }}>[ {briefingData.critical_signals} ] CRITICAL</div>
                            </div>
                            <div style={{ background: '#000', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="mono text-2xs text-tertiary">SYSTEM HEALTH</div>
                                <div className="mono font-bold" style={{ fontSize: '20px', color: 'var(--accent-primary)' }}>{briefingData.health_score}/100</div>
                                <div className="mono text-2xs" style={{ color: 'var(--text-secondary)' }}>[ {briefingData.agents_online}/{briefingData.agents_total} ] AGENTS ONLINE</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                            <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)' }}>
                                <div className="mono text-xs font-bold" style={{ padding: '12px', background: 'var(--border-subtle)', color: 'var(--accent-primary)' }}>/// SIGNAL FEEDS</div>
                                <div>
                                    {(briefingData.signals || []).map((s, i) => (
                                        <div key={i} style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {s.impact >= 9 ? '[CRIT]' : s.impact >= 8 ? '[WARN]' : '[INFO]'} {s.title.toUpperCase()}
                                            </span>
                                            <span className="mono text-2xs" style={{ color: 'var(--accent-primary)' }}>LVL_{s.impact}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)' }}>
                                <div className="mono text-xs font-bold" style={{ padding: '12px', background: 'var(--border-subtle)', color: 'var(--accent-primary)' }}>/// PRIORITY TASKS</div>
                                <div>
                                    {(briefingData.top_tasks || []).map((t, i) => (
                                        <div key={i} style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {t.priority === 'urgent' ? '[PRI_0]' : t.priority === 'high' ? '[PRI_1]' : '[PRI_2]'} {t.title.toUpperCase()}
                                            </span>
                                            <span className="mono text-2xs" style={{ color: t.status === 'done' ? 'var(--color-success)' : 'var(--text-tertiary)' }}>[{t.status.toUpperCase()}]</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Preview Tab ── */}
                {activeTab === 'preview' && briefingData && (
                    <div style={{ border: '1px solid var(--border-default)', background: '#000', padding: '24px' }}>
                        <pre className="mono text-xs" style={{ color: 'var(--color-success)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                            {`/// HERALD PAYLOAD
/// T:${briefingData.date}

[ PIPELINE STATUS ]
TARGET:  $${briefingData.pipeline_total?.toLocaleString()} (${briefingData.pipeline_change_pct >= 0 ? '+' : ''}${briefingData.pipeline_change_pct}% D-1)
ACTIVE:  [${briefingData.deal_count}] DEALS

[ SIGNALS PROTOCOL ]
TOTAL:   ${briefingData.signal_count} DETECTED
CRIT:    ${briefingData.critical_signals} ACTION REQUIRED
${(briefingData.signals || []).map(s => `> LVL_${s.impact} | ${s.title.toUpperCase()}`).join('\n')}

[ TASKS QUEUE ]
${(briefingData.top_tasks || []).map(t => `> [${t.status.toUpperCase()}] ${t.priority.toUpperCase()} | ${t.title.toUpperCase()}`).join('\n')}

[ AGENT NETWORK ]
NET:     [ ${briefingData.agents_online}/${briefingData.agents_total} ] ONLINE
HLTH:    ${briefingData.health_score}/100 
         ${'█'.repeat(Math.round(briefingData.health_score / 10))}${'░'.repeat(10 - Math.round(briefingData.health_score / 10))}

END OF TRANSMISSION.`}
                        </pre>
                    </div>
                )}

                {/* ── Config Tab ── */}
                {activeTab === 'config' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)' }}>
                            <div className="mono text-xs font-bold" style={{ padding: '12px', background: 'var(--border-subtle)', color: 'var(--accent-primary)' }}>/// OPERATIONAL SYSTEM RECORD</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr' }}>
                                {[
                                    { label: 'BOT TARGET', value: '@aiopsinternalbot' },
                                    { label: 'CHANNEL LINK', value: 'PRIVATE' },
                                    { label: 'CRON FREQ', value: '08:00 AM DAILY' },
                                    { label: 'EDGE RUNTIME', value: 'agent-herald v3 [ACTIVE]' },
                                    { label: 'WORKFLOW', value: 'HERALD_8AM_DISPATCH' },
                                    { label: 'SUB-MODEL', value: agent?.model?.toUpperCase() || 'SYSTEM DEFAULT' },
                                    { label: 'REST CYCLE', value: `${agent?.cycle_minutes || 1440} MINS` },
                                    { label: 'PARENT NODE', value: 'CORTEX OS' }
                                ].map((row, idx) => (
                                    <Fragment key={idx}>
                                        <div className="mono text-xs text-tertiary" style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>{row.label}</div>
                                        <div className="mono text-xs text-primary" style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)' }}>{row.value}</div>
                                    </Fragment>
                                ))}
                            </div>
                        </div>

                        <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)' }}>
                            <div className="mono text-xs font-bold" style={{ padding: '12px', background: 'var(--border-subtle)', color: 'var(--accent-primary)' }}>/// AGENT DIRECTIVES</div>
                            <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {(agent?.capabilities || []).map(cap => (
                                    <span key={cap} className="mono text-2xs" style={{ border: '1px solid var(--border-default)', padding: '4px 8px', background: '#000', color: 'var(--text-secondary)' }}>
                                        {cap.toUpperCase().replace(/_/g, ' ')}
                                    </span>
                                ))}
                                {(!agent?.capabilities || agent.capabilities.length === 0) && (
                                    <span className="mono text-2xs text-tertiary">[ NO DIRECTIVES ALLOCATED ]</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HeraldAgent
