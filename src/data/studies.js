// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Study Hub Data
// 14 Business Intelligence Studies
// ═══════════════════════════════════════════════════

export const STUDY_CATEGORIES = {
    STRATEGY: { label: 'STRATEGY', color: 'var(--accent-primary)' },
    DATA: { label: 'DATA', color: 'var(--info)' },
    FINANCE: { label: 'FINANCE', color: 'var(--success)' },
    OPS: { label: 'OPS', color: 'var(--warning)' },
    TECH: { label: 'TECH', color: 'var(--accent-secondary)' },
    GROWTH: { label: 'GROWTH', color: 'var(--danger)' },
}

export const studies = [
    // ── 00 — RESUMEN EJECUTIVO ──
    {
        id: 0,
        icon: '⚡',
        title: 'Resumen Ejecutivo',
        subtitle: 'Visión, números clave y decisiones críticas para el lanzamiento de la agencia AI',
        categories: ['STRATEGY'],
        readTime: 8,
        sections: [
            {
                title: '1. VISIÓN Y PROPUESTA DE VALOR',
                content: `ANTIGRAVITY es una agencia de marketing digital potenciada por inteligencia artificial, con sede en la **Región de Murcia**. Nuestro diferenciador: operamos un sistema operativo propietario (ANTIGRAVITY OS) que automatiza el **80% de las tareas repetitivas** de una agencia tradicional, permitiendo ofrecer resultados premium a una fracción del coste.

**Mercado objetivo:** Las +92.000 PYMEs de la Región de Murcia, donde el **99.86% son SMEs** y la penetración de marketing digital profesional es inferior al 15%.

**Modelo:** Suscripciones mensuales de €500 a €5.000/mes con servicios de SEO, gestión de redes sociales, publicidad digital, automatización y desarrollo web — todo amplificado por IA.`,
            },
            {
                title: '2. NÚMEROS CLAVE',
                table: {
                    headers: ['Métrica', 'Valor', 'Fuente'],
                    rows: [
                        ['PIB Región de Murcia', '€41.900M (+3.6% YoY)', 'INE 2025'],
                        ['Empresas en la región', '92.458', 'Directorio Central'],
                        ['% que son PYMEs', '99.86%', 'CREM'],
                        ['Gasto digital España', '$9.700M', 'Statista 2025'],
                        ['Crecimiento CAGR digital', '+15.6%', 'eMarketer'],
                        ['Agencias digitales en Murcia', '15–20 activas', 'Google Maps scan'],
                        ['Precio medio servicio básico', '€300–€500/mes', 'Análisis competitivo'],
                        ['Mercado global AI marketing', '$19.500M → $180.000M (2034)', 'Grand View Research'],
                    ],
                },
            },
            {
                title: '3. DECISIONES CRÍTICAS',
                content: `| Decisión | Opciones | Recomendación |
| --- | --- | --- |
| Nicho inicial | Hostelería / Inmobiliarias / Salud / E-commerce | **Hostelería** (mayor volumen en Murcia, lower ticket pero alto churn permisible) |
| Pricing de entrada | €300 / €500 / €800 | **€500/mes** Starter pack (cubre costes y posiciona calidad) |
| Forma jurídica | Autónomo / SL | **Autónomo** primeros 6 meses, SL cuando MRR > €3K |
| Herramienta de prospección | Manual / Scanner AI | **Scanner AI** (Google Maps + web analyzer integrado) |
| Primer canal de captación | Cold email / LinkedIn / Networking | **Cold email + visitas presenciales** (mercado local, relación directa) |`,
            },
            {
                title: '4. PLAN DE ACCIÓN 90 DÍAS',
                content: `**Días 1–30 (Fundación):**
- Alta de autónomo, branding básico, landing page
- Configurar ANTIGRAVITY OS completo (Supabase, edge functions)
- Escanear 500 negocios de hostelería en Murcia capital
- Contactar 50 restaurantes (cold email + visita)
- Cerrar 2 piloto gratuitos (15 días, para portfolio)

**Días 31–60 (Tracción):**
- Convertir pilotos en clientes de pago (€500/mes)
- Publicar 3 caso de estudio
- Lanzar campaña LinkedIn local
- Alcanzar 3–5 clientes activos = €1.500–€2.500 MRR

**Días 61–90 (Escala):**
- Contratar primer VA o freelancer (€400–€600/mes)
- Lanzar pack Growth (€1.200/mes)
- Target: 8–10 clientes = €4.000–€6.000 MRR
- Evaluar transición a SL`,
            },
        ],
    },

    // ── 01 — ESTUDIO DE MERCADO ──
    {
        id: 1,
        icon: '📊',
        title: 'Estudio de Mercado',
        subtitle: 'Marketing digital en Región de Murcia 2026: tamaño, players, SWOT, TAM/SAM/SOM',
        categories: ['DATA', 'STRATEGY'],
        readTime: 15,
        sections: [
            {
                title: '1. TAMAÑO Y DINÁMICA DEL MERCADO',
                content: `El ecosistema de marketing digital en la Región de Murcia opera dentro de una economía regional de **€41.900M de PIB** con un crecimiento del +3.6% interanual — por encima de la media española.

La región cuenta con **1.58 millones de habitantes** distribuidos en 45 municipios, con los principales centros económicos en:`,
                table: {
                    headers: ['Municipio', 'Población', 'Empresas est.', 'Sector dominante'],
                    rows: [
                        ['Murcia capital', '462.000', '~28.000', 'Servicios, hostelería, retail'],
                        ['Cartagena', '216.000', '~12.000', 'Industria, turismo, naval'],
                        ['Lorca', '96.000', '~5.500', 'Agricultura, construcción'],
                        ['Molina de Segura', '72.000', '~4.200', 'Conservas, industria'],
                        ['Alcantarilla', '42.000', '~2.400', 'Comercio, servicios'],
                        ['Torre Pacheco/Mar Menor', '38.000', '~2.800', 'Turismo, agricultura'],
                    ],
                },
            },
            {
                title: '2. TAM / SAM / SOM',
                table: {
                    headers: ['Nivel', 'Definición', 'Estimación'],
                    rows: [
                        ['TAM', 'Todas las empresas de Murcia × gasto digital medio', '92.458 × €3.600/año = €333M'],
                        ['SAM', 'PYMEs de hostelería + retail + servicios con web', '~8.000 × €6.000/año = €48M'],
                        ['SOM', 'Alcanzable Año 1 con nuestra capacidad', '20 clientes × €9.000/año = €180K'],
                    ],
                },
            },
            {
                title: '3. COMPETIDORES DIRECTOS',
                table: {
                    headers: ['Agencia', 'Ubicación', 'Servicios', 'Pricing est.', 'Debilidad'],
                    rows: [
                        ['Alquimia Digital', 'Murcia', 'SEO, SEM, RRSS', '€600–€1.500/mes', 'Sin AI, procesos manuales'],
                        ['La Fábrica Creativa', 'Murcia', 'Branding, web, RRSS', '€800–€2.000/mes', 'Más diseño que performance'],
                        ['Imagina Digital', 'Cartagena', 'Web, SEO, ads', '€400–€1.200/mes', 'Equipo pequeño, lento'],
                        ['MrFox Agency', 'Murcia', 'RRSS, influencers', '€500–€1.500/mes', 'Solo social media'],
                        ['Klawter', 'Multi-ciudad', 'Full service', '€2.000–€5.000/mes', 'Premium = fuera de rango PYME'],
                    ],
                },
            },
            {
                title: '4. ANÁLISIS SWOT',
                content: `| | Positivo | Negativo |
| --- | --- | --- |
| **Interno** | **Fortalezas:** IA propietaria, costes operativos bajos, sistema escalable, conocimiento local | **Debilidades:** Sin portfolio inicial, marca desconocida, equipo de 1 persona |
| **Externo** | **Oportunidades:** 99% PYMEs sin marketing digital, crecimiento +15% CAGR, poca competencia AI | **Amenazas:** Agencias nacionales expandiéndose, DIY tools (Canva, ChatGPT), crisis económica |`,
            },
            {
                title: '5. TENDENCIAS CLAVE',
                content: `1. **AI-first agencies** — Las agencias que adoptan IA reducen costes operativos un 40–60%
2. **Hiperlocalización** — Las PYMEs prefieren agencias locales que entienden su mercado
3. **Performance > branding** — Los clientes SME quieren resultados medibles, no creatividad abstracta
4. **Consolidación** — El mercado español se consolida: las agencias sin diferenciación desaparecen
5. **Video-first content** — Reels, TikTok, YouTube Shorts dominan el engagement (+312% vs static)`,
            },
        ],
    },

    // ── 02 — MODELO DE PRICING ──
    {
        id: 2,
        icon: '💰',
        title: 'Modelo de Pricing',
        subtitle: 'Estructura de precios, márgenes y punto de equilibrio para servicios AI',
        categories: ['FINANCE'],
        readTime: 10,
        sections: [
            {
                title: '1. ESTRUCTURA DE COSTES FIJOS',
                table: {
                    headers: ['Concepto', 'Coste mensual', 'Notas'],
                    rows: [
                        ['Cuota autónomo', '€80', 'Tarifa plana primer año'],
                        ['OpenAI API (GPT-4o)', '€50–€150', 'Según uso, escala con clientes'],
                        ['Claude API', '€30–€80', 'Backup + análisis largo'],
                        ['Supabase Pro', '€25', 'Base de datos + auth + edge'],
                        ['Vercel Pro', '€20', 'Hosting + deploys'],
                        ['n8n Cloud', '€24', 'Automatización workflows'],
                        ['Dominios + Email', '€15', 'Google Workspace'],
                        ['Herramientas SEO (Ahrefs lite)', '€29', 'Keyword research'],
                        ['TOTAL FIJO', '€273–€423', 'Antes de coste variable'],
                    ],
                },
            },
            {
                title: '2. PACKS Y PRICING',
                table: {
                    headers: ['Pack', 'Precio/mes', 'Margen bruto', 'Horas/mes', 'Coste variable'],
                    rows: [
                        ['🟢 Starter', '€500', '~72%', '8–10h', '€140'],
                        ['🟡 Growth', '€1.200', '~78%', '15–20h', '€260'],
                        ['🔴 Enterprise', '€3.000', '~82%', '30–40h', '€540'],
                        ['⚡ Custom / Proyecto', '€2.000–€5.000', '~75%', 'Variable', 'Variable'],
                    ],
                },
            },
            {
                title: '3. PUNTO DE EQUILIBRIO',
                content: `**Break-even mensual:** €423 (costes fijos máximos)

| Escenario | Clientes | MRR | Beneficio neto |
| --- | --- | --- | --- |
| Supervivencia | 1 Starter | €500 | +€77 |
| Básico | 2 Starter + 1 Growth | €2.200 | +€1.337 |
| **Objetivo Q2** | 3 Starter + 2 Growth + 1 Enterprise | €5.700 | +€4.037 |
| Escala | 5 Starter + 3 Growth + 2 Enterprise | €12.100 | +€9.437 |

**Nota:** El margen bruto de ~75–80% es posible SOLO gracias a la automatización AI. Una agencia tradicional opera con márgenes del 30–40%.`,
            },
            {
                title: '4. ESTRATEGIA DE PRICING',
                content: `**Reglas de oro:**
1. **Nunca bajar de €500/mes** — posiciona calidad vs freelancers de Fiverr
2. **Pricing anual con descuento** — 10 meses al precio de 12 (fidelización)
3. **Setup fee €200–€500** — cubre onboarding, crea compromiso psicológico
4. **Upsell automático** — cada pack tiene "upgrade trigger" (ej: si Starter genera +30% leads → proponer Growth)
5. **Referral bonus** — 1 mes gratis por cada referido que firma`,
            },
        ],
    },

    // ── 03 — PAQUETES DE SERVICIO ──
    {
        id: 3,
        icon: '📦',
        title: 'Paquetes de Servicio',
        subtitle: 'Definición detallada de cada tier: entregables, SLA, deliverables',
        categories: ['STRATEGY', 'OPS'],
        readTime: 12,
        sections: [
            {
                title: '1. PACK STARTER — €500/mes',
                content: `**Ideal para:** Restaurantes, tiendas locales, clínicas pequeñas
**Duración mínima:** 3 meses

**Incluye:**
- Gestión de 2 redes sociales (Instagram + Facebook/Google Business)
- 12 posts/mes (diseño AI + copy AI + scheduling)
- Respuesta a comentarios y DMs (horario laboral)
- 1 reporte mensual de métricas
- Optimización básica de Google Business Profile
- Acceso a dashboard de métricas en tiempo real

**No incluye:** SEM/Ads, SEO técnico, desarrollo web, video producción`,
            },
            {
                title: '2. PACK GROWTH — €1.200/mes',
                content: `**Ideal para:** Negocios con facturación >€100K/año, e-commerce pequeño
**Duración mínima:** 6 meses

**Incluye todo lo de Starter PLUS:**
- Gestión de 4 redes sociales
- 20 posts/mes + 4 Reels/mes
- Campañas de Google Ads o Meta Ads (gestión incluida, presupuesto ad aparte)
- SEO On-Page básico (optimización de 5 páginas/mes)
- Email marketing (1 newsletter/semana, automatización welcome series)
- Community management activo
- Reportes quincenales + call mensual de estrategia (30 min)
- Chatbot AI en web/WhatsApp`,
            },
            {
                title: '3. PACK ENTERPRISE — €3.000/mes',
                content: `**Ideal para:** Empresas con equipos de +10 personas, multi-ubicación
**Duración mínima:** 12 meses

**Incluye todo lo de Growth PLUS:**
- Estrategia de contenidos completa (plan editorial trimestral)
- Producción de video (2 videos/mes, edición profesional)
- SEO técnico completo (auditoría, link building, schema markup)
- Landing pages y funnels de conversión
- Automatizaciones avanzadas (CRM, lead nurturing, scoring)
- Account manager dedicado
- Reportes semanales + call quincenal (45 min)
- Prioridad en soporte (respuesta <4h)
- Acceso beta a nuevas herramientas AI`,
            },
            {
                title: '4. MATRIZ DE SLA',
                table: {
                    headers: ['Métrica SLA', 'Starter', 'Growth', 'Enterprise'],
                    rows: [
                        ['Tiempo respuesta soporte', '<24h', '<12h', '<4h'],
                        ['Publicaciones garantizadas', '12/mes', '20/mes', '30+/mes'],
                        ['Reportes', 'Mensual', 'Quincenal', 'Semanal'],
                        ['Calls de estrategia', '0', '1/mes (30m)', '2/mes (45m)'],
                        ['Gestor dedicado', '❌', '❌', '✅'],
                        ['Garantía de rendimiento', '❌', 'KPIs definidos', 'KPIs + penalización'],
                    ],
                },
            },
        ],
    },

    // ── 04 — STACK TECNOLÓGICO ──
    {
        id: 4,
        icon: '🤖',
        title: 'Stack Tecnológico',
        subtitle: 'Herramientas AI, costes unitarios y ROI por categoría',
        categories: ['TECH', 'DATA'],
        readTime: 10,
        sections: [
            {
                title: '1. CORE AI STACK',
                table: {
                    headers: ['Herramienta', 'Uso', 'Coste/mes', 'ROI estimado'],
                    rows: [
                        ['OpenAI GPT-4o', 'Copy, análisis, chatbots, code gen', '€50–€150', 'Reemplaza 1 copywriter (€1.200/mes)'],
                        ['Claude 3.5 Sonnet', 'Análisis largo, documentos, strategy', '€30–€80', 'Reemplaza 1 analista (€1.500/mes)'],
                        ['Midjourney / DALL-E', 'Diseño gráfico, social media assets', '€10–€30', 'Reemplaza 1 diseñador parcial (€800/mes)'],
                        ['ElevenLabs', 'Voiceover para videos, podcasts', '€5–€22', 'Elimina coste de locución'],
                        ['Whisper API', 'Transcripción de reuniones', '€5', 'Ahorro de 5h/mes en notas'],
                    ],
                },
            },
            {
                title: '2. INFRAESTRUCTURA',
                table: {
                    headers: ['Servicio', 'Función', 'Coste/mes', 'Alternativa'],
                    rows: [
                        ['Supabase', 'DB, Auth, Edge Functions, Realtime', '€25', 'Firebase (€25) o PlanetScale (€29)'],
                        ['Vercel', 'Hosting, CI/CD, Edge', '€20', 'Netlify (€19)'],
                        ['n8n Cloud', 'Automatización de workflows', '€24', 'Make.com (€16) o Zapier (€30)'],
                        ['GitHub', 'Control de versiones', '€0', 'N/A (free tier)'],
                        ['Cloudflare', 'DNS, CDN, seguridad', '€0', 'N/A (free tier)'],
                    ],
                },
            },
            {
                title: '3. MARKETING & ANALYTICS',
                table: {
                    headers: ['Herramienta', 'Función', 'Coste/mes'],
                    rows: [
                        ['Google Analytics 4', 'Web analytics', '€0'],
                        ['Google Search Console', 'SEO monitoring', '€0'],
                        ['Ahrefs Lite', 'Keyword research, backlinks', '€29'],
                        ['Meta Business Suite', 'Gestión FB/IG ads', '€0'],
                        ['Google Ads', 'SEM management', '€0 (herramienta)'],
                        ['Canva Pro', 'Diseño rápido, templates', '€12'],
                        ['Metricool', 'Scheduling + analytics RRSS', '€15'],
                    ],
                },
            },
            {
                title: '4. COSTE TOTAL DEL STACK',
                content: `| Categoría | Rango mensual |
| --- | --- |
| AI APIs | €100–€280 |
| Infraestructura | €69 |
| Marketing tools | €56 |
| **TOTAL** | **€225–€405/mes** |

**Conclusión:** Por menos de **€400/mes** en herramientas, operamos como una agencia de 5–8 personas. El stack genera un **ROI de 10–15x** comparado con contratar un equipo equivalente (coste mínimo €8.000/mes en salarios).`,
            },
        ],
    },

    // ── 05 — ESTRATEGIA DE CAPTACIÓN ──
    {
        id: 5,
        icon: '🎯',
        title: 'Estrategia de Captación',
        subtitle: 'Funnel de prospección outbound: cold email, LinkedIn, Google Maps scanner',
        categories: ['GROWTH', 'STRATEGY'],
        readTime: 12,
        sections: [
            {
                title: '1. FUNNEL DE PROSPECCIÓN',
                content: `**Fase 1 — Identificación (Scanner AI)**
- Google Maps scanner: extraer negocios de hostelería en Murcia por zona
- Filtros: rating <4.5, pocas reseñas, web ausente o pobre, sin RRSS activas
- Target: 500 negocios escaneados/semana

**Fase 2 — Cualificación (AI Qualifier)**
- Analizar web automáticamente: velocidad, SEO, mobile, SSL
- Scoring 0–100 basado en "oportunidad digital"
- Priorizar leads con score >60 (mayor potencial de necesidad)

**Fase 3 — Contacto (Outreach)**
- Cold email personalizado (3-touch sequence, 5 días entre emails)
- LinkedIn connection + InMail para decisores
- Visita presencial para top 20% (diferenciador local)

**Fase 4 — Conversión**
- Audit gratuito de presencia digital (15 min, generado por AI)
- Propuesta vía video personalizado (Loom)
- Cierre: reunión presencial o videocall de 30 min`,
            },
            {
                title: '2. MÉTRICAS DEL FUNNEL',
                table: {
                    headers: ['Etapa', 'Volume/sem', 'Conv. rate', 'Output'],
                    rows: [
                        ['Escaneados', '500', '100%', '500 leads raw'],
                        ['Cualificados (>60 score)', '150', '30%', '150 leads buenos'],
                        ['Contactados (email)', '100', '20%→openers', '20 respuestas'],
                        ['Reuniones', '8', '8% de contactados', '8 calls/semana'],
                        ['Propuestas enviadas', '4', '50% de reuniones', '4 propuestas'],
                        ['Cierres', '1–2', '25–50% de propuestas', '1–2 clientes/sem'],
                    ],
                },
            },
            {
                title: '3. TEMPLATES DE COLD EMAIL',
                content: `**Email 1 — "El dato" (Day 0)**
*Asunto: Tu negocio pierde €X al mes en clientes digitales*
Cuerpo: dato específico del scan (ej: "tu web tarda 8.2s en cargar — el 53% de visitantes se va"), ofrecer audit gratis.

**Email 2 — "El caso" (Day 5)**
*Asunto: Cómo [negocio similar] aumentó reservas un 40%*
Cuerpo: mini caso de estudio (real o proyectado), CTA para llamada.

**Email 3 — "La urgencia" (Day 10)**
*Asunto: Tu competidor [nombre] ya lo está haciendo*
Cuerpo: mencionar competidor que sí tiene RRSS activas o buena web, CTA final.`,
            },
            {
                title: '4. CANAL MIX RECOMENDADO',
                table: {
                    headers: ['Canal', '% esfuerzo', 'CAC estimado', 'Velocidad'],
                    rows: [
                        ['Cold email + Scanner AI', '40%', '€50–€100', 'Rápido (2–4 semanas)'],
                        ['Visitas presenciales', '25%', '€0 (tiempo)', 'Medio (4–6 sem)'],
                        ['LinkedIn orgánico', '15%', '€0', 'Lento (8–12 sem)'],
                        ['Referidos', '10%', '€0', 'Variable'],
                        ['Google Ads (local)', '10%', '€150–€300', 'Rápido (1–2 sem)'],
                    ],
                },
            },
        ],
    },

    // ── 06 — GO-TO-MARKET ──
    {
        id: 6,
        icon: '🚀',
        title: 'Go-To-Market',
        subtitle: 'Plan de lanzamiento: hitos 30/60/90 días, pilot strategy, canal mix',
        categories: ['STRATEGY', 'GROWTH'],
        readTime: 10,
        sections: [
            {
                title: '1. FASE 1 — FUNDACIÓN (Días 1–30)',
                content: `**Objetivo:** Infraestructura completa + 2 pilotos gratuitos

| Semana | Acciones | Output |
| --- | --- | --- |
| S1 | Alta autónomo, cuenta bancaria business, dominio + email | Legal ✅ |
| S1–S2 | Deploy ANTIGRAVITY OS, landing page, branding kit | Producto ✅ |
| S2 | Primer scan de 500 negocios hostelería Murcia | 150 leads cualificados |
| S3 | Contactar top 50, ofrecer piloto gratis 15 días | 5–10 interesados |
| S4 | Ejecutar 2 pilotos, documentar resultados | 2 casos de estudio |`,
            },
            {
                title: '2. FASE 2 — TRACCIÓN (Días 31–60)',
                content: `**Objetivo:** Primeros clientes de pago, MRR > €1.500

| Semana | Acciones | Output |
| --- | --- | --- |
| S5 | Convertir pilotos → clientes Starter (€500/mes) | 2 clientes |
| S5–S6 | Publicar casos de estudio en LinkedIn + web | Social proof |
| S6–S7 | Cold email batch 2 (200 contactos nuevo segmento) | 5–8 reuniones |
| S7–S8 | Cerrar 1–3 clientes adicionales | 3–5 clientes total |
| S8 | **Milestone: MRR €1.500–€2.500** | Validación ✅ |`,
            },
            {
                title: '3. FASE 3 — ESCALA (Días 61–90)',
                content: `**Objetivo:** Proceso repetible, MRR > €4.000

| Semana | Acciones | Output |
| --- | --- | --- |
| S9 | Contratar primer VA / freelancer (RRSS, diseño) | Capacidad ×2 |
| S9–S10 | Lanzar pack Growth (€1.200/mes), upsell a Starter | Revenue ↑ |
| S10–S11 | Expandir a segundo nicho (inmobiliarias o salud) | TAM ↑ |
| S11–S12 | Implementar referral program | Canal orgánico |
| S12 | **Milestone: MRR €4.000–€6.000, 8–10 clientes** | Escala ✅ |`,
            },
            {
                title: '4. KPIs DE LANZAMIENTO',
                table: {
                    headers: ['KPI', 'Día 30', 'Día 60', 'Día 90'],
                    rows: [
                        ['Clientes activos', '0 (2 pilotos)', '3–5', '8–10'],
                        ['MRR', '€0', '€1.500–€2.500', '€4.000–€6.000'],
                        ['Pipeline value', '€5.000', '€12.000', '€25.000'],
                        ['Leads cualificados', '150', '400', '800'],
                        ['Win rate', 'N/A', '20–30%', '25–35%'],
                        ['Churn', 'N/A', '0%', '<10%'],
                    ],
                },
            },
        ],
    },

    // ── 07 — FRAMEWORK KPIs ──
    {
        id: 7,
        icon: '📈',
        title: 'Framework KPIs',
        subtitle: 'MRR, churn, LTV, CAC, pipeline velocity — targets por trimestre',
        categories: ['DATA', 'FINANCE'],
        readTime: 10,
        sections: [
            {
                title: '1. KPIs PRIMARIOS (North Star)',
                table: {
                    headers: ['KPI', 'Fórmula', 'Target Q1', 'Target Q2', 'Target Q4'],
                    rows: [
                        ['MRR', 'Σ revenue recurrente mensual', '€2.500', '€8.000', '€20.000'],
                        ['Clientes activos', 'Total con contrato vigente', '5', '12', '25'],
                        ['Churn mensual', 'Clientes perdidos / total', '<15%', '<10%', '<7%'],
                        ['LTV', 'ARPU × (1/churn)', '€3.333', '€6.000', '€8.571'],
                        ['CAC', 'Coste adquisición / nuevos clientes', '<€200', '<€150', '<€100'],
                    ],
                },
            },
            {
                title: '2. KPIs SECUNDARIOS (Pipeline)',
                table: {
                    headers: ['KPI', 'Descripción', 'Target'],
                    rows: [
                        ['Pipeline velocity', '(# opp × win rate × deal size) / cycle days', '>€3.000/mes'],
                        ['Lead-to-close rate', '% de leads que convierten', '>5%'],
                        ['Avg deal size', 'Revenue medio por cliente', '>€700/mes'],
                        ['Sales cycle', 'Días desde primer contacto a cierre', '<21 días'],
                        ['Proposals sent', 'Propuestas enviadas/mes', '>8'],
                    ],
                },
            },
            {
                title: '3. KPIs OPERATIVOS (Delivery)',
                table: {
                    headers: ['KPI', 'Descripción', 'Target'],
                    rows: [
                        ['Client satisfaction (NPS)', 'Net Promoter Score', '>50'],
                        ['Task completion rate', '% tareas entregadas a tiempo', '>90%'],
                        ['Content production', 'Pieces creados/mes (all clients)', '>60'],
                        ['Response time', 'Tiempo medio respuesta soporte', '<6h'],
                        ['AI automation rate', '% tareas automatizadas vs manual', '>70%'],
                    ],
                },
            },
            {
                title: '4. DASHBOARD DE SEGUIMIENTO',
                content: `**Frecuencia de revisión:**
- **Diario:** MRR, nuevos leads, tareas pendientes
- **Semanal:** Pipeline velocity, proposals sent, content output
- **Mensual:** Churn, LTV, CAC, NPS, revenue growth
- **Trimestral:** Revisión estratégica completa, ajuste de targets

**Alertas automáticas (Watchtower):**
- 🔴 Churn >15% en cualquier mes
- 🔴 MRR cae >10% mes a mes
- 🟡 Pipeline <3x del target MRR
- 🟡 NPS <30
- 🟢 LTV/CAC ratio >3x (excelente)`,
            },
        ],
    },

    // ── 08 — PROTOCOLO DE CALIDAD ──
    {
        id: 8,
        icon: '🛡️',
        title: 'Protocolo de Calidad',
        subtitle: 'QA de entregables, SOPs de comunicación, matriz de escalación',
        categories: ['OPS'],
        readTime: 8,
        sections: [
            {
                title: '1. CHECKLIST DE CALIDAD POR ENTREGABLE',
                table: {
                    headers: ['Entregable', 'Checks obligatorios', 'Herramienta QA'],
                    rows: [
                        ['Post RRSS', 'Copy sin errores, imagen 1080×1080, hashtags relevantes, CTA', 'Grammarly + revisión manual'],
                        ['Campaña Ads', 'Segmentación revisada, presupuesto confirmado, tracking pixels', 'Meta/Google preview'],
                        ['Reporte mensual', 'Datos verificados, gráficos claros, recomendaciones accionables', 'Template estandarizado'],
                        ['Web / Landing', 'Mobile responsive, <3s carga, SSL, formularios funcionales', 'PageSpeed + GTmetrix'],
                        ['Email marketing', 'Subject A/B, preview text, links funcionales, unsubscribe', 'Litmus + test envío'],
                    ],
                },
            },
            {
                title: '2. SOP DE COMUNICACIÓN CON CLIENTES',
                content: `**Canales autorizados:**
- Email (comunicación formal, reportes)
- WhatsApp Business (comunicación rápida, aprobaciones)
- Call/Videocall (estrategia, onboarding, revisiones)

**Reglas:**
1. Respuesta máxima: Starter 24h, Growth 12h, Enterprise 4h
2. Toda aprobación de contenido requiere confirmación escrita
3. Cambios de scope → nuevo presupuesto (nunca scope creep gratis)
4. Reportes enviados máximo 3 días después del cierre de mes
5. Nunca compartir datos de un cliente con otro`,
            },
            {
                title: '3. MATRIZ DE ESCALACIÓN',
                table: {
                    headers: ['Nivel', 'Situación', 'Acción', 'Tiempo resp.'],
                    rows: [
                        ['L1 — Normal', 'Pregunta operativa, aprobación contenido', 'Respuesta directa', '24h'],
                        ['L2 — Urgente', 'Error en campaña activa, bug en web', 'Fix inmediato + notificación', '4h'],
                        ['L3 — Crítico', 'Cuenta hackeada, gasto ad descontrolado', 'Pausar todo + llamar al cliente', '1h'],
                        ['L4 — Crisis', 'PR negativo viral, demanda legal', 'Protocolo crisis + asesor legal', 'Inmediato'],
                    ],
                },
            },
        ],
    },

    // ── 09 — DATA ROOM ──
    {
        id: 9,
        icon: '✅',
        title: 'Data Room',
        subtitle: 'Documentación legal, checklist de inversores y partners',
        categories: ['OPS', 'STRATEGY'],
        readTime: 6,
        sections: [
            {
                title: '1. DOCUMENTOS LEGALES',
                table: {
                    headers: ['Documento', 'Estado', 'Prioridad'],
                    rows: [
                        ['Alta autónomo (RETA)', '⬜ Pendiente', '🔴 Crítico'],
                        ['Alta IAE (epígrafe 844 — Servicios de publicidad)', '⬜ Pendiente', '🔴 Crítico'],
                        ['Declaración censal (modelo 036/037)', '⬜ Pendiente', '🔴 Crítico'],
                        ['LOPD / RGPD — Política de privacidad', '⬜ Pendiente', '🟡 Alto'],
                        ['Contrato tipo de servicios', '⬜ Pendiente', '🟡 Alto'],
                        ['Condiciones generales de contratación', '⬜ Pendiente', '🟡 Alto'],
                        ['Seguro responsabilidad civil', '⬜ Pendiente', '🟢 Medio'],
                        ['Registro de marca (OEPM)', '⬜ Pendiente', '🟢 Medio'],
                    ],
                },
            },
            {
                title: '2. DOCUMENTOS FINANCIEROS',
                table: {
                    headers: ['Documento', 'Estado', 'Frecuencia'],
                    rows: [
                        ['Modelo 303 (IVA trimestral)', '⬜', 'Trimestral'],
                        ['Modelo 130 (IRPF trimestral)', '⬜', 'Trimestral'],
                        ['Modelo 390 (Resumen anual IVA)', '⬜', 'Anual'],
                        ['Libro de facturas emitidas', '⬜', 'Continuo'],
                        ['Libro de facturas recibidas', '⬜', 'Continuo'],
                        ['Proyección financiera 12 meses', '⬜', 'Mensual update'],
                    ],
                },
            },
            {
                title: '3. DOCUMENTOS PARA PARTNERS/INVERSORES',
                table: {
                    headers: ['Documento', 'Estado', 'Notas'],
                    rows: [
                        ['Pitch deck (10 slides)', '⬜', 'Ver estudio #10'],
                        ['One-pager ejecutivo', '⬜', 'Resumen en 1 página'],
                        ['Financial model (Excel)', '⬜', 'Proyección 3 años'],
                        ['Portfolio / Casos de estudio', '⬜', 'Mínimo 3 necesarios'],
                        ['Testimonios de clientes', '⬜', 'Video + escrito'],
                        ['Demo de ANTIGRAVITY OS', '⬜', 'Video walkthrough 3 min'],
                    ],
                },
            },
        ],
    },

    // ── 10 — PITCH DECK ──
    {
        id: 10,
        icon: '🎤',
        title: 'Pitch Deck',
        subtitle: 'Estructura slide-by-slide para inversores y partners estratégicos',
        categories: ['STRATEGY'],
        readTime: 8,
        sections: [
            {
                title: '1. ESTRUCTURA DEL DECK (10 SLIDES)',
                table: {
                    headers: ['#', 'Slide', 'Mensaje clave', 'Duración'],
                    rows: [
                        ['1', 'Cover', 'ANTIGRAVITY — AI-Powered Marketing Agency', '15s'],
                        ['2', 'Problema', 'El 85% de PYMEs en Murcia no tienen marketing digital efectivo', '45s'],
                        ['3', 'Solución', 'Agencia AI que automatiza el 80% del trabajo → precio competitivo', '60s'],
                        ['4', 'Producto', 'Demo visual de ANTIGRAVITY OS + servicios', '90s'],
                        ['5', 'Mercado', 'TAM €333M, SAM €48M, SOM €180K año 1', '45s'],
                        ['6', 'Modelo de negocio', 'Suscripciones €500–€5K/mes, margen 75–82%', '45s'],
                        ['7', 'Tracción', 'X clientes, €X MRR, pipeline €X', '30s'],
                        ['8', 'Competencia', 'Mapa competitivo + nuestro diferenciador AI', '30s'],
                        ['9', 'Roadmap', 'Q1–Q4 2026, hitos de revenue', '30s'],
                        ['10', 'Ask / CTA', 'Lo que necesitamos + próximos pasos', '30s'],
                    ],
                },
            },
            {
                title: '2. MENSAJES CLAVE POR SLIDE',
                content: `**Slide 2 — Problema:**
- "92.458 empresas en Murcia. El 85% no invierte en marketing digital."
- "Las que lo hacen, pagan €1.000–€3.000/mes a agencias lentas e ineficientes."
- "Resultado: PYMEs perdiendo clientes ante competidores digitalizados."

**Slide 3 — Solución:**
- "ANTIGRAVITY usa IA propietaria para ejecutar en horas lo que tarda semanas."
- "Mismo resultado, 60% menos coste operativo."
- "Escalable: 1 operador puede gestionar 15–20 clientes con nuestro OS."

**Slide 6 — Unit Economics:**
- "CAC: <€150 | LTV: >€6.000 | LTV/CAC: 40x"
- "Margen bruto: 75–82% (vs 30–40% agencia tradicional)"
- "Break-even: 1 cliente"`,
            },
        ],
    },

    // ── 11 — LANDING PAGE STRATEGY ──
    {
        id: 11,
        icon: '🌐',
        title: 'Landing Page',
        subtitle: 'Estrategia web, copywriting de conversión, arquitectura SEO/funnel',
        categories: ['GROWTH', 'STRATEGY'],
        readTime: 8,
        sections: [
            {
                title: '1. ARQUITECTURA DE PÁGINAS',
                table: {
                    headers: ['Página', 'Objetivo', 'CTA principal'],
                    rows: [
                        ['Homepage', 'Posicionar marca + generar leads', 'Solicitar audit gratis'],
                        ['/servicios', 'Explicar packs con pricing', 'Contactar para tu pack'],
                        ['/casos-de-estudio', 'Social proof con resultados reales', 'Quiero resultados similares'],
                        ['/sobre-nosotros', 'Confianza y credibilidad', 'Agenda una llamada'],
                        ['/blog', 'SEO content + autoridad', 'Suscríbete al newsletter'],
                        ['/contacto', 'Formulario + WhatsApp + Maps', 'Enviar mensaje'],
                        ['/audit-gratis', 'Landing de conversión para ads', 'Solicitar mi audit gratis'],
                    ],
                },
            },
            {
                title: '2. COPYWRITING — HOMEPAGE',
                content: `**Hero section:**
- H1: "Tu negocio merece marketing que funciona. Con IA."
- Subtítulo: "Somos la agencia de Murcia que usa inteligencia artificial para multiplicar tus clientes."
- CTA: "Solicita tu audit digital gratis →"

**Sección de dolor:**
- "¿Tu web no genera clientes?"
- "¿Tus redes sociales están muertas?"
- "¿Pagas una agencia que no da resultados?"

**Sección de solución:**
- "Automatizamos lo repetitivo para enfocarnos en lo que importa: hacerte crecer."
- 3 iconos: Más clientes | Menos coste | Resultados medibles

**Social proof:**
- Logos de clientes
- Testimonios con foto
- Métricas reales (+X% leads, +X% revenue)`,
            },
            {
                title: '3. SEO KEYWORDS TARGET',
                table: {
                    headers: ['Keyword', 'Vol. búsqueda/mes', 'Dificultad', 'Intent'],
                    rows: [
                        ['agencia marketing digital murcia', '320', 'Media', 'Comercial'],
                        ['marketing digital murcia', '480', 'Media', 'Informativa'],
                        ['agencia seo murcia', '170', 'Baja', 'Comercial'],
                        ['community manager murcia', '210', 'Baja', 'Comercial'],
                        ['publicidad google murcia', '90', 'Baja', 'Comercial'],
                        ['diseño web murcia', '390', 'Alta', 'Comercial'],
                    ],
                },
            },
        ],
    },

    // ── 12 — ROADMAP 2026 ──
    {
        id: 12,
        icon: '🗺️',
        title: 'Roadmap 2026',
        subtitle: 'Hoja de ruta trimestral: producto, revenue y milestones clave',
        categories: ['STRATEGY'],
        readTime: 8,
        sections: [
            {
                title: '1. Q1 2026 — FUNDACIÓN',
                content: `**Tema:** Validar producto-mercado, conseguir primeros clientes

| Milestone | Target | Status |
| --- | --- | --- |
| Legal setup (autónomo) | Completar | ⬜ |
| ANTIGRAVITY OS v1 deployed | Funcional | ⬜ |
| Landing page live | Conversión >3% | ⬜ |
| 5 clientes de pago | MRR €2.500 | ⬜ |
| 3 casos de estudio publicados | Social proof | ⬜ |
| Scanner AI operativo | 500 scans/semana | ⬜ |`,
            },
            {
                title: '2. Q2 2026 — TRACCIÓN',
                content: `**Tema:** Escalar canal de adquisición, primer hire

| Milestone | Target | Status |
| --- | --- | --- |
| 12 clientes activos | MRR €8.000 | ⬜ |
| Primer pack Enterprise vendido | €3.000/mes | ⬜ |
| Contratar VA/freelancer (RRSS) | €500/mes | ⬜ |
| Lanzar segundo nicho | Inmobiliarias | ⬜ |
| Referral program activo | 2 referidos/mes | ⬜ |
| NPS >50 | Satisfacción alta | ⬜ |`,
            },
            {
                title: '3. Q3 2026 — EXPANSIÓN',
                content: `**Tema:** Diversificar servicios, evaluar SL

| Milestone | Target | Status |
| --- | --- | --- |
| 20 clientes activos | MRR €15.000 | ⬜ |
| Segundo hire (account manager) | €1.200/mes | ⬜ |
| Lanzar servicio de video/Reels | Upsell +€300/mes | ⬜ |
| Constituir SL | Escudo fiscal | ⬜ |
| Partner con herramienta local | Co-marketing | ⬜ |
| Revenue anualizado | >€180.000 | ⬜ |`,
            },
            {
                title: '4. Q4 2026 — CONSOLIDACIÓN',
                content: `**Tema:** Procesos maduros, preparar 2027

| Milestone | Target | Status |
| --- | --- | --- |
| 25+ clientes activos | MRR €20.000+ | ⬜ |
| Equipo de 3–4 personas | Full time | ⬜ |
| ANTIGRAVITY OS v2 (white-label?) | Explorar | ⬜ |
| Oficina/coworking en Murcia | Presencia física | ⬜ |
| Revenue anualizado | >€240.000 | ⬜ |
| Plan 2027 definido | Expansión regional | ⬜ |`,
            },
        ],
    },

    // ── 13 — ÁRBOL DE DECISIÓN ──
    {
        id: 13,
        icon: '🌳',
        title: 'Árbol de Decisión',
        subtitle: 'Decision trees críticos: pricing, nicho, inversiones en herramientas',
        categories: ['STRATEGY'],
        readTime: 7,
        sections: [
            {
                title: '1. DECISIÓN: ¿QUÉ NICHO ATACAR PRIMERO?',
                content: `\`\`\`
¿Conoces bien el sector?
├── SÍ → ¿Hay volumen en Murcia (>2.000 empresas)?
│   ├── SÍ → ¿Ticket medio >€500/mes posible?
│   │   ├── SÍ → ✅ LANZAR (ej: hostelería, inmobiliarias)
│   │   └── NO → ⚠️ Solo como puerta de entrada (upsell después)
│   └── NO → ❌ Descartartodo (ej: industria naval es muy nicho)
└── NO → ¿Puedes aprenderlo en <2 semanas?
    ├── SÍ → Investigar y re-evaluar
    └── NO → ❌ Siguiente nicho
\`\`\`

**Resultado para Murcia:** Hostelería (>5.000 negocios, ticket alcanzable, alta necesidad digital).`,
            },
            {
                title: '2. DECISIÓN: ¿CUÁNDO SUBIR PRECIOS?',
                content: `\`\`\`
¿Churn mensual <10%?
├── SÍ → ¿Pipeline >3x MRR actual?
│   ├── SÍ → ¿Capacidad ocupada >80%?
│   │   ├── SÍ → ✅ SUBIR PRECIOS (nuevo tier o +15% en existentes)
│   │   └── NO → Mantener precios, llenar capacidad
│   └── NO → Mantener precios, mejorar prospección
└── NO → ❌ NO subir. Arreglar retención primero.
\`\`\``,
            },
            {
                title: '3. DECISIÓN: ¿CUÁNDO CONTRATAR?',
                content: `\`\`\`
¿MRR estable >€5.000 durante 2+ meses?
├── SÍ → ¿Estás trabajando >50h/semana?
│   ├── SÍ → ¿Qué tarea consume más tiempo?
│   │   ├── RRSS/Contenido → Contratar VA RRSS (€400–€600/mes)
│   │   ├── Ventas/Admin → Contratar VA admin (€300–€500/mes)
│   │   └── Delivery → Contratar freelancer especialista
│   └── NO → No contratar aún, optimizar procesos con AI
└── NO → ❌ No contratar. Demasiado riesgo financiero.
\`\`\``,
            },
            {
                title: '4. DECISIÓN: ¿AUTÓNOMO O SL?',
                content: `\`\`\`
¿Beneficio anual neto >€40.000?
├── SÍ → ¿Planeas facturar >€60.000 este año?
│   ├── SÍ → ✅ Constituir SL (tipo impositivo 25% vs IRPF progresivo)
│   └── NO → Evaluar en 6 meses
└── NO → Mantener autónomo (cuota más baja, menos burocracia)

Nota: Con la tarifa plana de autónomo (€80/mes primer año), no tiene
sentido constituir SL hasta que el IRPF marginal supere el 25%.
\`\`\``,
            },
        ],
    },
]
