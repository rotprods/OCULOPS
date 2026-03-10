/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Finance
   P&L, margins, capacity, forecast
   ═══════════════════════════════════════════════════ */

const Finance = {
    render() {
        const f = App.data.finance || {};
        const sim = App.data.simulation || {};
        const mrr = f.mrr || 0;
        const clients = f.clients || 0;
        const avgTicket = clients > 0 ? Math.round(mrr / clients) : sim.avgTicket || 2500;
        const revenue = mrr;
        const expenses = 500;
        const margin = revenue > 0 ? ((revenue - expenses) / revenue * 100).toFixed(1) : 0;
        const budget = App.data.meta?.budget || 3000;
        const ltv = avgTicket * (1 / (Math.max(sim.churn, 1) / 100));
        const cac = clients > 0 ? Math.round(budget / clients) : 0;
        const payback = cac > 0 && avgTicket > 0 ? (cac / avgTicket).toFixed(1) : '-';
        const capacity = sim.capacity || 8;
        const utilization = capacity > 0 ? ((clients / capacity) * 100).toFixed(0) : 0;
        const concentrationRisk = clients > 0 ? (1 / clients * 100).toFixed(0) : 100;

        const el = document.getElementById('mod-finance');
        el.innerHTML = `
      <div class="module-header">
        <h1>Finance</h1>
        <p>P&L, métricas unitarias, capacidad y riesgo de concentración.</p>
      </div>

      <!-- KPIs -->
      <div class="grid-4 mb-6">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--success-bg);color:var(--success)">💰</div>
          <div class="kpi-value" style="color:var(--success)">${mrr.toLocaleString()}€</div>
          <div class="kpi-label">MRR</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--info-bg);color:var(--info)">📊</div>
          <div class="kpi-value">${margin}%</div>
          <div class="kpi-label">Margen</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(var(--accent-primary-rgb),0.1);color:var(--accent-primary)">🎟️</div>
          <div class="kpi-value">${avgTicket.toLocaleString()}€</div>
          <div class="kpi-label">Ticket Medio</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:${parseInt(concentrationRisk) > 40 ? 'var(--danger-bg)' : 'var(--success-bg)'};color:${parseInt(concentrationRisk) > 40 ? 'var(--danger)' : 'var(--success)'}">⚠️</div>
          <div class="kpi-value">${concentrationRisk}%</div>
          <div class="kpi-label">Riesgo Concentración</div>
        </div>
      </div>

      <!-- P&L + Unit Economics -->
      <div class="grid-2 mb-6">
        <div class="card">
          <div class="card-header"><div class="card-title">📋 P&L Mensual</div></div>
          <div class="flex justify-between mb-3" style="font-size:var(--text-sm)">
            <span>Revenue (MRR)</span>
            <span class="text-mono" style="color:var(--success)">+${revenue.toLocaleString()}€</span>
          </div>
          <div class="flex justify-between mb-3" style="font-size:var(--text-sm)">
            <span>Gastos operativos</span>
            <span class="text-mono" style="color:var(--danger)">-${expenses}€</span>
          </div>
          <div class="divider"></div>
          <div class="flex justify-between" style="font-size:var(--text-sm);font-weight:700">
            <span>Net Profit</span>
            <span class="text-mono" style="color:${revenue - expenses >= 0 ? 'var(--success)' : 'var(--danger)'}">${(revenue - expenses).toLocaleString()}€</span>
          </div>
          <div class="divider"></div>
          <div class="flex justify-between mb-2" style="font-size:var(--text-xs);color:var(--text-tertiary)">
            <span>Presupuesto inicial</span>
            <span class="text-mono">${budget.toLocaleString()}€</span>
          </div>
          <div class="flex justify-between" style="font-size:var(--text-xs);color:var(--text-tertiary)">
            <span>Cash runway (meses)</span>
            <span class="text-mono">${expenses > 0 ? (budget / expenses).toFixed(1) : '∞'}</span>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">📐 Unit Economics</div></div>
          ${[
                { label: 'CAC (Coste Adquisición)', value: `${cac.toLocaleString()}€`, good: cac < avgTicket },
                { label: 'LTV (Lifetime Value)', value: `${Math.round(ltv).toLocaleString()}€`, good: ltv > cac * 3 },
                { label: 'LTV:CAC Ratio', value: cac > 0 ? `${(ltv / cac).toFixed(1)}x` : '-', good: cac > 0 && ltv / cac > 3 },
                { label: 'Payback (meses)', value: payback, good: parseFloat(payback) < 3 },
                { label: 'Churn mensual', value: `${sim.churn}%`, good: sim.churn < 10 },
                { label: 'ARPU', value: `${avgTicket.toLocaleString()}€`, good: true }
            ].map(m => `
            <div class="flex justify-between items-center mb-3" style="font-size:var(--text-sm)">
              <span>${m.label}</span>
              <span class="badge ${m.good ? 'badge-success' : 'badge-warning'}">${m.value}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Capacity + Edit Finance -->
      <div class="grid-2 mb-6">
        <div class="card">
          <div class="card-header"><div class="card-title">⚡ Capacidad</div></div>
          <div style="text-align:center;padding:var(--space-4)">
            ${Charts.scoreRing(parseInt(utilization), 100, 100, parseInt(utilization) > 80 ? Charts.colors.danger : Charts.colors.primary)}
            <div class="text-muted mt-4">${clients} / ${capacity} clientes (${utilization}% utilización)</div>
          </div>
          <div class="alert ${parseInt(utilization) > 80 ? 'alert-danger' : 'alert-success'} mt-4">
            ${parseInt(utilization) > 80 ? '⚠️ Cerca del límite. Contrata o rechaza nuevos deals.' : '✅ Capacidad disponible para nuevos clientes.'}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">✏️ Editar Finanzas</div></div>
          <div class="input-group mb-3">
            <label>Clientes activos</label>
            <input class="input" type="number" id="fin-clients" value="${clients}" min="0">
          </div>
          <div class="input-group mb-3">
            <label>MRR actual (€)</label>
            <input class="input" type="number" id="fin-mrr" value="${mrr}" min="0">
          </div>
          <div class="input-group mb-3">
            <label>Presupuesto restante (€)</label>
            <input class="input" type="number" id="fin-budget" value="${budget}" min="0">
          </div>
          <button class="btn btn-primary" onclick="Finance.save()">💾 Guardar</button>
        </div>
      </div>

      <!-- Team Hiring Roadmap -->
      <div class="card">
        <div class="card-header"><div class="card-title">👥 Roadmap de Contratación</div></div>
        ${[
                { role: 'Delivery Operator', trigger: '>8 clientes ó >15k MRR', status: clients > 8 || mrr > 15000 ? 'now' : 'later' },
                { role: 'Ops Assistant', trigger: '>15k MRR', status: mrr > 15000 ? 'now' : 'later' },
                { role: 'SDR (Outbound)', trigger: '>30k MRR', status: mrr > 30000 ? 'now' : 'later' },
                { role: 'Project Manager', trigger: '>50k MRR', status: mrr > 50000 ? 'now' : 'later' },
                { role: 'Closer', trigger: '>70k MRR', status: mrr > 70000 ? 'now' : 'later' }
            ].map((h, i) => `
          <div class="flex items-center gap-3 mb-3" style="font-size:var(--text-sm)">
            <span class="badge badge-neutral">#${i + 1}</span>
            <span style="flex:1;font-weight:600;color:var(--text-primary)">${h.role}</span>
            <span class="text-muted" style="font-size:var(--text-xs)">${h.trigger}</span>
            <span class="badge ${h.status === 'now' ? 'badge-success' : 'badge-neutral'}">${h.status === 'now' ? '🟢 AHORA' : '⏳ Pendiente'}</span>
          </div>
        `).join('')}
      </div>
    `;
    },

    save() {
        App.data.finance.clients = parseInt(document.getElementById('fin-clients').value) || 0;
        App.data.finance.mrr = parseInt(document.getElementById('fin-mrr').value) || 0;
        App.data.meta.budget = parseInt(document.getElementById('fin-budget').value) || 0;
        App.saveData();
        this.render();
        App.toast('Finanzas actualizadas', 'success');
    }
};
