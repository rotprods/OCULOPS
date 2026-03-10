/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Knowledge Vault
   Decisions, experiments, playbooks, case studies
   ═══════════════════════════════════════════════════ */

const Knowledge = {
  activeTab: 'decisions',

  render() {
    const d = App.data;
    const tabs = [
      { key: 'decisions', icon: '⚖️', label: 'Decisiones', count: (d.decisions || []).length },
      { key: 'experiments', icon: '🧪', label: 'Experimentos', count: (d.experiments || []).length },
      { key: 'knowledge', icon: '📚', label: 'Playbooks & Notas', count: (d.knowledge || []).length }
    ];

    const el = document.getElementById('mod-knowledge');
    el.innerHTML = `
      <div class="module-header">
        <h1>Knowledge Vault</h1>
        <p>Registro de decisiones, experimentos y aprendizajes. Todo lo aprendido, preservado.</p>
      </div>

      <!-- Tabs -->
      <div class="tabs mb-6">
        ${tabs.map(t => `
          <div class="tab ${this.activeTab === t.key ? 'active' : ''}" onclick="Knowledge.setTab('${t.key}')">
            ${t.icon} ${t.label} (${t.count})
          </div>
        `).join('')}
      </div>

      <!-- Tab Content -->
      <div id="kv-content"></div>
    `;

    this.renderTab();
  },

  setTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  renderTab() {
    const container = document.getElementById('kv-content');
    if (!container) return;

    switch (this.activeTab) {
      case 'decisions': this.renderDecisions(container); break;
      case 'experiments': this.renderExperiments(container); break;
      case 'knowledge': this.renderKnowledge(container); break;
    }
  },

  renderDecisions(container) {
    const decisions = App.data.decisions || [];
    container.innerHTML = `
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">➕ Registrar Decisión</div>
        </div>
        <div class="grid-2" style="gap:var(--space-3)">
          <div class="input-group"><label>Decisión</label><input class="input" id="dec-title" placeholder="¿Qué se decidió?"></div>
          <div class="input-group"><label>Contexto</label><input class="input" id="dec-context" placeholder="¿Por qué?"></div>
          <div class="input-group"><label>Opciones consideradas</label><input class="input" id="dec-options" placeholder="Opción A, B, C"></div>
          <div class="input-group"><label>Opción elegida</label><input class="input" id="dec-chosen" placeholder="Se eligió..."></div>
        </div>
        <div class="input-group mt-3"><label>Resultado esperado</label><textarea class="input" id="dec-outcome" rows="2" placeholder="¿Qué esperamos que pase?"></textarea></div>
        <button class="btn btn-primary mt-3" onclick="Knowledge.addDecision()">Registrar</button>
      </div>

      ${decisions.length === 0 ? '<div class="empty-state"><div class="empty-icon">⚖️</div><h3>Sin decisiones</h3></div>' :
        decisions.map(d => `
          <div class="card mb-3" style="border-left:3px solid var(--info)">
            <div class="flex justify-between items-center">
              <div style="font-weight:700">${d.title}</div>
              <span class="badge badge-neutral">${d.date || ''}</span>
            </div>
            <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:var(--space-2);line-height:1.7">
              <div><strong>Contexto:</strong> ${d.context || '-'}</div>
              <div><strong>Opciones:</strong> ${d.options || '-'}</div>
              <div><strong>Elegida:</strong> <span style="color:var(--success)">${d.chosen || '-'}</span></div>
              <div><strong>Resultado:</strong> ${d.outcome || '-'}</div>
            </div>
            <button class="btn btn-sm btn-danger mt-2" onclick="Knowledge.removeItem('decisions','${d.id}')">Eliminar</button>
          </div>
        `).join('')}
    `;
  },

  renderExperiments(container) {
    const experiments = App.data.experiments || [];
    const states = ['hypothesis', 'running', 'concluded', 'archived'];
    container.innerHTML = `
      <div class="card mb-4">
        <div class="card-header"><div class="card-title">➕ Nuevo Experimento</div></div>
        <div class="grid-2" style="gap:var(--space-3)">
          <div class="input-group"><label>Nombre</label><input class="input" id="exp-name" placeholder="Nombre del experimento"></div>
          <div class="input-group"><label>Estado</label><select class="input" id="exp-status">${states.map(s => `<option value="${s}">${s}</option>`).join('')}</select></div>
          <div class="input-group" style="grid-column:span 2"><label>Hipótesis</label><textarea class="input" id="exp-hyp" rows="2" placeholder="Si hacemos X, entonces Y"></textarea></div>
          <div class="input-group"><label>KPI</label><input class="input" id="exp-kpi" placeholder="Métrica de éxito"></div>
          <div class="input-group"><label>Resultado</label><input class="input" id="exp-result" placeholder="Aún por determinar"></div>
        </div>
        <button class="btn btn-primary mt-3" onclick="Knowledge.addExperiment()">Crear</button>
      </div>

      ${experiments.length === 0 ? '<div class="empty-state"><div class="empty-icon">🧪</div><h3>Sin experimentos</h3></div>' :
        experiments.map(e => `
          <div class="card mb-3" style="border-left:3px solid ${e.status === 'concluded' ? 'var(--success)' : e.status === 'running' ? 'var(--warning)' : 'var(--text-tertiary)'}">
            <div class="flex justify-between items-center">
              <div style="font-weight:700">${e.name}</div>
              <div class="flex gap-2">
                <span class="badge ${e.status === 'concluded' ? 'badge-success' : e.status === 'running' ? 'badge-warning' : 'badge-neutral'}">${e.status}</span>
                <button class="btn btn-sm btn-ghost" onclick="Knowledge.cycleExpState('${e.id}')">→</button>
              </div>
            </div>
            <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:var(--space-2)">
              <div><strong>Hipótesis:</strong> ${e.hypothesis || '-'}</div>
              <div><strong>KPI:</strong> ${e.kpi || '-'}</div>
              <div><strong>Resultado:</strong> ${e.result || '-'}</div>
            </div>
            <button class="btn btn-sm btn-danger mt-2" onclick="Knowledge.removeItem('experiments','${e.id}')">Eliminar</button>
          </div>
        `).join('')}
    `;
  },

  renderKnowledge(container) {
    const entries = App.data.knowledge || [];
    container.innerHTML = `
      <div class="card mb-4">
        <div class="card-header"><div class="card-title">➕ Nueva Entrada</div></div>
        <div class="input-group mb-3"><label>Título</label><input class="input" id="kn-title" placeholder="Título"></div>
        <div class="input-group mb-3">
          <label>Tipo</label>
          <select class="input" id="kn-type">
            <option value="playbook">📘 Playbook</option>
            <option value="case-study">📋 Case Study</option>
            <option value="learning">💡 Learning</option>
            <option value="note">📝 Nota</option>
          </select>
        </div>
        <div class="input-group mb-3"><label>Contenido</label><textarea class="input" id="kn-content" rows="4" placeholder="Contenido..."></textarea></div>
        <button class="btn btn-primary" onclick="Knowledge.addEntry()">Guardar</button>
      </div>

      ${entries.length === 0 ? '<div class="empty-state"><div class="empty-icon">📚</div><h3>Sin entradas</h3></div>' :
        entries.map(e => {
          const typeIcons = { playbook: '📘', 'case-study': '📋', learning: '💡', note: '📝' };
          return `
            <div class="card mb-3">
              <div class="flex justify-between items-center">
                <div style="font-weight:700">${typeIcons[e.type] || '📝'} ${e.title}</div>
                <span class="badge badge-neutral">${e.date || ''}</span>
              </div>
              <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-top:var(--space-2);white-space:pre-wrap;line-height:1.7">${e.content || ''}</div>
              <button class="btn btn-sm btn-danger mt-2" onclick="Knowledge.removeItem('knowledge','${e.id}')">Eliminar</button>
            </div>`;
        }).join('')}
    `;
  },

  addDecision() {
    const item = {
      id: App.uid(),
      title: document.getElementById('dec-title').value.trim(),
      context: document.getElementById('dec-context').value.trim(),
      options: document.getElementById('dec-options').value.trim(),
      chosen: document.getElementById('dec-chosen').value.trim(),
      outcome: document.getElementById('dec-outcome').value.trim(),
      date: new Date().toISOString().split('T')[0]
    };
    if (!item.title) return App.toast('Título requerido', 'warning');
    if (!App.data.decisions) App.data.decisions = [];
    App.data.decisions.unshift(item);
    App.saveData();
    this.render();
    App.toast('Decisión registrada', 'success');
  },

  addExperiment() {
    const item = {
      id: App.uid(),
      name: document.getElementById('exp-name').value.trim(),
      status: document.getElementById('exp-status').value,
      hypothesis: document.getElementById('exp-hyp').value.trim(),
      kpi: document.getElementById('exp-kpi').value.trim(),
      result: document.getElementById('exp-result').value.trim(),
      date: new Date().toISOString().split('T')[0]
    };
    if (!item.name) return App.toast('Nombre requerido', 'warning');
    if (!App.data.experiments) App.data.experiments = [];
    App.data.experiments.unshift(item);
    App.saveData();
    this.render();
    App.toast('Experimento creado', 'success');
  },

  addEntry() {
    const item = {
      id: App.uid(),
      title: document.getElementById('kn-title').value.trim(),
      type: document.getElementById('kn-type').value,
      content: document.getElementById('kn-content').value.trim(),
      date: new Date().toISOString().split('T')[0]
    };
    if (!item.title) return App.toast('Título requerido', 'warning');
    if (!App.data.knowledge) App.data.knowledge = [];
    App.data.knowledge.unshift(item);
    App.saveData();
    this.render();
    App.toast('Entrada guardada', 'success');
  },

  cycleExpState(id) {
    const states = ['hypothesis', 'running', 'concluded', 'archived'];
    const exp = (App.data.experiments || []).find(e => e.id === id);
    if (!exp) return;
    const idx = states.indexOf(exp.status);
    exp.status = states[(idx + 1) % states.length];
    // Feedback loop: auto-log concluded experiments to Knowledge
    if (exp.status === 'concluded') {
      App.triggerFeedback('experiment_concluded', exp);
    }
    App.saveData();
    this.render();
  },

  removeItem(collection, id) {
    App.data[collection] = (App.data[collection] || []).filter(i => i.id !== id);
    App.saveData();
    this.render();
  }
};
