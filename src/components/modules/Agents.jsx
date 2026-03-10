// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — AI Agents Hub (CORTEX Network)
// Multi-Agent Orchestration Dashboard
// ═══════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { useAgents } from '../../hooks/useAgents'
import { useAgentStudies } from '../../hooks/useAgentStudies'
import { AGENT_AUTOMATION_PACKS } from '../../data/agentAutomationPacks'
import './Agents.css'

const AGENT_ICONS = {
  cortex: '🧠', atlas: '🌍', hunter: '🎯', oracle: '📊',
  sentinel: '🛡️', forge: '✍️', strategist: '⚖️', scribe: '📝', herald: '📱',
}

const AGENT_COLORS = {
  cortex: '#00d2d3', atlas: '#6366f1', hunter: '#f59e0b', oracle: '#8b5cf6',
  sentinel: '#ef4444', forge: '#10b981', strategist: '#3b82f6', scribe: '#ec4899', herald: '#facc15',
}

const INITIAL_STUDY_FORM = {
  agentCodeName: 'cortex',
  title: '',
  summary: '',
  contentMarkdown: '',
  sendTelegram: true,
}

const INITIAL_TELEGRAM_FORM = {
  label: 'Primary Telegram',
  chat_id: '',
  thread_id: '',
  notify_manual: true,
  notify_automated: true,
}

function Agents() {
  const { toast } = useAppStore()
  const { agents, tasks, logs, stats, triggerAgent, runCortexCycle } = useAgents()
  const {
    studies,
    telegramTarget,
    loading: studiesLoading,
    busy: studiesBusy,
    postStudy,
    resendStudy,
    saveTelegramTarget,
  } = useAgentStudies()
  const [triggering, setTriggering] = useState(null)
  const [activeTab, setActiveTab] = useState('network')
  const [studyForm, setStudyForm] = useState(INITIAL_STUDY_FORM)
  const [telegramForm, setTelegramForm] = useState(INITIAL_TELEGRAM_FORM)

  useEffect(() => {
    if (!telegramTarget) return
    setTelegramForm({
      label: telegramTarget.label || 'Primary Telegram',
      chat_id: telegramTarget.chat_id || '',
      thread_id: telegramTarget.thread_id || '',
      notify_manual: telegramTarget.notify_manual !== false,
      notify_automated: telegramTarget.notify_automated !== false,
    })
  }, [telegramTarget])

  const handleTrigger = useCallback(async (codeName, action) => {
    setTriggering(codeName)
    const result = await triggerAgent(codeName, action)
    setTriggering(null)

    if (result?.error) {
      toast(result.error, 'warning')
      return
    }

    toast(`${codeName.toUpperCase()} triggered`, 'success')
  }, [toast, triggerAgent])

  const handleCortexCycle = useCallback(async () => {
    setTriggering('cortex')
    const result = await runCortexCycle()
    setTriggering(null)

    if (result?.error) {
      toast(result.error, 'warning')
      return
    }

    toast('CORTEX orchestration started', 'success')
  }, [runCortexCycle, toast])

  const handlePostStudy = useCallback(async () => {
    if (!studyForm.title.trim()) {
      toast('Study title is required', 'warning')
      return
    }

    const summary = studyForm.summary.trim() || studyForm.contentMarkdown.trim()
    if (!summary) {
      toast('Add a summary or body before posting', 'warning')
      return
    }

    const highlights = summary
      .split(/\n|\./)
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 4)

    try {
      const result = await postStudy({
        agent_code_name: studyForm.agentCodeName,
        title: studyForm.title.trim(),
        summary,
        content_markdown: studyForm.contentMarkdown.trim() || summary,
        highlights,
        study_type: 'manual',
        send_telegram: studyForm.sendTelegram,
      })

      setStudyForm(current => ({ ...INITIAL_STUDY_FORM, agentCodeName: current.agentCodeName }))
      toast(result?.delivery?.delivered ? 'Study posted and sent to Telegram' : 'Study posted', 'success')
    } catch (error) {
      toast(error.message, 'warning')
    }
  }, [postStudy, studyForm, toast])

  const handleSaveTelegram = useCallback(async () => {
    if (!telegramForm.chat_id.trim()) {
      toast('Telegram chat_id is required', 'warning')
      return
    }

    await saveTelegramTarget({
      label: telegramForm.label.trim() || 'Primary Telegram',
      chat_id: telegramForm.chat_id.trim(),
      thread_id: telegramForm.thread_id.trim() || null,
      notify_manual: telegramForm.notify_manual,
      notify_automated: telegramForm.notify_automated,
      is_active: true,
      type: 'telegram',
    })

    toast('Telegram target saved', 'success')
  }, [saveTelegramTarget, telegramForm, toast])

  const handleResendStudy = useCallback(async (studyId) => {
    try {
      const result = await resendStudy(studyId)
      toast(result?.delivery?.delivered ? 'Study delivered to Telegram' : 'Telegram delivery skipped', result?.delivery?.delivered ? 'success' : 'warning')
    } catch (error) {
      toast(error.message, 'warning')
    }
  }, [resendStudy, toast])

  const cortex = agents.find(agent => agent.code_name === 'cortex')
  const subAgents = agents
    .filter(agent => agent.code_name !== 'cortex')
    .sort((a, b) => a.code_name.localeCompare(b.code_name))
  const recentLogs = logs.slice(0, 30)
  const recentTasks = tasks.slice(0, 20)
  const recentStudies = studies.slice(0, 24)

  const agentOptions = useMemo(() => {
    const map = new Map()
    AGENT_AUTOMATION_PACKS.forEach(pack => {
      map.set(pack.agentCodeName, {
        value: pack.agentCodeName,
        label: pack.label,
      })
    })
    agents.forEach(agent => {
      if (!map.has(agent.code_name)) {
        map.set(agent.code_name, {
          value: agent.code_name,
          label: agent.name,
        })
      }
    })
    return [...map.values()]
  }, [agents])

  const deliveryStats = useMemo(() => ({
    total: studies.length,
    sent: studies.filter(study => study.delivery_status === 'sent').length,
    failed: studies.filter(study => study.delivery_status === 'failed').length,
    manual: studies.filter(study => study.source === 'manual').length,
  }), [studies])

  const formatTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (ms) => {
    if (!ms) return '—'
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="fade-in">
      <div className="module-header">
        <h1>🧠 CORTEX — Agent Network</h1>
        <p>Red de 9 agentes IA, con desk interno de estudios, plantillas n8n oficiales y entrega móvil por Telegram.</p>
      </div>

      <div className="agents-overview">
        <div className="overview-stat">
          <div className="overview-stat-value accent">{stats.total}</div>
          <div className="overview-stat-label">Agents</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value success">{stats.online}</div>
          <div className="overview-stat-label">Online</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value warning">{stats.running}</div>
          <div className="overview-stat-label">Running</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value">{deliveryStats.total}</div>
          <div className="overview-stat-label">Studies</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value success">{deliveryStats.sent}</div>
          <div className="overview-stat-label">Telegram Sent</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value">{telegramTarget ? 'ON' : 'OFF'}</div>
          <div className="overview-stat-label">Telegram</div>
        </div>
        <div className="overview-stat">
          <div className="overview-stat-value">{stats.totalRuns}</div>
          <div className="overview-stat-label">Total Runs</div>
        </div>
      </div>

      <div className="agents-tabs">
        {[
          { key: 'network', label: '🌐 Network' },
          { key: 'queue', label: `📋 Queue${stats.queuedTasks > 0 ? ` (${stats.queuedTasks})` : ''}` },
          { key: 'logs', label: '📊 Logs' },
          { key: 'studies', label: '📝 Studies' },
          { key: 'automation', label: '🔁 Automation' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="agent-trigger"
            style={{
              width: 'auto',
              background: activeTab === tab.key ? 'rgba(0,210,211,0.15)' : 'transparent',
              borderColor: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--border-subtle)',
              color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '11px',
              padding: '6px 16px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'network' && (
        <div className="agents-network fade-in">
          {cortex && (
            <div className="agent-card is-head glow-panel">
              <div className="agent-header">
                <div className="agent-identity">
                  <div className="agent-avatar" style={{ background: `${AGENT_COLORS.cortex}15`, fontSize: '24px' }}>
                    {AGENT_ICONS.cortex}
                  </div>
                  <div>
                    <div className="agent-name">{cortex.name}</div>
                    <div className="agent-role">{cortex.role}</div>
                  </div>
                </div>
                <div className={`agent-status ${cortex.status}`}>
                  <span className="status-dot" />
                  {cortex.status}
                </div>
              </div>
              <div className="agent-desc">{cortex.description}</div>
              <div className="agent-stats">
                <div className="agent-stat"><div className="agent-stat-value">{cortex.total_runs || 0}</div><div className="agent-stat-label">Runs</div></div>
                <div className="agent-stat"><div className="agent-stat-value">{formatDuration(cortex.avg_duration_ms)}</div><div className="agent-stat-label">Avg Time</div></div>
                <div className="agent-stat"><div className="agent-stat-value">{formatTime(cortex.last_run_at)}</div><div className="agent-stat-label">Last Run</div></div>
              </div>
              <button
                className="agent-trigger cortex-trigger"
                onClick={handleCortexCycle}
                disabled={triggering === 'cortex'}
              >
                {triggering === 'cortex' ? '⏳ Running CORTEX cycle...' : '🚀 Run CORTEX Orchestration Cycle'}
              </button>
            </div>
          )}

          <div className="agents-swarm">
            {subAgents.map(agent => (
              <div key={agent.id} className="agent-card glow-panel">
                <div className="agent-header">
                  <div className="agent-identity">
                    <div className="agent-avatar" style={{ background: `${AGENT_COLORS[agent.code_name] || '#666'}15` }}>
                      {AGENT_ICONS[agent.code_name] || '🤖'}
                    </div>
                    <div>
                      <div className="agent-name">{agent.name}</div>
                      <div className="agent-role">{agent.role}</div>
                    </div>
                  </div>
                  <div className={`agent-status ${agent.status}`}>
                    <span className="status-dot" />
                    {agent.status}
                  </div>
                </div>

                <div className="agent-desc">{agent.description}</div>

                <div className="agent-stats">
                  <div className="agent-stat"><div className="agent-stat-value">{agent.total_runs || 0}</div><div className="agent-stat-label">Runs</div></div>
                  <div className="agent-stat"><div className="agent-stat-value">{agent.cycle_minutes ? `${agent.cycle_minutes}m` : 'Manual'}</div><div className="agent-stat-label">Cycle</div></div>
                  <div className="agent-stat"><div className="agent-stat-value">{formatTime(agent.last_run_at)}</div><div className="agent-stat-label">Last Run</div></div>
                </div>

                <div className="agent-caps">
                  {(agent.capabilities || []).slice(0, 5).map(cap => (
                    <span key={cap} className="agent-cap">{cap.replace(/_/g, ' ')}</span>
                  ))}
                </div>

                <button
                  className="agent-trigger"
                  onClick={() => handleTrigger(agent.code_name, 'cycle')}
                  disabled={triggering === agent.code_name}
                  style={{ borderColor: `${AGENT_COLORS[agent.code_name] || '#666'}33`, color: AGENT_COLORS[agent.code_name] || 'var(--accent-primary)' }}
                >
                  {triggering === agent.code_name ? '⏳ Running...' : `▶ Trigger ${agent.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="task-queue">
          <div className="section-header">
            <div className="section-title">📋 Task Queue <span className="section-badge">{recentTasks.length}</span></div>
          </div>
          {recentTasks.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-8)' }}>
              No tasks yet. Run a CORTEX cycle to generate tasks.
            </div>
          )}
          {recentTasks.map(task => (
            <div key={task.id} className="task-item">
              <span className="task-agent">{task.agent_code_name}</span>
              <span className="task-title">{task.title || task.type}</span>
              <span className={`task-status-badge ${task.status}`}>{task.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          <div className="section-header">
            <div className="section-title">📊 Activity Log <span className="section-badge">{recentLogs.length}</span></div>
          </div>
          <div className="activity-log">
            {recentLogs.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-8)' }}>
                No activity yet. Trigger an agent to see logs here.
              </div>
            )}
            {recentLogs.map(log => (
              <div key={log.id} className="log-entry">
                <span className="log-time">{formatTime(log.created_at)}</span>
                <span className="log-agent" style={{ color: AGENT_COLORS[log.agent_code_name] || 'var(--accent-primary)' }}>{log.agent_code_name}</span>
                <span className="log-action">{log.action}{log.error ? ` ❌ ${log.error}` : ''}</span>
                <span className="log-duration">{formatDuration(log.duration_ms)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'studies' && (
        <div className="agents-study-layout">
          <div className="card">
            <div className="card-header">
              <div className="card-title">📝 Manual Study Desk</div>
            </div>
            <div className="input-group">
              <label>Agent</label>
              <select className="input" value={studyForm.agentCodeName} onChange={event => setStudyForm({ ...studyForm, agentCodeName: event.target.value })}>
                {agentOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Title</label>
              <input className="input" value={studyForm.title} onChange={event => setStudyForm({ ...studyForm, title: event.target.value })} placeholder="Weekly market study, lead pattern, content test..." />
            </div>
            <div className="input-group">
              <label>Executive summary</label>
              <textarea className="input" rows={4} value={studyForm.summary} onChange={event => setStudyForm({ ...studyForm, summary: event.target.value })} placeholder="What was learned and what matters?" />
            </div>
            <div className="input-group">
              <label>Body / notes</label>
              <textarea className="input" rows={8} value={studyForm.contentMarkdown} onChange={event => setStudyForm({ ...studyForm, contentMarkdown: event.target.value })} placeholder="Paste the full reasoning, findings, actions, URLs, or next steps." />
            </div>
            <label className="agents-inline-toggle">
              <input type="checkbox" checked={studyForm.sendTelegram} onChange={event => setStudyForm({ ...studyForm, sendTelegram: event.target.checked })} />
              <span>Send this study to Telegram immediately</span>
            </label>
            <button className="btn btn-primary mt-4" onClick={handlePostStudy} disabled={studiesBusy === 'study'}>
              {studiesBusy === 'study' ? 'Posting...' : 'Post Study'}
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">📱 Telegram Output</div>
            </div>
            <div className="agents-telegram-kpis">
              <div className="agent-stat">
                <div className="agent-stat-value">{telegramTarget ? 'active' : 'offline'}</div>
                <div className="agent-stat-label">Channel</div>
              </div>
              <div className="agent-stat">
                <div className="agent-stat-value">{deliveryStats.sent}</div>
                <div className="agent-stat-label">Delivered</div>
              </div>
              <div className="agent-stat">
                <div className="agent-stat-value">{deliveryStats.failed}</div>
                <div className="agent-stat-label">Failed</div>
              </div>
            </div>
            <div className="input-group">
              <label>Label</label>
              <input className="input" value={telegramForm.label} onChange={event => setTelegramForm({ ...telegramForm, label: event.target.value })} />
            </div>
            <div className="input-group">
              <label>Telegram chat_id</label>
              <input className="input" value={telegramForm.chat_id} onChange={event => setTelegramForm({ ...telegramForm, chat_id: event.target.value })} placeholder="123456789 or -100..." />
            </div>
            <div className="input-group">
              <label>Thread / topic ID</label>
              <input className="input" value={telegramForm.thread_id} onChange={event => setTelegramForm({ ...telegramForm, thread_id: event.target.value })} placeholder="Optional" />
            </div>
            <label className="agents-inline-toggle">
              <input type="checkbox" checked={telegramForm.notify_manual} onChange={event => setTelegramForm({ ...telegramForm, notify_manual: event.target.checked })} />
              <span>Send manual studies</span>
            </label>
            <label className="agents-inline-toggle">
              <input type="checkbox" checked={telegramForm.notify_automated} onChange={event => setTelegramForm({ ...telegramForm, notify_automated: event.target.checked })} />
              <span>Send automated agent outputs</span>
            </label>
            <button className="btn btn-primary mt-4" onClick={handleSaveTelegram} disabled={studiesBusy === 'target'}>
              {studiesBusy === 'target' ? 'Saving...' : 'Save Telegram Target'}
            </button>
          </div>

          <div className="card agents-studies-feed">
            <div className="card-header">
              <div className="card-title">Recent Studies</div>
              <div className="badge badge-neutral">{recentStudies.length}</div>
            </div>
            {studiesLoading ? (
              <div style={{ color: 'var(--text-tertiary)' }}>Loading study feed...</div>
            ) : recentStudies.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)' }}>No studies yet. Manual posts and agent outputs will appear here.</div>
            ) : recentStudies.map(study => (
              <div key={study.id} className="agent-study-card">
                <div className="agent-study-header">
                  <div>
                    <div className="agent-study-title">
                      <span style={{ marginRight: '8px' }}>{AGENT_ICONS[study.agent_code_name] || '🤖'}</span>
                      {study.title}
                    </div>
                    <div className="agent-study-meta">
                      <span>{study.agent_code_name}</span>
                      <span>{study.source}</span>
                      <span>{formatTime(study.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge ${study.delivery_status === 'sent' ? 'badge-success' : study.delivery_status === 'failed' ? 'badge-danger' : 'badge-neutral'}`}>
                      {study.delivery_status || 'pending'}
                    </span>
                    {study.delivery_status !== 'sent' && (
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: '11px' }}
                        onClick={() => handleResendStudy(study.id)}
                        disabled={studiesBusy === `resend:${study.id}`}
                      >
                        {studiesBusy === `resend:${study.id}` ? 'Sending...' : 'Send to Telegram'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="agent-study-summary">{study.summary || 'No summary provided.'}</div>
                {Array.isArray(study.highlights) && study.highlights.length > 0 && (
                  <div className="agent-caps" style={{ marginTop: '10px' }}>
                    {study.highlights.slice(0, 5).map(item => (
                      <span key={item} className="agent-cap">{item}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="agents-pack-grid">
          {AGENT_AUTOMATION_PACKS.map(pack => (
            <div key={pack.agentCodeName} className="agent-card">
              <div className="agent-header">
                <div className="agent-identity">
                  <div className="agent-avatar" style={{ background: `${AGENT_COLORS[pack.agentCodeName] || '#666'}15` }}>
                    {AGENT_ICONS[pack.agentCodeName] || '🤖'}
                  </div>
                  <div>
                    <div className="agent-name">{pack.label}</div>
                    <div className="agent-role">n8n + agent blueprint</div>
                  </div>
                </div>
                <span className="badge badge-info">{pack.templates.length} templates</span>
              </div>
              <div className="agent-desc">{pack.objective}</div>
              <div className="agent-caps">
                <span className="agent-cap">trigger: {pack.defaultTrigger}</span>
                {pack.defaultActions.map(action => <span key={action} className="agent-cap">{action}</span>)}
              </div>
              <div className="agents-template-list">
                {pack.templates.map(template => (
                  <div key={template.id} className="agents-template-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>{template.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Template #{template.id}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a className="btn btn-ghost" style={{ fontSize: '11px' }} href={template.pageUrl} target="_blank" rel="noreferrer">Open</a>
                      <a className="btn btn-ghost" style={{ fontSize: '11px' }} href={template.downloadUrl} target="_blank" rel="noreferrer">JSON</a>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="agent-trigger"
                onClick={() => handleTrigger(pack.agentCodeName, 'cycle')}
                disabled={triggering === pack.agentCodeName}
              >
                {triggering === pack.agentCodeName ? '⏳ Running...' : `▶ Run ${pack.label}`}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="section-header">
          <div className="section-title">⚙️ Agent Configuration</div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Model</th>
                <th>Cycle</th>
                <th>Runs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent.id}>
                  <td style={{ fontWeight: 700 }}>{AGENT_ICONS[agent.code_name]} {agent.name}</td>
                  <td><code style={{ fontSize: '11px' }}>{agent.model}</code></td>
                  <td>{agent.cycle_minutes ? `${agent.cycle_minutes}m` : 'On-demand'}</td>
                  <td>{agent.total_runs || 0}</td>
                  <td><span className={`badge badge-${agent.status === 'online' ? 'success' : agent.status === 'error' ? 'danger' : 'info'}`}>{agent.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Agents
