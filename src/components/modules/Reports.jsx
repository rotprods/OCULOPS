// ===================================================
// ANTIGRAVITY OS — Reports Module
// Snapshots semanales/mensuales de KPIs de negocio
// ===================================================

import { useState } from 'react'
import { useDeals } from '../../hooks/useDeals'
import { useLeads } from '../../hooks/useLeads'
import { useTasks } from '../../hooks/useTasks'
import { useFinance } from '../../hooks/useFinance'

function Reports() {
  const { deals, totalValue, weightedValue, loading: dealsLoading } = useDeals()
  const { leads, loading: leadsLoading } = useLeads()
  const { tasks, completionRate, loading: tasksLoading } = useTasks()
  const { mrr, totalRevenue, totalExpenses, netIncome, loading: financeLoading } = useFinance()
  const [copied, setCopied] = useState(false)
  const [period, setPeriod] = useState('week')

  const loading = dealsLoading || leadsLoading || tasksLoading || financeLoading

  const closedDeals = deals.filter(d => d.stage === 'closed_won')
  const activeDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
  const doneTasks = tasks.filter(t => t.status === 'done')
  const newLeads = leads.length

  const periodLabel = period === 'week' ? 'Semana actual' : 'Mes actual'

  const reportText = `
ANTIGRAVITY OS — Reporte de Negocio
${periodLabel} — ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${'='.repeat(50)}

COMERCIAL
  Leads activos:        ${newLeads}
  Deals en pipeline:    ${activeDeals.length}
  Deals cerrados (won): ${closedDeals.length}
  Valor pipeline:       €${totalValue.toLocaleString()}
  Valor ponderado:      €${Math.round(weightedValue).toLocaleString()}

OPERACIONES
  Tareas totales:       ${tasks.length}
  Tareas completadas:   ${doneTasks.length}
  Tasa de completitud:  ${completionRate}%

FINANZAS
  MRR:                  €${mrr.toLocaleString()}
  Revenue total:        €${totalRevenue.toLocaleString()}
  Gastos totales:       €${totalExpenses.toLocaleString()}
  Beneficio neto:       €${netIncome.toLocaleString()}

Generado por ANTIGRAVITY OS v10.3
  `.trim()

  const copyReport = () => {
    navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-2)' }}>
      Cargando datos...
    </div>
  )

  return (
    <div className="fade-in">
      <div className="module-header">
        <h1>Reportes</h1>
        <p>Snapshot de KPIs de negocio. Exportable para reuniones y revisiones.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button className={`btn btn-sm ${period === 'week' ? 'btn-primary' : ''}`} onClick={() => setPeriod('week')}>Semanal</button>
        <button className={`btn btn-sm ${period === 'month' ? 'btn-primary' : ''}`} onClick={() => setPeriod('month')}>Mensual</button>
        <button className="btn btn-sm" onClick={copyReport} style={{ marginLeft: 'auto' }}>
          {copied ? 'Copiado' : 'Copiar reporte'}
        </button>
      </div>

      <div className="grid-4 mb-6">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-info)22', color: 'var(--color-info)' }}>👥</div>
          <div className="kpi-value">{newLeads}</div>
          <div className="kpi-label">Leads activos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-primary)22', color: 'var(--color-primary)' }}>💎</div>
          <div className="kpi-value">{activeDeals.length}</div>
          <div className="kpi-label">Deals en pipeline</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-success)22', color: 'var(--color-success)' }}>✓</div>
          <div className="kpi-value">{completionRate}%</div>
          <div className="kpi-label">Tareas completadas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--color-success)22', color: 'var(--color-success)' }}>💰</div>
          <div className="kpi-value">€{mrr.toLocaleString()}</div>
          <div className="kpi-label">MRR</div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card">
          <div className="card-header"><div className="card-title">Pipeline Comercial</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Leads en pipeline', value: newLeads },
              { label: 'Deals activos', value: activeDeals.length },
              { label: 'Deals cerrados (won)', value: closedDeals.length },
              { label: 'Valor total pipeline', value: `€${totalValue.toLocaleString()}` },
              { label: 'Valor ponderado', value: `€${Math.round(weightedValue).toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-2)', fontSize: '13px' }}>{label}</span>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Finanzas</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'MRR', value: `€${mrr.toLocaleString()}`, color: 'var(--color-primary)' },
              { label: 'Revenue total', value: `€${totalRevenue.toLocaleString()}`, color: 'var(--color-success)' },
              { label: 'Gastos', value: `€${totalExpenses.toLocaleString()}`, color: 'var(--color-danger)' },
              { label: 'Beneficio neto', value: `€${netIncome.toLocaleString()}`, color: netIncome >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-2)', fontSize: '13px' }}>{label}</span>
                <span style={{ fontWeight: 700, fontSize: '14px', color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Reporte exportable</div>
          <button className="btn btn-sm btn-primary" onClick={copyReport}>{copied ? 'Copiado' : 'Copiar'}</button>
        </div>
        <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--color-text-2)', background: 'var(--color-bg)', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
          {reportText}
        </pre>
      </div>
    </div>
  )
}

export default Reports
