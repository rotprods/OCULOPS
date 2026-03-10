// ===================================================
// ANTIGRAVITY OS — Simulation Engine
// Migrated from legacy/js/simulation.js
// ===================================================

import { useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { useFinance } from '../../hooks/useFinance'
import { useDeals } from '../../hooks/useDeals'
import { Charts } from '../../lib/charts'

function simulate(params, startClients = 0, startMrr = 0, months = 3) {
  const { contactsPerWeek, responseRate, meetingRate, closeRate, avgTicket, churn, capacity } = params
  const weeksPerMonth = 4.33
  const results = []
  let activeClients = startClients
  let mrr = startMrr
  for (let month = 1; month <= months; month++) {
    const contactsMonth = contactsPerWeek * weeksPerMonth
    const responses = contactsMonth * (responseRate / 100)
    const meetings  = responses * (meetingRate / 100)
    const closes    = Math.min(meetings * (closeRate / 100), capacity - activeClients)
    const newClients = Math.max(0, Math.round(closes))
    const churned    = Math.round(activeClients * (churn / 100))
    activeClients = Math.min(Math.max(0, activeClients + newClients - churned), capacity)
    mrr = activeClients * avgTicket
    results.push({ month, contacts: Math.round(contactsMonth), responses: Math.round(responses), meetings: Math.round(meetings), newClients, churned, totalClients: activeClients, mrr })
  }
  return results
}

function SliderRow({ label, min, max, step = 1, value, suffix = '', onChange }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
        <label style={{ color: 'var(--text-secondary)' }}>{label}</label>
        <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
        onChange={e => onChange(parseInt(e.target.value))} />
    </div>
  )
}

function Simulation() {
  const { data, updateData } = useAppStore()
  const { mrr: realMrr } = useFinance()
  const { pipelineView } = useDeals()
  const sim    = data.simulation || {}
  const budget = data.meta?.budget || 3000

  const [vars, setVars] = useState({
    contactsPerWeek: sim.contactsPerWeek || 20,
    responseRate:    sim.responseRate    || 15,
    meetingRate:     sim.meetingRate     || 40,
    closeRate:       sim.closeRate       || 30,
    avgTicket:       sim.avgTicket       || 2500,
    churn:           sim.churn           || 5,
    capacity:        sim.capacity        || 8,
  })

  const setVar = (key, val) => {
    setVars(v => ({ ...v, [key]: val }))
    updateData(d => ({ ...d, simulation: { ...d.simulation, [key]: val } }))
  }

  // Real data from Supabase
  const startClients = (pipelineView['closed_won'] || []).length
  const startMrr     = realMrr || 0

  const base = simulate(vars, startClients, startMrr)
  const opt  = simulate({ ...vars, responseRate: Math.min(vars.responseRate * 1.5, 50), closeRate: Math.min(vars.closeRate * 1.3, 60), avgTicket: vars.avgTicket * 1.2 }, startClients, startMrr)
  const pess = simulate({ ...vars, responseRate: vars.responseRate * 0.6, closeRate: vars.closeRate * 0.7, churn: Math.min(vars.churn * 1.5, 30) }, startClients, startMrr)

  const chartHtml = Charts.multiLine(
    [
      { data: [startMrr, ...opt.map(r => r.mrr)],  color: Charts.colors.success, dash: '5,5' },
      { data: [startMrr, ...base.map(r => r.mrr)], color: Charts.colors.primary },
      { data: [startMrr, ...pess.map(r => r.mrr)], color: Charts.colors.danger,  dash: '5,5' },
    ],
    { labels: ['Hoy', 'M1', 'M2', 'M3'], ySuffix: '€', width: 500, height: 220 }
  )

  const monthlyExpenses = 500
  const runwayRows = []
  let cash = budget
  for (let m = 0; m <= 6; m++) {
    const rev = m > 0 && m <= 3 ? base[m - 1].mrr : (base[base.length - 1]?.mrr || 0)
    if (m > 0) cash = cash - monthlyExpenses + (m <= 3 ? base[m - 1]?.mrr || 0 : rev)
    runwayRows.push({ month: m, cash: Math.round(cash), mrr: m > 0 && m <= 3 ? base[m - 1].mrr : rev })
  }

  const scenarios = [
    { name: 'Pesimista', data: pess, color: 'var(--danger)',         icon: '📉' },
    { name: 'Base',      data: base, color: 'var(--accent-primary)', icon: '📊' },
    { name: 'Optimista', data: opt,  color: 'var(--success)',        icon: '📈' },
  ]

  return (
    <div className="fade-in">
      <div className="module-header">
        <h1>Simulation Engine</h1>
        <p>Proyecta tu MRR a 30/60/90 dias ajustando las variables del modelo.</p>
      </div>

      <div className="grid-2 mb-6">
        {/* Controls */}
        <div className="card">
          <div className="card-header"><div className="card-title">Variables del Modelo</div></div>
          <SliderRow label="Contactos / semana" min={5}   max={100}  value={vars.contactsPerWeek} onChange={v => setVar('contactsPerWeek', v)} />
          <SliderRow label="Response Rate"       min={1}   max={50}   value={vars.responseRate}    suffix="%" onChange={v => setVar('responseRate', v)} />
          <SliderRow label="Meeting Rate"         min={10}  max={80}   value={vars.meetingRate}     suffix="%" onChange={v => setVar('meetingRate', v)} />
          <SliderRow label="Close Rate"           min={5}   max={60}   value={vars.closeRate}       suffix="%" onChange={v => setVar('closeRate', v)} />
          <SliderRow label="Ticket Medio"         min={500} max={10000} step={100} value={vars.avgTicket} suffix="€" onChange={v => setVar('avgTicket', v)} />
          <SliderRow label="Churn Mensual"        min={0}   max={30}   value={vars.churn}           suffix="%" onChange={v => setVar('churn', v)} />
          <SliderRow label="Capacidad max clientes" min={1} max={30}  value={vars.capacity}                  onChange={v => setVar('capacity', v)} />
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header"><div className="card-title">Proyeccion MRR</div></div>
          <div dangerouslySetInnerHTML={{ __html: chartHtml }} style={{ width: '100%' }} />
          <div className="divider" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
            {base.map(r => (
              <div key={r.month}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>MES {r.month}</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{r.mrr.toLocaleString()}€</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{r.totalClients} clientes · +{r.newClients} nuevos</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scenario comparison */}
      <div className="card mb-6">
        <div className="card-header"><div className="card-title">Comparacion de Escenarios</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {scenarios.map(sc => {
            const m3 = sc.data[2]
            return (
              <div key={sc.name} className="card" style={{ borderColor: sc.color + '33', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{sc.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: '12px' }}>{sc.name}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'monospace', color: sc.color }}>{m3.mrr.toLocaleString()}€</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>MRR mes 3</div>
                <div className="divider" />
                <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{m3.totalClients} clientes · {m3.contacts} contactos/mes</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cash Runway */}
      <div className="card">
        <div className="card-header"><div className="card-title">Cash Runway</div></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Mes</th><th>Cash</th><th>MRR</th><th>Gastos</th><th>Net</th><th>Estado</th></tr></thead>
            <tbody>
              {runwayRows.map(r => {
                const net = r.mrr - monthlyExpenses
                return (
                  <tr key={r.month}>
                    <td>M{r.month}</td>
                    <td style={{ fontFamily: 'monospace', color: r.cash > 0 ? 'var(--success)' : 'var(--danger)' }}>{r.cash.toLocaleString()}€</td>
                    <td style={{ fontFamily: 'monospace' }}>{r.mrr.toLocaleString()}€</td>
                    <td style={{ fontFamily: 'monospace' }}>{monthlyExpenses}€</td>
                    <td style={{ fontFamily: 'monospace', color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>{net >= 0 ? '+' : ''}{net.toLocaleString()}€</td>
                    <td><span className={`badge ${r.cash > 1000 ? 'badge-success' : r.cash > 0 ? 'badge-warning' : 'badge-danger'}`}>{r.cash > 1000 ? 'OK' : r.cash > 0 ? 'Bajo' : 'SIN CASH'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Simulation
