
# OCULOPS — MAC MINI RUNTIME INTEGRATION MASTER.md
## Objetivo
Conectar **CloudBot + Agent Zero + Ollama + N8N + Docker + PM2 + SaaS + tools/APIs** dentro del **Mac Mini** como núcleo soberano del sistema.

Este documento no es conceptual.  
Es una guía operativa para **cerrar la integración real** del ecosistema dentro del Mac Mini.

---

# 1. VERDAD ARQUITECTÓNICA

## Núcleo soberano
El **Mac Mini** es el sistema vivo.

Dentro del Mac Mini deben convivir, coordinarse y gobernarse:

- **CloudBot** → director interno / governor / operador maestro
- **Agent Zero** → workforce agentic base
- **Ollama** → inferencia local / modelos locales / fallback intelligence
- **OpenRouter / APIs externas** → inteligencia remota premium
- **N8N** → automatización y workflows
- **Docker** → aislamiento y runtime modular
- **PM2** → supervisor de procesos persistentes
- **SaaS** → capa de producto / dashboard / acciones del usuario
- **CloudHub / tools / skills / APIs** → capacidad operativa real
- **Memory + logs + critics** → capa de memoria, evaluación y estado
- **Governance + security** → permisos, sandbox, límites y blindaje

## Principio
No estamos conectando apps sueltas.  
Estamos construyendo una **telaraña operativa gobernada**.

---

# 2. MODELO OPERATIVO

## Estados obligatorios
Todo nodo del sistema debe estar en uno o varios de estos estados:

- `core`
- `connected`
- `simulated`
- `orphaned`
- `pending`
- `blocked`
- `experimental`

Nada puede estar en “medio conectado”.

## Reglas
### Regla 1
Todo es nodo.

### Regla 2
Toda conexión debe responder:
- quién llama
- a qué llama
- con qué permiso
- qué devuelve

### Regla 3
Toda pieza debe acabar integrada en la web.
Si no está en red, queda fuera del core.

---

# 3. NODOS PRINCIPALES A CONECTAR

## 3.1 CloudBot
Rol:
- director interno del sistema
- supervisor de estado
- dispatcher de decisiones
- governor de ejecución
- lector de health
- coordinador de workflows/agentes

Debe poder:
- leer estado de servicios
- consultar registries
- lanzar workflows
- activar agentes
- usar tools aprobadas
- escribir logs
- actualizar memoria
- bloquear ejecución insegura
- escalar a humano si hace falta

## 3.2 Agent Zero
Rol:
- capa de agentes de trabajo
- workers cognitivos / operativos
- ejecutor agentic base

Debe poder:
- recibir tareas desde CloudBot
- llamar tools autorizadas
- disparar workflows n8n cuando proceda
- consultar memoria
- devolver resultados estructurados

## 3.3 Ollama
Rol:
- inferencia local
- fallback intelligence
- modelos baratos/locales
- soporte offline/parcial

Debe poder:
- exponer endpoint local
- ser llamado por CloudBot / Agent Zero / services
- servir modelos para tareas baratas o privadas
- convivir con routing hacia OpenRouter

## 3.4 N8N
Rol:
- orquestación de automatizaciones
- workflows persistentes
- triggers y secuencias operativas

Debe poder:
- recibir triggers desde CloudBot
- recibir inputs desde SaaS / APIs / tools
- llamar APIs y servicios internos
- escribir resultados en memoria/logs/DB
- devolver estado estructurado

## 3.5 PM2
Rol:
- mantener vivos los procesos críticos
- reiniciar procesos si caen
- exponer health operativo

Debe supervisar como mínimo:
- CloudBot runtime
- bridges internos
- services de health
- adapters / event buses
- workers persistentes

## 3.6 Docker
Rol:
- aislamiento
- modularidad
- despliegue por servicios

Debe contener, según convenga:
- N8N
- Agent Zero
- ComfyUI
- servicios puente
- adapters
- memoria auxiliar
- brokers/event services

## 3.7 SaaS
Rol:
- interfaz del producto
- dashboard
- paneles
- acciones del usuario

Debe poder:
- leer estado del sistema
- activar acciones reales
- mostrar readiness
- saber si una acción está `connected`, `simulated`, `blocked` u `offline`

---

# 4. TOPOLOGÍA CANÓNICA

```text
SaaS Dashboard
   ↓
Action Router / API Layer
   ↓
CloudBot (Governor)
   ↓
Agent Registry / Workflow Registry / Tool Registry
   ↓
┌──────────────┬──────────────┬──────────────┐
│ Agent Zero   │ N8N          │ Ollama       │
│ workforce    │ workflows    │ local models │
└──────────────┴──────────────┴──────────────┘
   ↓
Tool Bus / MCP / Adapters
   ↓
CloudHub / APIs / skills / commands / filesystem / browser / voice / CRM / messaging
   ↓
Memory + Logs + Critics + Governance
```

---

# 5. SEPARACIÓN DE RESPONSABILIDADES

## CloudBot NO debe:
- hacer todo el trabajo operativo directamente
- ejecutar tareas masivas repetitivas
- sustituir a N8N
- sustituir a Agent Zero
- usar todas las tools sin policy

## CloudBot SÍ debe:
- decidir
- enrutar
- vigilar
- evaluar
- priorizar
- activar
- frenar
- registrar

## Agent Zero NO debe:
- gobernar el sistema global
- tocar producción sin policy
- improvisar acceso total a tools

## Agent Zero SÍ debe:
- trabajar
- ejecutar tareas
- usar skills
- devolver artefactos/resultados
- pedir recursos cuando haga falta

## Ollama NO debe:
- convertirse en el cerebro único del sistema

## Ollama SÍ debe:
- ser una capa de inferencia local
- servir tareas privadas/baratas
- actuar como fallback o low-cost lane

## N8N NO debe:
- ser el único orquestador cognitivo

## N8N SÍ debe:
- automatizar secuencias
- manejar triggers
- conectar apps
- ejecutar workflows confiables

---

# 6. REGISTRIES OBLIGATORIOS

## 6.1 agent_registry.json
Campos mínimos:
- `agent_id`
- `agent_name`
- `role`
- `capabilities`
- `allowed_tools`
- `input_schema`
- `output_schema`
- `autonomy_level`
- `supervisor`
- `state`
- `enabled`

## 6.2 tool_registry.json
Campos mínimos:
- `tool_id`
- `tool_name`
- `category`
- `provider`
- `input_schema`
- `output_schema`
- `auth_required`
- `latency_class`
- `risk_level`
- `enabled`
- `langchain_wrapper`
- `n8n_workflow_id`

## 6.3 workflow_registry.json
Campos mínimos:
- `workflow_id`
- `workflow_name`
- `trigger_type`
- `inputs`
- `outputs`
- `tools_used`
- `agents_used`
- `state`
- `risk_level`
- `owner`

## 6.4 service_registry.json
Campos mínimos:
- `service_id`
- `service_name`
- `runtime`
- `port`
- `healthcheck`
- `pm2_managed`
- `dockerized`
- `state`

## 6.5 dashboard_action_registry.json
Campos mínimos:
- `action_id`
- `view`
- `button_name`
- `required_state`
- `calls`
- `workflow_id`
- `tool_id`
- `agent_id`
- `policy_scope`
- `expected_output`

---

# 7. TOOL TAXONOMY BÁSICA

Usa esta taxonomía base:

- `search`
- `scrape`
- `crm`
- `messaging`
- `publishing`
- `payments`
- `voice`
- `filesystem`
- `browser`
- `ai_generation`
- `analytics`

## Regla de placement
- **APIs + comandos + skills = capacidades**
- **n8n = automatizaciones**
- **MCP = conector estándar**
- **LangChain = interfaz/tooling para agentes**
- **LangGraph = orquestación/state machine**
- **servicios internos = core runtime y adapters específicos**

---

# 8. CONEXIÓN ENTRE CLOUDBOT, AGENT ZERO, OLLAMA Y N8N

## Flujo canónico
### Caso A — acción del usuario
1. Usuario pulsa acción en el SaaS
2. API layer consulta `dashboard_action_registry`
3. Se validan permisos y estado
4. CloudBot recibe objetivo
5. CloudBot decide:
   - lanzar Agent Zero
   - lanzar workflow n8n
   - usar Ollama local
   - usar modelo remoto
6. Se ejecuta
7. Resultado vuelve al SaaS
8. Logs y memoria se actualizan

### Caso B — loop interno
1. CloudBot detecta condición / trigger / health event
2. Consulta policy + registries
3. Activa:
   - workflow n8n
   - agente específico
   - inference local en Ollama
4. Registra resultado
5. Si falla:
   - retry
   - fallback
   - escalado

### Caso C — tarea cognitiva local
1. CloudBot o Agent Zero enrutan a Ollama
2. Ollama resuelve tarea local
3. Resultado se devuelve
4. Si score insuficiente:
   - fallback a OpenRouter

---

# 9. RUTAS DE MODELO

## Lane 1 — local
Usar Ollama para:
- parsing
- tareas privadas
- tareas baratas
- clasificación
- resúmenes internos
- fallback

## Lane 2 — remote standard
Usar OpenRouter / modelos externos para:
- reasoning más complejo
- coding pesado
- tasks de alta calidad
- planning premium

## Lane 3 — governed escalation
CloudBot decide cuándo subir de:
- local → remoto
- agent → workflow
- automation → human review

---

# 10. HEALTH / READINESS

Debes crear un estado operativo único del sistema.

## ecosystem-readiness.latest.json
Campos mínimos:

```json
{
  "timestamp": "",
  "global_status": "connected",
  "services": {
    "cloudbot": "connected",
    "agent_zero": "connected",
    "ollama": "connected",
    "n8n": "connected",
    "docker": "connected",
    "pm2": "connected"
  },
  "capabilities": {
    "scraping": "connected",
    "publishing": "simulated",
    "voice": "pending",
    "crm_actions": "connected",
    "ai_generation": "connected"
  },
  "policies": {
    "allow_publish": false,
    "allow_voice_outbound": false
  }
}
```

## Regla
El SaaS no debe actuar por intuición visual.
Debe actuar según readiness real.

---

# 11. MEMORIA Y LOGS

## Memorias mínimas
- memoria de estado
- memoria de incidentes
- memoria de workflows
- memoria de agentes
- memoria de rutas exitosas
- memoria de fallos
- memoria de herramientas

## Logs mínimos
- decisión de CloudBot
- activación de workflow
- uso de tool
- inferencia local/remota
- error
- fallback
- cambio de estado

---

# 12. GOVERNANCE Y SEGURIDAD

## Reglas mínimas
- ninguna tool crítica sin registry
- ninguna acción de producción sin policy
- ninguna credencial sin scope
- ningún agente con acceso total por defecto
- ningún workflow crítico sin logging
- ninguna ejecución autónoma sin límites

## Sandbox
Deben existir al menos 3 zonas:
- `production`
- `staging`
- `simulation`

## Túnel
Exponer solo lo necesario.
Todo lo demás debe quedar detrás de:
- auth
- allowlist
- validation
- monitoring

---

# 13. ORDEN DE IMPLEMENTACIÓN

## Fase 1 — Freeze
Congelar realidad:
- qué corre
- dónde corre
- cómo se llama
- qué puerto usa
- qué depende de qué

## Fase 2 — Registries
Crear:
- agent_registry
- tool_registry
- workflow_registry
- service_registry
- dashboard_action_registry

## Fase 3 — CloudBot
Definir:
- identidad
- autoridad
- skills
- límites
- memoria
- políticas

## Fase 4 — Wiring
Conectar:
- SaaS → CloudBot
- CloudBot → Agent Zero
- CloudBot → N8N
- CloudBot → Ollama
- Agent Zero / N8N → Tool Bus
- Tool Bus → capacidades reales

## Fase 5 — Readiness
Crear:
- health checks
- heartbeats
- ecosystem-readiness.latest.json
- visual states del SaaS

## Fase 6 — Verticales críticos
Cerrar al menos 3 verticales:

### Vertical 1
Dashboard → CloudBot → workflow n8n → tool/API → resultado

### Vertical 2
Dashboard → CloudBot → Agent Zero → tool → resultado

### Vertical 3
CloudBot → Ollama local / fallback remoto → output → memoria/logs

## Fase 7 — Voice
Integrar como nodos gobernados:
- AI Call Receptionist
- AI Outbound Caller

## Fase 8 — Hardening
Blindar:
- policies
- permisos
- credenciales
- observabilidad
- rollback
- simulation

---

# 14. TESTING Y VALIDACIÓN

## Cada nodo debe probarse por:
- existencia
- health
- permisos
- inputs válidos
- outputs válidos
- logging
- memoria
- fallback
- error handling

## Cada conexión debe probarse por:
- quién llama
- qué llama
- permiso correcto
- retorno correcto

## Cada vertical debe probarse end-to-end.

Nada se considera “hecho” si no puede pasar por:
- trigger
- ejecución
- resultado
- log
- memoria
- estado final

---

# 15. FIRST 20 MOVES

1. Congelar inventario real del Mac Mini  
2. Listar procesos PM2  
3. Listar contenedores Docker  
4. Listar workflows N8N activos  
5. Documentar Agent Zero runtime  
6. Exponer endpoint health de Ollama  
7. Definir CloudBot role y límites  
8. Crear `agent_registry.json`  
9. Crear `tool_registry.json`  
10. Crear `workflow_registry.json`  
11. Crear `service_registry.json`  
12. Crear `dashboard_action_registry.json`  
13. Diseñar Tool Bus  
14. Conectar CloudBot con Agent Zero  
15. Conectar CloudBot con N8N  
16. Conectar CloudBot con Ollama  
17. Crear `ecosystem-readiness.latest.json`  
18. Conectar estados al SaaS  
19. Cerrar 3 verticales completos  
20. Activar logs + memoria + policy engine  

---

# 16. PRINCIPIO FINAL

OCULOPS dentro del Mac Mini debe comportarse como:

**una telaraña operativa gobernada, donde CloudBot dirige, Agent Zero trabaja, Ollama razona localmente, N8N automatiza, PM2 sostiene, Docker aísla, el SaaS visualiza y todo queda registrado, validado y protegido.**
