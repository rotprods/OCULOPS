// ===================================================
// ANTIGRAVITY OS — Analytics Module
// Funnel de conversion y tasas por fuente
// ===================================================

import { useLeads } from '../../hooks/useLeads'
import { useDeals } from '../../hooks/useDeals'

const STAGES = [
  { id: 'lead',        label: 'Lead captado',    color: 'var(--color-info)' },
  { id: 'contacted',   label: 'Contactado',       color: 'var(--color-primary)' },
  { id: 'meeting',     label: 'Reunion agendada', color: '#FF9500' },
  { id: 'proposal',    label: 'Propuesta enviada', color: '#AF52DE' },
  { id: 'closed_won',  label: 'Cerrado (won)',    color: 'var(--color-success)' },
]

function FunnelBar({ label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
      <div style={{ width: '150px', fontSize: '12px', color: 'var(--color-text-2)', textAlign: 'right', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: 'var(--color-bg-3)', borderRadius: '4px', overflow: 'hidden', height: '24px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', minWidth: count > 0 ? '4px' : '0', display: 'flex', alignItems: 'center', paddingLeft: '8px', transition: 'width 0.4s ease' }}>
          {pct > 10 && <span style={{ fontSize: '11px', fontWeight: 700, color: '#000' }}>{count}</span>}
        </div>
      </div>
      <div style={{ width: '36px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>{count}</div>
      <div style={{ width: '40px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-2)' }}>{pct}%</div>
    </div>
  )
}

function Analytics() {
  const { leads, loading: leadsLoading } = useLeads()
  const { deals, pipelineView, totalValue, weightedValue, loading: dealsLoading } = useDeals()

  const loading = leadsLoading || dealsLoading

  // Funnel: lead count by stage
  const funnelCounts = {
    lead:       leads.length + (pipelineView['lead'] || []).length,
    contacted:  (pipelineView['contacted'] || []).length,
    meeting:    (pipelineView['meeting'] || []).length,
    proposal:   (pipelineView['proposal'] || []).length,
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
    const src = l.source || 'Sin fuente'
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
    <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-2)' }}>
      Cargando analytics...
    </div>
  )

  return (
    <div className="fade-in">
      <div className="module-header">
        <h1>Analytics</h1>
        <p>Funnel de conversion, tasas por fuente y metricas de pipeline.</p>
      </div>

      <div className="grid-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-info)22', color: 'var(--color-info)' }}>👥</div>
          <div className="kpi-value">{leads.length}</div>
          <div className="kpi-label">Total leads</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-success)22', color: 'var(--color-success)' }}>%</div>
          <div className="kpi-value">{winRate}%</div>
          <div className="kpi-label">Win rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-primary)22', color: 'var(--color-primary)' }}>€</div>
          <div className="kpi-value">€{avgDealValue.toLocaleString()}</div>
          <div className="kpi-label">Ticket medio</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-success)22', color: 'var(--color-success)' }}>⟳</div>
          <div className="kpi-value">€{Math.round(weightedValue).toLocaleString()}</div>
          <div className="kpi-label">Pipeline ponderado</div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card">
          <div className="card-header"><div className="card-title">Funnel de conversion</div></div>
          <div style={{ marginTop: '8px' }}>
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

        <div className="card">
          <div className="card-header"><div className="card-title">Conversion por etapa</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {convRates.slice(1).map((stage) => (
              <div key={stage.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--color-bg)', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{STAGES[convRates.indexOf(stage) - 1]?.label ?? ''} → {stage.label}</span>
                <span style={{ fontWeight: 700, fontSize: '13px', color: stage.conv >= 50 ? 'var(--color-success)' : stage.conv >= 25 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                  {stage.conv}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Leads por fuente</div></div>
        {sourceEntries.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📡</div><h3>Sin datos de fuente</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {sourceEntries.map(([source, count]) => {
              const pct = Math.round((count / totalLeads) * 100)
              return (
                <div key={source} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '120px', fontSize: '12px', color: 'var(--color-text-2)', flexShrink: 0 }}>{source}</div>
                  <div style={{ flex: 1, background: 'var(--color-bg-3)', borderRadius: '4px', height: '20px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px', minWidth: '4px' }} />
                  </div>
                  <div style={{ width: '30px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>{count}</div>
                  <div style={{ width: '36px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-2)' }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics
