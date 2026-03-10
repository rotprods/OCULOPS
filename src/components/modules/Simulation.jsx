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
    const meetings = responses * (meetingRate / 100)
    const closes = Math.min(meetings * (closeRate / 100), capacity - activeClients)
    const newClients = Math.max(0, Math.round(closes))
    const churned = Math.round(activeClients * (churn / 100))
    activeClients = Math.min(Math.max(0, activeClients + newClients - churned), capacity)
    mrr = activeClients * avgTicket
    results.push({ month, contacts: Math.round(contactsMonth), responses: Math.round(responses), meetings: Math.round(meetings), newClients, churned, totalClients: activeClients, mrr })
  }
  return results
}

function SliderRow({ label, min, max, step = 1, value, suffix = '', onChange }) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <label style={{ color: 'var(--text-secondary)' }}>{label}</label>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', textShadow: '0 0 10px rgba(var(--accent-primary-rgb), 0.5)' }}>
          {value.toLocaleString()}{suffix}
        </span>
      </div>
      <div style={{ position: 'relative', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'visible' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentage}%`, background: 'var(--accent-primary)', borderRadius: '3px', boxShadow: '0 0 10px rgba(var(--accent-primary-rgb), 0.5)' }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          style={{
            position: 'absolute', top: '-6px', left: 0, width: '100%', height: '18px', opacity: 0, cursor: 'ew-resize'
          }}
          onChange={e => onChange(parseInt(e.target.value))}
        />
        <div style={{
          position: 'absolute', top: '50%', left: `${percentage}%`, transform: 'translate(-50%, -50%)',
          width: '14px', height: '14px', borderRadius: '50%', background: 'var(--bg-card)',
          border: '2px solid var(--accent-primary)', boxShadow: '0 0 8px rgba(var(--accent-primary-rgb), 0.8)',
          pointerEvents: 'none', transition: 'box-shadow 0.2s'
        }} />
      </div>
    </div>
  )
}

function Simulation() {
  const { data, updateData } = useAppStore()
  const { mrr: realMrr } = useFinance()
  const { pipelineView } = useDeals()
  const sim = data.simulation || {}
  const budget = data.meta?.budget || 3000

  const [vars, setVars] = useState({
    contactsPerWeek: sim.contactsPerWeek || 20,
    responseRate: sim.responseRate || 15,
    meetingRate: sim.meetingRate || 40,
    closeRate: sim.closeRate || 30,
    avgTicket: sim.avgTicket || 2500,
    churn: sim.churn || 5,
    capacity: sim.capacity || 8,
  })

  const setVar = (key, val) => {
    setVars(v => ({ ...v, [key]: val }))
    updateData(d => ({ ...d, simulation: { ...d.simulation, [key]: val } }))
  }

  // Real data from Supabase
  const startClients = (pipelineView['closed_won'] || []).length
  const startMrr = realMrr || 0

  const base = simulate(vars, startClients, startMrr)
  const opt = simulate({ ...vars, responseRate: Math.min(vars.responseRate * 1.5, 50), closeRate: Math.min(vars.closeRate * 1.3, 60), avgTicket: vars.avgTicket * 1.2 }, startClients, startMrr)
  const pess = simulate({ ...vars, responseRate: vars.responseRate * 0.6, closeRate: vars.closeRate * 0.7, churn: Math.min(vars.churn * 1.5, 30) }, startClients, startMrr)

  const chartHtml = Charts.multiLine(
    [
      { data: [startMrr, ...opt.map(r => r.mrr)], color: Charts.colors.success, dash: '5,5' },
      { data: [startMrr, ...base.map(r => r.mrr)], color: Charts.colors.primary },
      { data: [startMrr, ...pess.map(r => r.mrr)], color: Charts.colors.danger, dash: '5,5' },
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
    { name: 'Pesimista', data: pess, color: 'var(--danger)', icon: '📉' },
    { name: 'Base', data: base, color: 'var(--accent-primary)', icon: '📊' },
    { name: 'Optimista', data: opt, color: 'var(--success)', icon: '📈' },
  ]

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-default)' }}>
        <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>Simulation Engine</h1>
        <p className="mono text-xs text-tertiary" style={{ marginTop: '8px', letterSpacing: '0.05em' }}>/// MONTE CARLO PROJECTIONS // 30-60-90 DAY TRAJECTORY</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Controls */}
        <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-default)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="mono text-xs font-bold text-primary" style={{ marginBottom: '24px', letterSpacing: '0.1em' }}>/// MODEL VARIABLES</div>
          <SliderRow label="Contactos / semana" min={5} max={100} value={vars.contactsPerWeek} onChange={v => setVar('contactsPerWeek', v)} />
          <SliderRow label="Response Rate" min={1} max={50} value={vars.responseRate} suffix="%" onChange={v => setVar('responseRate', v)} />
          <SliderRow label="Meeting Rate" min={10} max={80} value={vars.meetingRate} suffix="%" onChange={v => setVar('meetingRate', v)} />
          <SliderRow label="Close Rate" min={5} max={60} value={vars.closeRate} suffix="%" onChange={v => setVar('closeRate', v)} />
          <SliderRow label="Ticket Medio" min={500} max={10000} step={100} value={vars.avgTicket} suffix="€" onChange={v => setVar('avgTicket', v)} />
          <SliderRow label="Churn Mensual" min={0} max={30} value={vars.churn} suffix="%" onChange={v => setVar('churn', v)} />
          <SliderRow label="Capacidad max clientes" min={1} max={30} value={vars.capacity} onChange={v => setVar('capacity', v)} />
        </div>

        {/* Results */}
        <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-default)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="mono text-xs font-bold text-primary" style={{ marginBottom: '16px', letterSpacing: '0.1em' }}>/// MRR PROJECTION</div>
          <div dangerouslySetInnerHTML={{ __html: chartHtml }} style={{ width: '100%', flex: 1, filter: 'drop-shadow(0 0 10px var(--accent-primary-20))' }} />
          <div style={{ height: '1px', background: 'var(--border-default)', margin: '24px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
            {base.map(r => (
              <div key={r.month} style={{ padding: '16px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }}>MONTH {r.month}</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', textShadow: '0 0 10px rgba(var(--accent-primary-rgb),0.3)' }}>{r.mrr.toLocaleString()}€</div>
                <div className="mono" style={{ color: 'var(--text-tertiary)', fontSize: '10px', marginTop: '8px', opacity: 0.8 }}>{r.totalClients} ACT // +{r.newClients} NEW</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scenario comparison */}
      <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-default)', padding: '24px' }}>
        <div className="mono text-xs font-bold text-primary" style={{ marginBottom: '20px', letterSpacing: '0.1em' }}>/// FORECAST SCENARIOS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {scenarios.map(sc => {
            const m3 = sc.data[2]
            return (
              <div key={sc.name} style={{ border: `1px solid ${sc.color}40`, background: `${sc.color}05`, padding: '24px', textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px', filter: `drop-shadow(0 0 10px ${sc.color}80)` }}>{sc.icon}</div>
                <div className="mono text-xs" style={{ fontWeight: 700, marginBottom: '16px', color: sc.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sc.name}</div>
                <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: sc.color, textShadow: `0 0 15px ${sc.color}60` }}>{m3.mrr.toLocaleString()}€</div>
                <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '8px', opacity: 0.7 }}>M3 OUTLOOK</div>
                <div style={{ height: '1px', background: `${sc.color}20`, margin: '16px 0' }} />
                <div className="mono" style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>{m3.totalClients} CTS // {m3.contacts} OUTREACH/MO</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cash Runway */}
      <div style={{ background: 'var(--color-bg-2)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="mono text-xs font-bold text-primary" style={{ letterSpacing: '0.1em' }}>/// RUNWAY & BURN ANALYSIS</div>
          <div className="mono text-xs" style={{ color: 'var(--text-tertiary)' }}>OVERHEAD: {monthlyExpenses}€/MO</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr className="mono" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '12px 24px', color: 'var(--color-primary)' }}>PERIOD</th>
                <th style={{ padding: '12px 24px', color: 'var(--color-primary)' }}>CAPITAL</th>
                <th style={{ padding: '12px 24px', color: 'var(--color-primary)' }}>MRR</th>
                <th style={{ padding: '12px 24px', color: 'var(--color-primary)' }}>BURN</th>
                <th style={{ padding: '12px 24px', color: 'var(--color-primary)' }}>NET</th>
                <th style={{ padding: '12px 24px', color: 'var(--color-primary)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody className="mono">
              {runwayRows.map(r => {
                const net = r.mrr - monthlyExpenses
                return (
                  <tr key={r.month} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 24px', color: 'var(--text-tertiary)' }}>M{r.month}</td>
                    <td style={{ padding: '12px 24px', color: r.cash > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{r.cash.toLocaleString()}€</td>
                    <td style={{ padding: '12px 24px' }}>{r.mrr.toLocaleString()}€</td>
                    <td style={{ padding: '12px 24px', color: 'var(--danger)' }}>-{monthlyExpenses}€</td>
                    <td style={{ padding: '12px 24px', color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>{net >= 0 ? '+' : ''}{net.toLocaleString()}€</td>
                    <td style={{ padding: '12px 24px' }}>
                      <span className={`badge ${r.cash > 1000 ? 'badge-success' : r.cash > 0 ? 'badge-warning' : 'badge-danger'}`} style={{ borderRadius: 0, padding: '4px 8px', letterSpacing: '0.1em' }}>
                        {r.cash > 1000 ? 'NOMINAL' : r.cash > 0 ? 'CRITICAL' : 'DEFAULT_DEAD'}
                      </span>
                    </td>
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
