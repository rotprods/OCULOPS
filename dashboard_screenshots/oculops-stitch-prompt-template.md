# OCULOPS Stitch Generation Prompt Template
> Version 1.0 | 2026-03-12
> Source: Forensic reverse-engineering of oculops_sidebar_navigation.png + 6 interface examples

---

## MANDATORY STYLE PREAMBLE

Copy the following block EXACTLY into every Stitch prompt before any screen-specific content. This is the visual DNA that ensures consistency across all 30+ screens.

```
A premium desktop SaaS dashboard UI screenshot, straight-on flat capture, no perspective distortion, no device mockup. The interface uses a warm off-white page background (#FAFAF8, not pure white — slightly cream/parchment tone). All cards and panels are matte white (#FFFFFF) with extremely soft shadows (2px blur, 5% black opacity) creating subtle floating depth. Borders are 1px solid warm gray (#E5E5E0), barely visible, structural not decorative. Corner radius on all cards: 12px. Corner radius on buttons: 8px. Corner radius on badges: 6px.

Typography is exclusively Inter font family — clean, geometric sans-serif. Primary text is near-black (#1A1A1A), never pure black. Secondary text is medium gray (#6B6B6B). Tertiary text is light gray (#9A9A9A). Section headers are 11px, bold, UPPERCASE, 0.2em letter-spacing, in #9A9A9A. Headlines are 24px bold. KPI values are 32px bold. Body text is 13px regular.

The SOLE accent color is intelligence gold (#FFD700) — used sparingly at under 5% of visual surface: active navigation items (10% opacity background), signal strength bars, primary action buttons, the logo icon, progress ring fills, and live data highlights. Yellow is a SIGNAL, not decoration. There is NO blue accent, NO purple, NO gradient fills, NO glassmorphism, NO dark mode. Semantic colors exist only in tiny status indicators: green (#34C759) for online/success dots, red (#E53E3E) for error badges, orange (#FF9F43) for warning pills.

The left sidebar is 240px wide with a warm cream background (#F5F0E8), separated from content by a 1px warm gray border. It has grouped navigation sections labeled CORE, INTELLIGENCE, AUTOMATION, ANALYTICS in 11px bold uppercase. Nav items are 13px medium weight with 20px icons, 40px row height. The active item has a pale yellow background (10% gold opacity) with a subtle gold border.

The top header bar is 56px tall, containing the page title left-aligned, a centered search bar (320px wide, inset background #F0F0EB, 8px radius), and a green-dot LIVE indicator top-right. Every card has an inner 1px white highlight on its top edge (inset 0 1px 0 rgba(255,255,255,0.8)) simulating overhead light catching the surface. The overall feel is Apple Store meets Bloomberg Terminal — expensive, alive, editorial, tactile. A boutique premium AI operating system, not a generic SaaS dashboard.
```

---

## SIDEBAR BLOCK

Copy this for every screen. Change ONLY the `[ACTIVE_ITEM]` marker to highlight the current screen.

```
The left sidebar (240px, warm cream #F5F0E8 background) contains:

TOP: Yellow circle logo icon (28px, #FFD700) + "OCULOPS" text (Inter 18px bold #1A1A1A). Below it, a small chip badge reading "AI Intelligence OS Signal" (11px, pale yellow background).

NAVIGATION SECTIONS (each with 11px bold uppercase gray label, then items below):

CORE section:
- Control Tower (lightning bolt icon)
- CRM (grid icon)
- Pipeline (diamond icon)
- Execution (rocket icon)

INTELLIGENCE section:
- Intelligence (eye icon)
- Markets (globe icon)
- Prospector (compass icon)
- Watchtower (binoculars icon)
- Niches (layers icon)
- Scanner (radar icon)

AUTOMATION section:
- AI Agents (robot/brain icon)
- Automation (gear icon)
- Messaging (chat icon)

ANALYTICS section:
- Finance (chart icon)

[ACTIVE_ITEM] has: background rgba(255,215,0,0.10), 1px border rgba(255,215,0,0.20), text #1A1A1A bold, icon tinted gold #C8A200.

All other items: text #6B6B6B, medium weight, no background.

FOOTER: "dev@oculops.os" in 12px #6B6B6B, "v1.0.0" in 10px #9A9A9A, settings icon, separated by top border.
```

---

## HEADER BAR BLOCK

Copy this for every screen. Change `[PAGE_TITLE]` and `[PAGE_ICON]`.

```
A 56px tall header bar spanning the full content width. Left side: [PAGE_ICON] emoji/icon + "[PAGE_TITLE]" in Inter 18px semibold #1A1A1A. Center: a search input (320px wide, 40px tall, #F0F0EB background, 8px radius, magnifying glass icon 18px #9A9A9A, placeholder text "Buscar..." in #9A9A9A). Right side: a green dot (8px, #34C759, pulsing glow) next to "LIVE" text in 11px bold #34C759.
```

---

## SCREEN TEMPLATES

### UI_001 — Control Tower

```
[MANDATORY STYLE PREAMBLE]

[SIDEBAR BLOCK with ACTIVE_ITEM = "Control Tower"]

[HEADER BAR BLOCK with PAGE_TITLE = "Control Tower", PAGE_ICON = "lightning bolt"]

MAIN CONTENT:

1. HERO BANNER (full-width card, 12px radius, 1px #E5E5E0 border, white bg):
   - Left: "OCULOPS" in Inter 48px bold #1A1A1A. Below it: "system activity summary" in 16px regular #6B6B6B.
   - Right: A green dot (12px, #34C759) + "LIVE / ACTIVE" in 14px bold #34C759, "INTELLIGENCE SYSTEM" in 12px regular #6B6B6B.

2. METRICS GRID heading: grid icon + "Metrics Grid" in 18px semibold.

3. HEALTH SCORE (left): A circular progress ring (120px, 8px stroke, gold #FFD700 fill on #E5E5E0 track), value "15" centered in 36px bold, "HEALTH SCORE" below in 10px bold uppercase #6B6B6B.

4. KPI CARDS (4-column grid, 16px gap, each card: white bg, 12px radius, 1px #E5E5E0 border, 20px padding):
   - Card 1 (gold border rgba(255,215,0,0.25)): Orange coin icon in 32px container, value "€0" in 32px bold, label "MRR" in 11px semibold #6B6B6B, "Target: €20k" in 11px #9A9A9A.
   - Card 2: Purple lock icon, "0", "CLIENTS", "Target: 5".
   - Card 3: Blue people icon, "0", "CLIENTS", "Target: 5".
   - Card 4: Teal diamond icon, "€0", "PIPELINE", "Target: €50k".

5. SECOND ROW KPI (3-column):
   - Alerts: yellow bell icon, "1", "ALERTS", "Target: <3".
   - Completed: green checkmark icon, "4%", "COMPLETED", "Target: 80%".
   - Signals: blue signal icon, "5", "SIGNALS", "Target: 10+".

6. QUICK ACTIONS heading: lightning icon + "Quick Actions" in 18px semibold.
   - Horizontal row of capsule buttons (white bg, 1px #E5E5E0 border, 9999px radius, 13px medium): "Add Lead", "Create Deal", "Run Report", "Create Planer", "Rosion Action", "Get Maniage", "OS Trandle".
```

---

### UI_002 — AI Agents

```
[MANDATORY STYLE PREAMBLE]

[SIDEBAR BLOCK with ACTIVE_ITEM = "AI Agents"]

[HEADER BAR BLOCK with PAGE_TITLE = "AI Agents", PAGE_ICON = "grid/list icon"]

MAIN CONTENT:

1. CORTEX MASTER CARD (full-width, 12px radius, border: 1px solid rgba(255,215,0,0.25), background: subtle gold gradient from rgba(255,215,0,0.06) to transparent, 24px padding):
   - Top-left: Brain/gear icon + "CORTEX" in 24px bold #1A1A1A + green "Online" pill badge (green dot + text, rgba(52,199,89,0.10) bg).
   - Below: "Head Orchestrator" in 13px #6B6B6B.
   - Right side: Three metric blocks separated by 1px gray dividers: "Runs" label / "1,452" value (20px bold), "Avg Time" / "2.3s", "Last Run" / "5 min ago".
   - Below: Row of action capsule buttons: "+ Añadir Lead", "Nueva Señal", "Crear Tarea", "Nuevo Experimento", "Buscar Leads", "Ver Mensajes".
   - Bottom: Orchestration progress bar (4px height, gold gradient fill on #E5E5E0 track, rounded).

2. AGENT GRID (3-column, 20px gap). Each agent card (white bg, 12px radius, 1px #E5E5E0 border, 20px padding):

   - ATLAS card: Compass icon + "ATLAS" 18px bold + green "Online" pill top-right. Row of capability tags ("Data Analysis", "Market Intel", "User Acquisition") in gray pills. Body text: brief intelligence summary 13px #6B6B6B. Bottom badges: "OPPORTUNITY" yellow pill + "HIGH" severity + "55% CONFIDENT". Footer: "OPERATIONAL LOGIC →" in 11px #9A9A9A.

   - ORACLE card: Same structure. Capability tags differ. Risk badge instead of opportunity (red tint). "90% CONFIDENT".

   - FORGE card: Same structure. "OPPORTUNITY" + "MEDIUM" + "85% CONFIDENT".

   - HUNTER card: Same layout, different data.
   - HERALD card: Shows "Idle" state (no active intelligence, muted styling, #9A9A9A text).
   - SCRIBE card: Shows "Idle" state.
```

---

### UI_003 — CRM

```
[MANDATORY STYLE PREAMBLE]

[SIDEBAR BLOCK with ACTIVE_ITEM = "CRM"]

[HEADER BAR BLOCK with PAGE_TITLE = "CRM", PAGE_ICON = "grid icon"]

MAIN CONTENT:

1. TOP ACTION BAR: Row of capsule action buttons ("+ Add Contact", "+ Add Company", "+ Add Deal") and a filter search input (inset style, magnifying glass icon).

2. TAB BAR: Three tabs ("Contacts", "Companies", "Deals") — active tab has bottom border 2px solid #FFD700 and bold text #1A1A1A. Inactive tabs: #6B6B6B regular.

3. DATA TABLE (full-width card, 12px radius, 1px #E5E5E0 border, overflow hidden):
   - Header row: #FAFAF8 background, 11px bold uppercase #6B6B6B columns: "Name", "Email", "Company", "Status", "Last Activity", "Score".
   - Data rows: White background, 48px height, 13px regular #1A1A1A. Each row:
     - Name column: 32px circular avatar (initials on muted colored bg) + name text.
     - Status column: Colored dot (green/yellow/gray) + status text.
     - Score column: Small horizontal bar (4px height, gold fill #FFD700 on #E5E5E0 track, proportional width).
   - Row separator: 1px solid #F0F0EB (very subtle).
   - Hover state: row background shifts to rgba(255,215,0,0.04).
   - Clickable rows with cursor pointer.

4. PAGINATION: Bottom of table, right-aligned. "Showing 1-20 of 156" text in 12px #6B6B6B. Page buttons: small capsules (ghost style).
```

---

### UI_004 — Pipeline

```
[MANDATORY STYLE PREAMBLE]

[SIDEBAR BLOCK with ACTIVE_ITEM = "Pipeline"]

[HEADER BAR BLOCK with PAGE_TITLE = "Pipeline", PAGE_ICON = "diamond icon"]

MAIN CONTENT:

1. PIPELINE HEADER: Total pipeline value "€47,500" in 28px bold #1A1A1A. "12 active deals" in 13px #6B6B6B.

2. KANBAN BOARD (horizontal scroll, 5 columns, 20px gap):
   Each column:
   - Column header: Stage name ("Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won") in 14px semibold #1A1A1A + deal count badge (gray pill) + total value in 12px #6B6B6B.
   - Column body: Vertical stack of deal cards with 12px gap.
   - Each deal card (white bg, 12px radius, 1px #E5E5E0 border, 16px padding, drag handle cursor):
     - Company name: 14px semibold #1A1A1A
     - Deal value: 16px bold #1A1A1A (e.g., "€2,500")
     - Contact name: 12px #6B6B6B
     - Bottom row: Priority dot (colored) + days-in-stage counter ("14d") in 11px #9A9A9A
   - "Closed Won" column cards have a left border: 3px solid #34C759 (green accent).

3. FUNNEL CHART (below kanban, optional): Horizontal stacked bar showing conversion between stages. Bar segments in gold gradient fading from 100% to lighter shades.
```

---

### UI_005 — Prospector Hub

```
[MANDATORY STYLE PREAMBLE]

[SIDEBAR BLOCK with ACTIVE_ITEM = "Prospector"]

[HEADER BAR BLOCK with PAGE_TITLE = "Prospector Hub", PAGE_ICON = "compass icon"]

MAIN CONTENT:

1. KPI ROW (4 cards, same style as Control Tower KPIs):
   - "Total KPI" / "38.05K" / green "+30%" trend
   - "Target Search" / "52.M" / green "+300%" trend
   - "Pows Actions" / "8 in Mth" / green "+20%" trend
   - "Target Query" / "74%" / green "+5%" trend

2. TAB BAR: "Scanning", "Tharains", "Scan Action", "Autopilot" — active tab has gold bottom border.

3. MAP VIEW (large card, 12px radius, overflow hidden):
   - Mapbox light-theme map with warm cream base tones
   - Gold (#FFD700) polygon overlays marking target regions
   - Search bar overlay top-left inside map
   - Zoom controls top-right
   - Tags: "Search" and "Airspart" capsule buttons on map

4. RIGHT PANEL — "Flight Command":
   - Card with toggle switches: "Scanning" (off), "Target query" (off), "Scan actation" (off), "Scan actions" (on, gold toggle), "CRM sync" (on, gold toggle), "Autopilot" (off).
   - "Scan query" CTA button (solid gold #FFD700 bg, 8px radius).

5. BOTTOM ROW (3 cards):
   - "Airspace intelligence": Data entries with colored status dots.
   - "Scan information": Key-value pairs (Target, Status, Scat time, Inner glow).
   - "Aminciple operation": Target/Last/Autopilot metrics with capsule action buttons.
```

---

### UI_006 — Intelligence (Master Intelligence)

```
[MANDATORY STYLE PREAMBLE]

[SIDEBAR BLOCK with ACTIVE_ITEM = "Intelligence"]

[HEADER BAR BLOCK with PAGE_TITLE = "Master Intelligence", PAGE_ICON = "eye icon"]

MAIN CONTENT:

1. HERO VISUALIZATION (large card, ~60% width, 350px tall, 12px radius):
   - Contains a dramatic golden energy sphere — a TouchDesigner-inspired generative visualization. Luminous golden orb with white-hot core (#FFFFFF center), radiating golden tendrils (#FFD700 to #CC9900) like neural dendrites or electrical arcs. Tiny floating gold particle effects around the sphere. Behind the sphere: a faint perspective grid in #9A9A9A at 5% opacity. Scattered data-point labels (JetBrains Mono 9px #9A9A9A at 50% opacity) — coordinates and values floating near the energy tendrils.

2. RIGHT SIDE KPIs (stacked vertically next to hero):
   - "Global Threat Level" badge: "Low" in green.
   - "Fleet Health:" label + "98.4%" value in 36px bold.
   - Circular health ring if space permits.

3. CRITICAL SIGNALS TABLE (full-width below hero):
   - Table title: "Critical Signals" in 16px semibold.
   - Header columns: "Date", "Signal Type", "Alert Type", "Risk Type", "New Points", "Signal Category", "Signal Strength" (this column has a highlighted gold background rgba(255,215,0,0.15)), "Signal Strength" bar column.
   - Data rows with signal strength mini-bars (4px gold bars #FFD700 on #E5E5E0 track, proportional width).
   - Status indicators: colored dots for alert severity.
   - Commander section below or footer of table.
```

---

### GENERIC SCREEN TEMPLATE

For any screen not specifically templated above, use this structure:

```
[MANDATORY STYLE PREAMBLE]

[SIDEBAR BLOCK with ACTIVE_ITEM = "{{SCREEN_NAME}}"]

[HEADER BAR BLOCK with PAGE_TITLE = "{{SCREEN_TITLE}}", PAGE_ICON = "{{ICON_DESCRIPTION}}"]

MAIN CONTENT:

1. {{HERO_SECTION}}: Describe the primary visual element — a summary card, a key visualization, or a status overview. Use the full-width card pattern (white bg, 12px radius, 1px #E5E5E0 border). Include 1-2 key metrics or a status indicator.

2. {{METRICS_ROW}}: 3-4 KPI cards in a horizontal grid (same card pattern as Control Tower: icon top-left in colored container, large value, small label, optional target). Use 16px gap.

3. {{PRIMARY_CONTENT}}: The main functional area — a data table, a kanban board, a card grid, a form, or a visualization. Follow the table/card patterns exactly as specified in the visual DNA.

4. {{SECONDARY_CONTENT}}: Supporting information — a secondary table, quick actions, related data cards, or configuration panels.

5. {{ACTIONS_FOOTER}}: If applicable, a row of capsule action buttons relevant to the screen context.

RULES:
- Every card uses: white bg, 12px radius, 1px solid #E5E5E0 border, 20px padding, soft shadow.
- Gold accent (#FFD700) appears ONLY on: active nav item, primary CTA buttons, signal bars, progress fills, highlighted data columns.
- All text is Inter font. All numeric display values are bold. All labels are medium or semibold in #6B6B6B.
- Status dots are 8px circles: green for active/online, yellow for processing, red for error.
- The layout breathes — generous 24-32px spacing between sections. No cramming.
- The overall density is medium — enough data to feel like a real intelligence tool, but enough whitespace to feel premium.
```

---

## ASPECT RATIO AND OUTPUT RULES

Include one of these at the END of every prompt:

```
Output: High-fidelity desktop UI screenshot at 16:10 aspect ratio (1440x900 or 1920x1200). Straight-on flat capture, no perspective, no 3D device mockup, no browser chrome. Pixel-perfect rendering. The screenshot must look like a real production SaaS application, not a concept mockup or wireframe.
```

---

## QUALITY CONTROL CHECKLIST

Before submitting any prompt to Stitch, verify:

- [ ] Mandatory style preamble is included verbatim
- [ ] Sidebar block is included with correct active item
- [ ] Header bar block is included with correct page title
- [ ] All colors reference exact hex values, not color names
- [ ] Yellow/gold appears in 5% or less of visual area
- [ ] No blue/purple/gradient accent colors mentioned
- [ ] All typography specifies Inter + exact sizes + weights
- [ ] Cards use 12px radius, 1px #E5E5E0 border pattern
- [ ] Background is #FAFAF8, not pure white
- [ ] Aspect ratio and output format specified at end
- [ ] Content is specific (real data labels, real values) not generic placeholder text
