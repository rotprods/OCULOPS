# ANTIGRAVITY OS — Audit: Legacy Modules — Análisis y Referencia
**Fecha:** 2026-03-06

---

> **IMPORTANTE:** La migración legacy → React ya está **100% completada** en v10.
> Este documento sirve como referencia de los datos y lógica de negocio de cada módulo,
> útil para entender las estructuras de datos y conectar con Supabase en el futuro.

---

## Tabla de complejidad y estado

| # | Módulo | Complejidad | Zustand fields | Dependencias cruzadas |
|---|--------|-------------|----------------|----------------------|
| 1 | Execution OS | Simple | `execution: { tasks, currentDay }` | Ninguna |
| 2 | Market Intelligence | Medium | `signals: [], filter` | Ninguna |
| 3 | GTM Machine | Medium | `icp: {}, leads: [], activeScript` | → Pipeline |
| 4 | Sales Pipeline | Medium | `pipeline: { 7 stages }` | → Finance, → Watchtower |
| 5 | Knowledge Vault | Medium | `decisions[], experiments[], knowledge[]` | → feedback |
| 6 | Finance | Simple | `finance: { clients, mrr }, meta: { budget }` | ← Simulation |
| 7 | Decision Ops | **Complex** | `niches[], bets[], resources: {}` | Ninguna |
| 8 | Watchtower | Medium | `alerts: []` | ← Pipeline |
| 9 | Opportunities | Medium | `opportunities: []` | Ninguna |
| 10 | Simulation Engine | **Complex** | `simulation: { 8 params }, results[]` | ← Finance |
| 11 | Control Tower | **Highest** | `history: { mrr, clients, pipeline }` | ← Todos |
| 12 | Data Brain | **Complex** | `entities: { 6 tipos }` | ← múltiples |

---

## Estructuras de datos por módulo

### 1. Execution OS
```javascript
tasks: [{
  day: 1-90,
  task: string,
  status: 'pending' | 'in-progress' | 'done',
  gate?: string  // hito/gate de la tarea
}]
currentDay: number
```
UI: 4 cards de semanas, lista de tareas con toggle de estado

---

### 2. Market Intelligence
```javascript
signals: [{
  id: uuid,
  title: string,
  category: string,         // sector/tipo
  indicator: 'leading' | 'lagging',
  impact: 0-100,
  source: string,
  confidence: 0-100,
  implication: string,
  date: ISO,
  status: string
}]
```
UI: KPI cards por categoría, tabla filtrable por indicator type, score ring

---

### 3. GTM Machine
```javascript
icp: {
  companySize: string,
  decisionMaker: string,
  painPoints: string,
  techStack: string,
  budget: string,
  buySignals: string
}

leads: [{
  id: uuid,
  name: string,
  company: string,
  role: string,
  email: string,
  linkedin: string,
  buySignal: string,
  source: string,
  confidence: 0-100,
  status: 'raw' | 'qualified' | 'contacted'
}]
```
**Cross-module:** Mover lead a Pipeline → `pipeline.lead.push(lead)`
Scripts estáticos: DM, Email, Follow-up, Objection handling

---

### 4. Sales Pipeline
```javascript
pipeline: {
  lead: [],
  contactado: [],
  response: [],
  meeting: [],
  propuesta: [],
  cerrado: [],
  onboarding: []
}

// Cada item:
{
  id: uuid,
  name: string,
  company: string,
  status: string,
  lastMoved: ISO
}
```
**Cross-module triggers:**
- Deal → `cerrado`: actualiza `finance.mrr++`, notifica a Watchtower

---

### 5. Knowledge Vault
```javascript
decisions: [{
  id, title, context, options, chosen, outcome, date
}]

experiments: [{
  id, name,
  status: 'hypothesis' | 'running' | 'concluded' | 'archived',
  hypothesis, kpi, result, date
}]

knowledge: [{
  id, title,
  type: 'playbook' | 'case-study' | 'learning' | 'note',
  content, date
}]
```
**Trigger:** experiment.status → 'concluded' dispara feedback event

---

### 6. Finance
```javascript
finance: { clients: number, mrr: number }
meta: { budget: number }       // gastos mensuales
simulation: { churn, capacity, avgTicket }  // read-only desde Simulation

// Cálculos derivados (no almacenados):
margin = (mrr - budget) / mrr
ltv = avgTicket / churn
cac = budget * 0.3 / clients
utilization = clients / capacity
```

---

### 7. Decision Ops — Algoritmo CEO Score
```javascript
niches: [{
  id, name,
  impact: 0-100, velocity: 0-100, scalability: 0-100,
  confidence: 0-100, risk: 0-100, resourceCost: 0-100
}]

bets: [{
  id, type: 'core' | 'explore',
  name, hypothesis, kpi, killCriteria, pivotPath, resources, status
}]

resources: {
  outbound: %, delivery: %, content: %,
  systems: %, strategy: %, admin: %
  // CONSTRAINT: deben sumar exactamente 100%
}
```

**Fórmula CEO Score (extraer a src/lib/ceoScore.js):**
```javascript
ceoScore = (impact^1.2 × velocity^1.5 × scalability^0.5 × confidence^1.0) / (risk × resource_cost)
```

---

### 8. Watchtower
```javascript
alerts: [{
  id,
  type: 'competitive' | 'opportunity' | 'churn' | 'capacity' | 'cash' | 'concentration',
  severity: 1-4,
  description, trigger, action,
  status: 'active' | 'resolved',
  createdDate, resolvedDate
}]
```
UI: Ordenados por severity DESC, últimos 5 resueltos en historial

---

### 9. Opportunities
```javascript
opportunities: [{
  id, title,
  category: 'quick' | 'medium' | 'long',
  ifCondition, expectResult, measureMetric, decideAction,
  probability: 0-100,
  payoff: €,
  speed: 1-10,
  cost: €,
  windowClosesBy: date,
  timestamp: ISO
}]

// Score:
score = (prob/100) × (payoff/100) × (speed/10) - (cost/1000)
```

---

### 10. Simulation Engine
```javascript
simulation: {
  contactsPerWeek: number,
  responseRate: %,
  meetingRate: %,
  closeRate: %,
  avgTicket: €,
  churn: %,
  capacity: number
}
```

**Algoritmo (re-implementar en src/lib/simulation.js):**
```javascript
function simulate(params, months = 3) {
  let { clients, mrr } = getFinanceData();
  const results = [];

  for (let m = 1; m <= months; m++) {
    const contacts = params.contactsPerWeek * 4.3;
    const responses = contacts * (params.responseRate / 100);
    const meetings = responses * (params.meetingRate / 100);
    const closes = Math.min(meetings * (params.closeRate / 100), params.capacity - clients);

    clients = Math.max(0, clients * (1 - params.churn / 100)) + closes;
    mrr = clients * params.avgTicket;

    results.push({ month: m, clients: Math.round(clients), mrr: Math.round(mrr), closes });
  }
  return results;
}

// 3 escenarios:
// Base: params tal cual
// Optimistic: responseRate×1.5, closeRate×1.3, avgTicket×1.2
// Pessimistic: responseRate×0.6, closeRate×0.7, churn×1.5
```

---

### 11. Control Tower (Dashboard central)

Agrega datos de TODOS los módulos. Depende de:
- Finance (mrr, clients)
- Pipeline (7 stages count)
- Execution (currentDay, task completion %)
- Watchtower (active alerts count)
- Niches + Bets (para radar chart y portfolio)
- History/snapshots (para sparklines)

**Zustand adicional necesario:**
```javascript
history: {
  mrr: [{ date, value }],
  clients: [{ date, value }],
  pipeline: [{ date, stage, count }]
}
```

---

### 12. Data Brain
```javascript
entities: {
  leads:       [{ name, company, role, email, linkedin, buySignal, source, confidence, status }],
  companies:   [{ name, industry, size, website, techStack, revenue, location, confidence }],
  competitors: [{ name, website, pricing, strengths, weaknesses, channels }],
  signals:     [{ title, category, indicator, impact, source, confidence, status }],
  experiments: [{ name, hypothesis, kpi, result, learnings, status }],
  decisions:   [{ title, context, options, chosen, outcome, confidence }]
}
```

---

## Algoritmos clave para extraer a `src/lib/`

| Algoritmo | Fichero recomendado | Complejidad |
|-----------|---------------------|-------------|
| CEO Score | `src/lib/ceoScore.js` | O(1) por niche |
| Simulation | `src/lib/simulation.js` | O(months) |
| Opportunity Score | `src/lib/opportunityScore.js` | O(1) |
| Health Score | `src/lib/healthScore.js` | O(modules) |
| Funnel metrics | `src/lib/funnelMetrics.js` | O(pipeline) |
