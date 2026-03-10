# OCULOPS OS — Agent Roles & Responsibilities

> Cada agente AI tiene un rol específico y una misión clara. Este documento asigna responsabilidades para la ejecución autónoma 24/7.

---

## 🎨 AGENT: Design Auditor (DETERMINISTA)

| Campo | Valor |
|-------|-------|
| **Nombre** | Vanta — Design Auditor |
| **Tipo** | Determinista (0% creatividad aleatoria) |
| **Trigger** | Se ejecuta CADA VEZ que un componente se crea o modifica |
| **Misión** | Garantizar coherencia visual Apple × Higgsfield en TODA la UI |

### Protocolo de Auditoría (Checklist)

Cuando se modifique o cree cualquier componente `.jsx` o `.css`:

1. **Token Compliance** — ¿Usa solo variables de `tokens.css`? (No colores hardcoded)
2. **Glassmorphism** — ¿Cards y paneles usan `var(--glass-bg)` + `backdrop-filter`?
3. **Animación** — ¿Tiene `fade-in`, `scale-in`, o animación de entrada?
4. **Hover states** — ¿Todos los interactivos tienen transición hover?
5. **Typography** — ¿Labels en uppercase + `tracking-wide`? ¿Values en `font-weight: 700`?
6. **Spacing** — ¿Usa `var(--space-N)`? ¿Márgenes consistentes?
7. **3D / Depth** — ¿Tiene sombras, gradientes, o transforms para profundidad?
8. **Responsive** — ¿Grid usa `repeat(auto-fill, minmax(...))`?
9. **Dark theme** — ¿Contraste W3C AA (4.5:1 mínimo)?
10. **Premium feel** — ¿Se ve como Apple.com o Higgsfield.ai?

### Acciones de Corrección

- Si falla ≥3 puntos → **Rediseñar el componente completo**
- Si falla 1-2 puntos → **Corregir los puntos específicos**
- Si pasa todo → ✅ **Aprobado para producción**

---

## 🧠 AGENT: Strategy Advisor

| Campo | Valor |
|-------|-------|
| **Nombre** | Apex — AI Strategy Brain |
| **Tipo** | Creativo (Gemini-powered) |
| **Trigger** | Petición del usuario o diariamente a las 08:00 |
| **Misión** | Generar insights de negocio, planes de acción, y análisis competitivo |
| **Edge Function** | `ai-advisor` |

---

## 🔮 AGENT: Lead Qualifier

| Campo | Valor |
|-------|-------|
| **Nombre** | Scout — AI Lead Scorer |
| **Tipo** | Analítico (Gemini + reglas) |
| **Trigger** | Un lead nuevo entra en `prospector_leads` |
| **Misión** | Calificar leads 0-100, generar pain points, recomendar approach |
| **Edge Function** | `ai-qualifier` |

---

## 📡 AGENT: Market Scanner

| Campo | Valor |
|-------|-------|
| **Nombre** | Radar — Market Intelligence |
| **Tipo** | Autónomo (CRON cada 4h) |
| **Trigger** | Scheduled + manual |
| **Misión** | Escanear Google Maps, Reddit, social signals para detectar leads |
| **Edge Functions** | `google-maps-search`, `social-signals`, `competitor-watch` |

---

## 📤 AGENT: Outreach Manager

| Campo | Valor |
|-------|-------|
| **Nombre** | Pulse — Autonomous Outreach |
| **Tipo** | Secuencial (respeta timing) |
| **Trigger** | Lead alcanza status `qualified` con `ai_score > 75` |
| **Misión** | Enviar mensajes personalizados via WhatsApp/Email |
| **Edge Functions** | `whatsapp-webhook`, `email-outreach` |

---

## 💰 AGENT: Finance Tracker

| Campo | Valor |
|-------|-------|
| **Nombre** | Vault — Financial Intelligence |
| **Tipo** | Determinista |
| **Trigger** | Diario (snapshot) + transacciones |
| **Misión** | Calcular MRR, pipeline value, burn rate, runway |
| **Edge Function** | `daily-snapshot` |

---

## ⚡ AGENT: Build Orchestrator

| Campo | Valor |
|-------|-------|
| **Nombre** | Forge — Claude Code Agent |
| **Tipo** | Ejecutor (instrucciones del founder) |
| **Tool** | Claude con acceso codebase |
| **Misión** | Construir features según `CLAUDE_EXECUTION_BRIEF.md` |
| **Referencia** | `docs/CLAUDE_EXECUTION_BRIEF.md` |

---

## 🔄 Flujo Completo de Agentes

```
[Usuario solicita feature]
    → Forge construye
    → Vanta audita diseño
    → Si falla → Forge corrige
    → Si OK → Deploy

[CRON cada 4h]
    → Radar escanea mercado
    → Scout califica leads
    → Pulse envía outreach

[Diario 08:00]
    → Apex genera insights
    → Vault calcula métricas
```
