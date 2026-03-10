/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Opportunity Engine
   Traceable paths with scoring and categorization
   ═══════════════════════════════════════════════════ */

const Opportunities = {
    render() {
        const opps = App.data.opportunities || [];
        const el = document.getElementById('mod-opportunities');

        const categories = {
            quick: { label: 'Quick Win', icon: '⚡', color: 'var(--success)', desc: '<2 semanas' },
            medium: { label: 'Medium Bet', icon: '🎯', color: 'var(--warning)', desc: '2-6 semanas' },
            long: { label: 'Long Play', icon: '🏗️', color: 'var(--accent-secondary)', desc: '6+ semanas' }
        };

        const counts = { quick: 0, medium: 0, long: 0 };
        opps.forEach(o => { if (counts[o.category] !== undefined) counts[o.category]++; });

        el.innerHTML = `
      <div class="module-header">
        <h1>Opportunity Engine</h1>
        <p>Caminos trazables: If X → Expect Y → Measure Z → Decide Q. Score = probability × payoff × speed - cost.</p>
      </div>

      <!-- Category Stats -->
      <div class="grid-3 mb-6">
        ${Object.entries(categories).map(([k, cat]) => `
          <div class="kpi-card" style="border-left:3px solid ${cat.color}">
            <div class="kpi-icon" style="background:${cat.color}22;color:${cat.color}">${cat.icon}</div>
            <div class="kpi-value">${counts[k]}</div>
            <div class="kpi-label">${cat.label} (${cat.desc})</div>
          </div>
        `).join('')}
      </div>

      <!-- Add Opportunity -->
      <div class="card mb-6">
        <div class="card-header"><div class="card-title">➕ Nueva Oportunidad</div></div>
        <div class="grid-2" style="gap:var(--space-3)">
          <div class="input-group">
            <label>Oportunidad</label>
            <input class="input" id="opp-title" placeholder="Si hacemos X...">
          </div>
          <div class="input-group">
            <label>Categoría</label>
            <select class="input" id="opp-category">
              ${Object.entries(categories).map(([k, c]) => `<option value="${k}">${c.icon} ${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="input-group"><label>If X (Condición)</label><input class="input" id="opp-if" placeholder="Si contactamos a 50 e-commerce..."></div>
          <div class="input-group"><label>Expect Y (Resultado)</label><input class="input" id="opp-expect" placeholder="Esperamos 5 meetings..."></div>
          <div class="input-group"><label>Measure Z (Métrica)</label><input class="input" id="opp-measure" placeholder="Response rate >10%"></div>
          <div class="input-group"><label>Decide Q (Decisión)</label><input class="input" id="opp-decide" placeholder="Escalar o pivotar"></div>
        </div>
        <div class="grid-4 mt-3" style="gap:var(--space-3)">
          <div class="input-group"><label>Probabilidad (%)</label><input class="input" id="opp-prob" type="number" value="50" min="0" max="100"></div>
          <div class="input-group"><label>Payoff (€)</label><input class="input" id="opp-payoff" type="number" value="5000"></div>
          <div class="input-group"><label>Speed (1-10)</label><input class="input" id="opp-speed" type="number" value="5" min="1" max="10"></div>
          <div class="input-group"><label>Cost (€)</label><input class="input" id="opp-cost" type="number" value="500"></div>
        </div>
        <div class="input-group mt-3">
          <label>Window Closes By</label>
          <input class="input" id="opp-window" type="date">
        </div>
        <button class="btn btn-primary mt-4" onclick="Opportunities.add()">Crear Oportunidad</button>
      </div>

      <!-- Opportunity Cards -->
      <div class="grid-auto mb-6">
        ${opps.length === 0 ? `
          <div class="empty-state full-width">
            <div class="empty-icon">💎</div>
            <h3>Sin oportunidades</h3>
            <p class="text-muted">Detecta caminos trazables para generar ingresos</p>
          </div>
        ` : opps
                .map(o => ({ ...o, score: this.calcScore(o) }))
                .sort((a, b) => b.score - a.score)
                .map(o => {
                    const cat = categories[o.category] || categories.medium;
                    const expired = o.windowClosesBy && new Date(o.windowClosesBy) < new Date();
                    return `
              <div class="card ${expired ? '' : 'card-glow'}" style="border-left:3px solid ${cat.color};${expired ? 'opacity:0.5' : ''}">
                <div class="flex justify-between items-center mb-2">
                  <span class="badge" style="background:${cat.color}22;color:${cat.color}">${cat.icon} ${cat.label}</span>
                  ${Charts.scoreRing(Math.min(Math.round(o.score), 100), 100, 40)}
                </div>
                <div style="font-weight:700;margin-bottom:var(--space-3)">${o.title}</div>
                <div style="font-size:var(--text-xs);color:var(--text-secondary);line-height:1.7">
                  <div><span style="color:var(--info)">IF:</span> ${o.ifCondition || '-'}</div>
                  <div><span style="color:var(--success)">EXPECT:</span> ${o.expectResult || '-'}</div>
                  <div><span style="color:var(--warning)">MEASURE:</span> ${o.measureMetric || '-'}</div>
                  <div><span style="color:var(--accent-tertiary)">DECIDE:</span> ${o.decideAction || '-'}</div>
                </div>
                <div class="divider"></div>
                <div class="flex justify-between" style="font-size:var(--text-xs)">
                  <span>Prob: ${o.probability}%</span>
                  <span>Payoff: ${(o.payoff || 0).toLocaleString()}€</span>
                  <span>Cost: ${(o.cost || 0).toLocaleString()}€</span>
                </div>
                ${o.windowClosesBy ? `<div class="badge ${expired ? 'badge-danger' : 'badge-warning'} mt-2" style="font-size:9px">${expired ? '⏰ EXPIRADA' : '⏱ Ventana: ' + o.windowClosesBy}</div>` : ''}
                <button class="btn btn-sm btn-danger mt-2" onclick="Opportunities.remove('${o.id}')">Eliminar</button>
              </div>`;
                }).join('')}
      </div>
    `;
    },

    calcScore(o) {
        return ((o.probability || 50) / 100) * ((o.payoff || 5000) / 100) * ((o.speed || 5) / 10) - ((o.cost || 500) / 1000);
    },

    add() {
        const opp = {
            id: App.uid(),
            title: document.getElementById('opp-title').value.trim(),
            category: document.getElementById('opp-category').value,
            ifCondition: document.getElementById('opp-if').value.trim(),
            expectResult: document.getElementById('opp-expect').value.trim(),
            measureMetric: document.getElementById('opp-measure').value.trim(),
            decideAction: document.getElementById('opp-decide').value.trim(),
            probability: parseInt(document.getElementById('opp-prob').value) || 50,
            payoff: parseInt(document.getElementById('opp-payoff').value) || 5000,
            speed: parseInt(document.getElementById('opp-speed').value) || 5,
            cost: parseInt(document.getElementById('opp-cost').value) || 500,
            windowClosesBy: document.getElementById('opp-window').value || null,
            timestamp: new Date().toISOString()
        };
        if (!opp.title) return App.toast('Título requerido', 'warning');
        App.data.opportunities.push(opp);
        App.saveData();
        this.render();
        App.toast('Oportunidad creada', 'success');
    },

    remove(id) {
        App.data.opportunities = App.data.opportunities.filter(o => o.id !== id);
        App.saveData();
        this.render();
    }
};
