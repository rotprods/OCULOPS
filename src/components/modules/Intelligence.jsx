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
  const filteredSignals = useMemo(() => signals.filter(s => signalFilter === 'all' || s.indicator === signalFilter).sort((l, r) => (r.impact || 0) - (l.impact || 0)), [signalFilter, signals])

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
          <div className="lab-col-layout">
            {/* Radar + Category grid */}
            <div className="intel-top-grid">
              <div className="intel-radar-wrap">
                <SignalRadar signals={signals} agents={agents} />
              </div>
              <div className="intel-cat-grid">
                {CATEGORIES.map(cat => (
                  <div key={cat.value} className="intel-cat-cell">
                    <div className="intel-cat-cell-header">
                      <span className="mono text-xs text-tertiary font-bold">{cat.label}</span>
                    </div>
                    <span className="intel-cat-value" style={{ color: cat.color }}>{signalsByCategory[cat.value] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social signals + Register form */}
            <div className="intel-split">
              <div className="lab-panel">
                <div className="lab-panel-header">
                  <span>Social signals</span>
                  <button className="btn btn-sm btn-ghost" onClick={refreshSocialSignals} disabled={socialRefreshing}>
                    <ArrowPathIcon style={{ width: 14, height: 14 }} className={socialRefreshing ? 'spin' : ''} />
                    {socialRefreshing ? 'Syncing...' : 'Sync'}
                  </button>
                </div>
                <div className="ct-section-body lab-col-layout">
                  {socialSignals.slice(0, 5).map(signal => (
                    <div key={signal.id} className="intel-social-card">
                      <div className="intel-social-header">
                        <div className="intel-social-tags">
                          <span className="badge">{signal.platform}</span>
                          <span className="badge" style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>{signal.topic}</span>
                        </div>
                        <button className="btn btn-sm btn-primary" onClick={() => handlePromoteSocialSignal(signal)} disabled={promotingId === signal.id}>
                          {promotingId === signal.id ? 'Adding...' : 'Promote'}
                        </button>
                      </div>
                      <div className="mono text-sm font-bold" style={{ marginBottom: 'var(--space-2)' }}>{signal.title}</div>
                      {signal.bodyExcerpt && <div className="mono text-xs text-secondary" style={{ marginBottom: 'var(--space-2)', opacity: 0.8 }}>{signal.bodyExcerpt.slice(0, 150)}...</div>}
                      <div className="mono text-xs text-tertiary">Engagement: {compactNumber(signal.engagement)} · Sentiment: {signal.sentimentScore} · Opp: {signal.opportunityScore}</div>
                    </div>
                  ))}
                  {socialSignals.length === 0 && <div className="table-empty">No social signals</div>}
                </div>
              </div>

              <div className="lab-panel">
                <div className="lab-panel-header">Log new signal</div>
                <div className="ct-section-body">
                  <div className="form-grid">
                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Signal title</label>
                      <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Category</label>
                      <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Impact</label>
                      <input className="form-input" type="number" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Confidence</label>
                      <input className="form-input" type="number" value={form.confidence} onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)', width: '100%' }} onClick={handleAdd} disabled={saving}>
                    {saving ? 'Adding...' : 'Register signal'}
                  </button>
                </div>
              </div>
            </div>

            {/* Signal table */}
            <div className="lab-panel">
              <div className="lab-panel-header">
                <span>Signal database</span>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {['all', 'leading', 'lagging'].map(value => (
                    <button key={value} className={`intel-section-pill ${signalFilter === value ? 'active' : ''}`} onClick={() => setSignalFilter(value)}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <table className="intel-signal-table">
                <thead><tr>
                  <th>Signal</th><th>Category</th><th>Impact</th><th>Confidence</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th>
                </tr></thead>
                <tbody>
                  {filteredSignals.map(signal => (
                    <tr key={signal.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedSignal(signal)}>
                      <td style={{ fontWeight: 'bold' }}>{signal.title}</td>
                      <td><span className="badge">{signal.category}</span></td>
                      <td style={{ color: signal.impact >= 70 ? 'var(--color-danger)' : 'var(--color-warning)' }}>{signal.impact}</td>
                      <td style={{ color: signal.confidence >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>{signal.confidence}</td>
                      <td className="text-tertiary">{signal.created_at?.split('T')[0]}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={e => { e.stopPropagation(); removeSignal(signal.id) }}>Del</button>
                      </td>
                    </tr>
                  ))}
                  {filteredSignals.length === 0 && <tr><td colSpan={6} className="table-empty">No signals recorded</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'apis' && (
          <div className="lab-col-layout">
            <div className="kpi-strip kpi-strip-4">
              <div className="kpi-strip-cell"><span className="mono text-xs text-tertiary">Catalog APIs</span><span className="mono text-lg font-bold" style={{ color: 'var(--color-info)' }}>{apiStatsSummary.total}</span></div>
              <div className="kpi-strip-cell"><span className="mono text-xs text-tertiary">Live connectors</span><span className="mono text-lg font-bold" style={{ color: 'var(--color-success)' }}>{apiStatsSummary.live}</span></div>
              <div className="kpi-strip-cell"><span className="mono text-xs text-tertiary">Installable</span><span className="mono text-lg font-bold" style={{ color: 'var(--color-warning)' }}>{apiStatsSummary.installable}</span></div>
              <div className="kpi-strip-cell"><span className="mono text-xs text-tertiary">Active sections</span><span className="mono text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>{apiStatsSummary.sections}</span></div>
            </div>

            <div className="intel-api-filters">
              <div className="form-field"><label className="form-label">Search</label><input className="form-input" value={apiSearch} onChange={e => setApiSearch(e.target.value)} /></div>
              <div className="form-field"><label className="form-label">Target</label>
                <select className="form-input" value={apiModuleTarget} onChange={e => setApiModuleTarget(e.target.value)}>
                  {moduleTargetOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-field"><label className="form-label">Sort</label>
                <select className="form-input" value={apiSort} onChange={e => setApiSort(e.target.value)}>
                  <option value="featured">Score</option><option value="connectivity">Connection</option><option value="section">Section</option><option value="name">Name</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/api-network')}>View network</button>
            </div>

            <div className="intel-section-pills">
              <button className={`intel-section-pill ${apiSection === 'all' ? 'active' : ''}`} onClick={() => setApiSection('all')}>All [{searchScopedApiEntries.length}]</button>
              {sectionSummary.filter(s => s.count > 0).map(s => (
                <button key={s.key} className={`intel-section-pill ${apiSection === s.key ? 'active' : ''}`} onClick={() => setApiSection(s.key)}>
                  {s.shortLabel} [{s.count}]
                </button>
              ))}
            </div>

            {apiLoading ? (
              <div className="table-empty">Loading API catalog...</div>
            ) : (
              <div className="lab-panel">
                <div className="lab-panel-header">API catalog</div>
                <table className="intel-signal-table">
                  <thead><tr>
                    <th>API</th><th>Section</th><th>Status</th><th>Score</th><th style={{ textAlign: 'right' }}>Action</th>
                  </tr></thead>
                  <tbody>
                    {pagedApiEntries.map(entry => (
                      <tr key={entry.slug}>
                        <td>
                          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{entry.name}</div>
                          <div className="text-tertiary" style={{ fontSize: 10 }}>{entry.description?.slice(0, 60)}...</div>
                        </td>
                        <td style={{ color: 'var(--accent-primary)' }}>{entry.section_label}</td>
                        <td>{entry.health_status === 'live' ? <span className="text-success">Live</span> : <span className="text-warning">{entry.activation_tier}</span>}</td>
                        <td style={{ color: 'var(--color-info)' }}>{entry.featured_score || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          {entry.installable ? (
                            <button className="btn btn-sm btn-ghost" onClick={() => handleInstallApi(entry)} disabled={installingSlug === entry.slug}>
                              {installingSlug === entry.slug ? 'Installing...' : 'Install'}
                            </button>
                          ) : entry.is_installed ? (
                            <span className="text-success font-bold text-xs">Installed</span>
                          ) : <span className="text-tertiary text-xs">N/A</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pageCount > 1 && (
              <div className="intel-pagination">
                <button className="btn btn-sm btn-ghost" onClick={() => setApiPage(p => Math.max(1, p - 1))} disabled={apiPage === 1}>Prev</button>
                <span className="mono text-xs text-tertiary">Page {apiPage} / {pageCount}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => setApiPage(p => Math.min(pageCount, p + 1))} disabled={apiPage === pageCount}>Next</button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedSignal && <SignalEditModal signal={selectedSignal} onSave={handleSignalSave} onDelete={handleSignalDelete} onClose={() => setSelectedSignal(null)} />}
    </ModulePage>
  )
}

export default Intelligence
