# ANTIGRAVITY OS — Audit: Arquitectura React
**Fecha:** 2026-03-06

---

## Resumen

Arquitectura limpia y bien organizada. 21/21 módulos migrados, 26 hooks custom con patrón consistente, Zustand bien estructurado. Los únicos blockers son la falta de Error Boundaries y el CEO Score duplicado.

**Nota importante:** La migración legacy → React ya está **100% completada**, a pesar de que HANDOFF.md la lista como tarea pendiente. El código en `src/components/modules/` está implementado.

---

## 1. Routing (21 rutas)

Todas las rutas se generan dinámicamente desde el array `modules` en App.jsx:

```jsx
const modules = [
  { id: 'control-tower', label: 'Control Tower', component: ControlTower },
  // ... 20 más
]

<Routes>
  {modules.map(mod => (
    <Route key={mod.id} path={`/${mod.id}`} element={<mod.component />} />
  ))}
  <Route path="/" element={<Navigate to="/control-tower" replace />} />
  <Route path="*" element={<Navigate to="/control-tower" replace />} />
</Routes>
```

✅ Patrón dinámico — evita hardcoding
✅ Redirect y wildcard correctamente definidos
❌ Sin lazy loading (ver 01_build_and_runtime.md)
❌ Sin rutas protegidas por rol (app single-user, aceptable por ahora)

---

## 2. Zustand Store (useAppStore.js)

```javascript
export const useAppStore = create(
  persist(
    (set, get) => ({
      data: getDefaultData(),   // Todos los datos del negocio
      modal: { open, content },
      toasts: [],
      updateData: (updater) => set(state => ({ data: updater(state.data) })),
      openModal: (content) => ...,
      closeModal: () => ...,
      toast: (message, type) => ...,
      triggerFeedback: (event, data) => ...
    }),
    { name: 'antigravity-os-v10' }
  )
)
```

### Datos en el store

| Dominio | Campos clave |
|---------|-------------|
| Meta | startDate, targetMRR, budget, hoursPerDay |
| Finance | revenue, expenses, MRR, clients, avgTicket |
| Pipeline | 7 etapas: lead → contactado → response → meeting → propuesta → cerrado → onboarding |
| Simulation | contactsPerWeek, responseRate, meetingRate, closeRate, capacity |
| Niches | id, name, impact, velocity, scalability, confidence, risk, resourceCost |
| Bets | id, type, name, hypothesis, kpi, killCriteria, status |
| Execution | currentDay, tasks[] (30-day plan) |
| Signals | id, title, category, indicator, impact, confidence |
| Agents | Lista de AI agents configurados |

### Issues

**⚠️ Store monolítico:** Todos los dominios en un solo Zustand store. Aceptable para v10 (single user), pero considerar split por dominio en v11.

**⚠️ Solo localStorage:** Sin sync con Supabase aún. Los datos no se sincronizan entre dispositivos.

**⚠️ `triggerFeedback` limitado:** Solo maneja `deal_closed` y `experiment_concluded`. Extender para todos los eventos del sistema.

---

## 3. Hooks Ecosystem (26 hooks)

Todos siguen el patrón consistente `{ data, loading, error, actions... }`:

```javascript
export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAll('contacts', { type: 'lead' });
      setLeads(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => channel?.unsubscribe(); }, []);

  return { leads, loading, error, reload: load, addLead, updateLead, removeLead };
}
```

### Inventario completo

**Auth:** useAuth
**CRM:** useLeads, useContacts, useCompanies, useDeals, useConversations, useDetectedLeads
**Inteligencia:** useSignals, useNiches, useBets, useExperiments, useDecisions, useOpportunities, useKnowledge
**Operaciones:** useTasks, useAlerts, useFinance, useAutomation, useCampaigns
**Avanzados:** useSnapshots, useAIAdvisor, useProspector, useGeoSearch, useRealtime, useConnectionStatus, useEdgeFunction

✅ useCallback en funciones async
✅ Cleanup de suscripciones en return de useEffect
✅ JSON.stringify(filters) en dependencies (evita re-renders)
⚠️ useEdgeFunction — edge functions no desplegadas aún

---

## 4. Error Boundaries — BLOCKER 🔴

**No existe ningún Error Boundary en el proyecto.**

Si cualquier componente lanza un error en render, **toda la aplicación crashea** mostrando pantalla en blanco.

**Fix — crear `src/components/ui/ErrorBoundary.jsx`:**

```jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <p className="text-secondary">Error al cargar este módulo.</p>
          <button className="btn btn-ghost" onClick={() => this.setState({ hasError: false })}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Usar en Layout.jsx alrededor del contenido:**
```jsx
<ErrorBoundary>
  <Outlet />
</ErrorBoundary>
```

---

## 5. Duplicación — CEO Score

El algoritmo de CEO Score aparece en dos lugares:

- `src/stores/useAppStore.js` — función `ceoScore()`
- `src/hooks/useNiches.js` — función `calculateCeoScore()`

**Fix:** Extraer a `src/lib/ceoScore.js`:
```javascript
export function ceoScore({ impact, velocity, scalability, confidence, risk, resourceCost }) {
  return (
    Math.pow(impact, 1.2) * Math.pow(velocity, 1.5) * Math.pow(scalability, 0.5) * confidence
  ) / (risk * resourceCost);
}
```

---

## 6. DEV_MODE Auth Bypass

```jsx
// src/App.jsx
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

if (DEV_MODE) {
  // Salta auth completamente, usa usuario mock
  return <AppRoutes user={{ email: 'dev@antigravity.os', id: 'dev' }} />;
}
```

Correcto para desarrollo local, pero hay riesgo de que llegue a producción sin configurar el `.env`.

**Fix:** Agregar warning visible:
```jsx
if (DEV_MODE) {
  console.warn('⚠️ ANTIGRAVITY OS corriendo en DEV_MODE. Configurar VITE_SUPABASE_URL para producción.');
  // opcional: banner visible en la UI
}
```

---

## 7. Supabase Client (src/lib/supabase.js)

```javascript
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
```

✅ Null-check correcto (no falla sin credenciales)
✅ Realtime configurado con rate limiting
✅ Helpers genéricos para todas las tablas
✅ Auth completo: signIn, signUp, magicLink, signOut

---

## 8. Valoración de calidad

| Área | Puntuación | Nota |
|------|-----------|------|
| Organización de ficheros | 9/10 | Estructura clara por dominio |
| Routing | 8/10 | Falta lazy loading |
| State management | 8/10 | Zustand correcto, falta split |
| Hooks | 9/10 | Patrón muy consistente |
| Error handling | 4/10 | Sin Error Boundaries |
| Código duplicado | 7/10 | Solo CEO Score |
| Async patterns | 9/10 | Correcto en todos los hooks |
| TypeScript | 0/10 | No configurado |
| Tests | 0/10 | Sin suite |

**Puntuación global arquitectura: 8.2/10** — Sólida, con gaps concretos y fáciles de resolver.
