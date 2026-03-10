/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Execution OS
   30-day plan with gates and progress tracking
   ═══════════════════════════════════════════════════ */

const Execution = {
    render() {
        const d = App.data.execution || {};
        const tasks = d.tasks || [];
        const done = tasks.filter(t => t.status === 'done').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const pct = tasks.length > 0 ? ((done / tasks.length) * 100).toFixed(0) : 0;

        // Group by week
        const weeks = [
            { label: 'Semana 1 (Día 1-7)', range: [1, 7], gate: '≥3 respuestas' },
            { label: 'Semana 2 (Día 8-14)', range: [8, 14], gate: '≥1 propuesta enviada' },
            { label: 'Semana 3 (Día 15-21)', range: [15, 21], gate: '≥1 cierre' },
            { label: 'Semana 4 (Día 22-30)', range: [22, 30], gate: 'MRR >0 + Pipeline >15k€' }
        ];

        const el = document.getElementById('mod-execution');
        el.innerHTML = `
      <div class="module-header">
        <h1>Execution OS</h1>
        <p>Plan de acción de 30 días con gates de validación. No avanzas sin cumplir métricas.</p>
      </div>

      <!-- Progress Summary -->
      <div class="grid-4 mb-6">
        <div class="kpi-card">
          <div class="kpi-value" style="color:var(--accent-primary)">${pct}%</div>
          <div class="kpi-label">Progreso Total</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value" style="color:var(--success)">${done}</div>
          <div class="kpi-label">Completadas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value" style="color:var(--warning)">${inProgress}</div>
          <div class="kpi-label">En progreso</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${tasks.length - done - inProgress}</div>
          <div class="kpi-label">Pendientes</div>
        </div>
      </div>

      <!-- Weeks -->
      ${weeks.map(week => {
            const weekTasks = tasks.filter(t => t.day >= week.range[0] && t.day <= week.range[1]);
            const weekDone = weekTasks.filter(t => t.status === 'done').length;
            const weekPct = weekTasks.length > 0 ? ((weekDone / weekTasks.length) * 100).toFixed(0) : 0;
            return `
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">${week.label}</div>
              <div class="flex items-center gap-3">
                <div class="progress-labeled" style="width:120px">
                  <div class="progress-bar"><div class="progress-fill" style="width:${weekPct}%"></div></div>
                  <span class="progress-text">${weekPct}%</span>
                </div>
                <div class="badge badge-warning">🚧 Gate: ${week.gate}</div>
              </div>
            </div>
            ${weekTasks.map(t => `
              <div class="flex items-center gap-3 mb-2" style="font-size:var(--text-sm);padding:var(--space-2) 0">
                <button class="btn-icon btn-ghost" style="font-size:18px" onclick="Execution.toggleTask(${t.day})">
                  ${t.status === 'done' ? '✅' : t.status === 'in-progress' ? '🔄' : '⬜'}
                </button>
                <span class="badge badge-neutral" style="min-width:35px">D${t.day}</span>
                <span style="flex:1;${t.status === 'done' ? 'text-decoration:line-through;color:var(--text-tertiary)' : ''}">${t.task}</span>
                ${t.gate ? `<span class="badge badge-warning" style="font-size:9px">GATE</span>` : ''}
              </div>
            `).join('')}
          </div>`;
        }).join('')}

      <!-- Custom Task -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">➕ Añadir Tarea Personalizada</div>
        </div>
        <div class="flex gap-3">
          <input class="input" id="exec-new-day" type="number" placeholder="Día" style="width:80px" min="1" max="90">
          <input class="input" id="exec-new-task" type="text" placeholder="Descripción de la tarea" style="flex:1">
          <input class="input" id="exec-new-gate" type="text" placeholder="Gate (opcional)" style="width:200px">
          <button class="btn btn-primary" onclick="Execution.addTask()">Añadir</button>
        </div>
      </div>
    `;
    },

    toggleTask(day) {
        const task = App.data.execution.tasks.find(t => t.day === day);
        if (!task) return;
        const cycle = { 'pending': 'in-progress', 'in-progress': 'done', 'done': 'pending' };
        task.status = cycle[task.status] || 'pending';
        App.saveData();
        this.render();
    },

    addTask() {
        const day = parseInt(document.getElementById('exec-new-day').value);
        const task = document.getElementById('exec-new-task').value.trim();
        const gate = document.getElementById('exec-new-gate').value.trim();
        if (!day || !task) return App.toast('Completa día y tarea', 'warning');
        App.data.execution.tasks.push({ day, task, status: 'pending', gate: gate || null });
        App.data.execution.tasks.sort((a, b) => a.day - b.day);
        App.saveData();
        this.render();
        App.toast('Tarea añadida', 'success');
    }
};
