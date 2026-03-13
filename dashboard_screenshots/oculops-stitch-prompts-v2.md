# OCULOPS Stitch Prompt System v2.0
> Version 2.0 | 2026-03-12
> Philosophy: FEELING first, MATERIAL second, LAYOUT third
> Project ID: 10904318559636289704

---

## SECTION 1: UNIVERSAL VISUAL DNA PREAMBLE v2

Copy this block VERBATIM at the start of every Stitch prompt. It replaces the v1 preamble entirely.

```
FEELING: This is a premium AI operating system that feels like a physical instrument — a Bloomberg terminal redesigned by Apple's industrial design team for a boutique intelligence agency. Every surface has weight and presence. Cards feel like they are laser-cut from pressed ivory cardstock and float 2mm above the surface, catching overhead light on their top edges. The sidebar feels like warm parchment paper, aged to a soft cream. Status indicators breathe — they pulse with slow, organic rhythm like a heartbeat monitor in a luxury medical suite. The overall sensation is calm authority: expensive, alive, unhurried, supremely confident. This is NOT a generic SaaS dashboard. This is a bespoke intelligence instrument built for one operator.

MATERIAL: The page canvas is warm off-white (#FAFAF8) — not sterile, slightly cream like premium uncoated paper stock. Cards are matte white (#FFFFFF) with hybrid soft-neumorphic depth: each card has a 1px inner white highlight on its top edge (inset 0 1px 0 rgba(255,255,255,0.8)) simulating overhead showroom light, plus a soft directional shadow falling down-right (0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)). Borders are 1px solid warm gray (#E5E5E0), barely visible, structural not decorative. The light source is top-left at 315 degrees, consistent everywhere. Corner radius on cards: 12px. Buttons: 8px. Badges: 6px. Capsules: 9999px. Padding inside cards: 20px. Gap between sections: 24px. The depth model has three elevations: cards at 2px shadow, hero panels at 8px shadow, modals at 16px shadow.

BRAND SIGNATURE: The SOLE accent color is intelligence gold (#FFD700). It appears on less than 5% of the visual surface — it is a SIGNAL, not decoration. Gold marks what is alive, active, or demands attention: the health score ring, signal strength bars, active navigation highlight, primary CTA buttons, the CORTEX orchestrator card border, and most importantly — the golden energy visualization that serves as the system's living heartbeat. There is NO blue accent, NO purple, NO gradient fills, NO glassmorphism. Semantic colors exist only in tiny status dots: green (#34C759) for online, red (#E53E3E) for errors, orange (#FF9F43) for warnings.

TYPOGRAPHY: Exclusively Inter font family. Primary text: #1A1A1A (near-black, never pure black). Secondary: #6B6B6B. Tertiary: #9A9A9A. Section labels: 11px bold UPPERCASE 0.2em letter-spacing #9A9A9A. Headlines: 24px bold. KPI values: 32-36px bold. Body: 13px regular. Data labels: 11px semibold. Monospace data overlays use JetBrains Mono 9-10px at 50% opacity.

SIDEBAR: 240px wide, warm cream background (#F5F0E8 fading to #F0EBE0), separated by 1px #E5E5E0 right border. Navigation grouped under CORE, INTELLIGENCE, AUTOMATION, ANALYTICS in 11px bold uppercase #9A9A9A. Nav items: 13px medium #6B6B6B, 40px row height, 20px icons, 8px radius. Active item: background rgba(255,215,0,0.10), border 1px solid rgba(255,215,0,0.20), text #1A1A1A bold, icon #C8A200. Logo: gold circle icon 28px + "OCULOPS" Inter 18px bold. Footer: "dev@oculops.os" 12px #6B6B6B, "v1.0.0" 10px #9A9A9A.

HEADER: 56px tall. Left: page icon + title Inter 18px semibold. Center: search bar 320px wide, #F0F0EB background, 8px radius, "Buscar..." placeholder. Right: green pulsing dot 8px + "LIVE" 11px bold #34C759.

OUTPUT: High-fidelity desktop UI screenshot, 16:10 aspect ratio (1440x900), straight-on flat capture, no perspective, no device mockup, no browser chrome. Pixel-perfect production SaaS application rendering.
```

---

## SECTION 2: GOLDEN SPHERE ADAPTATION GUIDE

The golden energy sphere is the brand's visual heartbeat. It never appears the same way twice — it adapts to each screen's purpose while maintaining its core identity: luminous gold, organic energy, living data.

### Adaptation Scale

| Screen Type | Sphere Form | Size | Intensity | Description |
|-------------|-------------|------|-----------|-------------|
| **Intelligence** | Full dramatic sphere | 400px | 100% | TouchDesigner-inspired golden orb with white-hot core, radiating neural tendrils, floating data coordinates in JetBrains Mono, perspective grid behind at 5% opacity. The flagship visualization. |
| **Control Tower** | Health ring with particle trail | 120px | 70% | Circular progress ring (8px stroke, gold fill on #E5E5E0 track) with a faint trail of 3-5 tiny gold particles drifting from the ring's endpoint, as if energy is leaking from the measurement. |
| **AI Agents** | Mini gold pulse orb | 32px | 50% | A small breathing gold sphere on the CORTEX master card, next to the agent name. Subtly glows brighter and dimmer on a 3s cycle. Implies the orchestrator's neural core. |
| **Pipeline** | Golden energy arc | full-width | 40% | A thin golden arc (2px, #FFD700 at 30% opacity) connecting the tops of kanban columns left to right, like an energy conduit showing deal flow. Small gold particle dots at each column junction. |
| **Prospector** | Gold radar sweep | map overlay | 60% | A semi-transparent golden radial sweep on the map (like a radar ping), centered on the primary search region. Gold (#FFD700) at 15% opacity, rotating or static arc. |
| **Finance** | Gold chart shimmer | chart area | 35% | The primary revenue line in charts is rendered in gold (#FFD700) with a subtle glow trail (0 0 8px rgba(255,215,0,0.3)) making it appear to emit light. Tiny particle dots along the line at data peaks. |
| **Herald / Briefing** | Gold signal pulse | 24px | 30% | A small gold pulse ring (expanding concentric circles at 10% opacity) next to the briefing header, like a broadcast signal emanating outward. |
| **Automation** | Gold circuit trace | decorative | 25% | Thin gold lines (1px, 20% opacity) connecting workflow nodes, with small gold dots at connection points that pulse when a workflow is active. |
| **Data-heavy screens** | Gold accent bar | 80px wide | 20% | A thin horizontal gold gradient bar (4px height, #FFD700 fading to transparent) at the top of the hero card, acting as a status heartbeat line. |
| **Settings/Config** | Gold dot indicator | 8px | 15% | A single gold dot next to the page title, breathing slowly, indicating the system is live and configurable. Minimal but present. |
| **Shell/Placeholder** | Gold particle scatter | background | 10% | 3-5 tiny gold dots (4px, 15% opacity) scattered decoratively in the hero section, implying dormant energy waiting to be activated. |

### Sphere Prompt Fragment (copy into hero section of any screen)

For FULL sphere (Intelligence only):
```
Contains a dramatic golden energy sphere — a TouchDesigner-inspired generative data visualization. Luminous golden orb (400px visual footprint) with white-hot core (#FFFFFF center emission), radiating golden tendrils (#FFD700 to #CC9900) like neural dendrites or electrical arcs branching organically outward. Tiny floating gold particle effects (4-6px dots at 20-60% opacity) drifting around the sphere. Behind: a faint perspective wireframe grid in #9A9A9A at 5% opacity with vanishing point behind the sphere. Scattered data-point labels in JetBrains Mono 9px #9A9A9A at 50% opacity — coordinates and values floating near tendril paths. The sphere casts a warm ambient glow: radial gradient from rgba(255,215,0,0.15) at center to transparent at 300px radius, bleeding onto surrounding card surfaces.
```

For HEALTH RING (Control Tower, dashboards):
```
A circular health score ring (120px diameter, 8px stroke, gold #FFD700 fill on #E5E5E0 track) with the score value centered in 36px bold Inter. A faint trail of 3-4 tiny gold particles (3px, 30% opacity) drift from the ring's fill endpoint, as if measurement energy is slowly dissipating. Below: "HEALTH SCORE" in 10px bold uppercase #6B6B6B.
```

For MINI ORB (agent cards, headers):
```
A small golden pulse orb (32px) glowing with soft radiance — solid gold core (#FFD700) with a diffuse glow halo (0 0 12px rgba(255,215,0,0.25)). Implies living neural activity. Positioned [LEFT/RIGHT] of the [ELEMENT] title.
```

---

## SECTION 3: READY-TO-USE PROMPTS (27 SCREENS)

Each prompt is complete and copy-paste-ready for Stitch `edit_screens`. The `base_screen_id` indicates which existing screen to use as the starting reference.

---

### SCREEN 01: Execution
**base_screen_id**: `12cbc5048845499b8d8c21b2c4afa0a9` (Control Tower V2 — KPI-focused)

```
FEELING: This is a premium AI operating system that feels like a physical instrument — a Bloomberg terminal redesigned by Apple's industrial design team for a boutique intelligence agency. Every surface has weight and presence. Cards feel like they are laser-cut from pressed ivory cardstock and float 2mm above the surface, catching overhead light on their top edges. The sidebar feels like warm parchment paper, aged to a soft cream. Status indicators breathe — they pulse with slow, organic rhythm like a heartbeat monitor in a luxury medical suite. The overall sensation is calm authority: expensive, alive, unhurried, supremely confident. This is NOT a generic SaaS dashboard. This is a bespoke intelligence instrument built for one operator.

MATERIAL: The page canvas is warm off-white (#FAFAF8) — not sterile, slightly cream like premium uncoated paper stock. Cards are matte white (#FFFFFF) with hybrid soft-neumorphic depth: each card has a 1px inner white highlight on its top edge (inset 0 1px 0 rgba(255,255,255,0.8)) simulating overhead showroom light, plus a soft directional shadow falling down-right (0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)). Borders are 1px solid warm gray (#E5E5E0), barely visible, structural not decorative. Corner radius 12px on cards, 8px on buttons, 6px on badges, 9999px on capsules. Padding 20px inside cards. Gap 24px between sections.

BRAND SIGNATURE: The SOLE accent color is intelligence gold (#FFD700) at under 5% of visual surface. No blue, no purple, no gradients, no glassmorphism. Semantic colors only in tiny status dots: green (#34C759) online, red (#E53E3E) error, orange (#FF9F43) warning.

TYPOGRAPHY: Inter font exclusively. Primary text #1A1A1A, secondary #6B6B6B, tertiary #9A9A9A. Section labels 11px bold UPPERCASE 0.2em spacing. Headlines 24px bold. KPI values 32px bold. Body 13px regular.

SIDEBAR (240px, warm cream #F5F0E8): Gold circle logo 28px + "OCULOPS" 18px bold. Nav grouped under CORE, INTELLIGENCE, AUTOMATION, ANALYTICS in 11px bold uppercase #9A9A9A. Active item = "Execution" with background rgba(255,215,0,0.10), border 1px solid rgba(255,215,0,0.20), bold text, icon #C8A200. Other items: 13px medium #6B6B6B. Footer: "dev@oculops.os" 12px, "v1.0.0" 10px.

HEADER (56px): Rocket icon + "Execution" Inter 18px semibold. Center: search bar 320px, #F0F0EB bg. Right: green pulsing dot + "LIVE" 11px bold #34C759.

MAIN CONTENT — Task Management Hub:

1. HERO CARD (full-width, white bg, 12px radius, 1px #E5E5E0 border, 24px padding): Left: "Task Execution Center" 24px bold #1A1A1A. "14 active tasks across 4 agents" 13px #6B6B6B. Right: A thin horizontal gold gradient bar (4px height, #FFD700 fading to transparent over 80px) acting as a living status heartbeat line. Below it: "System Throughput: 94%" in 12px #6B6B6B.

2. KPI ROW (4-column grid, 16px gap). Each card: white bg, 12px radius, 1px #E5E5E0, 20px padding, inner white highlight top edge.
   - Card 1 (gold-tinted border rgba(255,215,0,0.25)): Checkmark icon in green-tinted 32px container. "12" in 32px bold. "COMPLETED TODAY" 11px semibold #6B6B6B. "Target: 20" 11px #9A9A9A.
   - Card 2: Clock icon in blue-tinted container. "4" 32px bold. "IN PROGRESS" 11px semibold. "Avg: 2.3h" 11px #9A9A9A.
   - Card 3: Alert icon in orange-tinted container. "2" 32px bold. "BLOCKED" 11px semibold. "Target: 0" 11px #9A9A9A.
   - Card 4: Zap icon in gold-tinted container. "94%" 32px bold. "THROUGHPUT" 11px semibold. "Target: 85%" 11px #9A9A9A.

3. TASK TABLE (full-width card, 12px radius, 1px #E5E5E0 border, overflow hidden):
   - Header row: #FAFAF8 bg, 11px bold uppercase #6B6B6B columns: "Task", "Agent", "Priority", "Status", "Duration", "Progress".
   - 8 data rows, 48px height, 13px Inter #1A1A1A. Each row:
     - Task: task name + small description below in 11px #9A9A9A.
     - Agent: agent name with colored dot (green online, gray offline).
     - Priority: colored pill badge — "HIGH" (rgba(229,62,62,0.08) bg, #E53E3E text), "MEDIUM" (rgba(255,215,0,0.12) bg, #C8A200 text), "LOW" (#F0F0EB bg, #6B6B6B text).
     - Status: "Running" with green dot, "Queued" with yellow dot, "Blocked" with red dot.
     - Duration: "2h 14m" in JetBrains Mono 12px #6B6B6B.
     - Progress: mini gold bar (4px height, #FFD700 fill on #E5E5E0 track, proportional width, max 80px).
   - Row separator: 1px solid #F0F0EB. Hover: rgba(255,215,0,0.04) bg.

4. QUICK ACTIONS: Row of capsule buttons (white bg, 1px #E5E5E0, 9999px radius, 13px medium): "+ New Task", "Run All Queued", "Pause Active", "View Logs", "Export Report".

Output: High-fidelity desktop UI screenshot, 16:10 (1440x900), straight-on flat capture, no perspective, no mockup. Pixel-perfect production quality.
```

---

### SCREEN 02: Finance
**base_screen_id**: `12cbc5048845499b8d8c21b2c4afa0a9` (Control Tower V2)

```
FEELING: This is a premium AI operating system that feels like a physical instrument — a Bloomberg terminal redesigned by Apple's industrial design team for a boutique intelligence agency. Every surface has weight and presence. Cards feel like laser-cut pressed ivory cardstock floating 2mm above the surface. The sidebar feels like warm parchment paper. Status indicators breathe with slow organic rhythm. Calm authority: expensive, alive, supremely confident.

MATERIAL: Page canvas warm off-white (#FAFAF8). Cards matte white (#FFFFFF) with soft-neumorphic depth: inner white highlight top edge (inset 0 1px 0 rgba(255,255,255,0.8)), soft shadow down-right (0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)). Borders 1px solid #E5E5E0. Corner radius 12px cards, 8px buttons. Padding 20px. Gap 24px.

BRAND SIGNATURE: Sole accent intelligence gold (#FFD700) under 5% surface. No blue/purple/gradients/glassmorphism. Semantic dots only: green #34C759, red #E53E3E, orange #FF9F43.

TYPOGRAPHY: Inter exclusively. Primary #1A1A1A, secondary #6B6B6B, tertiary #9A9A9A. Labels 11px bold UPPERCASE. KPI values 32px bold. Body 13px.

SIDEBAR (240px, #F5F0E8 cream): Active item = "Finance". Gold logo + "OCULOPS". Standard nav structure.

HEADER (56px): Chart icon + "Finance" 18px semibold. Search bar center. LIVE indicator right.

MAIN CONTENT — Financial Command Center:

1. HERO CARD (full-width, 24px padding): Left: "Financial Intelligence" 24px bold. "Revenue tracking and expense analysis" 13px #6B6B6B. Right: "MRR" label 11px #6B6B6B + "E0" 36px bold #1A1A1A + "Target: E20k" 11px #9A9A9A. Below the MRR value: a small gold pulse orb (24px) with soft glow halo (0 0 12px rgba(255,215,0,0.25)) indicating live financial tracking.

2. REVENUE CHART (large card, 60% width, 280px tall, 12px radius, 1px #E5E5E0):
   - Title: "Monthly Revenue" 16px semibold. Period selector pills: "7D", "30D", "90D", "1Y" — active pill has gold bg #FFD700.
   - Area chart with gold (#FFD700) line (2px stroke) and pale gold fill below (rgba(255,215,0,0.08)). The line has a subtle glow trail: 0 0 8px rgba(255,215,0,0.3) making it appear to emit light. Tiny gold particle dots at data peaks (local maxima).
   - X-axis: month labels in 11px #9A9A9A. Y-axis: EUR values in 11px #9A9A9A.
   - Grid lines: 1px #F0F0EB horizontal only.

3. KPI ROW (4-column, 16px gap):
   - "E0 MRR" (gold border), "E242,600 PIPELINE", "6 ACTIVE DEALS", "E0 EXPENSES" — same card pattern as Control Tower KPIs with icon containers, 32px values, 11px labels, targets.

4. TRANSACTIONS TABLE (full-width card, 12px radius):
   - Header: "Recent Transactions" 16px semibold.
   - Columns: "Date", "Description", "Category", "Amount", "Status".
   - 6 rows with amounts in JetBrains Mono 13px (green for income, red for expense). Status pills. Gold signal bars in amount column for relative magnitude.

5. RIGHT PANEL (stacked beside chart, 35% width):
   - "Expense Breakdown" card: Horizontal stacked bar segments in muted colors with labels.
   - "Cash Flow" card: Sparkline in gold, net value below.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 03: Markets
**base_screen_id**: `e199e1b3147a45d39944b624a6e6386a` (Intelligence Terminal — data-heavy with hero viz)

```
FEELING: Premium AI operating system — Bloomberg terminal redesigned by Apple for a boutique intelligence agency. Surfaces are pressed ivory cardstock floating above the canvas. Warm parchment sidebar. Breathing status indicators. Calm authority, expensive, alive.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF with neumorphic depth (inset 0 1px 0 rgba(255,255,255,0.8) top highlight + 0 2px 8px rgba(0,0,0,0.05) shadow). Borders 1px #E5E5E0. Radius 12px. Padding 20px. Gap 24px.

BRAND SIGNATURE: Gold #FFD700 under 5%. No blue/purple/gradients. Semantic dots only.

TYPOGRAPHY: Inter. Primary #1A1A1A, secondary #6B6B6B, tertiary #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Markets".

HEADER (56px): Globe icon + "Markets" 18px semibold. Search + LIVE.

MAIN CONTENT — Market Intelligence Terminal:

1. HERO VISUALIZATION (60% width, 320px tall, 12px radius, elevated shadow 0 4px 16px rgba(0,0,0,0.07)):
   - A golden energy sphere at 70% scale — a luminous golden orb (280px) with bright core (#FFFFFF) radiating shorter tendrils (#FFD700 to #CC9900). Represents the market intelligence neural processor. Behind: perspective grid at 5% opacity #9A9A9A. Floating data labels in JetBrains Mono 9px: market tickers, trend percentages, sector names at 50% opacity.
   - Bottom overlay on the card: "Market Sentiment: Bullish" in 13px medium, green dot.

2. RIGHT KPI STACK (beside hero, 35% width, 3 cards stacked):
   - "Competitive Threats" / "3" 32px bold / red dot "HIGH ALERT".
   - "Market Signals" / "12" 32px bold / gold signal bars.
   - "Sector Growth" / "+4.2%" 32px bold green / trend arrow up.

3. COMPETITIVE LANDSCAPE TABLE (full-width, 12px radius):
   - Title: "Competitive Intelligence" 16px semibold.
   - Columns: "Competitor", "Sector", "Threat Level", "Recent Move", "Signal Strength", "Last Detected".
   - 6 rows with company names, colored threat pills (HIGH red, MEDIUM gold, LOW gray), signal strength gold bars (4px, proportional), timestamps in 12px #6B6B6B.
   - "Signal Strength" column header highlighted with rgba(255,215,0,0.15) bg.

4. TREND CARDS (3-column below table):
   - "AI Services Market" — sparkline in gold, "+12% QoQ" green trend.
   - "Client Acquisition Cost" — sparkline, "E320 avg" value.
   - "Market Share" — mini donut chart with gold fill segment.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 04: Analytics
**base_screen_id**: `12cbc5048845499b8d8c21b2c4afa0a9` (Control Tower V2)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic (inset highlight + soft shadow). Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%. No blue/purple/gradients.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Analytics" (under ANALYTICS section).

HEADER (56px): Bar-chart icon + "Analytics" 18px semibold. Search + LIVE.

MAIN CONTENT — Performance Analytics:

1. HERO CARD: "Performance Analytics" 24px bold. "Channel performance and conversion analysis" 13px #6B6B6B. Gold heartbeat bar (4px, #FFD700 fading to transparent) top-right corner.

2. KPI ROW (4-column):
   - "1,245 TOTAL VISITS" (gold border), "3.2% CONVERSION RATE", "E4,200 CAC", "E12,800 LTV".

3. MAIN CHART (large card, 70% width, 300px tall):
   - Title: "Channel Performance" 16px semibold. Tab pills: "All", "Organic", "Paid", "Referral" — active: gold bg.
   - Multi-line chart: primary line in gold #FFD700 (2px, glow trail 0 0 8px rgba(255,215,0,0.3)), secondary lines in #D4D4CF and #9A9A9A. X-axis weeks, Y-axis values.
   - Gold particle dots at the current data point (rightmost) indicating live data.

4. SIDE PANEL (30% width, stacked cards):
   - "Top Channels" — ranked list: 1. "Organic Search" with gold bar 72%, 2. "LinkedIn" bar 18%, 3. "Direct" bar 10%.
   - "Conversion Funnel" — vertical mini funnel: Visit > Lead > Qualified > Deal. Gold fill proportional to each stage.

5. SECONDARY TABLE: "Campaign Performance" — columns: "Campaign", "Channel", "Spend", "Leads", "CPA", "ROI". 5 rows. ROI column: green for positive, red for negative. Signal strength gold bars for lead volume.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 05: Opportunities
**base_screen_id**: `fd7a4a00a2704e08855dc8c6c5de3265` (CRM Module — table-heavy)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%. No blue/purple/gradients.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Opportunities" (add under INTELLIGENCE section between existing items).

HEADER (56px): Target icon + "Opportunities" 18px semibold. Search + LIVE.

MAIN CONTENT — Opportunity Scoring Matrix:

1. HERO CARD: "Opportunity Matrix" 24px bold. "AI-scored opportunities ranked by potential and confidence" 13px #6B6B6B. Small gold pulse orb (24px) with glow next to title.

2. KPI ROW (4-column):
   - "8 HIGH PRIORITY" (gold border), "E47,500 TOTAL VALUE", "72% AVG CONFIDENCE", "3 NEW THIS WEEK".

3. SCORING MATRIX (large card, full-width, 400px tall):
   - A scatter plot visualization: X-axis "Revenue Potential" (E0 to E10k), Y-axis "Win Probability" (0% to 100%). Grid lines in #F0F0EB.
   - Data points as circles: size proportional to deal value (20-60px diameter). Color: gold (#FFD700) fill at 30% opacity with 1px gold border for high-score, #E5E5E0 fill for low-score.
   - Top-right quadrant (high potential, high probability) has a subtle gold background tint rgba(255,215,0,0.04).
   - Hover tooltip implied: company name + value.

4. OPPORTUNITY TABLE below matrix (same card, scrollable):
   - Columns: "Opportunity", "Company", "Value", "Confidence", "Score", "Agent", "Next Action".
   - 6 rows. Score column: gold signal bar (4px, proportional). Confidence: percentage with color coding (>70% green dot, 40-70% yellow dot, <40% red dot).
   - Sorted by Score descending. "Score" header highlighted rgba(255,215,0,0.15).

5. ACTIONS: Capsule buttons: "+ Add Opportunity", "Re-score All", "Export Matrix".

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 06: Reports
**base_screen_id**: `fd7a4a00a2704e08855dc8c6c5de3265` (CRM Module — table-heavy)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Reports" (under ANALYTICS).

HEADER (56px): Document icon + "Reports" 18px semibold. Search + LIVE.

MAIN CONTENT — Automated Report Generation:

1. HERO CARD: "Intelligence Reports" 24px bold. "Auto-generated reports from agent analysis" 13px #6B6B6B. Gold heartbeat bar top-right.

2. KPI ROW (3-column):
   - "12 REPORTS GENERATED" (gold border), "3 PENDING REVIEW", "Weekly cadence" small text.

3. REPORT LIST (full-width card, 12px radius):
   - Each report as a row card (mini card-in-card pattern, 8px inner radius, 1px #F0F0EB border, 16px padding, 12px gap between rows):
     - Left: Document type icon in colored 40px container (gold for intelligence, blue for financial, green for performance).
     - Center: Report title 14px semibold #1A1A1A + "Generated by SCRIBE | Mar 10, 2026 | 14 pages" 12px #6B6B6B.
     - Right: Status pill ("Ready" green, "Generating" gold pulse, "Draft" gray). Download icon button (ghost style).
   - 6 report entries.

4. REPORT PREVIEW PANEL (right side, 35% width, taller card):
   - Title: "Preview: Weekly Intelligence Brief" 14px semibold.
   - Simulated report content: Section headers, paragraph text blocks in 12px #6B6B6B, a mini gold sparkline chart, key metrics highlighted in bold. Scroll indicator on right edge.

5. ACTIONS: "Generate New Report" solid gold button (#FFD700 bg, #1A1A1A text, 8px radius). "Schedule Reports" outline button.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 07: Herald
**base_screen_id**: `60c11820344f4e6f9156d75bb21b7433` (Messaging Hub — feed-style)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Herald" (add under INTELLIGENCE or AUTOMATION).

HEADER (56px): Broadcast/megaphone icon + "Herald" 18px semibold. Search + LIVE.

MAIN CONTENT — Daily Intelligence Briefing:

1. HERO CARD (full-width, 24px padding): Left: "Daily Intelligence Briefing" 24px bold. "March 12, 2026 | 08:00 CET" 13px #6B6B6B. Right: A gold signal pulse — concentric expanding rings (3 rings, #FFD700 at 30%, 15%, 5% opacity, 24px/48px/72px diameter) representing a broadcast signal. Below: "Compiled by HERALD agent" 11px #9A9A9A.

2. BRIEFING SECTIONS (vertical stack of cards, 16px gap, each card 12px radius, 1px #E5E5E0):

   - "Priority Alerts" card (gold-tinted border): Red alert icon. 2 alert items: each with severity pill (CRITICAL red, HIGH orange), title 14px semibold, description 13px #6B6B6B, timestamp 11px #9A9A9A.

   - "Market Signals" card: Signal icon. 3 signal entries: signal name, source, impact rating (gold bar 4px), confidence percentage.

   - "Agent Activity Summary" card: Robot icon. Summary text: "ATLAS completed 4 scans. HUNTER captured 2 leads. CORTEX orchestrated 12 tasks." Each agent name in bold. Mini activity sparkline in gold next to each.

   - "Recommended Actions" card: Zap icon. 3 action items as checkable rows: checkbox (unchecked, 20px, #E5E5E0 border, 4px radius) + action text 13px + priority pill.

3. SIDEBAR PANEL (right, 30% width): "Briefing Archive" — vertical list of past briefings: date + title + read/unread dot. Most recent has gold dot, older ones gray.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 08: Automation
**base_screen_id**: `e2fae50c918d4f0bab4dddb14c149f54` (AI Agents Dashboard — card-grid)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Automation".

HEADER (56px): Gear icon + "Automation" 18px semibold. Search + LIVE.

MAIN CONTENT — n8n Workflow Orchestration:

1. HERO CARD — "n8n Integration Hub" (full-width, gold-tinted border rgba(255,215,0,0.20)):
   - Left: "Workflow Orchestration" 24px bold. "Connected to n8n cloud instance" 13px #6B6B6B. Green dot + "CONNECTED" pill badge.
   - Right: "21 Workflows" 20px bold, "12 Active" 13px green, "9 Inactive" 13px #9A9A9A.
   - Decorative: thin gold circuit-trace lines (1px, 20% opacity) running horizontally across the card background, with small gold dots at intersections pulsing subtly.

2. KPI ROW (4-column):
   - "12 ACTIVE WORKFLOWS" (gold border), "847 EXECUTIONS TODAY", "99.2% SUCCESS RATE", "2.1s AVG TIME".

3. WORKFLOW GRID (3-column, 20px gap). Each card (white bg, 12px radius, 1px #E5E5E0, 20px padding):
   - Workflow icon (n8n-style node icon) + name 16px semibold.
   - Description 13px #6B6B6B.
   - Status: toggle switch (gold #FFD700 track when on, #E5E5E0 off). 44px wide, 24px tall, 20px white thumb.
   - Last run: timestamp 11px #9A9A9A.
   - Execution count: "142 runs" 11px #6B6B6B.
   - Bottom: capsule tags for triggers ("Webhook", "Schedule", "Agent Event") in #F0F0EB bg 11px.

   Show 6 workflow cards: "Lead Qualification", "CRM Sync", "Report Generation", "Signal Processing", "Outreach Sequence", "Data Enrichment".

4. ACTIONS: "Create Workflow" gold button, "View in n8n" outline button, "Sync All" ghost button.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 09: Flight Deck
**base_screen_id**: `e2fae50c918d4f0bab4dddb14c149f54` (AI Agents Dashboard — card-grid)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Flight Deck" (add under AUTOMATION or CORE).

HEADER (56px): Airplane/cockpit icon + "Flight Deck" 18px semibold. Search + LIVE.

MAIN CONTENT — Agent Mission Control:

1. CORTEX MASTER PANEL (full-width, gold-tinted border rgba(255,215,0,0.25), subtle gold gradient bg rgba(255,215,0,0.06) to transparent, 24px padding):
   - Left: Brain icon + small gold pulse orb (32px, glow halo 0 0 12px rgba(255,215,0,0.25)) + "CORTEX" 24px bold + green "LIVE" pill.
   - "Master Orchestrator — All Systems Nominal" 13px #6B6B6B.
   - Center: Three metric blocks separated by 1px #E5E5E0 dividers: "Missions Active" / "7", "Success Rate" / "96.4%", "Uptime" / "99.9%".
   - Right: "Orchestration Trigger" progress bar (4px, gold gradient fill, animated moving shimmer).
   - Control buttons: Play (gold filled circle), Pause, Stop, Settings icons in 32px containers.

2. AGENT STATUS GRID (7-column mini cards, compact):
   Each card (100px wide, 120px tall, 12px radius, 1px #E5E5E0):
   - Agent icon 24px + name 12px bold centered.
   - Status dot: green online, gray idle, red error.
   - "Running" / "Idle" / "Error" 10px.
   - Last heartbeat: "2m ago" 9px #9A9A9A.
   Show: ATLAS, HUNTER, ORACLE, FORGE, SENTINEL, SCRIBE, HERALD.

3. MISSION LOG (full-width card, 12px radius):
   - Title: "Active Missions" 16px semibold.
   - Timeline-style vertical list: each entry has timestamp (JetBrains Mono 11px #9A9A9A), agent name (bold), action description, status pill. Gold connecting line (2px, 15% opacity) running vertically between entries.
   - 8 log entries showing recent agent activity.

4. ACTIONS: "Launch Mission" gold button, "Emergency Stop" red outline button, "View Full Logs" ghost.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 10: GTM
**base_screen_id**: `12cbc5048845499b8d8c21b2c4afa0a9` (Control Tower V2)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "GTM" (under CORE or INTELLIGENCE).

HEADER (56px): Rocket icon + "Go-To-Market" 18px semibold. Search + LIVE.

MAIN CONTENT — Campaign Planning:

1. HERO CARD: "GTM Strategy Board" 24px bold. "Campaign planning and execution tracking" 13px #6B6B6B. Gold heartbeat bar top-right.

2. KPI ROW (4-column):
   - "3 ACTIVE CAMPAIGNS" (gold border), "E8,500 TOTAL SPEND", "47 LEADS GENERATED", "E180 COST PER LEAD".

3. CAMPAIGN CARDS (2-column, 20px gap). Each card (full height, 12px radius, 1px #E5E5E0, 20px padding):
   - Campaign name 16px semibold + status pill ("Active" green, "Draft" gray, "Paused" yellow).
   - Channel: "LinkedIn Outbound" 13px #6B6B6B with channel icon.
   - Budget: "E3,000 / E5,000" with gold progress bar (4px, proportional fill).
   - Metrics row: "24 Leads" | "E125 CPL" | "3.2% CTR" in 12px.
   - Timeline: "Mar 1 - Mar 31" 11px #9A9A9A.
   - Bottom: "View Details" ghost button.
   Show 4 campaign cards.

4. TIMELINE VIEW (full-width card below):
   - Gantt-style horizontal bars on a timeline grid. Each bar represents a campaign. Gold fill for active campaigns, #E5E5E0 for planned. Week labels on X-axis.

5. ACTIONS: "+ New Campaign" gold button, "Import from n8n" outline, "Strategy Playbook" ghost.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 11: Creative Studio
**base_screen_id**: `e199e1b3147a45d39944b624a6e6386a` (Intelligence Terminal — hero viz)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Creative Studio".

HEADER (56px): Paintbrush icon + "Creative Studio" 18px semibold. Search + LIVE.

MAIN CONTENT — Content Creation Tools:

1. HERO CARD (full-width, elevated shadow 0 4px 16px rgba(0,0,0,0.07)): "Creative Intelligence" 24px bold. A mini golden energy sphere (200px) — golden orb with bright core and short tendrils, representing creative AI processing. Smaller and more contained than the Intelligence screen sphere. Positioned right side of hero card. Left side: "FORGE agent ready" 13px #6B6B6B. "4 templates loaded" 11px #9A9A9A.

2. TEMPLATE GRID (3-column, 20px gap). Each card:
   - Preview area (160px tall, #F5F5F0 bg, 8px inner radius top) showing a simplified content mockup silhouette.
   - Below: Template name 14px semibold. Type: "Email", "Landing Page", "Social Post", "Proposal" in tag pills.
   - "Use Template" outline button + "AI Generate" gold button (small).
   Show 6 template cards.

3. RECENT CREATIONS (full-width card):
   - Horizontal scroll row of 4 mini preview cards (thumbnail + title + date + agent attribution "by FORGE").

4. TOOLS PANEL (right side, 25% width):
   - "AI Tools" section: "Generate Copy" button, "Suggest Images" button, "Optimize for SEO" button — stacked vertically, outline style with icons.
   - "Brand Assets" section: Color swatches (gold, black, white, cream squares), font sample "Inter / JetBrains Mono".

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 12: Niches
**base_screen_id**: `e199e1b3147a45d39944b624a6e6386a` (Intelligence Terminal)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Niches".

HEADER (56px): Layers icon + "Niches" 18px semibold. Search + LIVE.

MAIN CONTENT — Niche Market Analysis:

1. HERO CARD (60% width, 300px tall): A golden energy sphere at 50% scale (200px) — luminous orb with tendrils representing market connections between niches. Behind: a network graph where nodes are niche markets (gold circles of varying size) connected by thin gold lines (1px, 20% opacity). The largest node glows brightest. Data labels in JetBrains Mono 9px: niche names floating near nodes.

2. RIGHT KPI STACK:
   - "5 ACTIVE NICHES" / gold border.
   - "E-commerce" / "TOP PERFORMER" green pill.
   - "Healthcare" / "EMERGING" gold pill.

3. NICHE CARDS (2-column, 20px gap). Each card (12px radius, 1px #E5E5E0, 20px padding):
   - Niche name 16px semibold + trend arrow (up green, down red, flat gray).
   - Key metrics: "TAM: E2.4B", "Growth: +12%", "Competitors: 8" in 12px.
   - Opportunity score: gold bar (4px, proportional fill, max 80px).
   - "ICP Match: 84%" with small circular progress ring (40px, gold fill).
   - Tags: "High Margin", "Low Competition" in #F0F0EB pills.
   Show 6 niche cards: E-commerce, Healthcare Clinics, Real Estate, SaaS B2B, Restaurants, Legal.

4. ACTIONS: "Scan New Niche" gold button, "Compare Niches" outline, "Export Analysis" ghost.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 13: Knowledge
**base_screen_id**: `e199e1b3147a45d39944b624a6e6386a` (Intelligence Terminal)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Knowledge" (under INTELLIGENCE).

HEADER (56px): Book/brain icon + "Knowledge" 18px semibold. Search + LIVE.

MAIN CONTENT — Knowledge Base + Semantic Search:

1. HERO SEARCH (full-width card, 24px padding, gold-tinted border):
   - "Knowledge Intelligence" 24px bold.
   - Large search input (full-width, 48px tall, #F0F0EB bg, 12px radius, magnifying glass icon, placeholder "Search knowledge base with semantic AI..." in 14px #9A9A9A). Focus state: gold border glow rgba(255,215,0,0.4).
   - Below search: Tag filter row: "All", "Proposals", "Reports", "Signals", "Market Data", "Agent Learnings" — capsule filters, active one has gold bg.
   - Small gold pulse orb (20px) next to search icon indicating AI-powered search.

2. KNOWLEDGE GRAPH VISUALIZATION (card, 50% width, 280px tall):
   - Network of interconnected nodes — gold circles (varying 12-40px) connected by thin gold lines (1px, 15% opacity). Represents semantic connections between knowledge entries. Largest nodes labeled: "Market Signals", "Client Profiles", "Proposals".

3. KNOWLEDGE ENTRIES LIST (right, 50% width):
   - Vertical stack of entry cards (8px radius, 1px #F0F0EB, 16px padding):
     - Entry icon (document/signal/chart) + title 14px semibold.
     - Source: "Agent SCRIBE" 12px #6B6B6B. Date: "Mar 10, 2026" 11px #9A9A9A.
     - Relevance score: gold bar proportional.
     - Preview text: 2 lines of 12px #6B6B6B clipped with ellipsis.
   Show 5 entries.

4. STATS FOOTER: "1,245 knowledge entries | 47 categories | Last indexed: 2h ago" 11px #9A9A9A.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 14: Decisions
**base_screen_id**: `fd7a4a00a2704e08855dc8c6c5de3265` (CRM Module — table-heavy)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Decisions".

HEADER (56px): Scale/balance icon + "Decisions" 18px semibold. Search + LIVE.

MAIN CONTENT — Decision Log + Option Analysis:

1. HERO CARD: "Decision Intelligence" 24px bold. "Track decisions, analyze options, measure outcomes" 13px #6B6B6B. Gold heartbeat bar top-right.

2. KPI ROW (3-column):
   - "8 PENDING DECISIONS" (gold border), "24 DECISIONS MADE", "78% POSITIVE OUTCOMES".

3. DECISION LOG TABLE (full-width card, 12px radius):
   - Columns: "Decision", "Category", "Status", "Options", "Confidence", "Outcome", "Date".
   - 6 rows. Status pills: "Pending" gold, "Made" green, "Deferred" gray.
   - Confidence: gold signal bars (4px, proportional).
   - Outcome: "Positive" green pill, "Negative" red, "TBD" gray.
   - Clickable rows.

4. DECISION DETAIL PANEL (expandable, shows when row clicked):
   - Decision card (elevated shadow): Title 18px semibold. Context paragraph 13px #6B6B6B.
   - "Options Analysis" section: 3 option cards side by side (8px radius, 1px #F0F0EB), each with:
     - Option name 14px semibold.
     - Pros/Cons lists (checkmark green / X red prefixed).
     - AI confidence score: circular mini ring (40px, gold fill).
     - "Select" button on winning option (gold solid).

5. ACTIONS: "+ Log Decision" gold button, "Export Decision Log" outline.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 15: Experiments
**base_screen_id**: `12cbc5048845499b8d8c21b2c4afa0a9` (Control Tower V2)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Experiments".

HEADER (56px): Flask/beaker icon + "Experiments" 18px semibold. Search + LIVE.

MAIN CONTENT — A/B Testing Dashboard:

1. HERO CARD: "Experiment Lab" 24px bold. "A/B testing and hypothesis validation" 13px #6B6B6B. 3 tiny gold particle dots (4px, 15-30% opacity) scattered decoratively — dormant energy.

2. KPI ROW (4-column):
   - "3 RUNNING" (gold border), "12 COMPLETED", "67% WIN RATE", "E2,400 VALUE GENERATED".

3. EXPERIMENT CARDS (vertical stack, 16px gap). Each card (full-width, 12px radius, 1px #E5E5E0, 20px padding):
   - Left section (70%):
     - Experiment name 16px semibold + status pill ("Running" with gold pulse dot, "Completed" green, "Draft" gray).
     - Hypothesis: "If we [change], then [metric] will [improve by X%]" in 13px italic #6B6B6B.
     - Metrics: Two variants side by side — "Variant A" vs "Variant B", each with conversion rate, sample size, confidence interval.
     - Winner indicator: Gold crown icon next to winning variant.
   - Right section (30%):
     - Bar chart comparing A vs B: Variant A bar in #D4D4CF, Variant B bar in gold #FFD700 (if winning) or #D4D4CF.
     - Statistical significance: "p < 0.05" in JetBrains Mono 11px green, or "Not significant" #9A9A9A.
   Show 3 experiment cards.

4. ACTIONS: "+ New Experiment" gold button, "Archive" ghost.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 16: Simulation
**base_screen_id**: `e199e1b3147a45d39944b624a6e6386a` (Intelligence Terminal — hero viz)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Simulation".

HEADER (56px): Waveform/signal icon + "Simulation" 18px semibold. Search + LIVE.

MAIN CONTENT — Scenario Modeling:

1. HERO VISUALIZATION (60% width, 320px tall, elevated shadow):
   - A golden energy sphere at 60% scale — the simulation engine's neural core. Luminous orb (240px) with tendrils that branch into three distinct paths (representing three scenarios). Each path terminates in a smaller node labeled "Optimistic", "Baseline", "Conservative" in JetBrains Mono 10px. The tendrils' brightness corresponds to probability: brightest path = most likely.
   - Behind: perspective grid at 5% opacity.

2. SCENARIO PANEL (right, 35% width, 3 stacked cards):
   - "Optimistic" card: green-tinted top border 3px. "E45k MRR by Q4" 16px bold. Probability: "25%" in 11px. Key assumptions listed 12px #6B6B6B.
   - "Baseline" card: gold-tinted top border. "E20k MRR by Q4" 16px bold. "60%" probability. Gold highlighted as most likely.
   - "Conservative" card: gray top border. "E8k MRR by Q4". "15%".

3. PROJECTION CHART (full-width card below):
   - Multi-line chart: three lines diverging from a common start point. Gold line = baseline (2px, glow trail), lighter gold = optimistic, #D4D4CF = conservative. Shaded confidence band in rgba(255,215,0,0.06) between optimistic and conservative.
   - X-axis: months. Y-axis: EUR values.

4. INPUT CONTROLS: "Variables" section with slider inputs (gold thumb, #E5E5E0 track): "Growth Rate", "Churn", "CAC", "Conversion Rate". Each slider: label 12px, current value in JetBrains Mono 13px bold.

5. ACTIONS: "Run Simulation" gold button, "Save Scenario" outline, "Compare" ghost.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 17: Studies
**base_screen_id**: `fd7a4a00a2704e08855dc8c6c5de3265` (CRM Module — table-heavy)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Studies" (under INTELLIGENCE).

HEADER (56px): Microscope icon + "Studies" 18px semibold. Search + LIVE.

MAIN CONTENT — Research Hub:

1. HERO CARD: "Research Intelligence" 24px bold. "Agent-generated studies and market analysis" 13px #6B6B6B. Gold heartbeat bar.

2. KPI ROW (3-column):
   - "14 STUDIES PUBLISHED" (gold border), "3 IN PROGRESS", "4 AGENTS CONTRIBUTING".

3. STUDY GRID (2-column, 20px gap). Each card (12px radius, 1px #E5E5E0, 20px padding):
   - Study title 16px semibold (e.g., "AI Services Market Spain 2026", "Restaurant Digital Transformation", "E-commerce Customer Acquisition Costs").
   - Agent attribution: "by ORACLE + SENTINEL" with agent icons.
   - Date: "Published Mar 8, 2026" 11px #9A9A9A.
   - Tags: "Market Analysis", "Spain", "AI" in #F0F0EB pills.
   - Confidence: gold bar proportional. "87% confidence" text.
   - Key finding: 1-line excerpt in 12px italic #6B6B6B.
   - "Read Study" ghost button.
   Show 6 study cards.

4. STUDY PIPELINE: Horizontal status flow at bottom — "Queued (2)" > "Researching (1)" > "Writing (1)" > "Review (0)" > "Published (14)". Connected by thin gold line (1px, 20% opacity). Current active stage has gold dot.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 18: Command Center
**base_screen_id**: `12cbc5048845499b8d8c21b2c4afa0a9` (Control Tower V2)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Command Center".

HEADER (56px): Shield/command icon + "Command Center" 18px semibold. Search + LIVE.

MAIN CONTENT — System-Wide Operations:

1. HERO CARD (full-width, gold-tinted border, 24px padding):
   - "OCULOPS Command Center" 28px bold. A gold pulse orb (40px) with expanded glow halo (0 0 20px rgba(255,215,0,0.3)) — the system's heart. "ALL SYSTEMS OPERATIONAL" in 14px bold green #34C759.
   - System uptime: "99.97% | 45d 12h since last incident" 12px #6B6B6B.

2. SYSTEM STATUS GRID (6-column mini cards):
   - "Supabase DB" green dot + "Healthy".
   - "Edge Functions" green + "31 Active".
   - "n8n Cloud" green + "Connected".
   - "Vercel" green + "Deployed".
   - "Agent Fleet" green + "7/7 Online".
   - "Event Bus" green + "Streaming".
   Each: 8px radius inner card, 1px #F0F0EB, centered text, 11px.

3. EVENT STREAM (full-width card, 300px tall, scroll):
   - Title: "Live Event Stream" 16px semibold + gold pulse dot.
   - Vertical timeline of events: timestamp (JetBrains Mono 11px #9A9A9A) | event type pill (agent.completed gold, deal.stage_changed green, signal.detected blue, agent.error red) | description 13px.
   - Gold connecting line (1px, 15% opacity) running down left edge.
   - Most recent event at top with subtle gold glow on its row.

4. RESOURCE MONITOR (2-column below):
   - "Database Load" card: gauge/meter visualization, value "12%" in 20px bold, gold fill for usage.
   - "API Calls Today" card: "2,847" 20px bold, mini sparkline in gold showing call volume over 24h.

5. ACTIONS: "Run Diagnostics" gold button, "View Full Logs" outline, "Emergency Shutdown" red outline.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 19: Watchtower
**base_screen_id**: `e2fae50c918d4f0bab4dddb14c149f54` (AI Agents Dashboard — card-grid)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Watchtower".

HEADER (56px): Binoculars icon + "Watchtower" 18px semibold. Search + LIVE.

MAIN CONTENT — Monitoring Dashboard:

1. HERO CARD: "System Watchtower" 24px bold. "Real-time monitoring of all agents and services" 13px #6B6B6B. Gold heartbeat bar.

2. KPI ROW (4-column):
   - "7/7 AGENTS ONLINE" (gold border), "0 ERRORS TODAY", "2,847 EVENTS PROCESSED", "12ms AVG LATENCY".

3. AGENT HEALTH MATRIX (full-width card, 12px radius):
   - Grid of 7 agent cards (horizontal row, equal width):
   Each agent card (inner 8px radius, 1px #F0F0EB, 16px padding):
     - Agent name 13px bold centered.
     - Health ring: mini circular progress (48px, 4px stroke, gold fill on #E5E5E0 track). Value centered 14px bold.
     - Status dot below: green/yellow/red.
     - Last activity: "2m ago" 10px #9A9A9A.
     - Sparkline: 30-day activity micro chart (40px wide, 16px tall) in gold line.
   ATLAS: 98%, HUNTER: 95%, ORACLE: 92%, FORGE: 88%, SENTINEL: 96%, SCRIBE: 90%, HERALD: 85%.

4. ALERT FEED (full-width card):
   - Title: "Recent Alerts" 16px semibold.
   - 5 alert rows: severity dot (red/yellow/green) + timestamp + agent name + message. Most critical at top. "Signal Strength" gold bar for severity.

5. UPTIME CHART (full-width card):
   - Horizontal bar per agent showing 30-day uptime. Green segments for up, red for down. Gold outline on 100% uptime agents.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 20: World Monitor
**base_screen_id**: `8ccffaf15234432d8da0ac708317ae1f` (Prospector Terminal — map/spatial)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "World Monitor".

HEADER (56px): Globe icon + "World Monitor" 18px semibold. Search + LIVE.

MAIN CONTENT — Global Market Map:

1. KPI ROW (4-column):
   - "12 MARKETS TRACKED" (gold border), "47 ACTIVE SIGNALS", "3 REGIONS EXPANDING", "+8.2% GROWTH INDEX".

2. WORLD MAP (large card, full-width, 420px tall, 12px radius, overflow hidden):
   - Mapbox light-theme world map with warm cream base tones matching app palette.
   - Gold radar sweep overlay: a semi-transparent golden radial sweep (like a radar ping at 15% opacity) centered on Europe (primary market). The sweep rotates or is static as a golden arc sector.
   - Gold (#FFD700) polygon overlays on active market regions: Spain (primary, brightest), EU (secondary), LATAM (tertiary, lighter).
   - Gold dot markers (12px) on key cities: Madrid, Barcelona, Lisbon, Paris — each with a micro glow halo (0 0 8px rgba(255,215,0,0.3)).
   - Tooltip on Madrid: card popup (8px radius, white bg, shadow) showing "Madrid | 8 signals | E24k pipeline".
   - Map controls: zoom +/-, style as app buttons (white, subtle border) top-right.

3. BOTTOM PANEL (3 cards):
   - "Regional Intelligence": Table rows per region — Region, Signals, Growth, Status (gold bars for signal density).
   - "Emerging Opportunities": 3 mini cards with market name + trend + "AI Score" gold bar.
   - "Global Risk Index": Single large value "LOW" in green, with trend sparkline.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 21: Portfolio
**base_screen_id**: `12cbc5048845499b8d8c21b2c4afa0a9` (Control Tower V2)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Portfolio".

HEADER (56px): Briefcase icon + "Portfolio" 18px semibold. Search + LIVE.

MAIN CONTENT — Portfolio Management:

1. HERO CARD: "Client Portfolio" 24px bold. "Active client relationships and revenue tracking" 13px #6B6B6B. Gold heartbeat bar.

2. KPI ROW (4-column):
   - "0 ACTIVE CLIENTS" (gold border), "E0 MONTHLY REVENUE", "E0 LIFETIME VALUE", "0% RETENTION RATE".

3. CLIENT CARDS (2-column, 20px gap). Each card (12px radius, 1px #E5E5E0, 20px padding):
   - Client avatar (48px circle, initials on muted color bg) + company name 16px semibold + status pill ("Active" green, "Onboarding" gold, "At Risk" red).
   - Services: tag pills ("AI Automation", "Content", "Ads Management") in #F0F0EB.
   - Revenue: "E2,500/mo" 20px bold. Contract: "Mar 2026 - Mar 2027" 11px #9A9A9A.
   - Health score: mini circular ring (40px, gold fill) with percentage centered.
   - Last touchpoint: "3 days ago" 11px #9A9A9A.
   Show 4 client cards (can be empty state with "No clients yet" placeholder if preferred).

4. REVENUE CHART (full-width): Monthly recurring revenue stacked bar chart. Gold bars for active revenue, #E5E5E0 for churned. Goal line dashed in gold.

5. ACTIONS: "+ Add Client" gold button, "Client Health Report" outline.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 22: Lab
**base_screen_id**: `e199e1b3147a45d39944b624a6e6386a` (Intelligence Terminal — hero viz)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Lab".

HEADER (56px): Flask/atom icon + "Lab" 18px semibold. Search + LIVE.

MAIN CONTENT — R&D Sandbox:

1. HERO VISUALIZATION (full-width, 280px tall, elevated shadow):
   - A golden energy sphere at 50% scale (200px) with tendrils branching into experimental pathways — each tendril terminates in a glowing node labeled with an experiment name in JetBrains Mono 9px. The sphere represents the experimental engine. Behind: dot grid at 5% opacity.
   - Title overlay: "R&D Sandbox" 24px bold. "Test hypotheses, prototype agents, validate models" 13px #6B6B6B.

2. EXPERIMENT WORKBENCH (2-column layout):
   - LEFT: "Active Experiments" (3 cards stacked):
     - Each: experiment name 14px semibold + type pill ("Agent", "Model", "Workflow"). Description 12px #6B6B6B. Status: "Running" with gold pulse dot, runtime "4h 22m" in JetBrains Mono. Progress bar (gold, 4px).
   - RIGHT: "Quick Launch" panel:
     - "New Agent Prototype" button (gold).
     - "Test Workflow" button (outline).
     - "Model Evaluation" button (outline).
     - "Import from Production" ghost button.
     - Configuration inputs: model selector dropdown, temperature slider (gold thumb).

3. RESULTS LOG (full-width card):
   - Title: "Recent Results" 16px semibold.
   - Table: "Experiment", "Type", "Result", "Improvement", "Date". 4 rows. Improvement column: green percentage for positive, red for negative. Gold bars for magnitude.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 23: Billing
**base_screen_id**: `fd7a4a00a2704e08855dc8c6c5de3265` (CRM Module — table-heavy)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Billing" (under ANALYTICS or footer area).

HEADER (56px): Credit card icon + "Billing" 18px semibold. Search + LIVE.

MAIN CONTENT — Subscription Management:

1. PLAN CARD (full-width, gold-tinted border rgba(255,215,0,0.25), 24px padding):
   - "Current Plan: Operator Pro" 20px bold. Gold dot indicator (8px, breathing glow) next to title.
   - "E0/month" 36px bold. "Free during beta" 13px #6B6B6B.
   - Plan features: checklist with gold checkmarks: "7 AI Agents", "Unlimited Contacts", "n8n Integration", "Real-time Intelligence".
   - "Upgrade Plan" ghost button (not gold — plan is already active).

2. KPI ROW (3-column):
   - "E0 CURRENT BILL" (gold border), "E0 TOTAL SPENT", "FREE TIER active".

3. BILLING HISTORY TABLE (full-width card, 12px radius):
   - Columns: "Date", "Description", "Amount", "Status", "Invoice".
   - Empty state OR 3 sample rows: "Mar 2026 | Operator Pro | E0 | Paid | PDF icon".
   - Status: "Paid" green pill, "Pending" gold pill, "Failed" red pill.

4. PAYMENT METHOD CARD:
   - "Payment Method" 16px semibold.
   - Card display: "Visa ending in 4242" with card icon. "Update" ghost button.
   - "Add Payment Method" outline button.

5. USAGE METERS (2-column):
   - "API Calls" gauge: current / limit, gold progress bar.
   - "Storage" gauge: current / limit, gold progress bar.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 24: Team Settings
**base_screen_id**: `fd7a4a00a2704e08855dc8c6c5de3265` (CRM Module — table-heavy)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Team" (under footer or settings area).

HEADER (56px): People/group icon + "Team Settings" 18px semibold. Search + LIVE.

MAIN CONTENT — Team Configuration:

1. HERO CARD: "Team Management" 24px bold. "Manage team members, roles, and permissions" 13px #6B6B6B. Gold dot indicator (8px, breathing).

2. KPI ROW (3-column):
   - "1 TEAM MEMBER" (gold border), "1 ROLE CONFIGURED", "ADMIN ACCESS active".

3. TEAM MEMBERS TABLE (full-width card, 12px radius):
   - Columns: "Member", "Email", "Role", "Status", "Last Active", "Actions".
   - Member column: 40px avatar circle (initials "RO" on gold-tinted bg) + "Roberto Ortega" 14px semibold.
   - Role: "Owner" pill in gold bg. Other roles: "Admin" blue, "Member" gray, "Viewer" light gray.
   - Status: green "Active" dot + text.
   - Actions: "Edit" ghost button, "Remove" ghost button.
   - 1-3 rows.

4. INVITE SECTION (card, 12px radius):
   - "Invite Team Member" 16px semibold.
   - Email input field (#F0F0EB bg, 8px radius, placeholder "team@company.com").
   - Role selector dropdown.
   - "Send Invite" gold button.

5. PERMISSIONS MATRIX (card):
   - Table: Role names as columns, permission names as rows. Checkmarks (gold) for granted, X (gray) for denied. Roles: Owner, Admin, Member, Viewer. Permissions: "Manage Agents", "Edit CRM", "View Reports", "Billing Access", "Settings".

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 25: Settings
**base_screen_id**: `fd7a4a00a2704e08855dc8c6c5de3265` (CRM Module — table-heavy)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Settings" (footer area, settings icon).

HEADER (56px): Gear icon + "Settings" 18px semibold. Search + LIVE.

MAIN CONTENT — System Settings:

1. SETTINGS NAV (left column, 200px):
   - Vertical list of setting categories (same style as sidebar nav items, 8px radius, 40px height):
   "General", "Integrations", "Notifications", "Security", "API Keys", "Data & Privacy", "Appearance".
   Active: "General" with gold highlight bg.

2. SETTINGS PANEL (right, remaining width, card 12px radius, 24px padding):

   "General Settings" 20px semibold.

   - "Organization Name" label 12px #6B6B6B + input field (#F0F0EB bg, value "OCULOPS" 14px).
   - "Timezone" label + dropdown (Europe/Madrid).
   - "Language" label + dropdown (Espanol).
   - "Currency" label + dropdown (EUR E).
   - Divider: 1px #F0F0EB horizontal.
   - "Agent Configuration" 16px semibold.
   - "Default AI Model" dropdown (GPT-4o).
   - "Auto-run agents" toggle switch (gold track when on).
   - "Agent execution interval" slider (gold thumb): "Every 6 hours" value.
   - Divider.
   - "Notifications" 16px semibold.
   - Toggle rows: "Email notifications" (on, gold), "Agent alerts" (on), "Weekly digest" (off, #E5E5E0). Each: label 13px + description 12px #6B6B6B + toggle right-aligned.

3. SAVE BUTTON: "Save Changes" gold button bottom-right + "Discard" ghost button.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 26: Pixel Office
**base_screen_id**: `e199e1b3147a45d39944b624a6e6386a` (Intelligence Terminal — hero viz)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Pixel Office".

HEADER (56px): Monitor/desk icon + "Pixel Office" 18px semibold. Search + LIVE.

MAIN CONTENT — Virtual Workspace:

1. HERO VISUALIZATION (full-width, 300px tall, elevated shadow):
   - An isometric-style virtual office floor plan rendered in warm cream tones (#F5F0E8 surfaces, #E5E5E0 edges, minimal line art). Shows desk areas, a meeting room, a data wall.
   - Gold accents: each active workspace node has a small gold pulse dot (8px) indicating occupancy/activity.
   - The "data wall" section shows a mini golden energy sphere (100px) — the office's intelligence core.
   - Agent avatars as small labeled circles at their "desks": ATLAS, HUNTER, ORACLE, etc.
   - Clean, architectural diagram feel — not cartoonish.

2. ACTIVITY FEED (left, 60% width, card):
   - "Office Activity" 16px semibold.
   - Feed of events: "[ATLAS] completed market scan — 12 leads found" with timestamp and agent icon. 8 entries.

3. WORKSPACE STATUS (right, 35% width, stacked cards):
   - "Active Stations" card: "7/7 Occupied" with green dots.
   - "Meeting Room" card: "Available" green pill. "Next: Strategy Review 14:00" 12px #6B6B6B.
   - "Data Wall" card: "Live Intelligence Feed" with gold pulse dot. "1,245 data points streaming" 12px.

4. ACTIONS: "Start Focus Session" gold button, "Schedule Meeting" outline.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

### SCREEN 27: Marketplace
**base_screen_id**: `e2fae50c918d4f0bab4dddb14c149f54` (AI Agents Dashboard — card-grid)

```
FEELING: Premium AI operating system — Bloomberg meets Apple. Pressed ivory cards, warm parchment sidebar, breathing indicators. Expensive, alive, confident.

MATERIAL: Canvas #FAFAF8. Cards #FFFFFF, neumorphic. Borders 1px #E5E5E0. Radius 12px. Padding 20px.

BRAND SIGNATURE: Gold #FFD700 under 5%.

TYPOGRAPHY: Inter. #1A1A1A / #6B6B6B / #9A9A9A.

SIDEBAR (240px, #F5F0E8): Active item = "Marketplace".

HEADER (56px): Store/shopping bag icon + "Marketplace" 18px semibold. Search + LIVE.

MAIN CONTENT — Agent & Workflow Marketplace:

1. HERO CARD (full-width, 24px padding): "OCULOPS Marketplace" 24px bold. "Extend your intelligence system with agents, workflows, and integrations" 13px #6B6B6B. Small gold particle scatter (4 dots, 4px, 15-30% opacity) floating decoratively.

2. FILTER BAR: Category capsule filters: "All", "Agents", "Workflows", "Integrations", "Templates" — active: gold bg #FFD700. Search input inline (240px, #F0F0EB).

3. MARKETPLACE GRID (3-column, 20px gap). Each card (12px radius, 1px #E5E5E0, 20px padding):
   - Icon/logo area (48px, colored container, 12px radius).
   - Item name 16px semibold. Creator: "by OCULOPS" or "Community" 12px #6B6B6B.
   - Category pill: "Agent" gold, "Workflow" blue, "Integration" green.
   - Description: 2 lines 13px #6B6B6B.
   - Rating: 5 small stars (gold filled #FFD700 for rating, #E5E5E0 unfilled). "4.8" 12px.
   - Install count: "1.2k installs" 11px #9A9A9A.
   - "Install" gold button (small) or "Installed" green outline.

   Show 6 items:
   - "SEO Scanner Agent" (Agent, gold category).
   - "Lead Enrichment Workflow" (Workflow, blue).
   - "Slack Integration" (Integration, green).
   - "Cold Email Sequence" (Workflow).
   - "Social Listener Agent" (Agent).
   - "Google Ads Connector" (Integration).

4. FEATURED BANNER (full-width card at top of grid, gold-tinted border):
   - "Featured: Advanced Prospector Pack" — premium item with gold badge, larger description, install button.

Output: 16:10 (1440x900), flat capture, pixel-perfect, no mockup.
```

---

## SECTION 4: QUALITY VERIFICATION CHECKLIST

After generating any screen, verify against this checklist before accepting the output:

### Material Quality (THE MOST IMPORTANT)
- [ ] Cards appear to float above the surface with visible soft shadow depth, not flat
- [ ] Top edge of cards has a subtle bright highlight (simulating overhead light)
- [ ] The sidebar has a warm cream tone distinct from the cooler white content area
- [ ] Surfaces read as matte — no glossy reflections, no glass effects
- [ ] The background canvas has warmth — cream/parchment, not sterile pure white
- [ ] Borders are barely visible — structural, not decorative. No thick outlines
- [ ] Overall elevation hierarchy is clear: sidebar flush < cards 2px < hero panels 8px

### Brand Signature (GOLD ENERGY)
- [ ] Gold (#FFD700) appears on 5% or less of total visual surface
- [ ] The screen's gold signature element is present (sphere, ring, bar, orb, particles — per adaptation guide)
- [ ] Gold is used ONLY for: active nav, signal bars, CTAs, health rings, the signature element, progress fills
- [ ] No blue, purple, or gradient accent colors exist anywhere
- [ ] The gold elements feel alive — they imply pulse, glow, breathing, not static decoration

### Typography
- [ ] All text is Inter font family (or JetBrains Mono for data overlays only)
- [ ] Primary text is #1A1A1A — never pure #000000 black
- [ ] Section labels are 11px bold UPPERCASE with wide letter-spacing in #9A9A9A
- [ ] KPI values are 32px+ bold — they dominate their cards
- [ ] No font is hardcoded — the rendering matches Inter's clean geometric style

### Layout Feeling
- [ ] The layout breathes — generous 24-32px spacing, not cramped
- [ ] Density is medium: enough data to feel like a real intelligence tool, enough whitespace to feel premium
- [ ] The sidebar, header, and content area are clearly three distinct zones
- [ ] The LIVE indicator with green pulsing dot is present top-right
- [ ] Search bar is centered in the header

### Emotional Verification
- [ ] Does this look like it costs $10,000/year to access? (premium feel)
- [ ] Does it feel ALIVE — like data is streaming through it right now? (live indicators)
- [ ] Could this be a still frame from a sci-fi film's command center? (cinematic authority)
- [ ] Is it closer to Bloomberg/Apple than to Notion/Linear? (instrument, not tool)
- [ ] Would you trust this interface to run a real business? (credibility)

### Technical Accuracy
- [ ] All hex colors match the spec exactly (use eyedropper to verify)
- [ ] Corner radius is consistent: 12px cards, 8px buttons, 6px badges, 9999px capsules
- [ ] The aspect ratio is 16:10 (1440x900 or equivalent)
- [ ] No perspective distortion, no 3D device mockup, no browser chrome
- [ ] The output looks like a real production application screenshot

---

## QUICK REFERENCE: Base Screen ID Selection Guide

| Screen Character | Best Base | Screen ID |
|-----------------|-----------|-----------|
| Data-heavy with hero visualization | Intelligence Terminal | `e199e1b3147a45d39944b624a6e6386a` |
| KPI-focused dashboard | Control Tower V2 | `12cbc5048845499b8d8c21b2c4afa0a9` |
| Map or spatial visualization | Prospector Terminal | `8ccffaf15234432d8da0ac708317ae1f` |
| Table-heavy with CRUD | CRM Module | `fd7a4a00a2704e08855dc8c6c5de3265` |
| Chat, feed, or timeline | Messaging Hub | `60c11820344f4e6f9156d75bb21b7433` |
| Card grid layout | AI Agents Dashboard V2 | `e2fae50c918d4f0bab4dddb14c149f54` |
