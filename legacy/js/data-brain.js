/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Data Brain
   Relational entity model with state machines
   ═══════════════════════════════════════════════════ */

const DataBrain = {
    activeEntity: 'leads',

    entities: {
        leads: { icon: '👤', label: 'Leads', fields: ['name', 'company', 'role', 'email', 'linkedin', 'buySignal', 'source', 'confidence', 'status'], states: ['raw', 'qualified', 'contacted', 'responded', 'meeting', 'proposal', 'closed_won', 'closed_lost'] },
        companies: { icon: '🏢', label: 'Companies', fields: ['name', 'industry', 'size', 'website', 'techStack', 'revenue', 'location', 'confidence'], states: [] },
        competitors: { icon: '⚔️', label: 'Competitors', fields: ['name', 'website', 'pricing', 'strengths', 'weaknesses', 'channels', 'nps_proxy', 'churnProxy'], states: [] },
        signals: { icon: '📡', label: 'Signals', fields: ['title', 'category', 'indicator', 'impact', 'source', 'confidence'], states: ['detected', 'validated', 'actionable', 'acted', 'dismissed'] },
        experiments: { icon: '🧪', label: 'Experiments', fields: ['name', 'hypothesis', 'kpi', 'result', 'learnings'], states: ['hypothesis', 'running', 'concluded', 'archived'] },
        decisions: { icon: '⚖️', label: 'Decisions', fields: ['title', 'context', 'options', 'chosen', 'outcome', 'confidence'], states: [] }
    },

    render() {
        const d = App.data;
        const entityKeys = Object.keys(this.entities);
        const el = document.getElementById('mod-data-brain');

        // Entity counts
        const counts = {};
        entityKeys.forEach(k => {
            counts[k] = (d[k] || []).length;
        });

        // Data Quality Score
        const totalEntities = Object.values(counts).reduce((s, c) => s + c, 0);
        const withConfidence = [...(d.leads || []), ...(d.signals || [])].filter(e => e.confidence > 0).length;
        const dqScore = totalEntities > 0 ? Math.round((withConfidence / Math.max(totalEntities, 1)) * 100) : 0;

        el.innerHTML = `
      <div class="module-header">
        <h1>Data Brain</h1>
        <p>Ontología relacional con ${totalEntities} entidades. Modelo de datos con estados, lineage y quality scoring.</p>
      </div>

      <!-- Entity Stats -->
      <div class="grid-3 mb-6">
        ${entityKeys.slice(0, 3).map(k => `
          <div class="kpi-card">
            <div class="kpi-icon" style="background:rgba(var(--accent-primary-rgb),0.1);color:var(--accent-primary)">${this.entities[k].icon}</div>
            <div class="kpi-value">${counts[k]}</div>
            <div class="kpi-label">${this.entities[k].label}</div>
          </div>
        `).join('')}
      </div>

      <!-- DQ Score + Entity Nav -->
      <div class="grid-2 mb-6">
        <div class="card" style="text-align:center">
          <div class="card-title mb-4" style="justify-content:center">📊 Data Quality Score</div>
          ${Charts.scoreRing(dqScore, 100, 100)}
          <div class="text-muted mt-4" style="font-size:var(--text-xs)">${totalEntities} entidades · ${withConfidence} con confianza</div>
        </div>
        <div class="card">
          <div class="card-title mb-4">📂 Entidades</div>
          ${entityKeys.map(k => `
            <div class="flex items-center gap-3 mb-2 nav-item ${this.activeEntity === k ? 'active' : ''}" style="padding:var(--space-2) var(--space-3);border-radius:var(--radius-sm);cursor:pointer" onclick="DataBrain.selectEntity('${k}')">
              <span>${this.entities[k].icon}</span>
              <span style="flex:1">${this.entities[k].label}</span>
              <span class="badge badge-neutral">${counts[k]}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ER Diagram -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🔗 Modelo Relacional</div>
        </div>
        <div style="padding:var(--space-4);font-size:var(--text-xs);font-family:var(--font-mono);color:var(--text-secondary);background:var(--bg-primary);border-radius:var(--radius-sm);line-height:1.8">
          <div style="color:var(--accent-primary)">REGION → has → NICHES</div>
          <div style="color:var(--success)">NICHE → has → COMPANIES → has → CONTACTS → becomes → LEADS</div>
          <div style="color:var(--warning)">LEAD → generates → OPPORTUNITY → matches → OFFER</div>
          <div style="color:var(--info)">COMPETITOR → competes_in → NICHE</div>
          <div style="color:var(--accent-tertiary)">SIGNAL → affects → NICHE | COMPANY</div>
          <div style="color:var(--danger)">DECISION → triggers → EXPERIMENT → requires → TASKS</div>
          <div style="color:var(--text-tertiary)">CAMPAIGN → uses → CHANNEL → generates → LEADS</div>
          <div style="color:var(--text-tertiary)">PARTNER → refers → LEADS</div>
        </div>
      </div>

      <!-- Active Entity View -->
      <div class="card mb-6" id="db-entity-view"></div>
    `;

        this.renderEntityView();
    },

    selectEntity(key) {
        this.activeEntity = key;
        this.render();
    },

    renderEntityView() {
        const key = this.activeEntity;
        const entity = this.entities[key];
        const items = App.data[key] || [];
        const container = document.getElementById('db-entity-view');
        if (!container) return;

        container.innerHTML = `
      <div class="card-header">
        <div class="card-title">${entity.icon} ${entity.label} (${items.length})</div>
        <button class="btn btn-primary btn-sm" onclick="DataBrain.openAddModal('${key}')">+ Añadir</button>
      </div>
      ${items.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">${entity.icon}</div>
          <h3>Sin ${entity.label.toLowerCase()}</h3>
          <p class="text-muted">Añade tu primer registro</p>
        </div>
      ` : `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                ${entity.fields.slice(0, 5).map(f => `<th>${f}</th>`).join('')}
                ${entity.states.length > 0 ? '<th>Estado</th>' : ''}
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  ${entity.fields.slice(0, 5).map(f => `<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis">${item[f] || '-'}</td>`).join('')}
                  ${entity.states.length > 0 ? `<td><span class="badge badge-info">${item.status || entity.states[0]}</span></td>` : ''}
                  <td>
                    ${entity.states.length > 0 ? `<button class="btn btn-sm btn-ghost" onclick="DataBrain.cycleState('${key}','${item.id}')">→</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="DataBrain.removeItem('${key}','${item.id}')">✕</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
    },

    openAddModal(entityKey) {
        const entity = this.entities[entityKey];
        const fields = entity.fields.map(f => `
      <div class="input-group mb-3">
        <label>${f}</label>
        <input class="input" id="db-field-${f}" placeholder="${f}">
      </div>
    `).join('');

        App.openModal(`
      <h2>${entity.icon} Añadir ${entity.label}</h2>
      ${fields}
      ${entity.states.length > 0 ? `
        <div class="input-group mb-3">
          <label>Estado inicial</label>
          <select class="input" id="db-field-status">
            ${entity.states.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
      ` : ''}
      <div class="input-group mb-3">
        <label>Confianza (0-100)</label>
        <input class="input" id="db-field-confidence-meta" type="number" min="0" max="100" value="70">
      </div>
      <div class="flex gap-3 mt-4">
        <button class="btn btn-primary" onclick="DataBrain.saveItem('${entityKey}')">Guardar</button>
        <button class="btn" onclick="App.closeModal()">Cancelar</button>
      </div>
    `);
    },

    saveItem(entityKey) {
        const entity = this.entities[entityKey];
        const item = { id: App.uid(), timestamp: new Date().toISOString() };
        entity.fields.forEach(f => {
            const el = document.getElementById(`db-field-${f}`);
            item[f] = el ? el.value.trim() : '';
        });
        if (entity.states.length > 0) {
            const statusEl = document.getElementById('db-field-status');
            item.status = statusEl ? statusEl.value : entity.states[0];
        }
        const confEl = document.getElementById('db-field-confidence-meta');
        item.confidence = confEl ? parseInt(confEl.value) : 70;
        item.lineage_id = `${entityKey}-${item.id}`;
        item.evidence_type = 'direct';

        if (!App.data[entityKey]) App.data[entityKey] = [];
        App.data[entityKey].push(item);
        App.saveData();
        App.closeModal();
        this.render();
        App.toast(`${entity.label} añadido`, 'success');
    },

    cycleState(entityKey, itemId) {
        const entity = this.entities[entityKey];
        const items = App.data[entityKey] || [];
        const item = items.find(i => i.id === itemId);
        if (!item || entity.states.length === 0) return;
        const currentIdx = entity.states.indexOf(item.status || entity.states[0]);
        item.status = entity.states[(currentIdx + 1) % entity.states.length];
        App.saveData();
        this.renderEntityView();
    },

    removeItem(entityKey, itemId) {
        App.data[entityKey] = (App.data[entityKey] || []).filter(i => i.id !== itemId);
        App.saveData();
        this.renderEntityView();
        App.toast('Registro eliminado', 'info');
    }
};
