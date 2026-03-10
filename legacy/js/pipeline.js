/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Sales Pipeline
   Visual pipeline with drag-like stage progression
   ═══════════════════════════════════════════════════ */

const Pipeline = {
  stages: ['lead', 'contacted', 'response', 'meeting', 'proposal', 'closed', 'onboarding'],
  stageLabels: { lead: 'Lead', contacted: 'Contactado', response: 'Respuesta', meeting: 'Meeting', proposal: 'Propuesta', closed: 'Cerrado', onboarding: 'Onboarding' },
  stageColors: { lead: 'var(--text-tertiary)', contacted: 'var(--info)', response: 'var(--accent-primary)', meeting: 'var(--warning)', proposal: 'var(--accent-tertiary)', closed: 'var(--success)', onboarding: 'var(--accent-secondary)' },

  render() {
    const p = App.data.pipeline || {};
    const el = document.getElementById('mod-pipeline');
    const totalLeads = this.stages.reduce((s, st) => s + (p[st] || []).length, 0);
    const closedDeals = (p.closed || []).length + (p.onboarding || []).length;
    const pipelineValue = closedDeals * (App.data.simulation?.avgTicket || 2500);

    el.innerHTML = `
      <div class="module-header">
        <h1>Sales Pipeline</h1>
        <p>${totalLeads} leads en pipeline · ${closedDeals} cerrados · ${pipelineValue.toLocaleString()}€ valor</p>
      </div>

      <!-- Pipeline Stages Bar -->
      <div class="pipeline mb-6">
        ${this.stages.map(st => `
          <div class="pipeline-stage ${(p[st] || []).length > 0 ? 'active' : ''}">
            <span class="stage-count">${(p[st] || []).length}</span>
            ${this.stageLabels[st]}
          </div>
        `).join('')}
      </div>

      <!-- Stage Cards -->
      <div style="display:grid;grid-template-columns:repeat(${this.stages.length}, 1fr);gap:var(--space-3);overflow-x:auto;padding-bottom:var(--space-4)">
        ${this.stages.map(st => {
      const items = p[st] || [];
      return `
            <div style="min-width:160px">
              <div style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${this.stageColors[st]};margin-bottom:var(--space-3);text-align:center;padding:var(--space-2);background:var(--bg-card);border-radius:var(--radius-sm)">
                ${this.stageLabels[st]} (${items.length})
              </div>
              ${items.map(item => `
                <div class="card mb-2" style="padding:var(--space-3);cursor:pointer;border-left:3px solid ${this.stageColors[st]}">
                  <div style="font-size:var(--text-xs);font-weight:700;color:var(--text-primary)">${item.name || 'Sin nombre'}</div>
                  <div style="font-size:10px;color:var(--text-tertiary)">${item.company || ''}</div>
                  <div class="flex gap-2 mt-2">
                    ${this.stages.indexOf(st) > 0 ? `<button class="btn btn-sm btn-ghost" style="font-size:10px;padding:2px 4px" onclick="Pipeline.moveStage('${item.id}','${st}','prev')">←</button>` : ''}
                    ${this.stages.indexOf(st) < this.stages.length - 1 ? `<button class="btn btn-sm btn-ghost" style="font-size:10px;padding:2px 4px" onclick="Pipeline.moveStage('${item.id}','${st}','next')">→</button>` : ''}
                    <button class="btn btn-sm btn-ghost" style="font-size:10px;padding:2px 4px;color:var(--danger)" onclick="Pipeline.removeFromPipeline('${item.id}','${st}')">✕</button>
                  </div>
                </div>
              `).join('')}
              ${items.length === 0 ? '<div style="text-align:center;font-size:10px;color:var(--text-tertiary);padding:var(--space-4)">Vacío</div>' : ''}
            </div>`;
    }).join('')}
      </div>

      <!-- Funnel Conversion -->
      <div class="card mt-6">
        <div class="card-header">
          <div class="card-title">📊 Conversion Funnel</div>
        </div>
        <div id="pipeline-funnel"></div>
      </div>
    `;

    const funnelData = this.stages.map(st => ({ label: this.stageLabels[st], value: (p[st] || []).length }));
    Charts.funnel('pipeline-funnel', funnelData);
  },

  moveStage(itemId, currentStage, direction) {
    const p = App.data.pipeline;
    const items = p[currentStage] || [];
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;

    const stageIdx = this.stages.indexOf(currentStage);
    const newStageIdx = direction === 'next' ? stageIdx + 1 : stageIdx - 1;
    if (newStageIdx < 0 || newStageIdx >= this.stages.length) return;

    const newStage = this.stages[newStageIdx];
    const [item] = items.splice(idx, 1);
    item.status = newStage;
    item.lastMoved = new Date().toISOString();
    if (!p[newStage]) p[newStage] = [];
    p[newStage].push(item);

    // Update MRR if moved to closed
    if (newStage === 'closed') {
      App.data.finance.clients = (App.data.finance.clients || 0) + 1;
      const ticket = App.data.simulation?.avgTicket || 2500;
      App.data.finance.mrr = App.data.finance.clients * ticket;
      App.toast(`🎉 ¡Deal cerrado! MRR: ${App.data.finance.mrr.toLocaleString()}€`, 'success');
      // Feedback loop: notify Watchtower
      App.triggerFeedback('deal_closed', { name: item.name || 'Deal', company: item.company || '' });
    }

    App.saveData();
    this.render();
  },

  removeFromPipeline(itemId, stage) {
    const p = App.data.pipeline;
    p[stage] = (p[stage] || []).filter(i => i.id !== itemId);
    App.saveData();
    this.render();
  }
};
