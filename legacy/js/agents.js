/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — AI Agents Module
   ═══════════════════════════════════════════════════ */

const Agents = {
    render() {
        const el = document.getElementById('mod-agents');
        el.innerHTML = `
      <div class="module-header">
        <h1>AI Agents Hub</h1>
        <p>Orquestación y estado de agentes autónomos integrados en el ecosistema Antigravity.</p>
      </div>

      <div class="grid-2 mb-6">
        <!-- Antigravity Assistant Card -->
        <div class="card">
          <div class="card-header">
            <div class="flex items-center gap-3">
              <div class="kpi-icon" style="background:var(--accent-primary)22;color:var(--accent-primary)">🛰️</div>
              <div class="card-title">Antigravity Assistant</div>
            </div>
            <span class="badge badge-success">Online</span>
          </div>
          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">
            Asistente estratégico de arquitectura y desarrollo de sistemas de IA.
          </p>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between text-xs">
              <span class="text-tertiary">Rol:</span>
              <span class="text-primary font-bold">Arquitecto Jefe</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-tertiary">Contexto:</span>
              <span class="text-primary font-bold">Full System Path</span>
            </div>
          </div>
        </div>

        <!-- Claude Code Card -->
        <div class="card">
          <div class="card-header">
            <div class="flex items-center gap-3">
              <div class="kpi-icon" style="background:#d9770622;color:#d97706">🤖</div>
              <div class="card-title">Claude Code</div>
            </div>
            <span class="badge badge-info">Installed</span>
          </div>
          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">
            Agente de terminal para ejecución rápida, refactorización y gestión de infraestructura.
          </p>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between text-xs">
              <span class="text-tertiary">Ubicación:</span>
              <span class="text-mono" style="font-size:10px">~/.local/bin/claude</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-tertiary">Comando:</span>
              <code class="text-primary font-bold">claude</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Orchestration Workflow -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📋 Protocolo de Orquestación</div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Fase</th>
                <th>Agente Primario</th>
                <th>Acción Clave</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="badge badge-neutral">Strategy</span></td>
                <td>Antigravity</td>
                <td>Diseño de arquitectura y mental models.</td>
              </tr>
              <tr>
                <td><span class="badge badge-info">Execution</span></td>
                <td>Claude Code</td>
                <td>Implementación masiva y gestión de Git.</td>
              </tr>
              <tr>
                <td><span class="badge badge-success">Validation</span></td>
                <td>Mixed</td>
                <td>Cross-check de lógica y pruebas unitarias.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Access Terminal Integration -->
      <div class="card mt-6" style="background:var(--bg-card-alt)">
        <div class="card-header">
          <div class="card-title">⌨️ Terminal Commands</div>
        </div>
        <div class="grid-2 gap-4">
          <div class="p-3" style="background:var(--bg-app);border-radius:var(--radius-sm)">
            <div class="text-xs text-tertiary mb-1">Update Claude CLI</div>
            <code style="color:var(--accent-primary)">npm install -g @anthropic-ai/claude-code</code>
          </div>
          <div class="p-3" style="background:var(--bg-app);border-radius:var(--radius-sm)">
            <div class="text-xs text-tertiary mb-1">Start Session</div>
            <code style="color:var(--accent-primary)">claude</code>
          </div>
        </div>
      </div>
    `;
    }
};
