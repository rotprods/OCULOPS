/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — NEXT LEVEL Intelligence
   Command Palette + AI Insights + Particles + Health
   ═══════════════════════════════════════════════════ */

/* ── Command Palette (⌘K) ── */
const CmdPalette = {
    selectedIdx: 0,
    items: [],

    init() {
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }
        });
    },

    open() {
        const backdrop = document.getElementById('cmd-backdrop');
        backdrop.classList.add('visible');
        const input = document.getElementById('cmd-input');
        input.value = '';
        input.focus();
        this.selectedIdx = 0;
        this.filter('');
    },

    close() {
        document.getElementById('cmd-backdrop').classList.remove('visible');
    },

    getCommands() {
        const d = App.data;
        return [
            // Navigation
            { group: 'Navegación', icon: '📡', label: 'Control Tower', action: () => App.navigate('control-tower'), shortcut: 'Alt+1' },
            { group: 'Navegación', icon: '🚀', label: 'Execution OS', action: () => App.navigate('execution'), shortcut: 'Alt+2' },
            { group: 'Navegación', icon: '🌐', label: 'Market Intel', action: () => App.navigate('intelligence'), shortcut: 'Alt+3' },
            { group: 'Navegación', icon: '🧠', label: 'Data Brain', action: () => App.navigate('data-brain'), shortcut: 'Alt+4' },
            { group: 'Navegación', icon: '⚖️', label: 'Decision Ops', action: () => App.navigate('decision'), shortcut: 'Alt+5' },
            { group: 'Navegación', icon: '📊', label: 'Simulación', action: () => App.navigate('simulation'), shortcut: 'Alt+6' },
            { group: 'Navegación', icon: '🎯', label: 'GTM Machine', action: () => App.navigate('gtm'), shortcut: 'Alt+7' },
            { group: 'Navegación', icon: '🔄', label: 'Sales Pipeline', action: () => App.navigate('pipeline'), shortcut: 'Alt+8' },
            { group: 'Navegación', icon: '🗼', label: 'Watchtower', action: () => App.navigate('watchtower'), shortcut: 'Alt+9' },
            { group: 'Navegación', icon: '💰', label: 'Finance', action: () => App.navigate('finance'), shortcut: 'Alt+0' },
            { group: 'Navegación', icon: '💎', label: 'Opportunities', action: () => App.navigate('opportunities') },
            { group: 'Navegación', icon: '📚', label: 'Knowledge Vault', action: () => App.navigate('knowledge') },

            // Actions
            { group: 'Acciones', icon: '➕', label: 'Añadir Lead', action: () => { App.navigate('gtm'); setTimeout(() => document.querySelector('#mod-gtm .btn-primary')?.click(), 200); } },
            { group: 'Acciones', icon: '📊', label: 'Simular MRR', action: () => { App.navigate('simulation'); setTimeout(() => Simulation.runSimulation(), 200); } },
            { group: 'Acciones', icon: '📥', label: 'Exportar datos', action: () => App.exportData() },
            { group: 'Acciones', icon: '🔍', label: 'Ver Insights AI', action: () => AIInsights.showPanel() },
            { group: 'Acciones', icon: '❓', label: 'Atajos de teclado', action: () => this.showShortcuts() },

            // Data Search
            ...(d.leads || []).slice(0, 5).map(l => ({
                group: 'Leads', icon: '👤', label: `${l.name} — ${l.company}`, action: () => App.navigate('gtm')
            })),
            ...(d.niches || []).map(n => ({
                group: 'Nichos', icon: '🎯', label: n.name, action: () => App.navigate('decision')
            }))
        ];
    },

    filter(query) {
        const cmds = this.getCommands();
        const q = query.toLowerCase();
        this.items = q ? cmds.filter(c =>
            c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
        ) : cmds;
        this.selectedIdx = 0;
        this.renderResults();
    },

    renderResults() {
        const el = document.getElementById('cmd-results');
        if (!this.items.length) {
            el.innerHTML = '<div style="padding:var(--space-5);text-align:center;color:var(--text-tertiary)">Sin resultados</div>';
            return;
        }
        let html = '';
        let currentGroup = '';
        this.items.forEach((item, idx) => {
            if (item.group !== currentGroup) {
                currentGroup = item.group;
                html += `<div class="cmd-result-group">${currentGroup}</div>`;
            }
            html += `
        <div class="cmd-result-item ${idx === this.selectedIdx ? 'selected' : ''}" onclick="CmdPalette.execute(${idx})" onmouseover="CmdPalette.selectedIdx=${idx};CmdPalette.renderResults()">
          <span class="cmd-icon">${item.icon}</span>
          <span>${item.label}</span>
          ${item.shortcut ? `<span class="cmd-shortcut">${item.shortcut}</span>` : ''}
        </div>`;
        });
        el.innerHTML = html;
    },

    handleKey(e) {
        if (e.key === 'Escape') return this.close();
        if (e.key === 'ArrowDown') { e.preventDefault(); this.selectedIdx = Math.min(this.selectedIdx + 1, this.items.length - 1); this.renderResults(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); this.selectedIdx = Math.max(this.selectedIdx - 1, 0); this.renderResults(); }
        if (e.key === 'Enter') { e.preventDefault(); this.execute(this.selectedIdx); }
    },

    execute(idx) {
        const item = this.items[idx];
        if (item) { this.close(); item.action(); }
    },

    showShortcuts() {
        App.openModal(`
      <h2>⌨️ Atajos de Teclado</h2>
      <div class="table-container" style="margin-top:var(--space-4)">
        <table>
          <thead><tr><th>Atajo</th><th>Acción</th></tr></thead>
          <tbody>
            <tr><td class="text-mono">⌘K / Ctrl+K</td><td>Abrir paleta de comandos</td></tr>
            <tr><td class="text-mono">Alt + 1-0</td><td>Navegar a módulo (1=Tower, 0=Finance)</td></tr>
            <tr><td class="text-mono">Escape</td><td>Cerrar modal / paleta</td></tr>
          </tbody>
        </table>
      </div>
    `);
    }
};

/* ── AI Insights Engine ── */
const AIInsights = {
    generate() {
        const d = App.data;
        const insights = [];
        const mrr = d.finance?.mrr || 0;
        const target = d.meta?.targetMRR || 20000;
        const clients = d.finance?.clients || 0;
        const leadsCount = (d.leads || []).length;
        const pipelineTotal = Object.values(d.pipeline || {}).reduce((s, arr) => s + arr.length, 0);
        const day = d.execution?.currentDay || 1;
        const activeAlerts = (d.alerts || []).filter(a => a.status === 'active').length;
        const closedDeals = (d.pipeline?.closed || []).length;
        const meetingsActive = (d.pipeline?.meeting || []).length;
        const proposals = (d.pipeline?.proposal || []).length;
        const capacity = d.simulation?.capacity || 10;

        // Revenue velocity
        if (mrr === 0 && day > 15) {
            insights.push({ icon: '🚨', title: 'Revenue en cero', text: `Día ${day} y MRR sigue en 0€. Necesitas cerrar al menos 1 deal para validar modelo. Prioriza reuniones sobre outreach.`, tag: 'URGENTE', priority: 10 });
        } else if (mrr > 0 && mrr < target * 0.25) {
            insights.push({ icon: '📈', title: 'Tracción temprana detectada', text: `MRR en ${mrr.toLocaleString()}€ (${((mrr / target) * 100).toFixed(0)}% del objetivo). Necesitas ${Math.ceil((target - mrr) / (d.simulation?.avgTicket || 2500))} clientes más para alcanzar ${target.toLocaleString()}€.`, tag: 'GROWTH', priority: 7 });
        }

        // Pipeline health
        if (leadsCount > 10 && meetingsActive === 0) {
            insights.push({ icon: '⚠️', title: 'Pipeline obstruido', text: `${leadsCount} leads pero 0 meetings activas. Tu cuello de botella está en la conversión Lead→Meeting. Revisa tu secuencia de outreach.`, tag: 'PIPELINE', priority: 9 });
        }
        if (proposals > 0 && closedDeals === 0) {
            insights.push({ icon: '💡', title: 'Propuestas sin cerrar', text: `${proposals} propuestas enviadas, 0 cerradas. Posibles causas: pricing, timing, o falta de follow-up. Revisa tu proceso.`, tag: 'SALES', priority: 8 });
        }

        // Capacity
        const capacityUsed = (clients / capacity) * 100;
        if (capacityUsed >= 80) {
            insights.push({ icon: '⚡', title: 'Cerca de capacidad máxima', text: `${clients}/${capacity} clientes (${Math.round(capacityUsed)}%). Planifica contratación o automatización antes de saturarte.`, tag: 'CAPACITY', priority: 8 });
        }

        // Execution velocity
        const pendingTasks = (d.execution?.tasks || []).filter(t => t.status === 'pending').length;
        const totalTasks = (d.execution?.tasks || []).length;
        if (totalTasks > 0 && pendingTasks / totalTasks > 0.7 && day > 30) {
            insights.push({ icon: '🐢', title: 'Ejecución lenta', text: `${pendingTasks}/${totalTasks} tareas pendientes en día ${day}. Estás ejecutando al ${((1 - pendingTasks / totalTasks) * 100).toFixed(0)}%. Foco en tareas de alto impacto.`, tag: 'EXECUTION', priority: 7 });
        }

        // Alerts
        if (activeAlerts > 3) {
            insights.push({ icon: '🗼', title: `${activeAlerts} alertas activas`, text: `Múltiples alertas sin resolver. Revisa Watchtower y prioriza por severidad.`, tag: 'WATCHTOWER', priority: 6 });
        }

        // Data quality
        const totalEntities = leadsCount + (d.companies || []).length + (d.signals || []).length;
        if (totalEntities === 0) {
            insights.push({ icon: '📊', title: 'Base de datos vacía', text: `No hay entidades en el Data Brain. Comienza añadiendo tu ICP, leads cualificados y señales de mercado.`, tag: 'DATA', priority: 5 });
        }

        // Knowledge
        if ((d.knowledge || []).length === 0 && day > 7) {
            insights.push({ icon: '📚', title: 'Sin learnings registrados', text: `No hay entradas en Knowledge Vault. Documenta tus aprendizajes para construir ventaja competitiva.`, tag: 'KNOWLEDGE', priority: 4 });
        }

        // Positive reinforcement
        if (closedDeals > 0) {
            insights.push({ icon: '🏆', title: `${closedDeals} deal${closedDeals > 1 ? 's' : ''} cerrado${closedDeals > 1 ? 's' : ''}`, text: `¡Bien! Has cerrado ${closedDeals} deal${closedDeals > 1 ? 's' : ''}. Enfoca en retention y upsell al ${Math.round(capacityUsed)}% de capacidad.`, tag: 'WIN', priority: 3 });
        }

        return insights.sort((a, b) => b.priority - a.priority);
    },

    // System health: composite score
    healthScore() {
        const d = App.data;
        const scores = [];
        const mrr = d.finance?.mrr || 0;
        const target = d.meta?.targetMRR || 20000;
        const day = d.execution?.currentDay || 1;
        const totalTasks = (d.execution?.tasks || []).length;
        const doneTasks = (d.execution?.tasks || []).filter(t => t.status === 'done').length;
        const leadsCount = (d.leads || []).length;
        const pipelineTotal = Object.values(d.pipeline || {}).reduce((s, arr) => s + arr.length, 0);

        // Revenue progress (0-100)
        scores.push({ name: 'Revenue', score: Math.min((mrr / target) * 100, 100), color: '#00d26a' });
        // Execution progress
        scores.push({ name: 'Ejecución', score: totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 50, color: '#54a0ff' });
        // Pipeline fullness
        scores.push({ name: 'Pipeline', score: Math.min(pipelineTotal * 10, 100), color: '#00d2d3' });
        // Data richness
        const entities = leadsCount + (d.companies || []).length + (d.signals || []).length + (d.knowledge || []).length;
        scores.push({ name: 'Data', score: Math.min(entities * 5, 100), color: '#f368e0' });

        const overall = Math.round(scores.reduce((s, s2) => s + s2.score, 0) / scores.length);
        return { overall, components: scores };
    },

    showPanel() {
        const insights = this.generate();
        const health = this.healthScore();

        App.openModal(`
      <h2 style="display:flex;align-items:center;gap:var(--space-3)">🤖 AI Intelligence Panel <span class="badge badge-info">Auto-Generated</span></h2>

      <div style="margin:var(--space-5) 0">
        <div class="flex items-center gap-4 mb-4">
          <div>
            ${Charts.scoreRing(health.overall, 100, 80, health.overall >= 60 ? Charts.colors.success : health.overall >= 30 ? Charts.colors.warning : Charts.colors.danger)}
          </div>
          <div>
            <div style="font-size:var(--text-lg);font-weight:800">System Health: ${health.overall}%</div>
            <div class="text-muted" style="font-size:var(--text-xs)">Score compuesto de Revenue + Ejecución + Pipeline + Data</div>
          </div>
        </div>
        <div class="health-bar mb-4">
          ${health.components.map(c => `<div class="health-segment" style="width:${c.score / health.components.length}%;background:${c.color}" title="${c.name}: ${Math.round(c.score)}%"></div>`).join('')}
        </div>
        <div class="grid-4" style="gap:var(--space-3);margin-bottom:var(--space-5)">
          ${health.components.map(c => `
            <div style="text-align:center">
              <div class="text-mono" style="font-size:var(--text-lg);font-weight:800;color:${c.color}">${Math.round(c.score)}%</div>
              <div class="text-muted" style="font-size:var(--text-xs)">${c.name}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="divider"></div>

      <h3 style="margin:var(--space-4) 0 var(--space-3)">📡 Strategic Insights (${insights.length})</h3>
      <div style="display:flex;flex-direction:column;gap:var(--space-3);max-height:300px;overflow-y:auto">
        ${insights.length > 0 ? insights.map(i => `
          <div class="insight-card">
            <span class="insight-icon">${i.icon}</span>
            <div class="insight-content">
              <div class="insight-title">${i.title}</div>
              <div class="insight-text">${i.text}</div>
              <span class="insight-tag">${i.tag}</span>
            </div>
          </div>
        `).join('') : '<div class="text-muted text-center" style="padding:var(--space-5)">No hay insights disponibles. Comienza añadiendo datos al sistema.</div>'}
      </div>
    `);
    }
};

/* ── Particle Constellation (sidebar background) ── */
const Particles = {
    init() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar || document.getElementById('particle-canvas')) return;
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        sidebar.style.position = 'relative';
        sidebar.insertBefore(canvas, sidebar.firstChild);

        const ctx = canvas.getContext('2d');
        const particles = [];
        const count = 30;

        const resize = () => {
            canvas.width = sidebar.offsetWidth;
            canvas.height = sidebar.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.5 + 0.5
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update & draw particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 210, 211, 0.5)';
                ctx.fill();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 80) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(0, 210, 211, ${0.15 * (1 - dist / 80)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(draw);
        };
        draw();
    }
};

// ── Boot next-level features ──
document.addEventListener('DOMContentLoaded', () => {
    CmdPalette.init();
    Particles.init();
});
