/* ═══════════════════════════════════════════════════
   ANTIGRAVITY OS v10 — SVG Chart Library
   ═══════════════════════════════════════════════════ */

const Charts = {
  colors: {
    primary: '#00d2d3',
    secondary: '#5f27cd',
    tertiary: '#f368e0',
    success: '#00d26a',
    warning: '#feca57',
    danger: '#ff6b6b',
    info: '#54a0ff',
    muted: '#64748b',
    grid: 'rgba(255,255,255,0.06)',
    text: '#94a3b8'
  },

  /* ── Line Chart ── */
  line(container, data, options = {}) {
    const { width = 500, height = 200, color = this.colors.primary, showArea = true, showDots = true, labels = [], yPrefix = '', ySuffix = '' } = options;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data, 1);
    const minVal = Math.min(...data, 0);
    const range = maxVal - minVal || 1;

    const points = data.map((v, i) => ({
      x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
      y: padding.top + (1 - (v - minVal) / range) * chartH
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Grid lines
    const gridLines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = padding.top + (i / steps) * chartH;
      const val = maxVal - (i / steps) * range;
      gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${this.colors.grid}" stroke-width="1"/>`);
      gridLines.push(`<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="${this.colors.text}" font-size="10" font-family="var(--font-mono)">${yPrefix}${Math.round(val).toLocaleString()}${ySuffix}</text>`);
    }

    // X labels
    const xLabels = labels.map((l, i) => {
      const x = padding.left + (i / Math.max(labels.length - 1, 1)) * chartW;
      return `<text x="${x}" y="${height - 5}" text-anchor="middle" fill="${this.colors.text}" font-size="10" font-family="var(--font-mono)">${l}</text>`;
    }).join('');

    const dots = showDots ? points.map((p, i) =>
      `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="var(--bg-card)" stroke-width="2">
        <title>${yPrefix}${data[i].toLocaleString()}${ySuffix}</title>
      </circle>`
    ).join('') : '';

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${gridLines.join('')}
        ${xLabels}
        ${showArea ? `<path d="${areaD}" fill="url(#areaGrad-${container})" opacity="0.3"/>` : ''}
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
        <defs>
          <linearGradient id="areaGrad-${container}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>`;

    const el = document.getElementById(container);
    if (el) el.innerHTML = svg;
  },

  /* ── Multi-Line Chart ── */
  multiLine(container, datasets, options = {}) {
    const { width = 500, height = 200, labels = [], yPrefix = '', ySuffix = '' } = options;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const allData = datasets.flatMap(d => d.data);
    const maxVal = Math.max(...allData, 1);
    const minVal = Math.min(...allData, 0);
    const range = maxVal - minVal || 1;

    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * chartH;
      const val = maxVal - (i / 4) * range;
      gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${this.colors.grid}" stroke-width="1"/>`);
      gridLines.push(`<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="${this.colors.text}" font-size="10" font-family="var(--font-mono)">${yPrefix}${Math.round(val).toLocaleString()}${ySuffix}</text>`);
    }

    const xLabels = labels.map((l, i) => {
      const x = padding.left + (i / Math.max(labels.length - 1, 1)) * chartW;
      return `<text x="${x}" y="${height - 5}" text-anchor="middle" fill="${this.colors.text}" font-size="10" font-family="var(--font-mono)">${l}</text>`;
    }).join('');

    const lines = datasets.map(ds => {
      const pts = ds.data.map((v, i) => ({
        x: padding.left + (i / Math.max(ds.data.length - 1, 1)) * chartW,
        y: padding.top + (1 - (v - minVal) / range) * chartH
      }));
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return `<path d="${d}" fill="none" stroke="${ds.color}" stroke-width="2" stroke-linecap="round" stroke-dasharray="${ds.dash || 'none'}"/>`;
    }).join('');

    const el = document.getElementById(container);
    if (el) el.innerHTML = `<svg viewBox="0 0 ${width} ${height}">${gridLines.join('')}${xLabels}${lines}</svg>`;
  },

  /* ── Bar Chart ── */
  bar(container, data, options = {}) {
    const { width = 500, height = 200, colors = null, labels = [], yPrefix = '', ySuffix = '' } = options;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...data, 1);

    const barW = (chartW / data.length) * 0.6;
    const gap = (chartW / data.length) * 0.4;

    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * chartH;
      const val = maxVal - (i / 4) * maxVal;
      gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${this.colors.grid}" stroke-width="1"/>`);
      gridLines.push(`<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="${this.colors.text}" font-size="10" font-family="var(--font-mono)">${yPrefix}${Math.round(val)}${ySuffix}</text>`);
    }

    const bars = data.map((v, i) => {
      const barH = (v / maxVal) * chartH;
      const x = padding.left + i * (barW + gap) + gap / 2;
      const y = padding.top + chartH - barH;
      const c = colors ? colors[i % colors.length] : this.colors.primary;
      const label = labels[i] || '';
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${c}" rx="3" opacity="0.85">
          <title>${label}: ${yPrefix}${v}${ySuffix}</title>
        </rect>
        <text x="${x + barW / 2}" y="${height - padding.bottom + 15}" text-anchor="middle" fill="${this.colors.text}" font-size="10" font-family="var(--font-mono)">${label}</text>`;
    }).join('');

    const el = document.getElementById(container);
    if (el) el.innerHTML = `<svg viewBox="0 0 ${width} ${height}">${gridLines.join('')}${bars}</svg>`;
  },

  /* ── Donut Chart ── */
  donut(container, segments, options = {}) {
    const { size = 140, thickness = 20, centerText = '' } = options;
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

    let offset = 0;
    const arcs = segments.map(seg => {
      const pct = seg.value / total;
      const dashLen = pct * circumference;
      const dashArr = `${dashLen} ${circumference - dashLen}`;
      const arc = `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${seg.color}" stroke-width="${thickness}" stroke-dasharray="${dashArr}" stroke-dashoffset="${-offset}" stroke-linecap="round"/>`;
      offset += dashLen;
      return arc;
    }).join('');

    const el = document.getElementById(container);
    if (el) el.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="var(--bg-primary)" stroke-width="${thickness}"/>
        ${arcs}
      </svg>
      ${centerText ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;pointer-events:none">
        <span style="font-size:var(--text-xl);font-weight:800;font-family:var(--font-mono)">${centerText}</span>
      </div>` : ''}`;
  },

  /* ── Score Ring (mini) ── */
  scoreRing(value, max = 100, size = 60, color = null) {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(value / max, 1);
    const c = color || (pct >= 0.7 ? this.colors.success : pct >= 0.4 ? this.colors.warning : this.colors.danger);
    return `
      <div class="score-ring" style="width:${size}px;height:${size}px">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--bg-primary)" stroke-width="5"/>
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="${pct * circ} ${circ - pct * circ}" stroke-linecap="round"/>
        </svg>
        <span class="score-text" style="font-size:${size > 50 ? 'var(--text-base)' : 'var(--text-xs)'};color:${c}">${value}</span>
      </div>`;
  },

  /* ── Funnel ── */
  funnel(container, stages) {
    const maxVal = Math.max(...stages.map(s => s.value), 1);
    const html = stages.map((s, i) => {
      const pct = maxVal > 0 ? (s.value / maxVal) * 100 : 0;
      const rate = i > 0 && stages[i - 1].value > 0 ? ((s.value / stages[i - 1].value) * 100).toFixed(1) : (i === 0 ? '100' : '0');
      return `
        <div class="funnel-step">
          <span class="funnel-label">${s.label}</span>
          <div style="flex:1"><div class="funnel-bar" style="width:${pct}%"></div></div>
          <span class="funnel-value">${s.value}</span>
          <span class="funnel-rate">${rate}%</span>
        </div>`;
    }).join('');
    const el = document.getElementById(container);
    if (el) el.innerHTML = html;
  },

  /* ── Radar Chart ── */
  radar(container, datasets, axes, options = {}) {
    const { size = 240, levels = 4 } = options;
    const cx = size / 2, cy = size / 2;
    const radius = size / 2 - 30;
    const angleStep = (2 * Math.PI) / axes.length;

    const getPoint = (val, maxVal, axisIdx) => {
      const r = (val / maxVal) * radius;
      const angle = axisIdx * angleStep - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    };

    // Grid
    let grid = '';
    for (let l = 1; l <= levels; l++) {
      const pts = axes.map((_, i) => {
        const p = getPoint(l * (100 / levels), 100, i);
        return `${p.x},${p.y}`;
      }).join(' ');
      grid += `<polygon points="${pts}" fill="none" stroke="${this.colors.grid}" stroke-width="1"/>`;
    }

    // Axis lines + labels
    let axisLines = '';
    axes.forEach((label, i) => {
      const p = getPoint(100, 100, i);
      const lp = getPoint(115, 100, i);
      axisLines += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${this.colors.grid}" stroke-width="1"/>`;
      axisLines += `<text x="${lp.x}" y="${lp.y}" text-anchor="middle" dominant-baseline="middle">${label}</text>`;
    });

    // Data polygons
    const dataPolys = datasets.map(ds => {
      const pts = ds.data.map((v, i) => {
        const p = getPoint(v, 100, i);
        return `${p.x},${p.y}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${ds.color}" fill-opacity="0.15" stroke="${ds.color}" stroke-width="2"/>`;
    }).join('');

    // Legend
    const legend = datasets.map((ds, i) =>
      `<text x="${size - 10}" y="${15 + i * 14}" text-anchor="end" fill="${ds.color}" font-size="10" font-weight="600">${ds.label}</text>`
    ).join('');

    const el = document.getElementById(container);
    if (el) el.innerHTML = `
      <div class="radar-chart">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
          ${grid}${axisLines}${dataPolys}${legend}
        </svg>
      </div>`;
  },

  /* ── Sparkline (mini inline chart) ── */
  sparkline(data, options = {}) {
    const { width = 60, height = 20, color = this.colors.primary } = options;
    if (!data || data.length < 2) return `<span class="sparkline"><svg width="${width}" height="${height}"></svg></span>`;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    }).join(' ');
    const isUp = data[data.length - 1] >= data[0];
    const c = color === 'auto' ? (isUp ? this.colors.success : this.colors.danger) : color;
    return `<span class="sparkline"><svg width="${width}" height="${height}"><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/></svg></span>`;
  },

  /* ── Animated Counter ── */
  animateCounter(elementId, target, duration = 800, prefix = '', suffix = '') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const start = parseInt(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + (target - start) * eased);
      el.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
      else { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 300); }
    };
    requestAnimationFrame(step);
  }
};
