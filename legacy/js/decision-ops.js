/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Decision Ops
   Scoring, CEO Formula, Portfolio Bets, Resource Allocation
   ═══════════════════════════════════════════════════ */

const DecisionOps = {
    render() {
        const d = App.data;
        const niches = d.niches || [];
        const bets = d.bets || [];
        const el = document.getElementById('mod-decision');

        el.innerHTML = `
      <div class="module-header">
        <h1>Decision Ops</h1>
        <p>Scoring de nichos, portfolio bets con kill criteria, y fórmula de decisión mejorada con pesos dinámicos.</p>
      </div>

      <!-- Niche Scoring Matrix -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🎯 Scoring de Nichos</div>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-primary" onclick="DecisionOps.addNiche()">+ Nicho</button>
          </div>
        </div>
        <div class="card-subtitle mb-4">SCORE = (impact^1.2 × velocity^1.5 × scalability^0.5 × confidence^1.0) / (risk × resource_cost) — Pesos fase 0→20k</div>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Nicho</th><th>Impact</th><th>Velocity</th><th>Scale</th><th>Conf.</th><th>Risk</th><th>R.Cost</th><th>Score</th><th></th></tr>
            </thead>
            <tbody>
              ${niches
                .map(n => ({ ...n, score: App.ceoScore(n) }))
                .sort((a, b) => b.score - a.score)
                .map(n => `
                  <tr>
                    <td style="font-weight:600;color:var(--text-primary)">${n.name}</td>
                    <td><input type="number" class="input" style="width:60px;padding:4px 8px" value="${n.impact}" onchange="DecisionOps.updateNiche(${n.id},'impact',this.value)" min="0" max="100"></td>
                    <td><input type="number" class="input" style="width:60px;padding:4px 8px" value="${n.velocity}" onchange="DecisionOps.updateNiche(${n.id},'velocity',this.value)" min="0" max="100"></td>
                    <td><input type="number" class="input" style="width:60px;padding:4px 8px" value="${n.scalability}" onchange="DecisionOps.updateNiche(${n.id},'scalability',this.value)" min="0" max="100"></td>
                    <td><input type="number" class="input" style="width:60px;padding:4px 8px" value="${n.confidence}" onchange="DecisionOps.updateNiche(${n.id},'confidence',this.value)" min="0" max="100"></td>
                    <td><input type="number" class="input" style="width:60px;padding:4px 8px" value="${n.risk}" onchange="DecisionOps.updateNiche(${n.id},'risk',this.value)" min="1" max="100"></td>
                    <td><input type="number" class="input" style="width:60px;padding:4px 8px" value="${n.resourceCost}" onchange="DecisionOps.updateNiche(${n.id},'resourceCost',this.value)" min="1" max="100"></td>
                    <td>${Charts.scoreRing(Math.min(n.score, 100), 100, 44)}</td>
                    <td><button class="btn btn-sm btn-danger" onclick="DecisionOps.removeNiche(${n.id})">✕</button></td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Portfolio Bets -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🎲 Portfolio Bets (2 Core + 2 Explore)</div>
          <button class="btn btn-sm btn-primary" onclick="DecisionOps.addBet()">+ Bet</button>
        </div>
        <div class="grid-2" style="gap:var(--space-4)">
          ${bets.map(bet => `
            <div class="card" style="border-left:3px solid ${bet.type === 'core' ? 'var(--success)' : 'var(--info)'}">
              <div class="flex justify-between items-center mb-3">
                <span class="badge ${bet.type === 'core' ? 'badge-success' : 'badge-info'}">${bet.type.toUpperCase()}</span>
                <span class="chip">${bet.resources}</span>
              </div>
              <div style="font-weight:700;margin-bottom:var(--space-2)">${bet.name}</div>
              <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-3)">${bet.hypothesis}</div>
              <div class="flex flex-col gap-2" style="font-size:var(--text-xs)">
                <div><span class="text-muted">KPI:</span> <span style="color:var(--success)">${bet.kpi}</span></div>
                <div><span class="text-muted">Kill:</span> <span style="color:var(--danger)">${bet.killCriteria}</span></div>
                <div><span class="text-muted">Pivot:</span> <span style="color:var(--info)">${bet.pivotPath}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Resource Allocation -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">⏱️ Resource Allocation (40h/semana — Constraint REAL)</div>
          <button class="btn btn-sm" onclick="DecisionOps.resetResources()">Reset</button>
        </div>
        <div class="alert alert-warning mb-4">
          ⚠️ Restricción: 1 persona, 8h/día, 5 días = 40h. Cada % equivale a ${(40 * 0.01 * 60).toFixed(0)} min/semana.
        </div>
        ${Object.entries(d.resources || {}).map(([key, pct]) => {
                    const labels = { outbound: 'Outbound/Sales ★', delivery: 'Delivery', content: 'Content/Inbound', systems: 'Systems/Automation', strategy: 'Strategy/Analysis', admin: 'Admin/Legal' };
                    return `
            <div class="slider-group mb-3">
              <div class="slider-header">
                <label>${labels[key] || key}</label>
                <span class="slider-value">${pct}% (${(40 * pct / 100).toFixed(1)}h)</span>
              </div>
              <input type="range" min="0" max="60" value="${pct}" oninput="DecisionOps.updateResource('${key}', this.value)">
            </div>`;
                }).join('')}
        <div class="flex justify-between mt-4" style="font-size:var(--text-sm);font-weight:700">
          <span>Total</span>
          <span id="resource-total" style="color:${Object.values(d.resources || {}).reduce((s, v) => s + v, 0) === 100 ? 'var(--success)' : 'var(--danger)'}">
            ${Object.values(d.resources || {}).reduce((s, v) => s + v, 0)}%
          </span>
        </div>
      </div>
    `;
    },

    updateNiche(id, field, value) {
        const n = App.data.niches.find(n => n.id === id);
        if (n) n[field] = parseInt(value) || 0;
        App.saveData();
        this.render();
    },

    addNiche() {
        App.openModal(`
      <h2>+ Nuevo Nicho</h2>
      <div class="input-group mb-3"><label>Nombre</label><input class="input" id="niche-name"></div>
      <div class="grid-2" style="gap:var(--space-3)">
        <div class="input-group"><label>Impact</label><input class="input" id="n-impact" type="number" value="50" min="0" max="100"></div>
        <div class="input-group"><label>Velocity</label><input class="input" id="n-velocity" type="number" value="50" min="0" max="100"></div>
        <div class="input-group"><label>Scalability</label><input class="input" id="n-scale" type="number" value="50" min="0" max="100"></div>
        <div class="input-group"><label>Confidence</label><input class="input" id="n-conf" type="number" value="50" min="0" max="100"></div>
        <div class="input-group"><label>Risk</label><input class="input" id="n-risk" type="number" value="30" min="1" max="100"></div>
        <div class="input-group"><label>Resource Cost</label><input class="input" id="n-rcost" type="number" value="30" min="1" max="100"></div>
      </div>
      <button class="btn btn-primary mt-4" onclick="DecisionOps.saveNiche()">Guardar</button>
    `);
    },

    saveNiche() {
        const name = document.getElementById('niche-name').value.trim();
        if (!name) return App.toast('Nombre requerido', 'warning');
        App.data.niches.push({
            id: Date.now(),
            name,
            impact: parseInt(document.getElementById('n-impact').value) || 50,
            velocity: parseInt(document.getElementById('n-velocity').value) || 50,
            scalability: parseInt(document.getElementById('n-scale').value) || 50,
            confidence: parseInt(document.getElementById('n-conf').value) || 50,
            risk: parseInt(document.getElementById('n-risk').value) || 30,
            resourceCost: parseInt(document.getElementById('n-rcost').value) || 30
        });
        App.saveData();
        App.closeModal();
        this.render();
        App.toast('Nicho añadido', 'success');
    },

    removeNiche(id) {
        App.data.niches = App.data.niches.filter(n => n.id !== id);
        App.saveData();
        this.render();
    },

    addBet() {
        App.openModal(`
      <h2>+ Nueva Bet</h2>
      <div class="input-group mb-3"><label>Tipo</label><select class="input" id="bet-type"><option value="core">Core</option><option value="explore">Explore</option></select></div>
      <div class="input-group mb-3"><label>Nombre</label><input class="input" id="bet-name"></div>
      <div class="input-group mb-3"><label>Hipótesis</label><textarea class="input" id="bet-hyp" rows="2"></textarea></div>
      <div class="input-group mb-3"><label>KPI</label><input class="input" id="bet-kpi"></div>
      <div class="input-group mb-3"><label>Kill Criteria</label><input class="input" id="bet-kill"></div>
      <div class="input-group mb-3"><label>Pivot Path</label><input class="input" id="bet-pivot"></div>
      <div class="input-group mb-3"><label>% Recursos</label><input class="input" id="bet-res" value="10%"></div>
      <button class="btn btn-primary mt-4" onclick="DecisionOps.saveBet()">Guardar</button>
    `);
    },

    saveBet() {
        App.data.bets.push({
            id: Date.now(),
            type: document.getElementById('bet-type').value,
            name: document.getElementById('bet-name').value.trim(),
            hypothesis: document.getElementById('bet-hyp').value.trim(),
            kpi: document.getElementById('bet-kpi').value.trim(),
            killCriteria: document.getElementById('bet-kill').value.trim(),
            pivotPath: document.getElementById('bet-pivot').value.trim(),
            resources: document.getElementById('bet-res').value.trim(),
            status: 'active'
        });
        App.saveData();
        App.closeModal();
        this.render();
        App.toast('Bet añadida', 'success');
    },

    updateResource(key, value) {
        App.data.resources[key] = parseInt(value);
        App.saveData();
        this.render();
    },

    resetResources() {
        App.data.resources = { outbound: 37, delivery: 30, content: 12, systems: 10, strategy: 5, admin: 6 };
        App.saveData();
        this.render();
    }
};
