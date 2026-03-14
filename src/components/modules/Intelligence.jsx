// ═══════════════════════════════════════════════════
// OCULOPS — Intelligence v11.0
// Signal Radar & API Atlas
// ═══════════════════════════════════════════════════

import { useState, useMemo, useEffect, useCallback, useDeferredValue, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignals } from '../../hooks/useSignals'
import { useSignalStore } from '../../stores/useSignalStore'
import { useSocialSignals } from '../../hooks/useSocialSignals'
import { useApiCatalog } from '../../hooks/useApiCatalog'
import { buildApiIntelligencePresentation, normalizeText, summarizeApiIntelligenceSections } from '../../lib/publicApiCatalog.js'
import { getTemplateByCatalogSlug } from '../../lib/publicApiConnectorTemplates.js'
import useAgents from '../../hooks/useAgents'
import { useAppStore } from '../../stores/useAppStore'
import { XMarkIcon, ArrowPathIcon, SignalIcon } from '@heroicons/react/24/outline'
import ModulePage from '../ui/ModulePage'
import Modal from '../ui/Modal'
import './Intelligence.css'

// ── Signal Radar SVG ──
function SignalRadar({ signals = [], agents = [] }) {
  const size = 300, cx = size / 2, cy = size / 2
  const rings = [40, 80, 120]
  const categoryAngles = { macro: 0, mercado: 60, competencia: 120, tecnologia: 180, social: 240, economic: 300 }
  const categoryColors = { macro: 'var(--color-info)', mercado: 'var(--color-success)', competencia: 'var(--color-danger)', tecnologia: 'var(--accent-primary)', social: 'var(--chart-5)', economic: 'var(--color-warning)' }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: 'var(--surface-base)' }}>
      {rings.map(r => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-strong)" strokeWidth="0.5" strokeDasharray="4 4" />)}
      <line x1={cx} y1={cx - 140} x2={cx} y2={cx + 140} stroke="var(--border-default)" strokeWidth="1" />
      <line x1={cx - 140} y1={cy} x2={cx + 140} y2={cy} stroke="var(--border-default)" strokeWidth="1" />
      {signals.slice(0, 30).map((s, i) => {
        const angle = (categoryAngles[s.category] || 0) + (i * 15) % 60 - 30
        const dist = Math.min(120, 40 + (s.impact || 50) * 0.8)
        const rad = (angle * Math.PI) / 180
        const x = cx + Math.cos(rad) * dist, y = cy + Math.sin(rad) * dist
        const color = categoryColors[s.category] || 'var(--text-tertiary)'
        return (
          <g key={s.id || i}>
            <circle cx={x} cy={y} r={2} fill={color} />
            <circle cx={x} cy={y} r={8} fill="none" stroke={color} strokeWidth="0.5" opacity="0.4">
              <animate attributeName="r" values="4;12;4" dur="4s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="4s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
            </circle>
          </g>
        )
      })}
      {agents.slice(0, 4).map((agent, i) => {
        const agentAngle = 45 + i * 90, rad = (agentAngle * Math.PI) / 180
        const x = cx + Math.cos(rad) * 100, y = cy + Math.sin(rad) * 100
        const color = agent.status === 'online' ? 'var(--color-success)' : 'var(--color-warning)'
        return (
          <g key={agent.id || i}>
            <rect x={x - 12} y={y - 8} width="24" height="16" fill="var(--surface-base)" stroke={color} strokeWidth="1" rx="2" />
            <text x={x} y={y + 3} textAnchor="middle" fill={color} fontSize="8" fontWeight="800" fontFamily="var(--font-mono)">
              {(agent.code_name || agent.name || '').slice(0, 3).toUpperCase()}
            </text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={6} fill="var(--accent-primary)" opacity="0.8" />
      <circle cx={cx} cy={cy} r={12} fill="none" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.5">
        <animate attributeName="r" values="12;24;12" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

const CATEGORIES = [
  { value: 'macro', label: 'Macro', color: 'var(--color-info)' },
  { value: 'mercado', label: 'Market', color: 'var(--color-success)' },
  { value: 'competencia', label: 'Competition', color: 'var(--color-danger)' },
  { value: 'tecnologia', label: 'Technology', color: 'var(--accent-primary)' },
  { value: 'social', label: 'Social', color: 'var(--chart-5)' },
  { value: 'economic', label: 'Economic', color: 'var(--color-warning)' },
]

const emptyForm = { title: '', category: 'macro', indicator: 'leading', impact: 50, source: '', confidence: 70, implication: '' }
const API_PAGE_SIZE = 18
const ACTIVATION_PRIORITY = { live: 4, adapter_ready: 3, candidate: 2, catalog_only: 1 }
const SIGNAL_CATEGORIES = ['macro', 'mercado', 'competencia', 'tecnologia', 'social', 'economic']

function compactNumber(value) {
  if (!value) return '0'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function sortApiEntries(entries, sortMode) {
  return [...entries].sort((l, r) => {
    if (sortMode === 'name') return l.name.localeCompare(r.name)
    if (sortMode === 'section') {
      if ((l.section_rank || 0) !== (r.section_rank || 0)) return (l.section_rank || 0) - (r.section_rank || 0)
      return l.name.localeCompare(r.name)
    }
    if (sortMode === 'connectivity') {
      const lScore = ACTIVATION_PRIORITY[l.health_status === 'live' ? 'live' : l.activation_tier] || 0
      const rScore = ACTIVATION_PRIORITY[r.health_status === 'live' ? 'live' : r.activation_tier] || 0
      if (rScore !== lScore) return rScore - lScore
      if ((r.featured_score || 0) !== (l.featured_score || 0)) return (r.featured_score || 0) - (l.featured_score || 0)
      return l.name.localeCompare(r.name)
    }
    if ((r.featured_score || 0) !== (l.featured_score || 0)) return (r.featured_score || 0) - (l.featured_score || 0)
    return l.name.localeCompare(r.name)
  })
}

function metricColor(v) {
  if (v >= 70) return 'var(--color-success)'
  if (v >= 40) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function SignalEditModal({ signal, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    title: signal.title || '', category: signal.category || 'macro',
    source: signal.source || '', impact: signal.impact || 50,
    confidence: signal.confidence || 50, notes: signal.notes || signal.implication || '',
  })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave(signal.id, form); setSaving(false) }

  return (
    <Modal title="Signal details" onClose={onClose} footer={
      <div className="modal-actions">
        <button className="btn btn-danger" onClick={() => onDelete(signal.id)}>Delete</button>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    }>
      <div className="form-grid">
        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Signal title</label>
          <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="form-field">
          <label className="form-label">Category</label>
          <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {SIGNAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Source</label>
          <input className="form-input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
        </div>
        <div className="form-field">
          <label className="form-label">Impact <span style={{ color: metricColor(form.impact) }}>[{form.impact}]</span></label>
          <input type="range" min="0" max="100" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: parseInt(e.target.value) }))} style={{ accentColor: metricColor(form.impact) }} />
        </div>
        <div className="form-field">
          <label className="form-label">Confidence <span style={{ color: metricColor(form.confidence) }}>[{form.confidence}]</span></label>
          <input type="range" min="0" max="100" value={form.confidence} onChange={e => setForm(f => ({ ...f, confidence: parseInt(e.target.value) }))} style={{ accentColor: metricColor(form.confidence) }} />
        </div>
        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Notes</label>
          <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="mono text-xs text-tertiary" style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
        Registered: {new Date(signal.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </Modal>
  )
}

function Intelligence() {
  const navigate = useNavigate()
  const { signals, addSignal, updateSignal, removeSignal } = useSignals()
  const toast = useAppStore(s => s.toast)
  const [selectedSignal, setSelectedSignal] = useState(null)
  const { items: socialSignals, refresh: refreshSocialSignals, refreshing: socialRefreshing } = useSocialSignals()
  const { entries: catalogEntries, loading: apiLoading, installConnector, reload: reloadCatalog } = useApiCatalog({ isListed: true })
  const { agents } = useAgents()

  const [activeView, setActiveView] = useState('signals')
  const signalFilter = useSignalStore(s => s.filter)
  const setSignalFilter = useSignalStore(s => s.setFilter)
  const [signalSearch, setSignalSearch] = useState('')
  const [showLogModal, setShowLogModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [promotingId, setPromotingId] = useState(null)

  const [apiSearch, setApiSearch] = useState('')
  const [apiSection, setApiSection] = useState('all')
  const [apiModuleTarget, setApiModuleTarget] = useState('all')
  const [apiSort, setApiSort] = useState('featured')
  const [apiPage, setApiPage] = useState(1)
  const [installingSlug, setInstallingSlug] = useState(null)
  const deferredApiSearch = useDeferredValue(apiSearch)

  useEffect(() => { setApiPage(1) }, [apiModuleTarget, apiSearch, apiSection, apiSort])

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await addSignal({ ...form, impact: parseInt(form.impact, 10), confidence: parseInt(form.confidence, 10), status: 'active' })
    setForm(emptyForm); setSaving(false)
  }

  const handleSignalSave = useCallback(async (id, changes) => {
    await updateSignal(id, changes); setSelectedSignal(null); toast('Signal updated', 'success')
  }, [updateSignal, toast])

  const handleSignalDelete = useCallback(async (id) => {
    await removeSignal(id); setSelectedSignal(null); toast('Signal removed', 'success')
  }, [removeSignal, toast])

  const handlePromoteSocialSignal = async (signal) => {
    setPromotingId(signal.id)
    await addSignal({
      title: signal.title, category: 'social', indicator: signal.opportunityScore >= 70 ? 'leading' : 'lagging',
      impact: signal.opportunityScore, source: signal.permalink || `${signal.platform}:${signal.externalId}`,
      confidence: Math.max(45, Math.min(95, Math.round((signal.velocityScore * 0.55) + (signal.opportunityScore * 0.45)))),
      implication: `${signal.topic} signal on ${signal.platform}. Engagement ${signal.engagement} with sentiment ${signal.sentimentScore}.`, status: 'active'
    })
    setPromotingId(null)
  }

  const signalsByCategory = useMemo(() => signals.reduce((acc, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc }, {}), [signals])
  const filteredSignals = useMemo(() => signals.filter(s => {
    if (signalFilter !== 'all' && s.indicator !== signalFilter) return false
    if (signalSearch.trim() && !s.title.toLowerCase().includes(signalSearch.toLowerCase())) return false
    return true
  }).sort((l, r) => (r.impact || 0) - (l.impact || 0)), [signalFilter, signalSearch, signals])

  // ── API datasource logic ──
  const preparedApiEntries = useMemo(() => catalogEntries.map(entry => {
    const template = getTemplateByCatalogSlug(entry.slug)
    return { ...entry, ...buildApiIntelligencePresentation(entry), installable: Boolean(template) && !template.internalOnly && !entry.is_installed, internalOnly: template?.internalOnly || false }
  }).filter(e => !e.internalOnly), [catalogEntries])

  const moduleTargetOptions = useMemo(() => ['all', ...new Set(preparedApiEntries.flatMap(e => e.module_targets || []))], [preparedApiEntries])

  const searchScopedApiEntries = useMemo(() => {
    const query = normalizeText(deferredApiSearch)
    return preparedApiEntries.filter(entry => {
      if (apiModuleTarget !== 'all' && !(entry.module_targets || []).includes(apiModuleTarget)) return false
      if (!query) return true
      return normalizeText([entry.name, entry.category, entry.description, entry.section_label, ...(entry.capabilities || [])].join(' ')).includes(query)
    })
  }, [apiModuleTarget, deferredApiSearch, preparedApiEntries])

  const sectionSummary = useMemo(() => summarizeApiIntelligenceSections(searchScopedApiEntries), [searchScopedApiEntries])
  const filteredApiEntries = useMemo(() => searchScopedApiEntries.filter(e => apiSection === 'all' || e.section_key === apiSection), [apiSection, searchScopedApiEntries])
  const sortedApiEntries = useMemo(() => sortApiEntries(filteredApiEntries, apiSort), [filteredApiEntries, apiSort])
  const pageCount = Math.max(1, Math.ceil(sortedApiEntries.length / API_PAGE_SIZE))
  const pagedApiEntries = useMemo(() => sortedApiEntries.slice((apiPage - 1) * API_PAGE_SIZE, apiPage * API_PAGE_SIZE), [apiPage, sortedApiEntries])

  const apiStatsSummary = useMemo(() => ({
    total: preparedApiEntries.length,
    live: preparedApiEntries.filter(e => e.health_status === 'live' || e.activation_tier === 'live').length,
    installable: preparedApiEntries.filter(e => e.installable).length,
    sections: sectionSummary.filter(s => s.count > 0).length,
  }), [preparedApiEntries, sectionSummary])

  const handleInstallApi = async (entry) => {
    setInstallingSlug(entry.slug)
    const result = await installConnector(entry.slug)
    if (result?.error) { setInstallingSlug(null); return }
    startTransition(() => { reloadCatalog() })
    setInstallingSlug(null)
  }

  return (
    <ModulePage
      title="Intelligence"
      subtitle={`Signal radar & API atlas · ${signals.length} active signals`}
      actions={
        <div className="lab-tabs">
          <button className={`lab-tab-btn ${activeView === 'signals' ? 'active' : ''}`} onClick={() => setActiveView('signals')}>Signals</button>
          <button className={`lab-tab-btn ${activeView === 'apis' ? 'active' : ''}`} onClick={() => setActiveView('apis')}>API Atlas</button>
        </div>
      }
    >
      <div className="lab-content">
        {activeView === 'signals' && (
          <div className="v3-intel-layout">
            
            {/* Semantic Search */}
            <section className="v3-glass-card v3-intel-search-section">
              <div className="v3-hero-glow"></div>
              <div className="v3-intel-search-content">
                <label className="v3-intel-label">Semantic Intelligence Search</label>
                <div className="v3-intel-input-wrapper">
                  <SignalIcon className="v3-intel-input-icon" />
                  <input className="v3-input v3-intel-search-input" placeholder="Search knowledge graph, entities, or indexed metadata..." type="text" value={signalSearch} onChange={e => setSignalSearch(e.target.value)} />
                </div>
                <div className="v3-intel-filter-row">
                  <span className="v3-intel-filter-label">Filters:</span>
                  {['all', 'leading', 'lagging'].map(value => (
                    <button key={value} className={`v3-pill-filter ${signalFilter === value ? 'active' : ''}`} onClick={() => setSignalFilter(value)}>
                      {value === 'all' ? 'All Nodes' : value}
                    </button>
                  ))}
                  <button className="v3-pill-filter" onClick={() => setShowLogModal(true)}>+ Log Signal</button>
                  <button className="v3-pill-filter v3-intel-sync-btn" onClick={refreshSocialSignals} disabled={socialRefreshing}>
                    <ArrowPathIcon className={socialRefreshing ? 'spin' : ''} />
                    {socialRefreshing ? 'Syncing...' : 'Sync Social'}
                  </button>
                </div>
              </div>
            </section>

            <div className="v3-intel-grid-2">
              {/* Relational Network Graph */}
              <section className="v3-glass-card v3-intel-widget">
                <div className="v3-intel-widget-header">
                  <h3 className="v3-intel-widget-title">Relational Network Graph</h3>
                  <div className="v3-intel-cat-summary">
                    {CATEGORIES.map(cat => (
                      <div key={cat.value} title={`${cat.label} (${signalsByCategory[cat.value] || 0})`} className="v3-intel-cat-dot" style={{ backgroundColor: cat.color }}>
                        {(signalsByCategory[cat.value] || 0)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="v3-intel-widget-body v3-intel-radar-container">
                  <div className="v3-intel-radar-bg"></div>
                  <div className="v3-intel-radar-content">
                     <SignalRadar signals={filteredSignals} agents={agents} />
                  </div>
                </div>
              </section>

              {/* Top Entities */}
              <section className="v3-intel-widget-col">
                <div className="v3-intel-widget-header-row">
                  <h3 className="v3-intel-widget-title">Top Entities</h3>
                  <span className="v3-intel-widget-count">{filteredSignals.length} Active</span>
                </div>
                <div className="v3-intel-entity-list custom-scrollbar">
                  {filteredSignals.map(signal => (
                    <div key={signal.id} className="v3-glass-card v3-intel-entity-card" onClick={() => setSelectedSignal(signal)}>
                      <div className="v3-intel-entity-top">
                        <h4 className="v3-intel-entity-name">{signal.title}</h4>
                        <span className="v3-intel-entity-id">#{signal.id.substring(0,6).toUpperCase()}</span>
                      </div>
                      <div className="v3-intel-entity-bar-row">
                        <div className="v3-intel-entity-bar-wrap">
                          <div className="v3-intel-entity-bar-header">
                            <span className="v3-intel-entity-bar-label">Impact Relevance</span>
                            <span className="v3-intel-entity-bar-value">{signal.impact}%</span>
                          </div>
                          <div className="v3-intel-entity-bar-track">
                            <div className="v3-intel-entity-bar-fill" style={{ width: `${signal.impact}%`, boxShadow: signal.impact > 70 ? 'var(--shadow-glow)' : 'none' }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="v3-intel-entity-bottom">
                        <div className="v3-intel-entity-meta">
                          <span className="v3-intel-entity-icon">
                             <span className="material-symbols-outlined">history_edu</span>
                          </span>
                          <span className="v3-intel-entity-category">{signal.category}</span>
                        </div>
                        <span className="v3-intel-entity-date">{signal.created_at?.split('T')[0]}</span>
                      </div>
                    </div>
                  ))}
                  {filteredSignals.length === 0 && <div className="v3-glass-card v3-intel-entity-card text-center text-tertiary mono">No signals match filter criteria.</div>}
                </div>
              </section>
            </div>
            
            {/* Social Signal Intercepts Grid */}
            <div className="v3-intel-social-section">
              <div className="v3-intel-widget-header-row" style={{ marginTop: 'var(--space-6)' }}>
                <h3 className="v3-intel-widget-title" style={{ fontSize: '14px' }}>Social Intercepts</h3>
              </div>
              <div className="v3-intel-social-grid">
                {socialSignals.slice(0, 6).map(signal => (
                  <div key={signal.id} className="v3-glass-card v3-intel-social-card">
                    <div className="v3-intel-social-header">
                      <div className="v3-intel-social-tags">
                        <span className="badge">{signal.platform}</span>
                        <span className="badge v3-gold-badge">{signal.topic}</span>
                      </div>
                      <button className="v3-pill-filter v3-intel-social-promote" onClick={() => handlePromoteSocialSignal(signal)} disabled={promotingId === signal.id}>
                        {promotingId === signal.id ? '...' : 'Promote'}
                      </button>
                    </div>
                    <div className="v3-intel-social-title">{signal.title}</div>
                    {signal.bodyExcerpt && <div className="v3-intel-social-excerpt">{signal.bodyExcerpt.slice(0, 100)}...</div>}
                    <div className="v3-intel-social-footer">
                      <span>Opp: {signal.opportunityScore}</span>
                      <span>Eng: {compactNumber(signal.engagement)}</span>
                    </div>
                  </div>
                ))}
                {socialSignals.length === 0 && <div className="v3-glass-card p-4 text-center text-tertiary mono" style={{ gridColumn: '1 / -1' }}>No social intercepts active.</div>}
              </div>
            </div>

            {/* Master Signal Intelligence Database (Restored) */}
            <div className="v3-signal-master-db mt-8 mb-12">
              <div className="v3-intel-widget-header-row mb-4">
                <h3 className="v3-intel-widget-title text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--gold)]">database</span> Signal Raw Database
                </h3>
              </div>
              <div className="v3-glass-card overflow-x-auto">
                <table className="v3-table w-full text-left">
                  <thead><tr>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary">Signal Signature</th>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary">Category</th>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary">Impact</th>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary">Confidence</th>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary">Discovery Date</th>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary text-right text-[var(--error)]">Action</th>
                  </tr></thead>
                  <tbody>
                    {filteredSignals.map(signal => (
                      <tr key={signal.id} className="cursor-pointer hover:bg-[var(--gold-muted-bg)] transition-colors border-b border-[var(--border-subtle)] hover:border-[var(--gold-border)]" onClick={() => setSelectedSignal(signal)}>
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{signal.title}</div>
                          <div className="text-xs text-tertiary mt-1">UUID: {signal.id.substring(0,8)}</div>
                        </td>
                        <td className="p-4"><span className="badge" style={{ backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{signal.category}</span></td>
                        <td className="p-4 font-mono font-bold text-sm" style={{ color: signal.impact >= 70 ? 'var(--error)' : 'var(--gold)' }}>{signal.impact}%</td>
                        <td className="p-4 font-mono font-bold text-sm" style={{ color: signal.confidence >= 70 ? 'var(--success)' : 'var(--warning)' }}>{signal.confidence}%</td>
                        <td className="p-4 text-tertiary text-sm">{signal.created_at?.split('T')[0]}</td>
                        <td className="p-4 text-right">
                          <button className="v3-btn-subtle text-[var(--error)] text-xs py-1 px-3 border border-[var(--error)] hover:bg-[var(--error)] hover:text-white" onClick={e => { e.stopPropagation(); removeSignal(signal.id) }}>PURGE</button>
                        </td>
                      </tr>
                    ))}
                    {filteredSignals.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-tertiary mono italic border-b border-[var(--border)]">No signals recorded in master database</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeView === 'apis' && (
          <div className="v3-intel-layout mb-12 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="v3-glass-card p-4">
                <span className="mono text-xs text-secondary tracking-widest uppercase">Catalog APIs</span>
                <div className="mono text-2xl font-bold mt-2" style={{ color: 'var(--info)' }}>{apiStatsSummary.total}</div>
              </div>
              <div className="v3-glass-card p-4">
                <span className="mono text-xs text-secondary tracking-widest uppercase">Live Connectors</span>
                <div className="mono text-2xl font-bold mt-2" style={{ color: 'var(--success)' }}>{apiStatsSummary.live}</div>
              </div>
              <div className="v3-glass-card p-4">
                <span className="mono text-xs text-secondary tracking-widest uppercase">Installable</span>
                <div className="mono text-2xl font-bold mt-2" style={{ color: 'var(--warning)' }}>{apiStatsSummary.installable}</div>
              </div>
              <div className="v3-glass-card p-4">
                <span className="mono text-xs text-secondary tracking-widest uppercase">Active Sections</span>
                <div className="mono text-2xl font-bold mt-2" style={{ color: 'var(--gold)' }}>{apiStatsSummary.sections}</div>
              </div>
            </div>

            <div className="v3-glass-card p-4 mb-6 flex flex-wrap gap-4 items-end" style={{ border: '1px solid var(--gold-border)' }}>
              <div className="form-field flex-1 min-w-[200px]">
                <label className="v3-form-label text-xs">Search Integrations</label>
                <input className="v3-input" value={apiSearch} onChange={e => setApiSearch(e.target.value)} placeholder="Type OS API Name..." />
              </div>
              <div className="form-field min-w-[150px]">
                <label className="v3-form-label text-xs">Target Module</label>
                <select className="v3-input" value={apiModuleTarget} onChange={e => setApiModuleTarget(e.target.value)}>
                  {moduleTargetOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-field min-w-[150px]">
                <label className="v3-form-label text-xs">Sort Backbone By</label>
                <select className="v3-input" value={apiSort} onChange={e => setApiSort(e.target.value)}>
                  <option value="featured">Intel Score</option><option value="connectivity">Connection Tier</option><option value="section">OS Section</option><option value="name">Alphabetical</option>
                </select>
              </div>
              <button className="v3-btn-outline h-[38px] px-6" onClick={() => navigate('/api-network')}>View OS Hub</button>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              <button className={`v3-pill-filter ${apiSection === 'all' ? 'active' : ''}`} onClick={() => setApiSection('all')}>All Routes [{searchScopedApiEntries.length}]</button>
              {sectionSummary.filter(s => s.count > 0).map(s => (
                <button key={s.key} className={`v3-pill-filter ${apiSection === s.key ? 'active' : ''}`} onClick={() => setApiSection(s.key)}>
                  {s.shortLabel} [{s.count}]
                </button>
              ))}
            </div>

            {apiLoading ? (
              <div className="v3-glass-card p-8 text-center text-secondary mono" style={{ opacity: 0.6 }}>Synchronizing OS API Backbone...</div>
            ) : (
              <div className="v3-glass-card overflow-x-auto">
                <table className="v3-table w-full text-left">
                  <thead><tr>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary">API Integrations</th>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary">OS Section</th>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary">Health Status</th>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary">Priority Score</th>
                    <th className="p-4 border-b border-[var(--border)] text-xs text-tertiary text-right">Deployment</th>
                  </tr></thead>
                  <tbody>
                    {pagedApiEntries.map(entry => (
                      <tr key={entry.slug} className="hover:bg-[var(--gold-muted-bg)] transition-colors border-b border-[var(--border-subtle)] hover:border-[var(--gold-border)]">
                        <td className="p-4 border-b border-[var(--border-subtle)]">
                          <div className="font-bold text-white mb-1 tracking-wide">{entry.name}</div>
                          <div className="text-tertiary text-xs max-w-sm leading-tight">{entry.description?.slice(0, 100)}{entry.description?.length > 100 ? '...' : ''}</div>
                        </td>
                        <td className="p-4 border-b border-[var(--border-subtle)] text-[var(--gold)] text-sm uppercase mono">{entry.section_label}</td>
                        <td className="p-4 border-b border-[var(--border-subtle)] text-sm">
                          {entry.health_status === 'live' ? <span className="text-[var(--success)] border border-[var(--success)] bg-[#10b9811a] px-3 py-1 rounded-full text-xs box-border">LIVE CONNECTION</span> : <span className="text-[var(--warning)] px-3 py-1 text-xs border border-[var(--warning)] rounded-full">{entry.activation_tier.toUpperCase()}</span>}
                        </td>
                        <td className="p-4 border-b border-[var(--border-subtle)] font-mono text-[var(--info)] text-sm">{entry.featured_score || 0}</td>
                        <td className="p-4 border-b border-[var(--border-subtle)] text-right">
                          {entry.installable ? (
                            <button className="v3-btn-subtle text-xs py-1 px-4 hover:bg-[var(--gold)] hover:text-[#111]" onClick={() => handleInstallApi(entry)} disabled={installingSlug === entry.slug}>
                              {installingSlug === entry.slug ? 'Installing...' : 'Link API'}
                            </button>
                          ) : entry.is_installed ? (
                            <span className="text-[var(--success)] font-bold text-xs uppercase tracking-widest inline-flex items-center gap-1">
                              • ACTIVE
                            </span>
                          ) : <span className="text-tertiary text-xs italic">N/A</span>}
                        </td>
                      </tr>
                    ))}
                    {pagedApiEntries.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-tertiary mono italic border-b border-[var(--border)]">No API integrations found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {pageCount > 1 && (
              <div className="flex justify-between items-center mt-6 v3-glass-card px-4 py-2 border border-[var(--gold-border)] bg-[var(--gold-muted-bg)]">
                <button className="v3-btn-outline text-xs px-4 py-1.5" onClick={() => setApiPage(p => Math.max(1, p - 1))} disabled={apiPage === 1}>PREV</button>
                <span className="mono text-xs text-white tracking-widest">PAGE {apiPage} / {pageCount}</span>
                <button className="v3-btn-outline text-xs px-4 py-1.5" onClick={() => setApiPage(p => Math.min(pageCount, p + 1))} disabled={apiPage === pageCount}>NEXT</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showLogModal && (
        <Modal title="Log new signal" onClose={() => setShowLogModal(false)} footer={
           <div className="modal-actions" style={{ justifyContent: 'flex-end', display: 'flex' }}>
             <button className="v3-btn-outline" onClick={() => setShowLogModal(false)}>Cancel</button>
             <button className="v3-btn-primary" onClick={() => { handleAdd(); setShowLogModal(false); }} disabled={saving}>
                 {saving ? 'Adding...' : 'Register signal'}
             </button>
           </div>
        }>
          <div className="form-grid">
             <div className="form-field" style={{ gridColumn: '1 / -1' }}>
               <label className="form-label">Signal title</label>
               <input className="v3-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
             </div>
             <div className="form-field">
               <label className="form-label">Category</label>
                 <select className="v3-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                     {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                 </select>
             </div>
             <div className="form-field">
                 <label className="form-label">Impact</label>
                 <input className="v3-input" type="number" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} />
             </div>
             <div className="form-field">
                 <label className="form-label">Confidence</label>
                 <input className="v3-input" type="number" value={form.confidence} onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))} />
             </div>
          </div>
        </Modal>
      )}

      {selectedSignal && <SignalEditModal signal={selectedSignal} onSave={handleSignalSave} onDelete={handleSignalDelete} onClose={() => setSelectedSignal(null)} />}
    </ModulePage>
  )
}

export default Intelligence
