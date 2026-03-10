/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Market Intelligence
   Fusioned signal layers (§4-§10 merged)
   ═══════════════════════════════════════════════════ */

const Intelligence = {
    render() {
        const signals = App.data.signals || [];
        const el = document.getElementById('mod-intelligence');
        el.innerHTML = `
      <div class="module-header">
        <h1>Market Intelligence</h1>
        <p>Señales fusionadas de mercado, competencia, tecnología y economía. Leading vs Lagging indicators.</p>
      </div>

      <!-- Signal Fusion Summary -->
      <div class="grid-4 mb-6">
        ${['Macro', 'Mercado', 'Competencia', 'Tecnología'].map((cat, i) => {
            const count = signals.filter(s => s.category === cat.toLowerCase()).length;
            const icons = ['🌍', '📈', '⚔️', '🤖'];
            const colors = ['var(--info)', 'var(--success)', 'var(--danger)', 'var(--accent-primary)'];
            return `
            <div class="kpi-card">
              <div class="kpi-icon" style="background:${colors[i]}22;color:${colors[i]}">${icons[i]}</div>
              <div class="kpi-value">${count}</div>
              <div class="kpi-label">Señales ${cat}</div>
            </div>`;
        }).join('')}
      </div>

      <!-- Add Signal -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">➕ Registrar Señal</div>
        </div>
        <div class="grid-2" style="gap:var(--space-3)">
          <div class="input-group">
            <label>Señal</label>
            <input class="input" id="sig-title" placeholder="Descripción de la señal">
          </div>
          <div class="input-group">
            <label>Categoría</label>
            <select class="input" id="sig-category">
              <option value="macro">🌍 Macro</option>
              <option value="mercado">📈 Mercado</option>
              <option value="competencia">⚔️ Competencia</option>
              <option value="tecnología">🤖 Tecnología</option>
              <option value="social">👥 Social</option>
              <option value="economic">💰 Económica</option>
            </select>
          </div>
          <div class="input-group">
            <label>Tipo indicador</label>
            <select class="input" id="sig-indicator">
              <option value="leading">⚡ Leading (predice)</option>
              <option value="lagging">📋 Lagging (confirma)</option>
            </select>
          </div>
          <div class="input-group">
            <label>Impacto (1-100)</label>
            <input class="input" id="sig-impact" type="number" min="1" max="100" value="50">
          </div>
          <div class="input-group">
            <label>Fuente</label>
            <input class="input" id="sig-source" placeholder="URL o referencia">
          </div>
          <div class="input-group">
            <label>Confianza (0-100)</label>
            <input class="input" id="sig-confidence" type="number" min="0" max="100" value="70">
          </div>
        </div>
        <div class="input-group mt-4">
          <label>Implicación para el negocio</label>
          <textarea class="input" id="sig-implication" rows="2" placeholder="¿Qué significa para la agencia?"></textarea>
        </div>
        <button class="btn btn-primary mt-4" onclick="Intelligence.addSignal()">Registrar Señal</button>
      </div>

      <!-- Signals Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📡 Señales Registradas (${signals.length})</div>
          <div class="flex gap-2">
            <button class="btn btn-sm ${this.filter === 'all' ? 'btn-primary' : ''}" onclick="Intelligence.setFilter('all')">Todas</button>
            <button class="btn btn-sm ${this.filter === 'leading' ? 'btn-primary' : ''}" onclick="Intelligence.setFilter('leading')">Leading</button>
            <button class="btn btn-sm ${this.filter === 'lagging' ? 'btn-primary' : ''}" onclick="Intelligence.setFilter('lagging')">Lagging</button>
          </div>
        </div>
        ${signals.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📡</div>
            <h3>Sin señales registradas</h3>
            <p class="text-muted">Añade señales de mercado para construir tu inteligencia</p>
          </div>
        ` : `
          <div class="table-container">
            <table>
              <thead>
                <tr><th>Señal</th><th>Cat.</th><th>Tipo</th><th>Impacto</th><th>Confianza</th><th>Fecha</th><th></th></tr>
              </thead>
              <tbody>
                ${signals
                .filter(s => !this.filter || this.filter === 'all' || s.indicator === this.filter)
                .sort((a, b) => (b.impact || 0) - (a.impact || 0))
                .map(s => `
                    <tr>
                      <td style="color:var(--text-primary);max-width:300px">
                        <div style="font-weight:600">${s.title}</div>
                        ${s.implication ? `<div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px">${s.implication}</div>` : ''}
                      </td>
                      <td><span class="badge badge-info">${s.category}</span></td>
                      <td><span class="badge ${s.indicator === 'leading' ? 'badge-success' : 'badge-neutral'}">${s.indicator === 'leading' ? '⚡ Leading' : '📋 Lagging'}</span></td>
                      <td>${Charts.scoreRing(s.impact || 50, 100, 36)}</td>
                      <td>${Charts.scoreRing(s.confidence || 50, 100, 36)}</td>
                      <td class="text-mono" style="font-size:var(--text-xs)">${s.date || '-'}</td>
                      <td><button class="btn btn-sm btn-danger" onclick="Intelligence.removeSignal('${s.id}')">✕</button></td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
    },

    filter: 'all',

    setFilter(f) {
        this.filter = f;
        this.render();
    },

    addSignal() {
        const signal = {
            id: App.uid(),
            title: document.getElementById('sig-title').value.trim(),
            category: document.getElementById('sig-category').value,
            indicator: document.getElementById('sig-indicator').value,
            impact: parseInt(document.getElementById('sig-impact').value) || 50,
            source: document.getElementById('sig-source').value.trim(),
            confidence: parseInt(document.getElementById('sig-confidence').value) || 70,
            implication: document.getElementById('sig-implication').value.trim(),
            date: new Date().toISOString().split('T')[0],
            status: 'active'
        };
        if (!signal.title) return App.toast('Introduce la señal', 'warning');
        App.data.signals.push(signal);
        App.saveData();
        this.render();
        App.toast('Señal registrada', 'success');
    },

    removeSignal(id) {
        App.data.signals = App.data.signals.filter(s => s.id !== id);
        App.saveData();
        this.render();
    }
};
