/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Control Tower (NEXT LEVEL)
   Central dashboard with AI insights, sparklines,
   radar charts, and animated gradient borders
   ═══════════════════════════════════════════════════ */

const ControlTower = {
  render() {
    const d = App.data;
    const mrr = d.finance?.mrr || 0;
    const clients = d.finance?.clients || 0;
    const avgTicket = clients > 0 ? Math.round(mrr / clients) : 0;
    const target = d.meta?.targetMRR || 20000;
    const pctTarget = Math.min((mrr / target) * 100, 100).toFixed(1);
    const pipelineTotal = Object.values(d.pipeline || {}).reduce((s, arr) => s + arr.length, 0);
    const activeAlerts = (d.alerts || []).filter(a => a.status === 'active').length;
    const dayNum = d.execution?.currentDay || 1;
    const runway = d.meta?.budget || 3000;
    const tasksComplete = (d.execution?.tasks || []).filter(t => t.status === 'done').length;
    const totalTasks = (d.execution?.tasks || []).length;
    const taskPct = totalTasks > 0 ? ((tasksComplete / totalTasks) * 100).toFixed(0) : 0;

    // Pipeline counts
    const pc = {};
    Object.keys(d.pipeline || {}).forEach(k => pc[k] = (d.pipeline[k] || []).length);

    // Conversion funnel
    const funnel = [
      { label: 'Leads', value: pc.lead || 0 },
      { label: 'Contactados', value: pc.contacted || 0 },
      { label: 'Respuesta', value: pc.response || 0 },
      { label: 'Meeting', value: pc.meeting || 0 },
      { label: 'Propuesta', value: pc.proposal || 0 },
      { label: 'Cerrado', value: pc.closed || 0 }
    ];

    // Health & insights
    const health = typeof AIInsights !== 'undefined' ? AIInsights.healthScore() : { overall: 0, components: [] };
    const insights = typeof AIInsights !== 'undefined' ? AIInsights.generate().slice(0, 3) : [];

    // Sparkline trend data
    const mrrTrend = d.history?.mrr || [0, 0, 0, mrr];
    const clientTrend = d.history?.clients || [0, 0, clients];
    const pipelineTrend = d.history?.pipeline || [0, pipelineTotal];

    const el = document.getElementById('mod-control-tower');
    el.innerHTML = `
      <div class="module-header">
        <h1>Control Tower</h1>
        <p>Centro de comando estratégico — inteligencia en tiempo real</p>
      </div>

      <!-- System Health Bar + AI Insights Quick -->
      <div class="card card-gradient mb-6">
        <div class="card-header" style="position:relative;z-index:1">
          <div class="card-title">🤖 System Intelligence</div>
          <button class="btn btn-sm btn-primary" onclick="AIInsights.showPanel()">Ver Panel Completo</button>
        </div>
        <div class="flex items-center gap-5 mb-4" style="position:relative;z-index:1">
          <div style="text-align:center">
            ${Charts.scoreRing(health.overall, 100, 80, health.overall >= 60 ? Charts.colors.success : health.overall >= 30 ? Charts.colors.warning : Charts.colors.danger)}
            <div class="text-muted" style="font-size:var(--text-xs);margin-top:var(--space-1)">Health Score</div>
          </div>
          <div style="flex:1">
            <div class="health-bar mb-3">
              ${health.components.map(c => `<div class="health-segment" style="width:${c.score / health.components.length}%;background:${c.color}" title="${c.name}: ${Math.round(c.score)}%"></div>`).join('')}
            </div>
            <div class="flex gap-4" style="flex-wrap:wrap">
              ${health.components.map(c => `
                <div style="font-size:var(--text-xs)">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c.color};margin-right:4px"></span>
                  ${c.name}: <strong style="color:${c.color}">${Math.round(c.score)}%</strong>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        ${insights.length > 0 ? `
          <div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:var(--space-2)">
            ${insights.map(i => `
              <div class="insight-card">
                <span class="insight-icon">${i.icon}</span>
                <div class="insight-content">
                  <div class="insight-title">${i.title}</div>
                  <div class="insight-text">${i.text}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- KPI Row with Sparklines -->
      <div class="grid-4 mb-6">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--success-bg);color:var(--success)">💰</div>
          <div class="flex items-center gap-2">
            <div class="kpi-value counter-animate" style="color:var(--success)" id="kpi-mrr">${mrr.toLocaleString()}€</div>
            ${Charts.sparkline(mrrTrend, { color: 'auto' })}
          </div>
          <div class="kpi-label">MRR Actual</div>
          <div class="kpi-trend ${mrr > 0 ? 'up' : 'flat'}">${pctTarget}% del objetivo</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--info-bg);color:var(--info)">👥</div>
          <div class="flex items-center gap-2">
            <div class="kpi-value">${clients}</div>
            ${Charts.sparkline(clientTrend, { color: Charts.colors.info })}
          </div>
          <div class="kpi-label">Clientes Activos</div>
          <div class="kpi-trend flat">Ticket medio: ${avgTicket.toLocaleString()}€</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(var(--accent-primary-rgb),0.1);color:var(--accent-primary)">🔄</div>
          <div class="flex items-center gap-2">
            <div class="kpi-value">${pipelineTotal}</div>
            ${Charts.sparkline(pipelineTrend, { color: Charts.colors.primary })}
          </div>
          <div class="kpi-label">Pipeline Total</div>
          <div class="kpi-trend flat">${pc.meeting || 0} meetings activas</div>
        </div>
        <div class="kpi-card ${activeAlerts > 0 ? 'pulse-critical' : ''}">
          <div class="kpi-icon" style="background:${activeAlerts > 0 ? 'var(--danger-bg)' : 'var(--success-bg)'};color:${activeAlerts > 0 ? 'var(--danger)' : 'var(--success)'}">🗼</div>
          <div class="kpi-value">${activeAlerts}</div>
          <div class="kpi-label">Alertas Activas</div>
          <div class="kpi-trend ${activeAlerts > 0 ? 'down' : 'up'}">${activeAlerts > 0 ? 'Requiere atención' : 'Todo en orden'}</div>
        </div>
      </div>

      <!-- Row 2: Progress + Funnel -->
      <div class="grid-2 mb-6">
        <div class="card card-glow">
          <div class="card-header">
            <div class="card-title">🎯 Progreso hacia ${target.toLocaleString()}€/mes</div>
            <div class="badge badge-info">Día ${dayNum}/90</div>
          </div>
          <div style="text-align:center;padding:var(--space-4) 0">
            <div style="position:relative;display:inline-block">
              ${Charts.scoreRing(Math.round(pctTarget), 100, 120, mrr >= target ? Charts.colors.success : Charts.colors.primary)}
            </div>
            <div class="text-muted mt-4" style="font-size:var(--text-sm)">${mrr.toLocaleString()}€ / ${target.toLocaleString()}€</div>
          </div>
          <div class="divider"></div>
          <div class="flex justify-between items-center" style="font-size:var(--text-xs)">
            <span class="text-muted">Presupuesto restante</span>
            <span class="text-mono" style="color:${runway > 1000 ? 'var(--success)' : 'var(--danger)'}">${runway.toLocaleString()}€</span>
          </div>
          <div class="flex justify-between items-center mt-2" style="font-size:var(--text-xs)">
            <span class="text-muted">Ejecución plan</span>
            <span class="text-mono">${taskPct}% completado</span>
          </div>
        </div>

        <div class="card card-glow">
          <div class="card-header">
            <div class="card-title">🔽 Funnel de Ventas</div>
          </div>
          <div id="ct-funnel"></div>
        </div>
      </div>

      <!-- Row 3: Radar Chart + Resource Allocation -->
      <div class="grid-2 mb-6">
        <div class="card">
          <div class="card-header">
            <div class="card-title">🎯 Radar de Nichos</div>
          </div>
          <div id="ct-radar" style="text-align:center;padding:var(--space-3) 0"></div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">⏱️ Distribución de Tiempo (40h/sem)</div>
          </div>
          ${Object.entries(d.resources || {}).map(([key, pct]) => {
      const labels = { outbound: 'Outbound/Sales', delivery: 'Delivery', content: 'Content', systems: 'Systems', strategy: 'Strategy', admin: 'Admin' };
      const colors = { outbound: 'var(--accent-primary)', delivery: 'var(--success)', content: 'var(--accent-tertiary)', systems: 'var(--info)', strategy: 'var(--accent-secondary)', admin: 'var(--text-tertiary)' };
      return `
              <div class="flex items-center gap-3 mb-2">
                <span style="font-size:var(--text-xs);min-width:100px;color:var(--text-secondary)">${labels[key] || key}</span>
                <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%;background:${colors[key] || 'var(--accent-primary)'}"></div></div>
                <span class="text-mono" style="font-size:var(--text-xs);min-width:40px;text-align:right;color:${colors[key]}">${pct}%</span>
              </div>`;
    }).join('')}
        </div>
      </div>

      <!-- Row 4: Portfolio + Quick Actions -->
      <div class="grid-2 mb-6">
        <div class="card">
          <div class="card-header">
            <div class="card-title">🎲 Portfolio Bets</div>
          </div>
          ${(d.bets || []).map(bet => `
            <div class="flex items-center gap-3 mb-3" style="font-size:var(--text-sm)">
              <span class="badge ${bet.type === 'core' ? 'badge-success' : 'badge-info'}" style="min-width:50px">${bet.type}</span>
              <span style="flex:1;color:var(--text-primary)">${bet.name}</span>
              <span class="text-mono" style="font-size:var(--text-xs);color:var(--accent-primary)">${bet.resources}</span>
            </div>
          `).join('')}
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">⚡ Acciones Rápidas</div>
          </div>
          <div class="grid-2" style="gap:var(--space-3)">
            <button class="btn" style="width:100%;justify-content:center" onclick="CmdPalette.open()">⌘K Comandos</button>
            <button class="btn" style="width:100%;justify-content:center" onclick="App.navigate('pipeline')">🔄 Pipeline</button>
            <button class="btn" style="width:100%;justify-content:center" onclick="App.navigate('simulation')">📊 Simular MRR</button>
            <button class="btn" style="width:100%;justify-content:center" onclick="AIInsights.showPanel()">🤖 AI Insights</button>
            <button class="btn" style="width:100%;justify-content:center" onclick="App.navigate('decision')">⚖️ Scoring</button>
            <button class="btn" style="width:100%;justify-content:center" onclick="App.navigate('knowledge')">📚 Knowledge</button>
          </div>
        </div>
      </div>

      <!-- CEO Formula -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🧮 CEO Decision Formula — Ranking de Nichos</div>
          <div class="card-subtitle">SCORE = (impact^w1 × velocity^w2 × scalability^w3 × confidence^w4) / (risk × resource_cost)</div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Rank</th><th>Nicho</th><th>Impact</th><th>Velocity</th><th>Scalability</th><th>Confidence</th><th>Risk</th><th>Score</th></tr>
            </thead>
            <tbody>
              ${(d.niches || [])
        .map(n => ({ ...n, score: App.ceoScore(n) }))
        .sort((a, b) => b.score - a.score)
        .map((n, i) => `
                  <tr>
                    <td><strong>#${i + 1}</strong></td>
                    <td style="color:var(--text-primary);font-weight:600">${n.name}</td>
                    <td>${n.impact}</td>
                    <td>${n.velocity}</td>
                    <td>${n.scalability}</td>
                    <td>${n.confidence}</td>
                    <td>${n.risk}</td>
                    <td>${Charts.scoreRing(Math.min(n.score, 100), 100, 44)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Render funnel
    Charts.funnel('ct-funnel', funnel);

    // Render radar chart for top niches
    const niches = (d.niches || []).slice(0, 3);
    if (niches.length > 0) {
      Charts.radar('ct-radar',
        niches.map((n, i) => ({
          label: n.name,
          data: [n.impact, n.velocity, n.scalability, n.confidence, 100 - n.risk],
          color: [Charts.colors.primary, Charts.colors.success, Charts.colors.tertiary][i]
        })),
        ['Impact', 'Velocity', 'Scale', 'Confidence', 'Low Risk'],
        { size: 220 }
      );
    }

    App.updateGlobalProgress();
  }
};
