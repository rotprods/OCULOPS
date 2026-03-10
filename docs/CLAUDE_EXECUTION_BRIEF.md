# OCULOPS OS — Claude Execution Brief v1

## Next-Gen Autonomous Intelligence Layer

> **Para**: Claude (o cualquier AI Agent con acceso al codebase)
> **De**: Roberto Ortega, Founder
> **Contexto**: Este documento contiene las instrucciones para construir las próximas capas del sistema operativo OCULOPS OS — una plataforma de inteligencia empresarial autónoma diseñada para escalar una agencia de IA a €100k/mes.

---

## 🏗️ ARQUITECTURA ACTUAL (Ya construido)

```
Frontend (Vite + React)
├── 18 Módulos: Control Tower, Execution, Intelligence, Niches, Portfolio,
│   Lab, Opportunities, Pipeline, CRM, Finance, Watchtower, Decisions,
│   Knowledge, GTM Machine, Scanner, Messaging, AI Agents, Automation
├── ProspectorHub: 4-tab mega-module con mapa, scanner, leads, API network
├── NotificationCenter: Real-time toasts via Supabase postgres_changes
└── 19 Custom Hooks: todos conectados a Supabase con realtime

Backend (Supabase)
├── 15+ tablas con RLS + Realtime
├── Edge Functions activas:
│   ├── ai-advisor (Gemini Strategy Insights)
│   ├── ai-qualifier (Lead AI Scoring)
│   ├── google-maps-search (Places API + demo fallback)
│   ├── web-analyzer (PageSpeed + tech stack + social detection)
│   └── daily-snapshot (metrics aggregation)
├── Edge Functions escritas (no desplegadas):
│   ├── meta-business-discovery
│   ├── tiktok-business-search
│   ├── whatsapp-webhook
│   ├── manychat-sync
│   └── api-proxy
└── Auth: email/password + magic link
```

---

## 🚀 FASES DE EJECUCIÓN

### FASE 1: Market Intelligence Engine (Prioridad CRÍTICA)

**Objetivo**: El OS debe poder escanear mercados autónomamente y generar leads cualificados sin intervención humana.

**Tareas**:

1. **Financial Markets Module** — Crear edge function `market-data` que:
   - Llame a Alpha Vantage (stocks, forex) y CoinGecko (crypto) cada hora
   - Almacene en tabla `market_snapshots` (symbol, price, change_24h, volume)
   - Frontend: crear módulo `Markets.jsx` con gráficos de tendencias
   - Hook: `useMarkets` con realtime

2. **Social Signal Aggregator** — Crear edge function `social-signals` que:
   - Reddit API: monitorice subreddits relevantes (r/SaaS, r/smallbusiness, r/ecommerce)
   - Detecte menciones de "necesito web", "busco agencia", "automatización"
   - Almacene en tabla `social_signals` con sentiment score
   - Frontend: feed en Intelligence module

3. **Competitor Watcher** — Crear edge function `competitor-watch` que:
   - Meta Ad Library: detecte cuando un competidor lanza anuncios nuevos
   - TikTok: monitorice tendencias en nichos objetivo
   - Almacene alertas en `watchtower_alerts` con source y urgency

### FASE 2: Autonomous Outreach System

**Objetivo**: El OS contacta leads cualificados automáticamente.

**Tareas**:

1. **WhatsApp Integration** — Activar `whatsapp-webhook`:
   - Enviar template messages a leads con `ai_score > 75`
   - Recibir respuestas y actualizar status del lead
   - Crear flujo: lead qualified → esperar 24h → enviar mensaje → track

2. **Email Outreach** — Crear edge function `email-outreach`:
   - Hunter.io para encontrar email del decision maker
   - Anthropic Claude para generar email personalizado
   - Supabase para trackear opens/replies vía pixel

3. **LinkedIn Connector** — Para futuro: template de mensajes via Phantom Buster

### FASE 3: Blockchain & Payments Layer

**Objetivo**: Aceptar pagos en crypto y crear un sistema de licencias tokenizado.

**Tareas**:

1. **XRP Payment Gateway** — Crear módulo `Payments.jsx`:
   - Generar wallet XRP por cliente via `xrpl.js`
   - QR code para pagos
   - Webhook que detecte pago recibido y active servicio
   - Dashboard con balance, transacciones, conversión EUR

2. **Smart Contracts** (Futuro):
   - Licencias como tokens en XRPL
   - Contratos de servicio on-chain
   - Revenue sharing automatizado con freelancers

### FASE 4: Live Data Feeds & Monitoring

**Objetivo**: Feeds en tiempo real de cámaras, tráfico, y eventos.

**Tareas**:

1. **Webcam Feed Panel** — Crear mini-app `LiveFeeds.jsx`:
   - Windy Webcams API para feeds de ciudades
   - Overlay de datos (weather, traffic, events)
   - Útil para nichos physical (restaurantes, retail)

2. **News & Events Feed** — Crear edge function `news-aggregator`:
   - Finnhub para noticias financieras
   - Google News RSS para noticias de sector
   - AI summarizer con Gemini

---

## 📐 PATRONES DE CÓDIGO (Seguir siempre)

### Edge Function Template

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  // Auth check → Business logic → Return JSON
});
```

### React Hook Template

```javascript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useXxx() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    // Fetch + realtime subscription
  }, [])

  return { data, loading, /* actions */ }
}
```

### Module Component Template

```jsx
function ModuleName() {
  const { data, loading } = useXxx()
  return (
    <div className="fade-in">
      <div className="module-header"><h1>Title</h1></div>
      {/* KPI cards → main content → detail panels */}
    </div>
  )
}
```

---

## 🎯 MÉTRICAS DE ÉXITO

| Métrica | Actual | Target 30d | Target 90d |
|---------|--------|------------|------------|
| APIs activas | 3 | 10 | 19+ |
| Leads/día automáticos | 0 | 50 | 200+ |
| Outreach mensajes/día | 0 | 20 | 100+ |
| Revenue tracking | Manual | Semi-auto | Full auto |
| AI insights/día | 3 | 10 | 50+ |

---

## ⚡ EJECUTAR AHORA

Claude (o agente que lea esto): empieza por la **FASE 1, Tarea 1** (Financial Markets Module). Es la más autónoma, no requiere keys de pago, y añade valor visual inmediato al dashboard.

Referencia APIs: ver `docs/MASTER_API_REGISTRY.md` para keys y URLs.
Referencia código: ver `src/hooks/` para patrones de hooks y `supabase/functions/` para edge functions.
