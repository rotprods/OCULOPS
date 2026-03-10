// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — AI Agents Hub (CORTEX Network)
// Multi-Agent Orchestration Dashboard - 100-Year UX
// ═══════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { useAgents } from '../../hooks/useAgents'
import { useAgentStudies } from '../../hooks/useAgentStudies'
import { AGENT_AUTOMATION_PACKS } from '../../data/agentAutomationPacks'

const AGENT_ICONS = { cortex: '🧠', atlas: '🌍', hunter: '🎯', oracle: '📊', sentinel: '🛡️', forge: '✍️', strategist: '⚖️', scribe: '📝', herald: '📱' }
const AGENT_COLORS = { cortex: '#00d2d3', atlas: '#6366f1', hunter: '#f59e0b', oracle: '#8b5cf6', sentinel: '#ef4444', forge: '#10b981', strategist: '#3b82f6', scribe: '#ec4899', herald: '#facc15' }
const INITIAL_STUDY_FORM = { agentCodeName: 'cortex', title: '', summary: '', contentMarkdown: '', sendTelegram: true }
const INITIAL_TELEGRAM_FORM = { label: 'Primary Telegram', chat_id: '', thread_id: '', notify_manual: true, notify_automated: true }

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()
}

function formatDuration(ms) {
  if (!ms) return '—'
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function Agents() {
  const { toast } = useAppStore()
  const { agents, tasks, logs, stats, triggerAgent, runCortexCycle } = useAgents()
  const { studies, telegramTarget, loading: studiesLoading, busy: studiesBusy, postStudy, resendStudy, saveTelegramTarget } = useAgentStudies()

  const [triggering, setTriggering] = useState(null)
  const [activeTab, setActiveTab] = useState('network')
  const [studyForm, setStudyForm] = useState(INITIAL_STUDY_FORM)
  const [telegramForm, setTelegramForm] = useState(INITIAL_TELEGRAM_FORM)

  useEffect(() => {
    if (!telegramTarget) return
    setTelegramForm({
      label: telegramTarget.label || 'Primary Telegram', chat_id: telegramTarget.chat_id || '',
      thread_id: telegramTarget.thread_id || '', notify_manual: telegramTarget.notify_manual !== false,
      notify_automated: telegramTarget.notify_automated !== false,
    })
  }, [telegramTarget])

  const handleTrigger = useCallback(async (codeName, action) => {
    setTriggering(codeName)
    const result = await triggerAgent(codeName, action)
    setTriggering(null)
    if (result?.error) toast(result.error, 'warning')
    else toast(`${codeName.toUpperCase()} triggered`, 'success')
  }, [toast, triggerAgent])

  const handleCortexCycle = useCallback(async () => {
    setTriggering('cortex')
    const result = await runCortexCycle()
    setTriggering(null)
    if (result?.error) toast(result.error, 'warning')
    else toast('CORTEX orchestration started', 'success')
  }, [runCortexCycle, toast])

  const handlePostStudy = useCallback(async () => {
    if (!studyForm.title.trim()) { toast('Study title is required', 'warning'); return }
    const summary = studyForm.summary.trim() || studyForm.contentMarkdown.trim()
    if (!summary) { toast('Add a summary or body before posting', 'warning'); return }

    const highlights = summary.split(/\n|\./).map(i => i.trim()).filter(Boolean).slice(0, 4)
    try {
      const result = await postStudy({
        agent_code_name: studyForm.agentCodeName,
        title: studyForm.title.trim(),
        summary, content_markdown: studyForm.contentMarkdown.trim() || summary,
        highlights, study_type: 'manual', send_telegram: studyForm.sendTelegram,
      })
      setStudyForm(cur => ({ ...INITIAL_STUDY_FORM, agentCodeName: cur.agentCodeName }))
      toast(result?.delivery?.delivered ? 'Study posted and routed to Telegram' : 'Study generated', 'success')
    } catch (e) {
      toast(e.message, 'warning')
    }
  }, [postStudy, studyForm, toast])

  const handleSaveTelegram = useCallback(async () => {
    if (!telegramForm.chat_id.trim()) { toast('Telegram chat_id is required', 'warning'); return }
    await saveTelegramTarget({
      label: telegramForm.label.trim() || 'Primary Telegram', chat_id: telegramForm.chat_id.trim(),
      thread_id: telegramForm.thread_id.trim() || null, notify_manual: telegramForm.notify_manual,
      notify_automated: telegramForm.notify_automated, is_active: true, type: 'telegram',
    })
    toast('Telegram link established', 'success')
  }, [saveTelegramTarget, telegramForm, toast])

  const handleResendStudy = useCallback(async (studyId) => {
    try {
      const result = await resendStudy(studyId)
      toast(result?.delivery?.delivered ? 'Delivered' : 'Delivery blocked', result?.delivery?.delivered ? 'success' : 'warning')
    } catch (e) { toast(e.message, 'warning') }
  }, [resendStudy, toast])

  const cortex = agents.find(agent => agent.code_name === 'cortex')
  const subAgents = agents.filter(agent => agent.code_name !== 'cortex').sort((a, b) => a.code_name.localeCompare(b.code_name))
  const agentOptions = useMemo(() => {
    const m = new Map()
    AGENT_AUTOMATION_PACKS.forEach(p => m.set(p.agentCodeName, { value: p.agentCodeName, label: p.label.toUpperCase() }))
    agents.forEach(a => { if (!m.has(a.code_name)) m.set(a.code_name, { value: a.code_name, label: a.name.toUpperCase() }) })
    return [...m.values()]
  }, [agents])

  const recentStudies = studies.slice(0, 24)
  const deliveryStats = useMemo(() => ({ total: studies.length, sent: studies.filter(s => s.delivery_status === 'sent').length, failed: studies.filter(s => s.delivery_status === 'failed').length }), [studies])

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#000', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <span style={{ fontSize: '24px' }}>🧠</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-editorial)', fontSize: '28px', color: 'var(--color-primary)', letterSpacing: '0.05em', lineHeight: '1' }}>CORTEX NETWORK HUB</h1>
            <span className="mono text-xs text-tertiary">MULTI-AGENT ORCHESTRATION DIRECTIVE // {stats.online} ONLINE</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2px' }}>
          {['network', 'queue', 'logs', 'studies', 'automation'].map(t => (
            <button key={t} className="mono" style={{ padding: '8px 16px', fontSize: '10px', background: activeTab === t ? 'var(--color-primary)' : 'transparent', color: activeTab === t ? '#000' : 'var(--color-text)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab(t)}>{t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* ── NETWORK STATUS STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1px', background: 'var(--border-default)', border: '1px solid var(--border-default)', marginBottom: '16px' }}>
        <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span className="mono text-xs text-tertiary">ASSETS</span>
          <span className="mono text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{stats.total}</span>
        </div>
        <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span className="mono text-xs text-tertiary">RUNNING</span>
          <span className="mono text-lg font-bold" style={{ color: 'var(--color-warning)' }}>{stats.running}</span>
        </div>
        <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span className="mono text-xs text-tertiary">QUEUED TASKS</span>
          <span className="mono text-lg font-bold" style={{ color: 'var(--color-text)' }}>{stats.queuedTasks}</span>
        </div>
        <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span className="mono text-xs text-tertiary">SYSTEM CYCLES</span>
          <span className="mono text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>{stats.totalRuns}</span>
        </div>
        <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span className="mono text-xs text-tertiary">DELIVERED INTEL</span>
          <span className="mono text-lg font-bold" style={{ color: 'var(--color-success)' }}>{deliveryStats.sent}</span>
        </div>
        <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <span className="mono text-xs text-tertiary">SECURE COMMS</span>
          <span className="mono text-lg font-bold" style={{ color: telegramTarget ? 'var(--color-success)' : 'var(--color-danger)' }}>{telegramTarget ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeTab === 'network' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* MASTER CORTEX */}
            {cortex && (
              <div style={{ border: '1px solid var(--color-primary)', background: '#000', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div className="mono text-xs font-bold" style={{ color: '#000', background: 'var(--color-primary)', padding: '4px 8px' }}>MASTER NODE</div>
                  <div>
                    <div className="mono font-bold" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>{cortex.name.toUpperCase()}</div>
                    <div className="mono text-xs text-tertiary">{cortex.description.toUpperCase()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div className="mono text-xs" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}><span className="text-tertiary">RUNS:</span> <strong className="text-primary">{cortex.total_runs || 0}</strong></div>
                  <div className="mono text-xs" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}><span className="text-tertiary">LAST:</span> <strong className="text-primary">{formatTime(cortex.last_run_at)}</strong></div>
                  <button className="btn mono btn-primary btn-sm" style={{ padding: '8px 16px', letterSpacing: '0.1em' }} onClick={handleCortexCycle} disabled={triggering === 'cortex'}>
                    {triggering === 'cortex' ? 'EXECUTING...' : 'INITIATE CORTEX'}
                  </button>
                </div>
              </div>
            )}

            {/* SUB-AGENTS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {subAgents.map(ag => (
                <div key={ag.id} style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 8, height: 8, background: ag.status === 'online' ? 'var(--color-success)' : ag.status === 'running' ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                      <span className="mono text-xs font-bold" style={{ color: AGENT_COLORS[ag.code_name] || 'var(--color-primary)' }}>{ag.code_name.toUpperCase()}</span>
                    </div>
                    <button className="btn btn-ghost mono btn-sm" style={{ fontSize: '9px', padding: '2px 8px', borderColor: AGENT_COLORS[ag.code_name] || 'var(--border-subtle)' }} onClick={() => handleTrigger(ag.code_name, 'cycle')} disabled={triggering === ag.code_name}>
                      {triggering === ag.code_name ? 'EXE...' : 'TRIGGER'}
                    </button>
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div className="mono text-sm font-bold">{ag.name.toUpperCase()}</div>
                    <div className="mono text-xs text-tertiary" style={{ minHeight: '40px' }}>{ag.description.toUpperCase()}</div>

                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto' }}>
                      {(ag.capabilities || []).slice(0, 3).map(cap => (
                        <span key={cap} style={{ border: '1px solid var(--border-subtle)', background: '#000', color: 'var(--text-secondary)', padding: '2px 6px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                          {cap.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }} className="mono text-xs">
                      <span className="text-tertiary">CYCLES: <strong className="text-primary">{ag.total_runs || 0}</strong></span>
                      <span className="text-tertiary">L.A.: <strong className="text-secondary">{formatTime(ag.last_run_at)}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
            <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// TASK QUEUE</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.slice(0, 50).map(t => (
                <div key={t.id} className="mono text-xs" style={{ display: 'flex', gap: '16px', padding: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: AGENT_COLORS[t.agent_code_name] || 'var(--color-primary)', width: '100px', fontWeight: 'bold' }}>{t.agent_code_name.toUpperCase()}</span>
                  <span style={{ color: 'var(--color-text)', flex: 1 }}>{t.title || t.type.toUpperCase()}</span>
                  <span style={{ color: t.status === 'completed' ? 'var(--color-success)' : t.status === 'failed' ? 'var(--color-danger)' : 'var(--color-warning)' }}>[{t.status.toUpperCase()}]</span>
                </div>
              ))}
              {tasks.length === 0 && <div className="mono text-xs text-tertiary" style={{ textAlign: 'center', padding: '32px' }}>QUEUE EMPTY</div>}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
            <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// NETWORK LOGS</div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.slice(0, 50).map(log => (
                <div key={log.id} className="mono text-xs" style={{ display: 'flex', gap: '16px', padding: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-tertiary)', width: '120px' }}>{formatTime(log.created_at)}</span>
                  <span style={{ color: AGENT_COLORS[log.agent_code_name] || 'var(--color-primary)', width: '100px', fontWeight: 'bold' }}>{log.agent_code_name.toUpperCase()}</span>
                  <span style={{ color: log.error ? 'var(--color-danger)' : 'var(--color-text)', flex: 1 }}>{log.action.toUpperCase()} {log.error ? ` [FATAL: ${log.error}]` : ''}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>{formatDuration(log.duration_ms)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'studies' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '16px', paddingBottom: '32px' }}>
            {/* LEFT COLUMN: COMPILE STUDY & SETTINGS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)' }}>
                <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// COMPILE STUDY BRIEF</div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="input-group">
                    <label className="mono text-xs">EXECUTING AGENT</label>
                    <select className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '8px' }} value={studyForm.agentCodeName} onChange={e => setStudyForm({ ...studyForm, agentCodeName: e.target.value })}>
                      {agentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="mono text-xs">DESIGNATION / TITLE</label>
                    <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '8px' }} value={studyForm.title} onChange={e => setStudyForm({ ...studyForm, title: e.target.value })} placeholder="STUDY_REF..." />
                  </div>
                  <div className="input-group">
                    <label className="mono text-xs">EXECUTIVE ABSTRACT</label>
                    <textarea className="input mono text-xs" rows={2} style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '8px' }} value={studyForm.summary} onChange={e => setStudyForm({ ...studyForm, summary: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="mono text-xs">RAW INTELLIGENCE</label>
                    <textarea className="input mono text-xs" rows={4} style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '8px' }} value={studyForm.contentMarkdown} onChange={e => setStudyForm({ ...studyForm, contentMarkdown: e.target.value })} />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }} className="mono text-xs">
                    <input type="checkbox" checked={studyForm.sendTelegram} onChange={e => setStudyForm({ ...studyForm, sendTelegram: e.target.checked })} style={{ appearance: 'auto' }} />
                    ROUTE TO TELEGRAM IMMEDIATELY
                  </label>

                  <button className="btn mono" style={{ border: '1px solid var(--color-primary)', background: '#000', color: 'var(--color-primary)', borderRadius: 0, padding: '10px', marginTop: '8px' }} onClick={handlePostStudy} disabled={studiesBusy === 'study'}>
                    {studiesBusy === 'study' ? 'PROCESSING...' : 'DISPATCH STUDY'}
                  </button>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)' }}>
                <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// OUTBOUND RELAY (TELEGRAM)</div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="input-group">
                    <label className="mono text-xs">LINK REFERENCE</label>
                    <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '8px' }} value={telegramForm.label} onChange={e => setTelegramForm({ ...telegramForm, label: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="mono text-xs">CHAT IDENTIFIER</label>
                    <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '8px' }} value={telegramForm.chat_id} onChange={e => setTelegramForm({ ...telegramForm, chat_id: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="mono text-xs">THREAD OVERRIDE</label>
                    <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '8px' }} value={telegramForm.thread_id} onChange={e => setTelegramForm({ ...telegramForm, thread_id: e.target.value })} placeholder="OPTIONAL" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} className="mono text-xs">
                      <input type="checkbox" checked={telegramForm.notify_manual} onChange={e => setTelegramForm({ ...telegramForm, notify_manual: e.target.checked })} style={{ appearance: 'auto' }} />
                      ALLOW MANUAL TRANSMISSIONS
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} className="mono text-xs">
                      <input type="checkbox" checked={telegramForm.notify_automated} onChange={e => setTelegramForm({ ...telegramForm, notify_automated: e.target.checked })} style={{ appearance: 'auto' }} />
                      ALLOW AUTOMATED TRANSMISSIONS
                    </label>
                  </div>

                  <button className="btn mono" style={{ border: '1px solid var(--color-primary)', background: '#000', color: 'var(--color-primary)', borderRadius: 0, padding: '10px', marginTop: '8px' }} onClick={handleSaveTelegram} disabled={studiesBusy === 'target'}>
                    {studiesBusy === 'target' ? 'LOCKING...' : 'SECURE RELAY RECORD'}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: RECENT STUDIES */}
            <div style={{ border: '1px solid var(--border-default)', background: '#000', display: 'flex', flexDirection: 'column' }}>
              <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// INTERCEPT LOG ({recentStudies.length} ARCHIVED)</div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', overflowY: 'auto' }}>
                {studiesLoading ? <div className="mono text-xs text-tertiary" style={{ textAlign: 'center', padding: '16px' }}>ACCESSING ARCHIVE...</div> :
                  recentStudies.length === 0 ? <div className="mono text-xs text-tertiary" style={{ textAlign: 'center', padding: '16px' }}>NO RECORDS ON FILE.</div> :
                    recentStudies.map(study => (
                      <div key={study.id} style={{ border: '1px solid var(--border-subtle)', background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <div className="mono font-bold" style={{ color: 'var(--color-text)', marginBottom: '4px' }}>
                              <span style={{ color: AGENT_COLORS[study.agent_code_name] || 'var(--color-primary)', marginRight: '8px' }}>[{study.agent_code_name.toUpperCase()}]</span>
                              {study.title.toUpperCase()}
                            </div>
                            <div className="mono text-xs text-tertiary">{study.source.toUpperCase()} // SYS_TIME: {formatTime(study.created_at)}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span className="mono text-xs" style={{ color: study.delivery_status === 'sent' ? 'var(--color-success)' : study.delivery_status === 'failed' ? 'var(--color-danger)' : 'var(--text-tertiary)' }}>
                              {study.delivery_status === 'sent' ? 'TX : SUCCESS' : study.delivery_status === 'failed' ? 'TX : FAILED' : 'TX : PENDING'}
                            </span>
                            {study.delivery_status !== 'sent' && (
                              <button className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }} onClick={() => handleResendStudy(study.id)} disabled={studiesBusy === `resend:${study.id}`}>
                                {studiesBusy === `resend:${study.id}` ? 'TX_ONGOING...' : 'FORCE TX'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mono text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>{study.summary.toUpperCase()}</div>
                        {Array.isArray(study.highlights) && study.highlights.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                            {study.highlights.slice(0, 3).map(h => (
                              <span key={h} className="mono" style={{ background: '#000', border: '1px solid var(--border-subtle)', color: 'var(--color-primary)', fontSize: '9px', padding: '2px 6px' }}>
                                {h.slice(0, 40).toUpperCase()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px', paddingBottom: '32px' }}>
            {AGENT_AUTOMATION_PACKS.map(pack => (
              <div key={pack.agentCodeName} style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono text-xs font-bold" style={{ color: AGENT_COLORS[pack.agentCodeName] || 'var(--color-primary)' }}>{pack.label.toUpperCase()} PROTOCOLS</span>
                  <span className="mono text-xs" style={{ color: 'var(--text-tertiary)' }}>[{pack.templates.length} TEMPLATES]</span>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div className="mono text-xs text-secondary">{pack.objective.toUpperCase()}</div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pack.templates.map(tmp => (
                      <div key={tmp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="mono text-xs font-bold" style={{ color: 'var(--color-text)' }}>{tmp.name.toUpperCase()}</div>
                          <div className="mono" style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>ID: {tmp.id}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <a href={tmp.pageUrl} target="_blank" rel="noreferrer" className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', border: '1px solid var(--border-subtle)' }}>DOCS</a>
                          <a href={tmp.downloadUrl} target="_blank" rel="noreferrer" className="btn btn-ghost mono" style={{ fontSize: '9px', padding: '2px 8px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>JSON</a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="btn mono" style={{ marginTop: 'auto', border: '1px solid var(--color-primary)', background: '#000', color: 'var(--color-primary)', padding: '10px' }} onClick={() => handleTrigger(pack.agentCodeName, 'cycle')} disabled={triggering === pack.agentCodeName}>
                    {triggering === pack.agentCodeName ? 'ENGAGED...' : `FORCE OVERRIDE [${pack.agentCodeName.toUpperCase()}]`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Agents
