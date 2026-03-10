// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — HERALD Agent Module
// Telegram Daily Briefing Bot Management
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react'
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
            setLastResult({ success: false, error: 'Supabase edge functions are not configured' })
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
            setLastResult({ success: false, error: err.message })
        }
        setSending(false)
    }, [fetchAgent, heraldReady])

    const formatTime = (iso) => {
        if (!iso) return '—'
        const d = new Date(iso)
        return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    if (loading) return (
        <div className="fade-in" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
            ⏳ Loading HERALD...
        </div>
    )

    if (!heraldReady) return (
        <div className="fade-in">
            <div className="module-header">
                <h1>📱 HERALD — Telegram Briefing Bot</h1>
                <p>Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para activar el briefing operativo.</p>
            </div>
            <div className="empty-state">
                <div className="empty-icon">📴</div>
                <h3>HERALD no configurado</h3>
                <p>El módulo queda en modo seguro hasta que el runtime de Supabase esté disponible.</p>
            </div>
        </div>
    )

    return (
        <div className="fade-in">
            {/* ── Header ── */}
            <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>📱 HERALD — Telegram Briefing Bot</h1>
                    <p>Envía briefings diarios de inteligencia por Telegram. Pipeline, señales, agentes, tareas y health score.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={triggerBriefing}
                    disabled={sending}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    {sending ? '⏳ Enviando...' : '📱 Enviar Briefing Ahora'}
                </button>
            </div>

            {/* ── Agent Status Card ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <div className="kpi-card">
                    <div className="kpi-value" style={{ color: agent?.status === 'online' ? 'var(--success)' : 'var(--danger)' }}>
                        {agent?.status === 'online' ? '🟢' : '🔴'} {agent?.status || 'unknown'}
                    </div>
                    <div className="kpi-label">Estado</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">{agent?.total_runs || 0}</div>
                    <div className="kpi-label">Total Runs</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value" style={{ fontSize: '14px' }}>{formatTime(agent?.last_run_at)}</div>
                    <div className="kpi-label">Último Envío</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-value">08:00</div>
                    <div className="kpi-label">Siguiente Briefing</div>
                </div>
            </div>

            {/* ── Last Send Result ── */}
            {lastResult && (
                <div className="card mb-6" style={{ borderLeft: `3px solid ${lastResult.success ? 'var(--success)' : 'var(--danger)'}` }}>
                    <div className="card-header">
                        <div className="card-title">{lastResult.success ? '✅ Briefing enviado correctamente' : '❌ Error al enviar'}</div>
                    </div>
                    {lastResult.success ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '12px' }}>
                            <strong>telegram_sent:</strong> {String(lastResult.telegram_sent)} · <strong>Pipeline:</strong> {lastResult.briefing_data?.pipeline_total?.toLocaleString()}€ · <strong>Deals:</strong> {lastResult.briefing_data?.deal_count}
                        </div>
                    ) : (
                        <div style={{ fontSize: '12px', color: 'var(--danger)', padding: '12px' }}>
                            {lastResult.error}
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab Navigation ── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[
                    { key: 'overview', label: '📊 Live Data', icon: '' },
                    { key: 'preview', label: '👁️ Preview', icon: '' },
                    { key: 'config', label: '⚙️ Config', icon: '' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className="btn btn-sm"
                        style={{
                            background: activeTab === tab.key ? 'rgba(250,204,21,0.15)' : 'transparent',
                            borderColor: activeTab === tab.key ? '#facc15' : 'var(--border-subtle)',
                            color: activeTab === tab.key ? '#facc15' : 'var(--text-tertiary)',
                            textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Live Data Tab ── */}
            {activeTab === 'overview' && briefingData && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                        <div className="card" style={{ padding: '16px', borderLeft: '3px solid var(--success)' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>💰 Pipeline</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{briefingData.pipeline_total?.toLocaleString()}€</div>
                            <div style={{ fontSize: '11px', color: briefingData.pipeline_change_pct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {briefingData.pipeline_change_pct >= 0 ? '📈' : '📉'} {briefingData.pipeline_change_pct >= 0 ? '+' : ''}{briefingData.pipeline_change_pct}% vs ayer
                            </div>
                        </div>
                        <div className="card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-primary)' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>💎 Deals Activos</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{briefingData.deal_count}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {(briefingData.stale_deals || []).length > 0 ? `⚠️ ${briefingData.stale_deals.length} necesitan atención` : '✅ Todos activos'}
                            </div>
                        </div>
                        <div className="card" style={{ padding: '16px', borderLeft: '3px solid var(--warning)' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>📡 Signals</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>{briefingData.signal_count}</div>
                            <div style={{ fontSize: '11px', color: 'var(--danger)' }}>🔴 {briefingData.critical_signals} critical</div>
                        </div>
                        <div className="card" style={{ padding: '16px', borderLeft: '3px solid #facc15' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>🎯 Health Score</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#facc15' }}>{briefingData.health_score}/100</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>🤖 {briefingData.agents_online}/{briefingData.agents_total} agents online</div>
                        </div>
                    </div>

                    {/* Signals detail */}
                    <div className="card mb-6">
                        <div className="card-header"><div className="card-title">📡 Top Signals</div></div>
                        {(briefingData.signals || []).map((s, i) => (
                            <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ marginRight: '8px' }}>{s.impact >= 9 ? '🔴' : s.impact >= 8 ? '🟠' : '🟡'}</span>
                                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{s.title}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>{s.category}</span>
                                </div>
                                <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{s.impact}/10</span>
                            </div>
                        ))}
                    </div>

                    {/* Top Tasks */}
                    <div className="card">
                        <div className="card-header"><div className="card-title">📋 Top Tasks</div></div>
                        {(briefingData.top_tasks || []).map((t, i) => (
                            <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ marginRight: '8px' }}>{t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : '🟡'}</span>
                                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{t.title}</span>
                                </div>
                                <span className={`badge ${t.status === 'done' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>{t.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Preview Tab ── */}
            {activeTab === 'preview' && briefingData && (
                <div className="card" style={{ padding: '24px', background: '#1a1a2e', borderRadius: '12px', fontFamily: 'monospace', lineHeight: 1.6 }}>
                    <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', color: '#e0e0e0' }}>
                        {`⚡ ANTIGRAVITY — Daily Briefing
━━━━━━━━━━━━━━━━━━━━━━
📅 ${briefingData.date}

💰 PIPELINE
  ${briefingData.pipeline_total?.toLocaleString()}€ ${briefingData.pipeline_change_pct >= 0 ? '📈' : '📉'} ${briefingData.pipeline_change_pct >= 0 ? '+' : ''}${briefingData.pipeline_change_pct}% vs ayer
  💎 ${briefingData.deal_count} deals activos

📡 SIGNALS (${briefingData.signal_count} total / ${briefingData.critical_signals} critical)
${(briefingData.signals || []).map(s => `  ${s.impact >= 9 ? '🔴' : s.impact >= 8 ? '🟠' : '🟡'} ${s.title} — Impact ${s.impact}/10`).join('\n')}

🤖 AGENTS: ✅ ${briefingData.agents_online}/${briefingData.agents_total} online

📋 TOP TASKS
${(briefingData.top_tasks || []).map(t => `  ${t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : '🟡'} ${t.title}`).join('\n')}

🎯 HEALTH: ${briefingData.health_score}/100
  ${'█'.repeat(Math.round(briefingData.health_score / 10))}${'░'.repeat(10 - Math.round(briefingData.health_score / 10))}

🌐 Abrir Dashboard`}
                    </div>
                </div>
            )}

            {/* ── Config Tab ── */}
            {activeTab === 'config' && (
                <div>
                    <div className="card mb-6">
                        <div className="card-header"><div className="card-title">⚙️ Configuración HERALD</div></div>
                        <div className="table-container">
                            <table>
                                <tbody>
                                    <tr><td style={{ fontWeight: 600, width: '200px' }}>Bot Username</td><td><code>@aiopsinternalbot</code></td></tr>
                                    <tr><td style={{ fontWeight: 600 }}>Canal</td><td>Telegram (Private Chat)</td></tr>
                                    <tr><td style={{ fontWeight: 600 }}>Horario</td><td>Todos los días a las <strong>08:00 AM</strong></td></tr>
                                    <tr><td style={{ fontWeight: 600 }}>Edge Function</td><td><code>agent-herald</code> v3 — ACTIVE</td></tr>
                                    <tr><td style={{ fontWeight: 600 }}>n8n Workflow</td><td>HERALD — Daily Telegram Briefing (8AM)</td></tr>
                                    <tr><td style={{ fontWeight: 600 }}>Modelo</td><td><code>{agent?.model || 'system'}</code></td></tr>
                                    <tr><td style={{ fontWeight: 600 }}>Ciclo</td><td>{agent?.cycle_minutes || 1440} minutos (24h)</td></tr>
                                    <tr><td style={{ fontWeight: 600 }}>Total Runs</td><td>{agent?.total_runs || 0}</td></tr>
                                    <tr><td style={{ fontWeight: 600 }}>Último Run</td><td>{formatTime(agent?.last_run_at)}</td></tr>
                                    <tr><td style={{ fontWeight: 600 }}>Parent Agent</td><td>CORTEX</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><div className="card-title">📋 Capabilities</div></div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '14px' }}>
                            {(agent?.capabilities || []).map(cap => (
                                <span key={cap} className="badge badge-neutral" style={{ fontSize: '11px' }}>{cap.replace(/_/g, ' ')}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HeraldAgent
