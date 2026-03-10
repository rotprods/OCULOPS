// ===================================================
// ANTIGRAVITY OS — Intelligence Radar System
// Signal radar + API intelligence atlas
// ===================================================

import { useState, useMemo, useEffect, useDeferredValue, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignals } from '../../hooks/useSignals'
import { useSignalStore } from '../../stores/useSignalStore'
import { useSocialSignals } from '../../hooks/useSocialSignals'
import { useApiCatalog } from '../../hooks/useApiCatalog'
import {
  buildApiIntelligencePresentation,
  normalizeText,
  summarizeApiIntelligenceSections,
} from '../../lib/publicApiCatalog.js'
import { getTemplateByCatalogSlug } from '../../lib/publicApiConnectorTemplates.js'
import { Charts } from '../../lib/charts'
import ApiIntelligenceCard from '../miniapps/ApiIntelligenceCard'
import useAgents from '../../hooks/useAgents'
import './Intelligence.css'

// ── Signal Radar SVG ──
function SignalRadar({ signals = [], agents = [] }) {
    const size = 240
    const cx = size / 2
    const cy = size / 2
    const rings = [30, 55, 80, 105]
    const categoryAngles = { macro: 0, mercado: 60, competencia: 120, tecnologia: 180, social: 240, economic: 300 }
    const categoryColors = { macro: '#5ac8fa', mercado: '#34c759', competencia: '#ff3b30', tecnologia: '#ffd700', social: '#af52de', economic: '#ff9f0a' }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="signal-radar-svg">
            {/* Concentric rings */}
            {rings.map(r => (
                <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}
            {/* Crosshair lines */}
            <line x1={cx} y1={cx - 110} x2={cx} y2={cx + 110} stroke="rgba(255,215,0,0.12)" strokeWidth="0.5" />
            <line x1={cx - 110} y1={cy} x2={cx + 110} y2={cy} stroke="rgba(255,215,0,0.12)" strokeWidth="0.5" />
            {/* Signal dots */}
            {signals.slice(0, 20).map((s, i) => {
                const angle = (categoryAngles[s.category] || 0) + (i * 15) % 60 - 30
                const dist = Math.min(100, 30 + (s.impact || 50) * 0.7)
                const rad = (angle * Math.PI) / 180
                const x = cx + Math.cos(rad) * dist
                const y = cy + Math.sin(rad) * dist
                const color = categoryColors[s.category] || '#888'
                return (
                    <g key={s.id || i}>
                        <circle cx={x} cy={y} r={3} fill={color} opacity="0.8">
                            <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
                        </circle>
                        <circle cx={x} cy={y} r={6} fill="none" stroke={color} strokeWidth="0.5" opacity="0.3">
                            <animate attributeName="r" values="6;12;6" dur="3s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
                            <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
                        </circle>
                    </g>
                )
            })}
            {/* Agent nodes */}
            {agents.slice(0, 4).map((agent, i) => {
                const agentAngle = 45 + i * 90
                const rad = (agentAngle * Math.PI) / 180
                const x = cx + Math.cos(rad) * 90
                const y = cy + Math.sin(rad) * 90
                const color = agent.status === 'online' ? '#34c759' : '#ffd700'
                return (
                    <g key={agent.id || i}>
                        <circle cx={x} cy={y} r={8} fill="rgba(0,0,0,0.6)" stroke={color} strokeWidth="1.5" />
                        <text x={x} y={y + 3} textAnchor="middle" fill={color} fontSize="6" fontWeight="700" fontFamily="var(--font-mono)">
                            {(agent.code_name || agent.name || '').slice(0, 3).toUpperCase()}
                        </text>
                        <circle cx={x} cy={y} r={12} fill="none" stroke={color} strokeWidth="0.5" opacity="0.2">
                            <animate attributeName="r" values="12;18;12" dur="4s" repeatCount="indefinite" />
                        </circle>
                    </g>
                )
            })}
            {/* Center dot */}
            <circle cx={cx} cy={cy} r={4} fill="var(--accent-primary)" opacity="0.9" />
            <circle cx={cx} cy={cy} r={8} fill="none" stroke="var(--accent-primary)" strokeWidth="0.5" opacity="0.4">
                <animate attributeName="r" values="8;14;8" dur="3s" repeatCount="indefinite" />
            </circle>
        </svg>
    )
}

const CATEGORIES = [
  { value: 'macro', label: 'Macro', icon: '🌍', color: 'var(--info)' },
  { value: 'mercado', label: 'Mercado', icon: '📈', color: 'var(--success)' },
  { value: 'competencia', label: 'Competencia', icon: '⚔️', color: 'var(--danger)' },
  { value: 'tecnologia', label: 'Tecnologia', icon: '🤖', color: 'var(--accent-primary)' },
  { value: 'social', label: 'Social', icon: '👥', color: 'var(--accent-secondary)' },
  { value: 'economic', label: 'Economica', icon: '💰', color: 'var(--warning)' },
]

const emptyForm = { title: '', category: 'macro', indicator: 'leading', impact: 50, source: '', confidence: 70, implication: '' }
const API_PAGE_SIZE = 18
const ACTIVATION_PRIORITY = { live: 4, adapter_ready: 3, candidate: 2, catalog_only: 1 }

function formatTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function compactNumber(value) {
  if (!value) return '0'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function sentimentTone(score) {
  if (score >= 20) return 'badge-success'
  if (score <= -15) return 'badge-danger'
  return 'badge-neutral'
}

function sortApiEntries(entries, sortMode) {
  return [...entries].sort((left, right) => {
    if (sortMode === 'name') {
      return left.name.localeCompare(right.name)
    }

    if (sortMode === 'section') {
      if ((left.section_rank || 0) !== (right.section_rank || 0)) {
        return (left.section_rank || 0) - (right.section_rank || 0)
      }
      return left.name.localeCompare(right.name)
    }

    if (sortMode === 'connectivity') {
      const leftScore = ACTIVATION_PRIORITY[left.health_status === 'live' ? 'live' : left.activation_tier] || 0
      const rightScore = ACTIVATION_PRIORITY[right.health_status === 'live' ? 'live' : right.activation_tier] || 0
      if (rightScore !== leftScore) return rightScore - leftScore
      if ((right.featured_score || 0) !== (left.featured_score || 0)) {
        return (right.featured_score || 0) - (left.featured_score || 0)
      }
      return left.name.localeCompare(right.name)
    }

    if ((right.featured_score || 0) !== (left.featured_score || 0)) {
      return (right.featured_score || 0) - (left.featured_score || 0)
    }

    return left.name.localeCompare(right.name)
  })
}

function Intelligence() {
  const navigate = useNavigate()
  const { signals, loading, addSignal, removeSignal } = useSignals()
  const {
    items: socialSignals,
    summary: socialSummary,
    refresh: refreshSocialSignals,
    refreshing: socialRefreshing,
    refreshError: socialRefreshError,
    dataMode: socialDataMode,
    runtimeConfigured: socialRuntimeConfigured,
  } = useSocialSignals()
  const {
    entries: catalogEntries,
    loading: apiLoading,
    error: apiError,
    stats: apiStats,
    syncRun: apiSyncRun,
    source: apiSource,
    installConnector,
    reload: reloadCatalog,
  } = useApiCatalog({ isListed: true })
  const { agents } = useAgents()

  const [activeView, setActiveView] = useState('signals')
  const signalFilter = useSignalStore(s => s.filter)
  const setSignalFilter = useSignalStore(s => s.setFilter)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [promotingId, setPromotingId] = useState(null)

  const [apiSearch, setApiSearch] = useState('')
  const [apiSection, setApiSection] = useState('all')
  const [apiModuleTarget, setApiModuleTarget] = useState('all')
  const [apiSort, setApiSort] = useState('featured')
  const [apiPage, setApiPage] = useState(1)
  const [installingSlug, setInstallingSlug] = useState(null)
  const [apiActionError, setApiActionError] = useState(null)
  const deferredApiSearch = useDeferredValue(apiSearch)

  useEffect(() => {
    setApiPage(1)
  }, [apiModuleTarget, apiSearch, apiSection, apiSort])

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await addSignal({
      title: form.title,
      category: form.category,
      indicator: form.indicator,
      impact: Number.parseInt(form.impact, 10),
      source: form.source,
      confidence: Number.parseInt(form.confidence, 10),
      implication: form.implication,
      status: 'active',
    })
    setForm(emptyForm)
    setSaving(false)
  }

  const handleRemove = async (id) => {
    await removeSignal(id)
  }

  const handlePromoteSocialSignal = async (signal) => {
    setPromotingId(signal.id)
    await addSignal({
      title: signal.title,
      category: 'social',
      indicator: signal.opportunityScore >= 70 ? 'leading' : 'lagging',
      impact: signal.opportunityScore,
      source: signal.permalink || `${signal.platform}:${signal.externalId}`,
      confidence: Math.max(45, Math.min(95, Math.round((signal.velocityScore * 0.55) + (signal.opportunityScore * 0.45)))),
      implication: `${signal.topic} signal on ${signal.platform}. Engagement ${signal.engagement} with sentiment ${signal.sentimentScore}.`,
      status: 'active',
    })
    setPromotingId(null)
  }

  const signalsByCategory = useMemo(
    () => signals.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1
      return acc
    }, {}),
    [signals]
  )

  const filteredSignals = useMemo(
    () => signals
      .filter(signal => signalFilter === 'all' || signal.indicator === signalFilter)
      .sort((left, right) => (right.impact || 0) - (left.impact || 0)),
    [signalFilter, signals]
  )
  const socialBadgeClass = socialDataMode === 'live' ? 'badge-success' : socialRuntimeConfigured ? 'badge-info' : 'badge-neutral'
  const socialBadgeLabel = socialDataMode === 'live' ? 'live radar' : socialRuntimeConfigured ? 'syncing live' : 'demo radar'

  const preparedApiEntries = useMemo(
    () => catalogEntries
      .map(entry => {
        const template = getTemplateByCatalogSlug(entry.slug)
        return {
          ...entry,
          ...buildApiIntelligencePresentation(entry),
          installable: Boolean(template) && !template.internalOnly && !entry.is_installed,
          internalOnly: template?.internalOnly || false,
        }
      })
      .filter(entry => !entry.internalOnly),
    [catalogEntries]
  )

  const moduleTargetOptions = useMemo(
    () => ['all', ...new Set(preparedApiEntries.flatMap(entry => entry.module_targets || []))],
    [preparedApiEntries]
  )

  const searchScopedApiEntries = useMemo(() => {
    const query = normalizeText(deferredApiSearch)

    return preparedApiEntries.filter(entry => {
      if (apiModuleTarget !== 'all' && !(entry.module_targets || []).includes(apiModuleTarget)) return false

      if (!query) return true

      const haystack = normalizeText([
        entry.name,
        entry.category,
        entry.description,
        entry.brand_hint,
        entry.section_label,
        ...(entry.module_targets || []),
        ...(entry.capabilities || []),
      ].join(' '))

      return haystack.includes(query)
    })
  }, [apiModuleTarget, deferredApiSearch, preparedApiEntries])

  const sectionSummary = useMemo(
    () => summarizeApiIntelligenceSections(searchScopedApiEntries),
    [searchScopedApiEntries]
  )

  const filteredApiEntries = useMemo(
    () => searchScopedApiEntries.filter(entry => apiSection === 'all' || entry.section_key === apiSection),
    [apiSection, searchScopedApiEntries]
  )

  const sortedApiEntries = useMemo(
    () => sortApiEntries(filteredApiEntries, apiSort),
    [filteredApiEntries, apiSort]
  )

  const featuredApiEntries = useMemo(
    () => sortApiEntries(
      apiSection === 'all' ? searchScopedApiEntries : filteredApiEntries,
      'featured'
    ).slice(0, 3),
    [apiSection, filteredApiEntries, searchScopedApiEntries]
  )

  const pageCount = Math.max(1, Math.ceil(sortedApiEntries.length / API_PAGE_SIZE))
  const pagedApiEntries = useMemo(
    () => sortedApiEntries.slice((apiPage - 1) * API_PAGE_SIZE, apiPage * API_PAGE_SIZE),
    [apiPage, sortedApiEntries]
  )

  const apiStatsSummary = useMemo(() => ({
    total: preparedApiEntries.length,
    live: preparedApiEntries.filter(entry => entry.health_status === 'live' || entry.activation_tier === 'live').length,
    installable: preparedApiEntries.filter(entry => entry.installable).length,
    sections: sectionSummary.filter(section => section.count > 0).length,
  }), [preparedApiEntries, sectionSummary])

  const handleInstallApi = async (entry) => {
    setApiActionError(null)
    setInstallingSlug(entry.slug)

    const result = await installConnector(entry.slug)

    if (result?.error) {
      setApiActionError(result.error)
      setInstallingSlug(null)
      return
    }

    startTransition(() => {
      reloadCatalog()
    })

    setInstallingSlug(null)
  }

  const handleOpenNetwork = () => {
    navigate('/api-network')
  }

  return (
    <div className="fade-in intelligence">
      <div className="module-header intelligence__header">
        <div>
          <h1>Intelligence Radar System</h1>
          <p>Live signal radar for the operating team plus a sectioned atlas of public APIs scored, grouped, and visually packaged for intelligence workflows.</p>
        </div>
        <div className="intelligence__tabs">
          <button className={`btn btn-sm ${activeView === 'signals' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveView('signals')}>
            Signal Radar
          </button>
          <button className={`btn btn-sm ${activeView === 'apis' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveView('apis')}>
            API Intelligence
          </button>
        </div>
      </div>

      {activeView === 'signals' && (
        <>
          {/* ── Radar Visualization ── */}
          <div className="intel-radar-panel">
            <SignalRadar signals={signals} agents={agents} />
            <div className="intel-radar-legend">
              {CATEGORIES.map(cat => (
                <span key={cat.value} className="intel-radar-legend-item">
                  <span className="intel-radar-legend-dot" style={{ background: cat.color }} />
                  {cat.label}
                </span>
              ))}
            </div>
          </div>
          {socialRefreshError && (
            <div className="card mb-6" style={{ borderLeft: '3px solid var(--warning)' }}>
              <div style={{ padding: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>Social sync notice:</strong> {socialRefreshError}
              </div>
            </div>
          )}

          <div className="grid-4 mb-6">
            {CATEGORIES.slice(0, 4).map(cat => {
              const count = signalsByCategory[cat.value] || 0
              return (
                <div key={cat.value} className="kpi-card">
                  <div className="kpi-icon" style={{ background: `${cat.color}22`, color: cat.color }}>{cat.icon}</div>
                  <div className="kpi-value">{count}</div>
                  <div className="kpi-label">Senales {cat.label}</div>
                </div>
              )
            })}
          </div>

          <div className="card mb-6">
            <div className="card-header" style={{ alignItems: 'center' }}>
              <div>
                <div className="card-title">Social Signal Radar</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Fast-moving conversations from Reddit and Hacker News that can be promoted into the operating signal board.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge ${socialBadgeClass}`}>
                  {socialBadgeLabel}
                </span>
                <button className="btn btn-primary btn-sm" onClick={refreshSocialSignals} disabled={socialRefreshing}>
                  {socialRefreshing ? 'Syncing...' : 'Sync Social Signals'}
                </button>
              </div>
            </div>

            <div className="grid-4 mb-6">
              <div className="kpi-card">
                <div className="kpi-value" style={{ color: 'var(--accent-primary)' }}>{socialSummary.trackedCount}</div>
                <div className="kpi-label">Captured Posts</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value" style={{ color: 'var(--success)' }}>{socialSummary.hotCount}</div>
                <div className="kpi-label">Hot Opportunities</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value" style={{ color: 'var(--warning)' }}>{socialSummary.averageOpportunity}</div>
                <div className="kpi-label">Avg Opportunity</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value" style={{ color: socialSummary.averageSentiment >= 0 ? 'var(--success)' : 'var(--danger)' }}>{socialSummary.averageSentiment}</div>
                <div className="kpi-label">Avg Sentiment</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {socialSignals.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📱</div>
                    <h3>No social signals yet</h3>
                    <p className="text-muted">Run a sync to start filling the radar.</p>
                  </div>
                ) : (
                  socialSignals.slice(0, 6).map(signal => (
                    <div key={signal.id} className="card" style={{ padding: '14px', borderColor: 'var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <span className={`badge ${signal.platform === 'reddit' ? 'badge-danger' : signal.platform === 'hackernews' ? 'badge-warning' : 'badge-neutral'}`}>{signal.platform}</span>
                            <span className="badge badge-neutral">{signal.topic}</span>
                            <span className={`badge ${sentimentTone(signal.sentimentScore)}`}>sentiment {signal.sentimentScore}</span>
                            <span className="badge badge-info">opp {signal.opportunityScore}</span>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{signal.title}</div>
                          {signal.bodyExcerpt && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {signal.bodyExcerpt}
                            </div>
                          )}
                        </div>
                        <button className="btn btn-sm" onClick={() => handlePromoteSocialSignal(signal)} disabled={promotingId === signal.id}>
                          {promotingId === signal.id ? 'Adding...' : 'Promote'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        <span>engagement {compactNumber(signal.engagement)}</span>
                        <span>velocity {signal.velocityScore}</span>
                        <span>{formatTime(signal.publishedAt)}</span>
                        {signal.permalink && (
                          <a href={signal.permalink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                            Open source
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <div className="card-title" style={{ marginBottom: '12px' }}>Radar Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span>Total engagement</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{compactNumber(socialSummary.totalEngagement)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span>Last update</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatTime(socialSummary.lastUpdated)}</strong>
                  </div>
                </div>

                <div className="divider" />

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Platform Mix
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(socialSummary.platformBreakdown || {}).map(([platform, count]) => (
                      <span key={platform} className="badge badge-neutral">{platform}: {count}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Top Topics
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(socialSummary.topicBreakdown || []).map((entry) => (
                      <div key={entry.topic} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                        <span>{entry.topic}</span>
                        <strong>{entry.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-6">
            <div className="card-header"><div className="card-title">Registrar Senal</div></div>
            <div className="grid-2" style={{ gap: '12px' }}>
              <div className="input-group">
                <label>Senal</label>
                <input className="input" placeholder="Descripcion de la senal" value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="input-group">
                <label>Categoria</label>
                <select className="input" value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))}>
                  {CATEGORIES.map(category => <option key={category.value} value={category.value}>{category.icon} {category.label}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Tipo indicador</label>
                <select className="input" value={form.indicator} onChange={event => setForm(current => ({ ...current, indicator: event.target.value }))}>
                  <option value="leading">Leading (predice)</option>
                  <option value="lagging">Lagging (confirma)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Impacto (1-100)</label>
                <input className="input" type="number" min="1" max="100" value={form.impact} onChange={event => setForm(current => ({ ...current, impact: event.target.value }))} />
              </div>
              <div className="input-group">
                <label>Fuente</label>
                <input className="input" placeholder="URL o referencia" value={form.source} onChange={event => setForm(current => ({ ...current, source: event.target.value }))} />
              </div>
              <div className="input-group">
                <label>Confianza (0-100)</label>
                <input className="input" type="number" min="0" max="100" value={form.confidence} onChange={event => setForm(current => ({ ...current, confidence: event.target.value }))} />
              </div>
            </div>
            <div className="input-group" style={{ marginTop: '12px' }}>
              <label>Implicacion para el negocio</label>
              <textarea className="input" rows="2" placeholder="Que significa para la agencia?" value={form.implication} onChange={event => setForm(current => ({ ...current, implication: event.target.value }))} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleAdd} disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar Senal'}
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Senales Registradas ({signals.length})</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'leading', 'lagging'].map(value => (
                  <button key={value} className={`btn btn-sm ${signalFilter === value ? 'btn-primary' : ''}`} onClick={() => setSignalFilter(value)}>
                    {value === 'all' ? 'Todas' : value === 'leading' ? 'Leading' : 'Lagging'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="empty-state">
                <div className="empty-icon">⏳</div>
                <h3>Cargando senales...</h3>
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📡</div>
                <h3>Sin senales registradas</h3>
                <p className="text-muted">Anade senales de mercado para construir tu inteligencia</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Senal</th><th>Cat.</th><th>Tipo</th><th>Impacto</th><th>Confianza</th><th>Fecha</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filteredSignals.map(signal => (
                      <tr key={signal.id}>
                        <td style={{ maxWidth: '300px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{signal.title}</div>
                          {signal.implication && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{signal.implication}</div>}
                        </td>
                        <td><span className="badge badge-info">{signal.category}</span></td>
                        <td><span className={`badge ${signal.indicator === 'leading' ? 'badge-success' : 'badge-neutral'}`}>{signal.indicator === 'leading' ? 'Leading' : 'Lagging'}</span></td>
                        <td dangerouslySetInnerHTML={{ __html: Charts.scoreRing(signal.impact || 50, 100, 36) }} />
                        <td dangerouslySetInnerHTML={{ __html: Charts.scoreRing(signal.confidence || 50, 100, 36) }} />
                        <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{signal.created_at?.split('T')[0] || '-'}</td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => handleRemove(signal.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeView === 'apis' && (
        <div className="intel-api">
          <div className="grid-4 mb-6">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'var(--color-info)22', color: 'var(--color-info)' }}>🕸️</div>
              <div className="kpi-value">{apiStatsSummary.total}</div>
              <div className="kpi-label">Catalog APIs</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'var(--color-success)22', color: 'var(--color-success)' }}>⚡</div>
              <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{apiStatsSummary.live}</div>
              <div className="kpi-label">Live Connectors</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'var(--color-primary)22', color: 'var(--color-primary)' }}>🧩</div>
              <div className="kpi-value" style={{ color: 'var(--warning)' }}>{apiStatsSummary.installable}</div>
              <div className="kpi-label">Installable Templates</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}>🗂️</div>
              <div className="kpi-value">{apiStatsSummary.sections}</div>
              <div className="kpi-label">Active Sections</div>
            </div>
          </div>

          {(apiError || apiActionError) && (
            <div className="intel-api__banner">
              {apiActionError || `Catalog fallback active: ${apiError}`}
            </div>
          )}

          <div className="intel-api__toolbar card mb-6">
            <div className="intel-api__toolbar-copy">
              <div className="card-title">API Intelligence Atlas</div>
              <p>
                Every public API gets a section, a score, and a visual card. Source mode: <strong>{apiSource}</strong>
                {apiSyncRun?.repo_pushed_at ? ` · upstream pushed ${new Date(apiSyncRun.repo_pushed_at).toLocaleDateString()}` : ''}
              </p>
            </div>
            <div className="intel-api__toolbar-actions">
              <button className="btn btn-ghost btn-sm" onClick={handleOpenNetwork}>Open API Network</button>
              <button className="btn btn-primary btn-sm" onClick={reloadCatalog}>Refresh Catalog</button>
            </div>
          </div>

          <div className="intel-api__controls mb-6">
            <div className="input-group" style={{ margin: 0 }}>
              <label>Search APIs</label>
              <input
                className="input"
                value={apiSearch}
                onChange={event => setApiSearch(event.target.value)}
                placeholder="Search name, host, section, description or capability..."
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label>Target module</label>
              <select className="input" value={apiModuleTarget} onChange={event => setApiModuleTarget(event.target.value)}>
                {moduleTargetOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label>Sort</label>
              <select className="input" value={apiSort} onChange={event => setApiSort(event.target.value)}>
                <option value="featured">Featured score</option>
                <option value="connectivity">Connectivity</option>
                <option value="section">Section</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          <div className="intel-api__section-strip mb-6">
            <button
              className={`intel-api__section-pill ${apiSection === 'all' ? 'is-active' : ''}`}
              onClick={() => setApiSection('all')}
            >
              <span>All APIs</span>
              <strong>{searchScopedApiEntries.length}</strong>
            </button>
            {sectionSummary.filter(section => section.count > 0).map(section => (
              <button
                key={section.key}
                className={`intel-api__section-pill ${apiSection === section.key ? 'is-active' : ''}`}
                onClick={() => setApiSection(section.key)}
                style={{ '--section-color': section.color }}
              >
                <span>{section.label}</span>
                <strong>{section.count}</strong>
              </button>
            ))}
          </div>

          {!apiLoading && featuredApiEntries.length > 0 && (
            <div className="intel-api__featured mb-6">
              {featuredApiEntries.map((entry, index) => (
                <ApiIntelligenceCard
                  key={entry.slug}
                  entry={entry}
                  variant={index === 0 ? 'hero' : 'standard'}
                  installing={installingSlug === entry.slug}
                  onInstall={handleInstallApi}
                  onOpenNetwork={handleOpenNetwork}
                />
              ))}
            </div>
          )}

          <div className="intel-api__section-grid mb-6">
            {sectionSummary.filter(section => section.count > 0).map(section => (
              <button
                key={section.key}
                className={`intel-api__section-card ${apiSection === section.key ? 'is-active' : ''}`}
                onClick={() => setApiSection(section.key)}
                style={{ '--section-color': section.color }}
              >
                <span className="intel-api__section-card-label">{section.shortLabel}</span>
                <strong>{section.label}</strong>
                <p>{section.description}</p>
                <span className="intel-api__section-card-count">{section.count} APIs</span>
              </button>
            ))}
          </div>

          {apiLoading ? (
            <div className="empty-state">
              <div className="empty-icon">🕸️</div>
              <h3>Loading API intelligence...</h3>
              <p className="text-muted">Building sections, thumbnails, and rankings from the catalog.</p>
            </div>
          ) : pagedApiEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗂️</div>
              <h3>No APIs match this view</h3>
              <p className="text-muted">Adjust the search, target module, or selected section.</p>
            </div>
          ) : (
            <>
              <div className="intel-api__results-head">
                <div>
                  <div className="card-title">
                    {apiSection === 'all'
                      ? `All API sections · ${sortedApiEntries.length} visible`
                      : `${pagedApiEntries[0]?.section_label || 'Section'} · ${sortedApiEntries.length} visible`}
                  </div>
                  <div className="intel-api__results-copy">
                    Cards are sectioned, scored, and ready to route into the intelligence stack.
                  </div>
                </div>
                <div className="intel-api__results-meta">
                  <span className="badge badge-neutral">{apiStats.liveCount || 0} live</span>
                  <span className="badge badge-neutral">{apiStats.installedCount || 0} installed</span>
                  <span className="badge badge-neutral">{pageCount} pages</span>
                </div>
              </div>

              <div className="intel-api__catalog-grid">
                {pagedApiEntries.map(entry => (
                  <ApiIntelligenceCard
                    key={entry.slug}
                    entry={entry}
                    variant={apiSection === 'all' ? 'compact' : 'standard'}
                    installing={installingSlug === entry.slug}
                    onInstall={handleInstallApi}
                    onOpenNetwork={handleOpenNetwork}
                  />
                ))}
              </div>

              {pageCount > 1 && (
                <div className="intel-api__pagination">
                  <button className="btn btn-ghost btn-sm" onClick={() => setApiPage(page => Math.max(1, page - 1))} disabled={apiPage === 1}>
                    Prev
                  </button>
                  <span>Page {apiPage} / {pageCount}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setApiPage(page => Math.min(pageCount, page + 1))} disabled={apiPage === pageCount}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Intelligence
