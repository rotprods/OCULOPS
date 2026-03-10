/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Watchtower
   Alert system with 6 types + 4-level escalation
   ═══════════════════════════════════════════════════ */

const Watchtower = {
    alertTypes: [
        { key: 'competitive', icon: '⚔️', label: 'Competencia', color: 'var(--danger)' },
        { key: 'opportunity', icon: '💎', label: 'Oportunidad', color: 'var(--success)' },
        { key: 'churn', icon: '📉', label: 'Churn Risk', color: 'var(--warning)' },
        { key: 'capacity', icon: '⚡', label: 'Capacidad', color: 'var(--info)' },
        { key: 'cash', icon: '💸', label: 'Cash', color: 'var(--danger)' },
        { key: 'concentration', icon: '🎯', label: 'Concentración', color: 'var(--accent-tertiary)' }
    ],

    severityLevels: [
        { level: 1, label: 'Info', color: 'var(--text-tertiary)', action: 'Log → revisión semanal' },
        { level: 2, label: 'Warning', color: 'var(--warning)', action: 'Notif. diaria → acción 48h' },
        { level: 3, label: 'Critical', color: 'var(--danger)', action: 'Notif. inmediata → acción 4h' },
        { level: 4, label: 'Emergency', color: '#ff0000', action: 'DETENER TODO → resolución inmediata' }
    ],

    render() {
        const alerts = App.data.alerts || [];
        const active = alerts.filter(a => a.status === 'active');
        const resolved = alerts.filter(a => a.status === 'resolved');
        const el = document.getElementById('mod-watchtower');

        el.innerHTML = `
      <div class="module-header">
        <h1>Watchtower</h1>
        <p>Sistema de alertas proactivo. 6 tipos de alerta con escalación de 4 niveles.</p>
      </div>

      <!-- Alert Summary -->
      <div class="grid-3 mb-6">
        ${this.alertTypes.slice(0, 3).map(at => {
            const count = active.filter(a => a.type === at.key).length;
            return `<div class="kpi-card">
            <div class="kpi-icon" style="background:${at.color}22;color:${at.color}">${at.icon}</div>
            <div class="kpi-value">${count}</div>
            <div class="kpi-label">${at.label}</div>
          </div>`;
        }).join('')}
      </div>

      <!-- Escalation Protocol -->
      <div class="card mb-6">
        <div class="card-header"><div class="card-title">🚨 Protocolo de Escalación</div></div>
        <div class="grid-4" style="gap:var(--space-3)">
          ${this.severityLevels.map(s => `
            <div style="text-align:center;padding:var(--space-3);background:var(--bg-primary);border-radius:var(--radius-sm);border-top:3px solid ${s.color}">
              <div style="font-weight:700;font-size:var(--text-lg);color:${s.color}">S${s.level}</div>
              <div style="font-weight:600;font-size:var(--text-sm)">${s.label}</div>
              <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:var(--space-2)">${s.action}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Create Alert -->
      <div class="card mb-6">
        <div class="card-header"><div class="card-title">➕ Nueva Alerta</div></div>
        <div class="grid-2" style="gap:var(--space-3)">
          <div class="input-group">
            <label>Tipo</label>
            <select class="input" id="alert-type">
              ${this.alertTypes.map(at => `<option value="${at.key}">${at.icon} ${at.label}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label>Severidad</label>
            <select class="input" id="alert-severity">
              ${this.severityLevels.map(s => `<option value="${s.level}">S${s.level} — ${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="input-group" style="grid-column:span 2">
            <label>Descripción</label>
            <input class="input" id="alert-desc" placeholder="Descripción de la alerta">
          </div>
          <div class="input-group">
            <label>Trigger / Threshold</label>
            <input class="input" id="alert-trigger" placeholder="Ej: response_rate < 5%">
          </div>
          <div class="input-group">
            <label>Acción requerida</label>
            <input class="input" id="alert-action" placeholder="¿Qué hacer?">
          </div>
        </div>
        <button class="btn btn-primary mt-4" onclick="Watchtower.addAlert()">Crear Alerta</button>
      </div>

      <!-- Active Alerts -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🔴 Alertas Activas (${active.length})</div>
        </div>
        ${active.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <h3>Todo en orden</h3>
            <p class="text-muted">No hay alertas activas</p>
          </div>
        ` : active.sort((a, b) => b.severity - a.severity).map(a => {
            const at = this.alertTypes.find(t => t.key === a.type) || {};
            const sv = this.severityLevels.find(s => s.level === a.severity) || {};
            return `
            <div class="alert mb-3" style="background:${sv.color}11;border-color:${sv.color}33;color:var(--text-primary)">
              <span style="font-size:20px">${at.icon || '⚠️'}</span>
              <div style="flex:1">
                <div style="font-weight:700;font-size:var(--text-sm)">${a.description}</div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px">
                  Trigger: ${a.trigger || '-'} · Acción: ${a.action || '-'}
                </div>
              </div>
              <span class="badge" style="background:${sv.color}22;color:${sv.color}">S${a.severity}</span>
              <button class="btn btn-sm" onclick="Watchtower.resolveAlert('${a.id}')">✓ Resolver</button>
            </div>`;
        }).join('')}
      </div>

      <!-- Resolved -->
      ${resolved.length > 0 ? `
        <div class="card">
          <div class="card-header"><div class="card-title">✅ Resueltas (${resolved.length})</div></div>
          ${resolved.slice(-5).map(a => `
            <div class="flex items-center gap-3 mb-2" style="font-size:var(--text-sm);opacity:0.6">
              <span>✅</span><span style="flex:1">${a.description}</span>
              <span class="text-mono" style="font-size:var(--text-xs)">${a.resolvedDate || ''}</span>
            </div>
          `).join('')}
        </div>` : ''}
    `;
    },

    addAlert() {
        const alert = {
            id: App.uid(),
            type: document.getElementById('alert-type').value,
            severity: parseInt(document.getElementById('alert-severity').value),
            description: document.getElementById('alert-desc').value.trim(),
            trigger: document.getElementById('alert-trigger').value.trim(),
            action: document.getElementById('alert-action').value.trim(),
            status: 'active',
            createdDate: new Date().toISOString().split('T')[0]
        };
        if (!alert.description) return App.toast('Descripción requerida', 'warning');
        App.data.alerts.push(alert);
        App.saveData();
        this.render();
        App.toast('Alerta creada', 'success');
    },

    resolveAlert(id) {
        const alert = App.data.alerts.find(a => a.id === id);
        if (alert) {
            alert.status = 'resolved';
            alert.resolvedDate = new Date().toISOString().split('T')[0];
        }
        App.saveData();
        this.render();
        App.toast('Alerta resuelta', 'success');
    }
};
