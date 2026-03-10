/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Simulation Engine
   Interactive MRR projections with editable variables
   ═══════════════════════════════════════════════════ */

const Simulation = {
    render() {
        const s = App.data.simulation;
        const el = document.getElementById('mod-simulation');
        el.innerHTML = `
      <div class="module-header">
        <h1>Simulation Engine</h1>
        <p>Proyecta tu MRR a 30/60/90 días ajustando las variables del modelo. Basado en restricciones reales de capacidad.</p>
      </div>

      <div class="grid-2 mb-6">
        <!-- Controls -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🎛️ Variables del Modelo</div>
            <button class="btn btn-sm btn-primary" onclick="Simulation.runSimulation()">▶ Simular</button>
          </div>
          
          <div class="slider-group mb-4">
            <div class="slider-header">
              <label>Contactos / semana</label>
              <span class="slider-value" id="sv-contacts">${s.contactsPerWeek}</span>
            </div>
            <input type="range" min="5" max="100" value="${s.contactsPerWeek}" oninput="Simulation.updateVar('contactsPerWeek', this.value, 'sv-contacts')">
          </div>

          <div class="slider-group mb-4">
            <div class="slider-header">
              <label>Response Rate (%)</label>
              <span class="slider-value" id="sv-response">${s.responseRate}%</span>
            </div>
            <input type="range" min="1" max="50" value="${s.responseRate}" oninput="Simulation.updateVar('responseRate', this.value, 'sv-response', '%')">
          </div>

          <div class="slider-group mb-4">
            <div class="slider-header">
              <label>Meeting Rate (%)</label>
              <span class="slider-value" id="sv-meeting">${s.meetingRate}%</span>
            </div>
            <input type="range" min="10" max="80" value="${s.meetingRate}" oninput="Simulation.updateVar('meetingRate', this.value, 'sv-meeting', '%')">
          </div>

          <div class="slider-group mb-4">
            <div class="slider-header">
              <label>Close Rate (%)</label>
              <span class="slider-value" id="sv-close">${s.closeRate}%</span>
            </div>
            <input type="range" min="5" max="60" value="${s.closeRate}" oninput="Simulation.updateVar('closeRate', this.value, 'sv-close', '%')">
          </div>

          <div class="slider-group mb-4">
            <div class="slider-header">
              <label>Ticket Medio (€)</label>
              <span class="slider-value" id="sv-ticket">${s.avgTicket}€</span>
            </div>
            <input type="range" min="500" max="10000" step="100" value="${s.avgTicket}" oninput="Simulation.updateVar('avgTicket', this.value, 'sv-ticket', '€')">
          </div>

          <div class="slider-group mb-4">
            <div class="slider-header">
              <label>Churn Mensual (%)</label>
              <span class="slider-value" id="sv-churn">${s.churn}%</span>
            </div>
            <input type="range" min="0" max="30" value="${s.churn}" oninput="Simulation.updateVar('churn', this.value, 'sv-churn', '%')">
          </div>

          <div class="slider-group mb-4">
            <div class="slider-header">
              <label>Capacidad max clientes</label>
              <span class="slider-value" id="sv-capacity">${s.capacity}</span>
            </div>
            <input type="range" min="1" max="30" value="${s.capacity}" oninput="Simulation.updateVar('capacity', this.value, 'sv-capacity')">
          </div>
        </div>

        <!-- Results -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📈 Proyección MRR</div>
          </div>
          <div id="sim-chart" style="width:100%;height:220px"></div>
          <div class="divider"></div>
          <div id="sim-results"></div>
        </div>
      </div>

      <!-- Scenario Comparison -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🔀 Comparación de Escenarios</div>
        </div>
        <div id="sim-scenarios" class="grid-3" style="gap:var(--space-4)"></div>
      </div>

      <!-- Cash Runway -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">💸 Cash Runway</div>
        </div>
        <div id="sim-runway"></div>
      </div>
    `;

        this.runSimulation();
    },

    updateVar(key, value, displayId, suffix = '') {
        App.data.simulation[key] = parseInt(value);
        document.getElementById(displayId).textContent = value + suffix;
    },

    simulate(params, months = 3) {
        const { contactsPerWeek, responseRate, meetingRate, closeRate, avgTicket, churn, capacity } = params;
        const weeksPerMonth = 4.33;
        const results = [];
        let activeClients = App.data.finance?.clients || 0;
        let mrr = App.data.finance?.mrr || 0;

        for (let month = 1; month <= months; month++) {
            const contactsMonth = contactsPerWeek * weeksPerMonth;
            const responses = contactsMonth * (responseRate / 100);
            const meetings = responses * (meetingRate / 100);
            const closes = Math.min(meetings * (closeRate / 100), capacity - activeClients);
            const newClients = Math.max(0, Math.round(closes));
            const churned = Math.round(activeClients * (churn / 100));
            activeClients = Math.max(0, activeClients + newClients - churned);
            activeClients = Math.min(activeClients, capacity);
            mrr = activeClients * avgTicket;

            results.push({
                month,
                contacts: Math.round(contactsMonth),
                responses: Math.round(responses),
                meetings: Math.round(meetings),
                newClients,
                churned,
                totalClients: activeClients,
                mrr
            });
        }
        return results;
    },

    runSimulation() {
        const s = App.data.simulation;
        App.saveData();

        // Base scenario
        const base = this.simulate(s);

        // Optimistic
        const opt = this.simulate({
            ...s,
            responseRate: Math.min(s.responseRate * 1.5, 50),
            closeRate: Math.min(s.closeRate * 1.3, 60),
            avgTicket: s.avgTicket * 1.2
        });

        // Pessimistic
        const pess = this.simulate({
            ...s,
            responseRate: s.responseRate * 0.6,
            closeRate: s.closeRate * 0.7,
            churn: Math.min(s.churn * 1.5, 30)
        });

        // Chart
        const labels = ['Hoy', 'M1', 'M2', 'M3'];
        const current = App.data.finance?.mrr || 0;
        Charts.multiLine('sim-chart', [
            { data: [current, ...opt.map(r => r.mrr)], color: Charts.colors.success, dash: '5,5' },
            { data: [current, ...base.map(r => r.mrr)], color: Charts.colors.primary },
            { data: [current, ...pess.map(r => r.mrr)], color: Charts.colors.danger, dash: '5,5' }
        ], { labels, yPrefix: '', ySuffix: '€', width: 500, height: 220 });

        // Results table
        document.getElementById('sim-results').innerHTML = `
      <div class="grid-3" style="gap:var(--space-4);text-align:center">
        ${base.map(r => `
          <div>
            <div class="text-muted" style="font-size:var(--text-xs)">MES ${r.month}</div>
            <div style="font-size:var(--text-xl);font-weight:800;color:var(--accent-primary);font-family:var(--font-mono)">${r.mrr.toLocaleString()}€</div>
            <div class="text-muted" style="font-size:var(--text-xs)">${r.totalClients} clientes · +${r.newClients} nuevos</div>
          </div>
        `).join('')}
      </div>
    `;

        // Scenarios
        const scenarios = [
            { name: 'Pesimista', data: pess, color: 'var(--danger)', icon: '📉' },
            { name: 'Base', data: base, color: 'var(--accent-primary)', icon: '📊' },
            { name: 'Optimista', data: opt, color: 'var(--success)', icon: '📈' }
        ];

        document.getElementById('sim-scenarios').innerHTML = scenarios.map(sc => {
            const m3 = sc.data[2];
            return `
        <div class="card" style="border-color:${sc.color}33">
          <div style="text-align:center">
            <div style="font-size:24px;margin-bottom:var(--space-2)">${sc.icon}</div>
            <div style="font-weight:700;margin-bottom:var(--space-3)">${sc.name}</div>
            <div style="font-size:var(--text-2xl);font-weight:800;font-family:var(--font-mono);color:${sc.color}">${m3.mrr.toLocaleString()}€</div>
            <div class="text-muted" style="font-size:var(--text-xs)">MRR mes 3</div>
            <div class="divider"></div>
            <div class="text-muted" style="font-size:var(--text-xs)">
              ${m3.totalClients} clientes · ${m3.contacts} contactos/mes
            </div>
          </div>
        </div>`;
        }).join('');

        // Cash Runway
        const budget = App.data.meta?.budget || 3000;
        const monthlyExpenses = 500;
        let cash = budget;
        const runwayData = [];
        for (let m = 0; m <= 6; m++) {
            const rev = m < base.length ? base[Math.min(m, base.length - 1)].mrr : (base[base.length - 1]?.mrr || 0);
            if (m > 0) cash = cash - monthlyExpenses + (m <= 3 ? base[m - 1]?.mrr || 0 : rev);
            runwayData.push({ month: m, cash: Math.round(cash), mrr: m > 0 && m <= 3 ? base[m - 1].mrr : rev });
        }

        document.getElementById('sim-runway').innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr><th>Mes</th><th>Cash</th><th>MRR</th><th>Gastos</th><th>Net</th><th>Estado</th></tr></thead>
          <tbody>
            ${runwayData.map(r => {
            const net = r.mrr - monthlyExpenses;
            return `<tr>
                <td>M${r.month}</td>
                <td class="text-mono" style="color:${r.cash > 0 ? 'var(--success)' : 'var(--danger)'}">${r.cash.toLocaleString()}€</td>
                <td class="text-mono">${r.mrr.toLocaleString()}€</td>
                <td class="text-mono">${monthlyExpenses}€</td>
                <td class="text-mono" style="color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">${net >= 0 ? '+' : ''}${net.toLocaleString()}€</td>
                <td><span class="badge ${r.cash > 1000 ? 'badge-success' : r.cash > 0 ? 'badge-warning' : 'badge-danger'}">${r.cash > 1000 ? 'OK' : r.cash > 0 ? 'Bajo' : '⚠️ SIN CASH'}</span></td>
              </tr>`;
        }).join('')}
          </tbody>
        </table>
      </div>
    `;
    }
};
