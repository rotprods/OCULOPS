// ═══════════════════════════════════════════════════
// OCULOPS — Intelligence Radar System
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ═══════════════════════════════════════════════════

import { useState, useMemo, useEffect, useCallback, useDeferredValue, startTransition } from 'react'
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
import useAgents from '../../hooks/useAgents'
import { useAppStore } from '../../stores/useAppStore'

// ── Strict Signal Radar SVG ──
function SignalRadar({ signals = [], agents = [] }) {
  const size = 300
  const cx = size / 2
  const cy = size / 2
  const rings = [40, 80, 120]
  const categoryAngles = { macro: 0, mercado: 60, competencia: 120, tecnologia: 180, social: 240, economic: 300 }
  const categoryColors = { macro: '#5ac8fa', mercado: '#34c759', competencia: '#ff3b30', tecnologia: 'var(--accent-primary)', social: '#af52de', economic: '#ff9f0a' }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ background: '#000', border: '1px solid var(--border-default)' }}>
      <rect x="0" y="0" width="100%" height="100%" fill="none" opacity="0.1" stroke="var(--accent-primary)" strokeWidth="0.5" />
      <path d={`M0,0 L${size},${size} M${size},0 L0,${size}`} stroke="rgba(255,215,0,0.05)" strokeWidth="0.5" />
      {rings.map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,215,0,0.15)" strokeWidth="0.5" strokeDasharray="4 4" />
      ))}
      <line x1={cx} y1={cx - 140} x2={cx} y2={cx + 140} stroke="rgba(255,215,0,0.2)" strokeWidth="1" />
      <line x1={cx - 140} y1={cy} x2={cx + 140} y2={cy} stroke="rgba(255,215,0,0.2)" strokeWidth="1" />

      {signals.slice(0, 30).map((s, i) => {
        const angle = (categoryAngles[s.category] || 0) + (i * 15) % 60 - 30
        const dist = Math.min(120, 40 + (s.impact || 50) * 0.8)
        const rad = (angle * Math.PI) / 180
        const x = cx + Math.cos(rad) * dist
        const y = cy + Math.sin(rad) * dist
        const color = categoryColors[s.category] || 'var(--color-text-tertiary)'
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
        const agentAngle = 45 + i * 90
        const rad = (agentAngle * Math.PI) / 180
        const x = cx + Math.cos(rad) * 100
        const y = cy + Math.sin(rad) * 100
        const color = agent.status === 'online' ? 'var(--color-success)' : 'var(--color-warning)'
        return (
          <g key={agent.id || i}>
            <rect x={x - 12} y={y - 8} width="24" height="16" fill="#000" stroke={color} strokeWidth="1" />
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
  { value: 'macro', label: 'MACRO', icon: '🌍', color: '#5ac8fa' },
  { value: 'mercado', label: 'MARKET', icon: '📈', color: '#34c759' },
  { value: 'competencia', label: 'COMBAT', icon: '⚔️', color: '#ff3b30' },
  { value: 'tecnologia', label: 'TECH', icon: '🤖', color: 'var(--accent-primary)' },
  { value: 'social', label: 'SOCIAL', icon: '👥', color: '#af52de' },
  { value: 'economic', label: 'ECON', icon: '💰', color: '#ff9f0a' },
]

const emptyForm = { title: '', category: 'macro', indicator: 'leading', impact: 50, source: '', confidence: 70, implication: '' }
const API_PAGE_SIZE = 18
const ACTIVATION_PRIORITY = { live: 4, adapter_ready: 3, candidate: 2, catalog_only: 1 }

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

const SIGNAL_CATEGORIES = ['macro', 'mercado', 'competencia', 'tecnologia', 'social', 'economic']

function metricColor(v) {
  if (v >= 70) return 'var(--color-success)'
  if (v >= 40) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function SignalEditModal({ signal, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    title: signal.title || '',
    category: signal.category || 'macro',
    source: signal.source || '',
    impact: signal.impact || 50,
    confidence: signal.confidence || 50,
    notes: signal.notes || signal.implication || '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = async () => {
    setSaving(true)
    await onSave(signal.id, { title: form.title, category: form.category, source: form.source, impact: parseInt(form.impact), confidence: parseInt(form.confidence), notes: form.notes })
    setSaving(false)
  }

  const inputStyle = { background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '4px' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ width: '500px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--surface-raised)', border: '1px solid var(--border-default)' }} onClick={e => e.stopPropagation()}>
        <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>/// SIGNAL DOSSIER</span>
          <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={onClose}>[ ESC ]</span>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>SIGNAL DESIGNATION</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelStyle}>CLASSIFICATION</label>
              <select style={{ ...inputStyle, appearance: 'auto' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {SIGNAL_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelStyle}>SOURCE</label>
              <input style={inputStyle} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
            </div>
            <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelStyle}>IMPACT <span style={{ color: metricColor(form.impact), fontWeight: 'bold' }}>[{form.impact}]</span></label>
              <input type="range" min="0" max="100" value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} style={{ accentColor: metricColor(form.impact) }} />
            </div>
            <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelStyle}>CONFIDENCE <span style={{ color: metricColor(form.confidence), fontWeight: 'bold' }}>[{form.confidence}]</span></label>
              <input type="range" min="0" max="100" value={form.confidence} onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))} style={{ accentColor: metricColor(form.confidence) }} />
            </div>
          </div>
          <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={labelStyle}>INTELLIGENCE NOTES</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            REGISTERED: {new Date(signal.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between' }}>
          <button className="mono font-bold" style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '10px', padding: '8px 16px', cursor: 'pointer' }} onClick={() => onDelete(signal.id)}>[ PURGE ]</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="mono font-bold" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '10px', padding: '8px 16px', cursor: 'pointer' }} onClick={onClose}>ABORT</button>
            <button className="mono font-bold" style={{ background: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', color: '#000', fontSize: '10px', padding: '8px 16px', cursor: 'pointer' }} onClick={handleSave} disabled={saving}>{saving ? 'TRANSMITTING...' : '[ COMMIT ]'}</button>
          </div>
        </div>
      </div>
    </div>
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
    setForm(emptyForm)
    setSaving(false)
  }

  const handleRemove = async (id) => await removeSignal(id)

  const handleSignalSave = useCallback(async (id, changes) => {
    await updateSignal(id, changes)
    setSelectedSignal(null)
    toast('SIGNAL UPDATED', 'success')
  }, [updateSignal, toast])

  const handleSignalDelete = useCallback(async (id) => {
    await removeSignal(id)
    setSelectedSignal(null)
    toast('SIGNAL PURGED', 'success')
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

  // --- API DATASOURCE LOGIC ---
  const preparedApiEntries = useMemo(() => catalogEntries.map(entry => {
    const template = getTemplateByCatalogSlug(entry.slug)
    return {
      ...entry, ...buildApiIntelligencePresentation(entry),
      installable: Boolean(template) && !template.internalOnly && !entry.is_installed,
      internalOnly: template?.internalOnly || false,
    }
  }).filter(e => !e.internalOnly), [catalogEntries])

  const moduleTargetOptions = useMemo(() => ['all', ...new Set(preparedApiEntries.flatMap(e => e.module_targets || []))], [preparedApiEntries])

  const searchScopedApiEntries = useMemo(() => {
    const query = normalizeText(deferredApiSearch)
    return preparedApiEntries.filter(entry => {
      if (apiModuleTarget !== 'all' && !(entry.module_targets || []).includes(apiModuleTarget)) return false
      if (!query) return true
      const haystack = normalizeText([entry.name, entry.category, entry.description, entry.section_label, ...(entry.capabilities || [])].join(' '))
      return haystack.includes(query)
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
    if (result?.error) { setInstallingSlug(null); return; }
    startTransition(() => { reloadCatalog() })
    setInstallingSlug(null)
  }

  const handleOpenNetwork = () => navigate('/api-network')

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--accent-primary)', letterSpacing: '0.05em', margin: 0 }}>INTELLIGENCE RADAR</h1>
          <p className="mono text-xs text-tertiary">SIGNAL OVERWATCH & SECURE API ATLAS // {signals.length} ACTIVE SIGNALS</p>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button className="mono" style={{ padding: '8px 16px', fontSize: '10px', background: activeView === 'signals' ? 'var(--accent-primary)' : 'transparent', color: activeView === 'signals' ? '#000' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveView('signals')}>01. SIGNAL RADAR</button>
          <button className="mono" style={{ padding: '8px 16px', fontSize: '10px', background: activeView === 'apis' ? 'var(--accent-primary)' : 'transparent', color: activeView === 'apis' ? '#000' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveView('apis')}>02. API ATLAS</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeView === 'signals' && (
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
            {/* TOP GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '16px' }}>
              <div style={{ border: '1px solid var(--border-default)', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <SignalRadar signals={signals} agents={agents} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border-default)', border: '1px solid var(--border-default)' }}>
                {CATEGORIES.slice(0, 6).map((cat, i) => (
                  <div key={i} style={{ background: 'var(--surface-raised)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono text-xs text-tertiary font-bold">{cat.label}</span>
                      <span>{cat.icon}</span>
                    </div>
                    <span className="mono" style={{ fontSize: '28px', fontWeight: '800', lineHeight: '1', color: cat.color }}>{signalsByCategory[cat.value] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TWO COLUMNS: SYSTEM SOCIAL + REGISTER */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div style={{ border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column' }}>
                <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>/// SOCIAL OMNINT INTERCEPTS</span>
                  <button className="btn btn-sm btn-ghost mono" style={{ padding: '2px 8px', fontSize: '9px' }} onClick={refreshSocialSignals} disabled={socialRefreshing}>{socialRefreshing ? 'SYNCING...' : 'FORCE SYNC'}</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', background: 'var(--surface-elevated)' }}>
                  {socialSignals.slice(0, 5).map(signal => (
                    <div key={signal.id} style={{ border: '1px solid var(--border-subtle)', padding: '12px', background: '#000' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className="badge badge-neutral mono text-xs" style={{ border: '1px solid var(--border-subtle)' }}>{signal.platform.toUpperCase()}</span>
                          <span className="badge badge-neutral mono text-xs" style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>{signal.topic.toUpperCase()}</span>
                        </div>
                        <button className="btn btn-primary mono btn-sm" style={{ padding: '2px 8px', fontSize: '9px' }} onClick={() => handlePromoteSocialSignal(signal)} disabled={promotingId === signal.id}>
                          {promotingId === signal.id ? 'PROC...' : 'PROMOTE'}
                        </button>
                      </div>
                      <div className="mono text-sm font-bold" style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>{signal.title.toUpperCase()}</div>
                      {signal.bodyExcerpt && <div className="mono text-xs text-secondary" style={{ marginBottom: '8px', opacity: 0.8 }}>{signal.bodyExcerpt.slice(0, 150)}...</div>}
                      <div className="mono text-xs text-tertiary">ENGAGEMENT: {compactNumber(signal.engagement)} | SENTIMENT: {signal.sentimentScore} | OPP: {signal.opportunityScore}</div>
                    </div>
                  ))}
                  {socialSignals.length === 0 && <div className="mono text-xs text-tertiary" style={{ textAlign: 'center', padding: '16px' }}>NO SOCIAL INTERCEPTS</div>}
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', background: 'var(--surface-raised)' }}>
                <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--accent-primary)' }}>/// LOG TARGET INTEL</div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="input-group"><label className="mono text-xs">SIGNAL REF</label><input className="input mono text-xs" style={{ padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 0 }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                  <div className="input-group"><label className="mono text-xs">CLASS</label>
                    <select className="input mono text-xs" style={{ padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 0 }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="input-group"><label className="mono text-xs">IMPACT</label><input className="input mono text-xs" type="number" style={{ padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 0 }} value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))} /></div>
                    <div className="input-group"><label className="mono text-xs">CONFIDENCE</label><input className="input mono text-xs" type="number" style={{ padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 0 }} value={form.confidence} onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))} /></div>
                  </div>
                  <button className="btn btn-primary mono" style={{ marginTop: '16px', width: '100%', borderRadius: 0, padding: '12px' }} onClick={handleAdd} disabled={saving}>
                    {saving ? 'ENCRYPTING...' : 'REGISTER INTEL'}
                  </button>
                </div>
              </div>
            </div>

            {/* RAW LEADS DATA TABLE */}
            <div style={{ border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
              <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>/// SECURE SIGNALS DB</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['all', 'leading', 'lagging'].map(value => (
                    <button key={value} className="mono" style={{ border: '1px solid var(--border-subtle)', background: signalFilter === value ? 'var(--accent-primary)' : 'transparent', color: signalFilter === value ? '#000' : 'var(--text-tertiary)', fontSize: '9px', padding: '2px 8px', cursor: 'pointer' }} onClick={() => setSignalFilter(value)}>
                      {value.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-raised)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: 'var(--accent-primary)' }}>REF</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: 'var(--accent-primary)' }}>CLASS</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: 'var(--accent-primary)' }}>IMP</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: 'var(--accent-primary)' }}>CNF</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: 'var(--accent-primary)' }}>SYS DATE</th>
                    <th style={{ padding: '8px', textAlign: 'right', color: 'var(--color-danger)' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSignals.map(signal => (
                    <tr key={signal.id} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.15s' }} onClick={() => setSelectedSignal(signal)} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{signal.title.toUpperCase()}</td>
                      <td style={{ padding: '8px' }}><span style={{ border: '1px solid var(--border-subtle)', padding: '2px 6px', color: 'var(--color-info)' }}>{signal.category.toUpperCase()}</span></td>
                      <td style={{ padding: '8px', color: signal.impact >= 70 ? 'var(--color-danger)' : 'var(--color-warning)' }}>{signal.impact}</td>
                      <td style={{ padding: '8px', color: signal.confidence >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>{signal.confidence}</td>
                      <td style={{ padding: '8px', color: 'var(--text-tertiary)' }}>{signal.created_at?.split('T')[0]}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button className="btn btn-ghost" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={e => { e.stopPropagation(); handleRemove(signal.id) }}>DEL</button>
                      </td>
                    </tr>
                  ))}
                  {filteredSignals.length === 0 && <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>NO SIGNALS RECORDED</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'apis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-default)', border: '1px solid var(--border-default)' }}>
              <div style={{ background: 'var(--surface-raised)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <span className="mono text-xs text-tertiary">CATALOG APIS</span>
                <span className="mono text-lg font-bold text-info">{apiStatsSummary.total}</span>
              </div>
              <div style={{ background: 'var(--surface-raised)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <span className="mono text-xs text-tertiary">LIVE CONNECTORS</span>
                <span className="mono text-lg font-bold text-success">{apiStatsSummary.live}</span>
              </div>
              <div style={{ background: 'var(--surface-raised)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <span className="mono text-xs text-tertiary">INSTALLABLE</span>
                <span className="mono text-lg font-bold text-warning">{apiStatsSummary.installable}</span>
              </div>
              <div style={{ background: 'var(--surface-raised)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <span className="mono text-xs text-tertiary">ACTIVE SECTIONS</span>
                <span className="mono text-lg font-bold text-primary">{apiStatsSummary.sections}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="mono text-xs">SEARCH ARCHIVE...</label>
                <input className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={apiSearch} onChange={e => setApiSearch(e.target.value)} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="mono text-xs">TARGET</label>
                <select className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={apiModuleTarget} onChange={e => setApiModuleTarget(e.target.value)}>
                  {moduleTargetOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="mono text-xs">SORT</label>
                <select className="input mono text-xs" style={{ border: '1px solid var(--border-subtle)', borderRadius: 0, padding: '10px' }} value={apiSort} onChange={e => setApiSort(e.target.value)}>
                  <option value="featured">SCORE</option><option value="connectivity">LINK</option><option value="section">SECTION</option><option value="name">NAME</option>
                </select>
              </div>
              <button className="btn btn-primary mono" style={{ padding: '10px 16px', borderRadius: 0, height: '42px' }} onClick={handleOpenNetwork}>VIEW NETWORK</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button className="mono text-xs font-bold" style={{ border: '1px solid var(--border-subtle)', background: apiSection === 'all' ? 'var(--accent-primary)' : '#000', color: apiSection === 'all' ? '#000' : 'var(--text-tertiary)', padding: '4px 12px', cursor: 'pointer' }} onClick={() => setApiSection('all')}>
                ALL [{searchScopedApiEntries.length}]
              </button>
              {sectionSummary.filter(s => s.count > 0).map(s => (
                <button key={s.key} className="mono text-xs font-bold" style={{ border: '1px solid var(--border-subtle)', background: apiSection === s.key ? s.color : '#000', color: apiSection === s.key ? '#000' : 'var(--text-tertiary)', padding: '4px 12px', cursor: 'pointer' }} onClick={() => setApiSection(s.key)}>
                  {s.shortLabel.toUpperCase()} [{s.count}]
                </button>
              ))}
            </div>

            {apiLoading ? (
              <div className="mono text-xs text-tertiary" style={{ textAlign: 'center', padding: '64px', border: '1px solid var(--border-subtle)' }}>ACQUIRING API DIRECTORY...</div>
            ) : (
              <div style={{ border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column' }}>
                <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--accent-primary)' }}>/// API CATALOG DIRECTORY</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <thead style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--accent-primary)' }}>AUTHORITY</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>MODULE</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>STATUS</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>SCORE</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-primary)' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedApiEntries.map(entry => (
                      <tr key={entry.slug} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{entry.name.toUpperCase()}</div>
                          <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>{entry.description.slice(0, 60)}...</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--accent-primary)' }}>{entry.section_label.toUpperCase()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {entry.health_status === 'live' ? <span className="text-success">LIVE LINK</span> : <span className="text-warning">{entry.activation_tier.toUpperCase()}</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-info)' }}>{entry.featured_score || 0}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {entry.installable ? (
                            <button className="btn btn-sm mono" style={{ border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', background: 'transparent' }} onClick={() => handleInstallApi(entry)} disabled={installingSlug === entry.slug}>
                              {installingSlug === entry.slug ? 'SYNCING...' : 'INSTALL CABLE'}
                            </button>
                          ) : entry.is_installed ? (
                            <span className="text-success font-bold text-xs mono">MOUNTED</span>
                          ) : (
                            <span className="text-tertiary text-xs mono">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pageCount > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
                <button className="btn mono btn-ghost" style={{ border: '1px solid var(--border-subtle)' }} onClick={() => setApiPage(p => Math.max(1, p - 1))} disabled={apiPage === 1}>PREV</button>
                <span className="mono text-xs text-tertiary">PAGE {apiPage} / {pageCount}</span>
                <button className="btn mono btn-ghost" style={{ border: '1px solid var(--border-subtle)' }} onClick={() => setApiPage(p => Math.min(pageCount, p + 1))} disabled={apiPage === pageCount}>NEXT</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Signal Edit Modal */}
      {selectedSignal && (
        <SignalEditModal
          signal={selectedSignal}
          onSave={handleSignalSave}
          onDelete={handleSignalDelete}
          onClose={() => setSelectedSignal(null)}
        />
      )}
    </div>
  )
}

export default Intelligence
