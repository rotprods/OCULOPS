// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Analytics Module
// 100-Year UX: strictly OLED Black, Gold, 1px Primitives
// ═══════════════════════════════════════════════════

import { useLeads } from '../../hooks/useLeads'
import { useDeals } from '../../hooks/useDeals'

const STAGES = [
  { id: 'lead', label: 'ACQUIRED LEAD', color: 'var(--color-info)' },
  { id: 'contacted', label: 'OUTREACH ACTIVE', color: 'var(--color-primary)' },
  { id: 'meeting', label: 'MEETING BOOKED', color: '#FF9500' },
  { id: 'proposal', label: 'PROPOSAL SENT', color: '#AF52DE' },
  { id: 'closed_won', label: 'CLOSED WON', color: 'var(--color-success)' },
]

function FunnelBar({ label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
      <div className="mono text-xs font-bold" style={{ width: '160px', color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, border: '1px solid var(--border-subtle)', background: '#000', height: '16px', position: 'relative' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
      </div>
      <div className="mono font-bold" style={{ width: '40px', textAlign: 'right', fontSize: '13px', color: 'var(--color-text)' }}>{count}</div>
      <div className="mono text-xs" style={{ width: '40px', textAlign: 'right', color: 'var(--text-tertiary)' }}>{pct}%</div>
    </div>
  )
}

function Analytics() {
  const { leads, loading: leadsLoading } = useLeads()
  const { deals, pipelineView, totalValue, weightedValue, loading: dealsLoading } = useDeals()

  const loading = leadsLoading || dealsLoading

  // Funnel: lead count by stage
  const funnelCounts = {
    lead: leads.length + (pipelineView['lead'] || []).length,
    contacted: (pipelineView['contacted'] || []).length,
    meeting: (pipelineView['meeting'] || []).length,
    proposal: (pipelineView['proposal'] || []).length,
    closed_won: (pipelineView['closed_won'] || []).length,
  }
  const maxCount = funnelCounts.lead || 1

  // Conversion rates step by step
  const convRates = STAGES.map((stage, i) => {
    if (i === 0) return { ...stage, count: funnelCounts[stage.id], conv: 100 }
    const prev = funnelCounts[STAGES[i - 1].id]
    const curr = funnelCounts[stage.id]
    return { ...stage, count: curr, conv: prev > 0 ? Math.round((curr / prev) * 100) : 0 }
  })

  // Source breakdown from leads
  const sourceMap = leads.reduce((acc, l) => {
    const src = l.source || 'UNKNOWN SOURCE'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})
  const sourceEntries = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])
  const totalLeads = leads.length || 1

  // Win rate
  const totalDeals = deals.length
  const wonDeals = (pipelineView['closed_won'] || []).length
  const lostDeals = (pipelineView['closed_lost'] || []).length
  const winRate = (wonDeals + lostDeals) > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0
  const avgDealValue = wonDeals > 0 ? Math.round(totalValue / totalDeals) : 0

  if (loading) return (
    <div className="fade-in mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>
      CALCULATING TELEMETRY...
    </div>
  )

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0 }}>ORBITAL ANALYTICS</h1>
          <span className="mono text-xs text-tertiary">CONVERSION FUNNEL, TRAFFIC SOURCES & PIPELINE METRICS</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>

        {/* ── KPI STRIP ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-default)', border: '1px solid var(--border-default)' }}>
          <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="mono text-xs text-tertiary">TOTAL LEADS</span>
              <span style={{ fontSize: '14px', color: 'var(--color-info)' }}>👥</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-text)' }}>{leads.length}</span>
          </div>
          <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="mono text-xs text-tertiary">WIN RATE</span>
              <span style={{ fontSize: '14px', color: 'var(--color-success)' }}>%</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-success)' }}>{winRate}%</span>
          </div>
          <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="mono text-xs text-tertiary">AVG TICKET</span>
              <span style={{ fontSize: '14px', color: 'var(--color-primary)' }}>€</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-primary)' }}>€{avgDealValue.toLocaleString()}</span>
          </div>
          <div style={{ background: 'var(--color-bg-2)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="mono text-xs text-tertiary">WEIGHTED VALUE</span>
              <span style={{ fontSize: '14px', color: 'var(--color-warning)' }}>⟳</span>
            </div>
            <span className="mono text-lg font-bold" style={{ color: 'var(--color-warning)' }}>€{Math.round(weightedValue).toLocaleString()}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
          <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
            <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// FUNNEL TELEMETRY</div>
            <div style={{ padding: '24px' }}>
              {convRates.map((stage) => (
                <FunnelBar
                  key={stage.id}
                  label={stage.label}
                  count={stage.count}
                  max={maxCount}
                  color={stage.color}
                />
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
            <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// CONVERSION COEFFICIENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
              {convRates.slice(1).map((stage) => (
                <div key={stage.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {STAGES[convRates.indexOf(stage) - 1]?.label ?? ''}
                    <span style={{ color: 'var(--text-tertiary)', margin: '0 8px' }}>→</span>
                    {stage.label}
                  </span>
                  <span className="mono font-bold text-sm" style={{ color: stage.conv >= 50 ? 'var(--color-success)' : stage.conv >= 25 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                    {stage.conv}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
          <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)' }}>/// LEAD TRAFFIC ORIGIN</div>
          {sourceEntries.length === 0 ? (
            <div className="mono text-xs text-tertiary" style={{ padding: '32px', textAlign: 'center' }}>NO ORIGIN DATA AVAILABLE</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '24px' }}>
              {sourceEntries.map(([source, count]) => {
                const pct = Math.round((count / totalLeads) * 100)
                return (
                  <div key={source} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="mono text-xs font-bold" style={{ width: '160px', color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>{source.toUpperCase()}</div>
                    <div style={{ flex: 1, border: '1px solid var(--border-subtle)', background: '#000', height: '12px', position: 'relative' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)' }} />
                    </div>
                    <div className="mono font-bold" style={{ width: '40px', textAlign: 'right', fontSize: '13px', color: 'var(--color-text)' }}>{count}</div>
                    <div className="mono text-xs" style={{ width: '40px', textAlign: 'right', color: 'var(--text-tertiary)' }}>{pct}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
