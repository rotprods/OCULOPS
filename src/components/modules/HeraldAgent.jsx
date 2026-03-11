// ═══════════════════════════════════════════════════
// OCULOPS — Herald Agent v11.0
// Telegram bot orchestrator — daily briefings
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect, Fragment } from 'react'
import { supabase } from '../../lib/supabase'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import ModulePage from '../ui/ModulePage'
import './HeraldAgent.css'

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

    const fetchAgent = useCallback(async () => {
        if (!supabase) { setAgent(null); return }
        const { data } = await supabase.from('agent_registry').select('*').eq('code_name', 'herald').single()
        setAgent(data)
    }, [])

    const fetchBriefingData = useCallback(async () => {
        if (!supabase) { setBriefingData(null); return }
        const { data } = await supabase.rpc('get_daily_briefing_data')
        setBriefingData(data)
    }, [])

    useEffect(() => {
        if (!supabase) { setLoading(false); return }
        Promise.all([fetchAgent(), fetchBriefingData()]).finally(() => setLoading(false))
        const interval = setInterval(() => { fetchAgent(); fetchBriefingData() }, 30000)
        return () => clearInterval(interval)
    }, [fetchAgent, fetchBriefingData])

    const triggerBriefing = useCallback(async () => {
        if (!heraldReady) { setLastResult({ success: false, error: 'Supabase edge functions offline' }); return }
        setSending(true); setLastResult(null)
        try {
            const resp = await fetch(`${SUPABASE_URL}/functions/v1/agent-herald`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, body: JSON.stringify({ action: 'daily_briefing' }) })
            setLastResult(await resp.json()); await fetchAgent()
        } catch (err) { setLastResult({ success: false, error: err.message }) }
        setSending(false)
    }, [fetchAgent, heraldReady])

    const formatTime = (iso) => {
        if (!iso) return '--:--'
        return new Date(iso).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    if (loading) return <div className="lab-panel-empty">Loading Herald agent...</div>

    if (!heraldReady) return (
        <ModulePage title="Herald" subtitle="Telegram bot orchestrator">
            <div className="lab-panel"><div className="lab-panel-header" style={{ color: 'var(--color-danger)' }}>Module offline</div>
                <div className="lab-panel-empty">Configure VITE_SUPABASE_URL to activate this module.</div>
            </div>
        </ModulePage>
    )

    const tabs = [
        { id: 'overview', label: 'Live data' },
        { id: 'preview', label: 'Payload preview' },
        { id: 'config', label: 'Configuration' },
    ]

    return (
        <ModulePage
            title="Herald"
            subtitle="Telegram orchestrator — daily operation briefings"
            actions={<button className="btn btn-primary" onClick={triggerBriefing} disabled={sending}><PaperAirplaneIcon style={{ width: 16, height: 16 }} />{sending ? 'Sending...' : 'Send briefing'}</button>}
        >
            <div className="lab-content">
                {/* Agent status */}
                <div className="kpi-strip kpi-strip-4">
                    <div className="kpi-strip-cell"><span className="mono text-xs text-tertiary">Status</span><span className="mono text-lg font-bold" style={{ color: agent?.status === 'online' ? 'var(--color-success)' : 'var(--color-danger)' }}>{agent?.status === 'online' ? 'Online' : 'Offline'}</span></div>
                    <div className="kpi-strip-cell"><span className="mono text-xs text-tertiary">Total runs</span><span className="mono text-lg font-bold">{agent?.total_runs || 0}</span></div>
                    <div className="kpi-strip-cell"><span className="mono text-xs text-tertiary">Last run</span><span className="mono font-bold" style={{ fontSize: 13 }}>{formatTime(agent?.last_run_at)}</span></div>
                    <div className="kpi-strip-cell"><span className="mono text-xs text-tertiary">Next scheduled</span><span className="mono text-lg font-bold" style={{ color: 'var(--color-info)' }}>08:00 AM</span></div>
                </div>

                {/* Result banner */}
                {lastResult && (
                    <div className={`herald-result ${lastResult.success ? 'herald-result--success' : 'herald-result--error'}`}>
                        <div className="herald-result-header">{lastResult.success ? 'Briefing sent successfully' : 'Briefing failed'}</div>
                        <div className="mono text-xs ct-section-body">
                            {lastResult.success ? (
                                <>Telegram: {String(lastResult.telegram_sent)} · Pipeline: ${lastResult.briefing_data?.pipeline_total?.toLocaleString()} · Deals: {lastResult.briefing_data?.deal_count}</>
                            ) : lastResult.error}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="lab-tabs">
                    {tabs.map(t => <button key={t.id} className={`lab-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
                </div>

                {/* Live Data */}
                {activeTab === 'overview' && briefingData && (
                    <div className="lab-col-layout">
                        <div className="herald-data-grid">
                            <div className="herald-data-cell"><span className="mono text-xs text-tertiary">Pipeline total</span><span className="mono font-bold" style={{ fontSize: 20, color: 'var(--color-success)' }}>${briefingData.pipeline_total?.toLocaleString()}</span><span className="mono text-xs" style={{ color: briefingData.pipeline_change_pct >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{briefingData.pipeline_change_pct >= 0 ? '+' : ''}{briefingData.pipeline_change_pct}% vs yesterday</span></div>
                            <div className="herald-data-cell"><span className="mono text-xs text-tertiary">Active deals</span><span className="mono font-bold" style={{ fontSize: 20, color: 'var(--accent-primary)' }}>{briefingData.deal_count}</span><span className="mono text-xs text-tertiary">{(briefingData.stale_deals || []).length > 0 ? `${briefingData.stale_deals.length} stale` : 'All active'}</span></div>
                            <div className="herald-data-cell"><span className="mono text-xs text-tertiary">Signals</span><span className="mono font-bold" style={{ fontSize: 20, color: 'var(--color-warning)' }}>{briefingData.signal_count}</span><span className="mono text-xs" style={{ color: 'var(--color-danger)' }}>{briefingData.critical_signals} critical</span></div>
                            <div className="herald-data-cell"><span className="mono text-xs text-tertiary">System health</span><span className="mono font-bold" style={{ fontSize: 20, color: 'var(--accent-primary)' }}>{briefingData.health_score}/100</span><span className="mono text-xs text-secondary">{briefingData.agents_online}/{briefingData.agents_total} agents online</span></div>
                        </div>

                        <div className="herald-split">
                            <div className="lab-panel">
                                <div className="lab-panel-header">Signal feed</div>
                                <div>{(briefingData.signals || []).map((s, i) => (
                                    <div key={i} className="lab-log-row">
                                        <span className="mono text-xs text-secondary">{s.impact >= 9 ? '🔴' : s.impact >= 8 ? '🟡' : 'ℹ️'} {s.title}</span>
                                        <span className="mono text-xs" style={{ color: 'var(--accent-primary)' }}>Impact {s.impact}</span>
                                    </div>
                                ))}</div>
                            </div>
                            <div className="lab-panel">
                                <div className="lab-panel-header">Priority tasks</div>
                                <div>{(briefingData.top_tasks || []).map((t, i) => (
                                    <div key={i} className="lab-log-row">
                                        <span className="mono text-xs text-secondary">{t.title}</span>
                                        <span className="badge" style={{ color: t.status === 'done' ? 'var(--color-success)' : 'var(--text-tertiary)' }}>{t.status}</span>
                                    </div>
                                ))}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview */}
                {activeTab === 'preview' && briefingData && (
                    <div className="herald-payload">
                        <pre>{`Herald Briefing — ${briefingData.date}

Pipeline
  Total: $${briefingData.pipeline_total?.toLocaleString()} (${briefingData.pipeline_change_pct >= 0 ? '+' : ''}${briefingData.pipeline_change_pct}% vs yesterday)
  Active deals: ${briefingData.deal_count}

Signals
  Total: ${briefingData.signal_count} detected
  Critical: ${briefingData.critical_signals}
${(briefingData.signals || []).map(s => `  · Impact ${s.impact} — ${s.title}`).join('\n')}

Tasks
${(briefingData.top_tasks || []).map(t => `  · [${t.status}] ${t.priority} — ${t.title}`).join('\n')}

System
  Agents: ${briefingData.agents_online}/${briefingData.agents_total} online
  Health: ${briefingData.health_score}/100 ${'█'.repeat(Math.round(briefingData.health_score / 10))}${'░'.repeat(10 - Math.round(briefingData.health_score / 10))}`}</pre>
                    </div>
                )}

                {/* Config */}
                {activeTab === 'config' && (
                    <div className="lab-col-layout">
                        <div className="lab-panel">
                            <div className="lab-panel-header">System configuration</div>
                            <div className="herald-config-grid">
                                {[
                                    { label: 'Bot target', value: '@aiopsinternalbot' },
                                    { label: 'Channel', value: 'Private' },
                                    { label: 'Schedule', value: '08:00 AM daily' },
                                    { label: 'Runtime', value: 'agent-herald v3' },
                                    { label: 'Workflow', value: 'Herald 8AM dispatch' },
                                    { label: 'Model', value: agent?.model || 'System default' },
                                    { label: 'Cycle', value: `${agent?.cycle_minutes || 1440} min` },
                                    { label: 'Parent', value: 'Cortex OS' },
                                ].map((row, i) => (
                                    <Fragment key={i}>
                                        <div>{row.label}</div>
                                        <div>{row.value}</div>
                                    </Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="lab-panel">
                            <div className="lab-panel-header">Capabilities</div>
                            <div className="ct-section-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                                {(agent?.capabilities || []).map(cap => <span key={cap} className="badge">{cap.replace(/_/g, ' ')}</span>)}
                                {(!agent?.capabilities || agent.capabilities.length === 0) && <span className="mono text-xs text-tertiary">No capabilities configured</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ModulePage>
    )
}

export default HeraldAgent
