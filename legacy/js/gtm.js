/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — GTM Machine
   ICP + Lead Management + Outreach Scripts
   ═══════════════════════════════════════════════════ */

const GTM = {
    render() {
        const d = App.data;
        const icp = d.icp || {};
        const leads = d.leads || [];
        const el = document.getElementById('mod-gtm');

        el.innerHTML = `
      <div class="module-header">
        <h1>GTM Machine</h1>
        <p>Define tu ICP, gestiona leads hipercualificados y usa scripts de outreach probados.</p>
      </div>

      <!-- ICP -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">🎯 ICP (Ideal Customer Profile)</div>
          <button class="btn btn-sm" onclick="GTM.saveICP()">💾 Guardar</button>
        </div>
        <div class="grid-2" style="gap:var(--space-3)">
          <div class="input-group"><label>Tamaño empresa</label><input class="input" id="icp-size" value="${icp.companySize || ''}"></div>
          <div class="input-group"><label>Decision Maker</label><input class="input" id="icp-dm" value="${icp.decisionMaker || ''}"></div>
          <div class="input-group"><label>Pain Points</label><input class="input" id="icp-pain" value="${icp.painPoints || ''}"></div>
          <div class="input-group"><label>Tech Stack</label><input class="input" id="icp-tech" value="${icp.techStack || ''}"></div>
          <div class="input-group"><label>Presupuesto</label><input class="input" id="icp-budget" value="${icp.budget || ''}"></div>
          <div class="input-group"><label>Señales de compra</label><input class="input" id="icp-signals" value="${icp.buySignals || ''}"></div>
        </div>
      </div>

      <!-- Leads -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">👤 Leads Hipercualificados (${leads.length})</div>
          <button class="btn btn-sm btn-primary" onclick="GTM.addLead()">+ Lead</button>
        </div>
        ${leads.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🎯</div>
            <h3>Sin leads todavía</h3>
            <p class="text-muted">Empieza con 30 leads hipercualificados con señal de compra visible</p>
          </div>
        ` : `
          <div class="table-container">
            <table>
              <thead><tr><th>Nombre</th><th>Empresa</th><th>Rol</th><th>Señal</th><th>Estado</th><th>Score</th><th></th></tr></thead>
              <tbody>
                ${leads.map(l => `
                  <tr>
                    <td style="font-weight:600;color:var(--text-primary)">${l.name || '-'}</td>
                    <td>${l.company || '-'}</td>
                    <td>${l.role || '-'}</td>
                    <td style="font-size:var(--text-xs)">${l.buySignal || '-'}</td>
                    <td><span class="badge ${l.status === 'qualified' ? 'badge-success' : l.status === 'contacted' ? 'badge-info' : 'badge-neutral'}">${l.status || 'raw'}</span></td>
                    <td>${Charts.scoreRing(l.confidence || 50, 100, 32)}</td>
                    <td>
                      <button class="btn btn-sm btn-ghost" onclick="GTM.moveToPipeline('${l.id}')">→ Pipeline</button>
                      <button class="btn btn-sm btn-danger" onclick="GTM.removeLead('${l.id}')">✕</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Outreach Scripts -->
      <div class="card mb-6">
        <div class="card-header">
          <div class="card-title">📝 Scripts de Outreach</div>
        </div>
        <div class="tabs mb-4">
          <div class="tab active" onclick="GTM.showScript('dm')">DM LinkedIn</div>
          <div class="tab" onclick="GTM.showScript('email')">Cold Email</div>
          <div class="tab" onclick="GTM.showScript('followup')">Follow-up</div>
          <div class="tab" onclick="GTM.showScript('objections')">Objeciones</div>
        </div>
        <div id="gtm-script" style="background:var(--bg-primary);border-radius:var(--radius-sm);padding:var(--space-4);font-size:var(--text-sm);line-height:1.8;white-space:pre-wrap;color:var(--text-secondary)"></div>
      </div>
    `;

        this.showScript('dm');
    },

    scripts: {
        dm: `Hola [Nombre],

Vi que [empresa] está [señal de compra: creciendo / contratando / lanzando nuevo producto].

En [mi agencia] ayudamos a empresas como la tuya a [beneficio principal] usando IA y automatización.

Ejemplo: ayudamos a [referencia similar] a [resultado concreto] en [tiempo].

¿Te interesaría una llamada de 15 min para explorar si tiene sentido?

Un saludo,
[Tu nombre]`,

        email: `Asunto: [Nombre], ¿automatizáis [proceso]?

Hola [Nombre],

Soy [tu nombre] de [agencia]. Ayudamos a [tipo de empresa] a [beneficio] con IA.

Vi que [empresa] está [señal]. Normalmente, las empresas en esta fase pierden [X horas/€] en [proceso manual].

Hemos ayudado a [referencia] a resolver esto en [tiempo] con [solución breve].

¿Tiene sentido agendar 15 min esta semana?

PD: Si no eres la persona correcta, ¿podrías redirigirme?

[Firma]`,

        followup: `Follow-up 1 (3 días después):
"Hola [Nombre], quería asegurarme de que viste mi mensaje. ¿Tiene sentido explorar [beneficio]?"

Follow-up 2 (7 días después):
"[Nombre], ¿cuál es vuestra prioridad ahora con [área]? Quizá podamos ayudar."

Follow-up 3 (14 días después - valor):
"Hola [Nombre], acabo de publicar [recurso/caso de estudio] sobre [tema relevante]. Te lo comparto por si es útil: [link]"

Follow-up 4 (30 días después - break-up):
"[Nombre], entiendo que quizá no es el momento. Si en el futuro necesitáis ayuda con [área], aquí estoy. ¡Éxitos!"`,

        objections: `🔴 "Es muy caro"
→ "Entiendo. ¿Cuánto os cuesta actualmente no tener [solución]? Nuestros clientes recuperan la inversión en [X] meses."

🔴 "Ya tenemos alguien interno"
→ "Genial. ¿Están usando IA específicamente para [caso de uso]? Normalmente complementamos al equipo, no lo sustituimos."

🔴 "No es buen momento"
→ "Lo entiendo. ¿Cuándo sería mejor? Mientras tanto, ¿te envío [recurso] que puede serte útil?"

🔴 "No conozco tu empresa"
→ "Normal, somos una boutique especializada. Aquí tienes [caso de estudio] con [empresa similar]. ¿Lo revisamos juntos?"

🔴 "Necesito consultarlo"
→ "Por supuesto. ¿Quién más participa en la decisión? Puedo preparar un documento específico para ellos."`
    },

    showScript(key) {
        document.getElementById('gtm-script').textContent = this.scripts[key] || '';
        document.querySelectorAll('#mod-gtm .tab').forEach((t, i) => {
            t.classList.toggle('active', ['dm', 'email', 'followup', 'objections'][i] === key);
        });
    },

    saveICP() {
        App.data.icp = {
            companySize: document.getElementById('icp-size').value,
            decisionMaker: document.getElementById('icp-dm').value,
            painPoints: document.getElementById('icp-pain').value,
            techStack: document.getElementById('icp-tech').value,
            budget: document.getElementById('icp-budget').value,
            buySignals: document.getElementById('icp-signals').value
        };
        App.saveData();
        App.toast('ICP guardado', 'success');
    },

    addLead() {
        App.openModal(`
      <h2>+ Nuevo Lead</h2>
      <div class="input-group mb-3"><label>Nombre</label><input class="input" id="lead-name"></div>
      <div class="input-group mb-3"><label>Empresa</label><input class="input" id="lead-company"></div>
      <div class="input-group mb-3"><label>Rol</label><input class="input" id="lead-role"></div>
      <div class="input-group mb-3"><label>Email</label><input class="input" id="lead-email" type="email"></div>
      <div class="input-group mb-3"><label>LinkedIn</label><input class="input" id="lead-linkedin"></div>
      <div class="input-group mb-3"><label>Señal de compra</label><input class="input" id="lead-signal" placeholder="Ej: Acaba de cerrar ronda serie A"></div>
      <div class="input-group mb-3"><label>Fuente</label><select class="input" id="lead-source"><option>LinkedIn</option><option>Referral</option><option>Web</option><option>Evento</option><option>Cold Research</option></select></div>
      <div class="input-group mb-3"><label>Confianza (0-100)</label><input class="input" id="lead-conf" type="number" value="60" min="0" max="100"></div>
      <button class="btn btn-primary mt-4" onclick="GTM.saveLead()">Guardar</button>
    `);
    },

    saveLead() {
        const lead = {
            id: App.uid(),
            name: document.getElementById('lead-name').value.trim(),
            company: document.getElementById('lead-company').value.trim(),
            role: document.getElementById('lead-role').value.trim(),
            email: document.getElementById('lead-email').value.trim(),
            linkedin: document.getElementById('lead-linkedin').value.trim(),
            buySignal: document.getElementById('lead-signal').value.trim(),
            source: document.getElementById('lead-source').value,
            confidence: parseInt(document.getElementById('lead-conf').value) || 60,
            status: 'raw',
            timestamp: new Date().toISOString()
        };
        if (!lead.name) return App.toast('Nombre requerido', 'warning');
        App.data.leads.push(lead);
        App.saveData();
        App.closeModal();
        this.render();
        App.toast('Lead añadido', 'success');
    },

    removeLead(id) {
        App.data.leads = App.data.leads.filter(l => l.id !== id);
        App.saveData();
        this.render();
    },

    moveToPipeline(id) {
        const lead = App.data.leads.find(l => l.id === id);
        if (!lead) return;
        lead.status = 'contacted';
        if (!App.data.pipeline.lead) App.data.pipeline.lead = [];
        App.data.pipeline.lead.push({ ...lead, pipelineDate: new Date().toISOString() });
        App.saveData();
        this.render();
        App.toast(`${lead.name} movido al pipeline`, 'success');
    }
};
