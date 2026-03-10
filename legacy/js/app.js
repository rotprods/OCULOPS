/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — Core Application
   ═══════════════════════════════════════════════════ */

const App = {
    currentModule: 'control-tower',
    data: {},

    /* ── Initialize ── */
    init() {
        this.loadData();
        this.updateDate();
        this.navigate('control-tower');
        this.initKeyboardShortcuts();
        setInterval(() => this.updateDate(), 60000);
        console.log('⚡ ANTIGRAVITY OS v10 initialized');
    },

    /* ── Navigation ── */
    navigate(moduleId) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.module === moduleId);
        });
        // Update modules
        document.querySelectorAll('.module').forEach(el => {
            el.classList.toggle('active', el.id === `mod-${moduleId}`);
        });
        // Update header
        const titles = {
            'control-tower': '📡 Control Tower',
            'execution': '🚀 Execution OS',
            'intelligence': '🌍 Market Intelligence',
            'data-brain': '🧠 Data Brain',
            'decision': '⚖️ Decision Ops',
            'simulation': '📊 Simulation Engine',
            'gtm': '🎯 GTM Machine',
            'pipeline': '🔄 Sales Pipeline',
            'watchtower': '🗼 Watchtower',
            'finance': '💰 Finance',
            'opportunities': '💎 Opportunity Engine',
            'knowledge': '📚 Knowledge Vault'
        };
        document.getElementById('header-title').textContent = titles[moduleId] || moduleId;
        this.currentModule = moduleId;

        // Render module
        const renderers = {
            'control-tower': () => ControlTower.render(),
            'execution': () => Execution.render(),
            'intelligence': () => Intelligence.render(),
            'data-brain': () => DataBrain.render(),
            'decision': () => DecisionOps.render(),
            'simulation': () => Simulation.render(),
            'gtm': () => GTM.render(),
            'pipeline': () => Pipeline.render(),
            'watchtower': () => Watchtower.render(),
            'finance': () => Finance.render(),
            'opportunities': () => Opportunities.render(),
            'knowledge': () => Knowledge.render(),
            'agents': () => Agents.render()
        };
        if (renderers[moduleId]) renderers[moduleId]();

        // Scroll to top
        document.getElementById('main-content').scrollTop = 0;

        // Update sidebar footer
        this.updateSidebarFooter();
    },

    /* ── Data Persistence ── */
    loadData() {
        const saved = localStorage.getItem('antigravity-os-v10');
        this.data = saved ? JSON.parse(saved) : this.getDefaultData();
    },

    saveData() {
        localStorage.setItem('antigravity-os-v10', JSON.stringify(this.data));
    },

    getDefaultData() {
        return {
            // Meta
            meta: {
                startDate: new Date().toISOString().split('T')[0],
                targetMRR: 20000,
                ultimateTarget: 100000,
                budget: 3000,
                hoursPerDay: 8
            },

            // Leads / Pipeline
            leads: [],
            pipeline: {
                lead: [], contacted: [], response: [], meeting: [], proposal: [], closed: [], onboarding: []
            },

            // Finance
            finance: {
                revenue: [], expenses: [], mrr: 0, clients: 0, avgTicket: 0
            },

            // Simulation defaults
            simulation: {
                contactsPerWeek: 20,
                responseRate: 15,
                meetingRate: 40,
                closeRate: 30,
                avgTicket: 2500,
                churn: 5,
                capacity: 8
            },

            // Watchtower alerts
            alerts: [],

            // Decisions log
            decisions: [],

            // Experiments
            experiments: [],

            // Opportunities
            opportunities: [],

            // Knowledge entries
            knowledge: [],

            // Companies & Competitors (Data Brain)
            companies: [],
            competitors: [],

            // Execution plan
            execution: {
                currentDay: 1,
                tasks: this.getDefaultTasks()
            },

            // ICP definition
            icp: {
                companySize: '10-200 empleados',
                decisionMaker: 'CEO / COO / Head of Marketing',
                painPoints: 'Procesos manuales, falta de automatización, costes de personal',
                techStack: 'CRM, email marketing, básico digital',
                budget: '2000-5000€/mes',
                buySignals: 'Contratando, funding reciente, crecimiento rápido'
            },

            // Scoring: Niches
            niches: [
                { id: 1, name: 'E-commerce', impact: 80, velocity: 70, scalability: 85, confidence: 65, risk: 30, resourceCost: 40 },
                { id: 2, name: 'Clínicas / Salud', impact: 75, velocity: 60, scalability: 70, confidence: 70, risk: 25, resourceCost: 35 },
                { id: 3, name: 'Inmobiliarias', impact: 70, velocity: 80, scalability: 60, confidence: 75, risk: 20, resourceCost: 30 },
                { id: 4, name: 'SaaS B2B', impact: 90, velocity: 50, scalability: 90, confidence: 55, risk: 40, resourceCost: 50 },
                { id: 5, name: 'Agencias Marketing', impact: 65, velocity: 75, scalability: 65, confidence: 80, risk: 15, resourceCost: 25 }
            ],

            // Portfolio Bets
            bets: [
                { id: 1, type: 'core', name: 'Automatización para e-commerce', hypothesis: 'Los e-commerce de 1-10M necesitan chatbots + email automation', kpi: '3 clientes en 30 días', killCriteria: '<5% response rate tras 100 contactos', pivotPath: 'Redirigir assets a clínicas', status: 'active', resources: '50%' },
                { id: 2, type: 'core', name: 'IA para inmobiliarias', hypothesis: 'Las inmobiliarias necesitan cualificación automática de leads', kpi: '2 clientes en 30 días', killCriteria: 'Ciclo de venta >45 días', pivotPath: 'Usar tech para agencias marketing', status: 'active', resources: '30%' },
                { id: 3, type: 'explore', name: 'Content marketing IA (inbound)', hypothesis: 'Contenido sobre IA en España atrae leads cualificados', kpi: '500 visitas/mes + 10 leads', killCriteria: '<100 visitas en 30 días', pivotPath: 'Usar contenido como asset de autoridad en outbound', status: 'active', resources: '15%' },
                { id: 4, type: 'explore', name: 'Partnership con agencias web', hypothesis: 'Agencias web refieren clientes que necesitan IA', kpi: '2 referrals en 30 días', killCriteria: '0 referrals en 45 días', pivotPath: 'Convertir en oferta white-label', status: 'active', resources: '5%' }
            ],

            // Resource Allocation
            resources: {
                outbound: 37,
                delivery: 30,
                content: 12,
                systems: 10,
                strategy: 5,
                admin: 6
            },

            // AI Agents
            agents: { active: true },

            // Signals
            signals: []
        };
    },

    getDefaultTasks() {
        return [
            { day: 1, task: 'Definir ICP específico + oferta concreta + pricing', status: 'pending', gate: null },
            { day: 2, task: 'Investigar 30 empresas target con señales de compra', status: 'pending', gate: null },
            { day: 3, task: 'Construir lista de 30 leads hipercualificados', status: 'pending', gate: null },
            { day: 4, task: 'Escribir 3 scripts de outreach (DM, email, follow-up)', status: 'pending', gate: null },
            { day: 5, task: 'Preparar propuesta template + pricing sheet', status: 'pending', gate: null },
            { day: 6, task: 'Lanzar outbound: 10 contactos/día', status: 'pending', gate: null },
            { day: 7, task: 'Revisar respuestas + ajustar messaging', status: 'pending', gate: '≥3 respuestas' },
            { day: 8, task: 'Seguir outbound + agendar meetings', status: 'pending', gate: null },
            { day: 9, task: 'Preparar deck de ventas y demo', status: 'pending', gate: null },
            { day: 10, task: 'Primera ronda de meetings', status: 'pending', gate: null },
            { day: 11, task: 'Follow-up meetings + enviar propuestas', status: 'pending', gate: null },
            { day: 12, task: 'Ampliar lista de leads: 30 más', status: 'pending', gate: null },
            { day: 13, task: 'Negociación + cierre primer deal', status: 'pending', gate: null },
            { day: 14, task: 'Review semana 2: ≥1 propuesta enviada', status: 'pending', gate: '≥1 propuesta' },
            { day: 15, task: 'Iniciar delivery primer cliente', status: 'pending', gate: null },
            { day: 16, task: 'Setup entorno + onboarding cliente', status: 'pending', gate: null },
            { day: 17, task: 'Entrega primer milestone', status: 'pending', gate: null },
            { day: 18, task: 'Continuar outbound paralelo', status: 'pending', gate: null },
            { day: 19, task: 'Segunda ronda de meetings', status: 'pending', gate: null },
            { day: 20, task: 'Segundo cierre esperado', status: 'pending', gate: null },
            { day: 21, task: 'Review día 21: ≥1 cliente activo', status: 'pending', gate: '≥1 cierre' },
            { day: 22, task: 'Crear caso de estudio del primer cliente', status: 'pending', gate: null },
            { day: 23, task: 'Publicar contenido con caso de estudio', status: 'pending', gate: null },
            { day: 24, task: 'Outbound con caso de estudio como proof', status: 'pending', gate: null },
            { day: 25, task: 'Optimizar pipeline y templates', status: 'pending', gate: null },
            { day: 26, task: 'Ampliar a 60 leads cualificados', status: 'pending', gate: null },
            { day: 27, task: 'Meetings con leads nuevos', status: 'pending', gate: null },
            { day: 28, task: 'Negociación deals pipeline', status: 'pending', gate: null },
            { day: 29, task: 'Crear SOPs básicos de delivery', status: 'pending', gate: null },
            { day: 30, task: 'Review mes 1: MRR > 0 + pipeline > 15k€', status: 'pending', gate: 'MRR >0 + Pipeline >15k€' }
        ];
    },

    /* ── Modal ── */
    openModal(html) {
        document.getElementById('modal-content').innerHTML = html;
        document.getElementById('modal-backdrop').classList.add('visible');
    },

    closeModal() {
        document.getElementById('modal-backdrop').classList.remove('visible');
    },

    /* ── Toast ── */
    toast(message, type = 'info') {
        const icons = { success: '✅', warning: '⚠️', danger: '❌', info: 'ℹ️' };
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    /* ── Date ── */
    updateDate() {
        const now = new Date();
        const opts = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        document.getElementById('header-date').textContent = now.toLocaleDateString('es-ES', opts);
    },

    /* ── Export/Import ── */
    exportData() {
        const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `antigravity-os-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast('Datos exportados', 'success');
    },

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.data = JSON.parse(e.target.result);
                this.saveData();
                this.navigate(this.currentModule);
                this.toast('Datos importados correctamente', 'success');
            } catch (err) {
                this.toast('Error al importar datos', 'danger');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('mobile-open');
    },

    /* ── Helper: Unique ID ── */
    uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    /* ── Confirm Dialog ── */
    confirm(message, onConfirm) {
        this.openModal(`
            <h2>⚠️ Confirmar</h2>
            <p style="color:var(--text-secondary);margin-bottom:var(--space-5)">${message}</p>
            <div class="flex gap-3" style="justify-content:flex-end">
                <button class="btn" onclick="App.closeModal()">Cancelar</button>
                <button class="btn btn-danger" id="confirm-action-btn">Confirmar</button>
            </div>
        `);
        document.getElementById('confirm-action-btn').onclick = () => {
            App.closeModal();
            onConfirm();
        };
    },

    /* ── CEO Decision Formula ── */
    ceoScore(item, phase = '0-20k') {
        const w = phase === '0-20k'
            ? { impact: 1.2, velocity: 1.5, scalability: 0.5, confidence: 1.0 }
            : { impact: 1.0, velocity: 0.8, scalability: 1.5, confidence: 1.0 };

        const norm = v => Math.max(v, 1) / 100;
        const numerator =
            Math.pow(norm(item.impact), w.impact) *
            Math.pow(norm(item.velocity), w.velocity) *
            Math.pow(norm(item.scalability), w.scalability) *
            Math.pow(norm(item.confidence), w.confidence);

        const denominator = norm(item.risk || 50) * norm(item.resourceCost || 50);
        return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
    },

    /* ── Global Progress ── */
    updateGlobalProgress() {
        const mrr = this.data.finance?.mrr || 0;
        const target = this.data.meta?.targetMRR || 20000;
        const pct = Math.min((mrr / target) * 100, 100);
        const bar = document.getElementById('global-progress');
        if (bar) bar.style.width = `${pct}%`;
    },

    /* ── Sidebar Footer Live Update ── */
    updateSidebarFooter() {
        const mrr = this.data.finance?.mrr || 0;
        const target = this.data.meta?.ultimateTarget || 100000;
        const footerEl = document.querySelector('.sidebar > div:last-child > div:first-child');
        if (footerEl) footerEl.textContent = `META: ${mrr.toLocaleString()}€ → ${(target / 1000).toFixed(0)}k€/mes`;
        this.updateGlobalProgress();
    },

    /* ── Keyboard Shortcuts ── */
    initKeyboardShortcuts() {
        const moduleKeys = {
            '1': 'control-tower', '2': 'execution', '3': 'intelligence',
            '4': 'data-brain', '5': 'decision', '6': 'simulation',
            '7': 'gtm', '8': 'pipeline', '9': 'watchtower', '0': 'finance'
        };
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.key === 'Escape') return this.closeModal();
            if (e.altKey && moduleKeys[e.key]) {
                e.preventDefault();
                this.navigate(moduleKeys[e.key]);
            }
        });
    },

    /* ── Feedback Loops ── */
    triggerFeedback(event, data) {
        switch (event) {
            case 'deal_closed':
                // Auto-create alert
                if (!this.data.alerts) this.data.alerts = [];
                this.data.alerts.push({
                    id: this.uid(), type: 'opportunity', severity: 1,
                    description: `🎉 Deal cerrado: ${data.name} (${data.company})`,
                    status: 'active', createdDate: new Date().toISOString().split('T')[0]
                });
                break;
            case 'experiment_concluded':
                // Auto-log in knowledge
                if (!this.data.knowledge) this.data.knowledge = [];
                this.data.knowledge.unshift({
                    id: this.uid(), type: 'learning',
                    title: `Experimento: ${data.name}`,
                    content: `Hipótesis: ${data.hypothesis}\nResultado: ${data.result}`,
                    date: new Date().toISOString().split('T')[0]
                });
                break;
            case 'alert_critical':
                this.toast(`🚨 ALERTA CRÍTICA: ${data.description}`, 'danger');
                break;
        }
        this.saveData();
    },

    /* ── Global Search ── */
    globalSearch(query) {
        const resultsEl = document.getElementById('search-results');
        if (!resultsEl) return;
        if (!query || query.length < 2) { resultsEl.style.display = 'none'; return; }
        const q = query.toLowerCase();
        const results = [];

        const searchIn = [
            { arr: this.data.leads || [], fields: ['name', 'company', 'role', 'buySignal'], icon: '👤', label: 'Lead', module: 'gtm' },
            { arr: this.data.signals || [], fields: ['title', 'category', 'implication'], icon: '📡', label: 'Signal', module: 'intelligence' },
            { arr: this.data.decisions || [], fields: ['title', 'context', 'chosen'], icon: '⚖️', label: 'Decision', module: 'knowledge' },
            { arr: this.data.experiments || [], fields: ['name', 'hypothesis', 'kpi'], icon: '🧪', label: 'Experiment', module: 'knowledge' },
            { arr: this.data.opportunities || [], fields: ['title', 'ifCondition', 'expectResult'], icon: '💎', label: 'Opportunity', module: 'opportunities' },
            { arr: this.data.knowledge || [], fields: ['title', 'content'], icon: '📚', label: 'Knowledge', module: 'knowledge' },
            { arr: this.data.companies || [], fields: ['name', 'industry', 'website'], icon: '🏢', label: 'Company', module: 'data-brain' },
            { arr: this.data.niches || [], fields: ['name'], icon: '🎯', label: 'Niche', module: 'decision' }
        ];

        searchIn.forEach(src => {
            src.arr.forEach(item => {
                const match = src.fields.some(f => (item[f] || '').toString().toLowerCase().includes(q));
                if (match) results.push({ ...item, _icon: src.icon, _label: src.label, _module: src.module, _displayName: item.name || item.title || '-' });
            });
        });

        if (results.length === 0) {
            resultsEl.innerHTML = '<div style="padding:var(--space-4);text-align:center;color:var(--text-tertiary);font-size:var(--text-xs)">Sin resultados para "' + query + '"</div>';
        } else {
            resultsEl.innerHTML = results.slice(0, 10).map(r => `
                <div style="padding:var(--space-2) var(--space-3);cursor:pointer;display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);border-bottom:1px solid var(--border-subtle);transition:background 0.1s" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background=''" onclick="App.navigate('${r._module}');document.getElementById('global-search').value=''">
                    <span>${r._icon}</span>
                    <span style="flex:1;color:var(--text-primary);font-weight:600">${r._displayName}</span>
                    <span class="badge badge-neutral">${r._label}</span>
                </div>
            `).join('') + (results.length > 10 ? `<div style="padding:var(--space-2);text-align:center;color:var(--text-tertiary);font-size:10px">+${results.length - 10} más...</div>` : '');
        }
        resultsEl.style.display = 'block';
    }
};

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => App.init());
