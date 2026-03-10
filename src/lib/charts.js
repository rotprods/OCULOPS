// ===================================================
// ANTIGRAVITY OS — SVG Chart Library
// Pure functions returning HTML/SVG strings.
// Use with dangerouslySetInnerHTML in React.
// ===================================================

export const Charts = {
  colors: {
    primary:   '#00d2d3',
    secondary: '#5f27cd',
    tertiary:  '#f368e0',
    success:   '#00d26a',
    warning:   '#feca57',
    danger:    '#ff6b6b',
    info:      '#54a0ff',
    muted:     '#64748b',
    grid:      'rgba(255,255,255,0.06)',
    text:      '#94a3b8',
  },

  // Line chart — returns SVG string
  line(data, options = {}) {
    const { width = 500, height = 200, color = this.colors.primary, showArea = true, showDots = true, labels = [], yPrefix = '', ySuffix = '' } = options
    const padding = { top: 20, right: 20, bottom: 30, left: 50 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const maxVal = Math.max(...data, 1)
    const minVal = Math.min(...data, 0)
    const range = maxVal - minVal || 1
    const points = data.map((v, i) => ({
      x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
      y: padding.top + (1 - (v - minVal) / range) * chartH,
    }))
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`
    const id = Math.random().toString(36).slice(2)
    const gridLines = []
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * chartH
      const val = maxVal - (i / 4) * range
      gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${this.colors.grid}" stroke-width="1"/>`)
      gridLines.push(`<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="${this.colors.text}" font-size="10" font-family="monospace">${yPrefix}${Math.round(val).toLocaleString()}${ySuffix}</text>`)
    }
    const xLabels = labels.map((l, i) => {
      const x = padding.left + (i / Math.max(labels.length - 1, 1)) * chartW
      return `<text x="${x}" y="${height - 5}" text-anchor="middle" fill="${this.colors.text}" font-size="10" font-family="monospace">${l}</text>`
    }).join('')
    const dots = showDots ? points.map((p, i) =>
      `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="#0a0e17" stroke-width="2"><title>${yPrefix}${data[i].toLocaleString()}${ySuffix}</title></circle>`
    ).join('') : ''
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
      ${gridLines.join('')}${xLabels}
      ${showArea ? `<path d="${areaD}" fill="url(#ag-${id})" opacity="0.3"/>` : ''}
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      <defs><linearGradient id="ag-${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
    </svg>`
  },

  // Multi-line chart — returns SVG string
  multiLine(datasets, options = {}) {
    const { width = 500, height = 200, labels = [], yPrefix = '', ySuffix = '' } = options
    const padding = { top: 20, right: 20, bottom: 30, left: 50 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const allData = datasets.flatMap(d => d.data)
    const maxVal = Math.max(...allData, 1)
    const minVal = Math.min(...allData, 0)
    const range = maxVal - minVal || 1
    const gridLines = []
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * chartH
      const val = maxVal - (i / 4) * range
      gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${this.colors.grid}" stroke-width="1"/>`)
      gridLines.push(`<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="${this.colors.text}" font-size="10" font-family="monospace">${yPrefix}${Math.round(val).toLocaleString()}${ySuffix}</text>`)
    }
    const xLabels = labels.map((l, i) => {
      const x = padding.left + (i / Math.max(labels.length - 1, 1)) * chartW
      return `<text x="${x}" y="${height - 5}" text-anchor="middle" fill="${this.colors.text}" font-size="10" font-family="monospace">${l}</text>`
    }).join('')
    const lines = datasets.map(ds => {
      const pts = ds.data.map((v, i) => ({
        x: padding.left + (i / Math.max(ds.data.length - 1, 1)) * chartW,
        y: padding.top + (1 - (v - minVal) / range) * chartH,
      }))
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      return `<path d="${d}" fill="none" stroke="${ds.color}" stroke-width="2" stroke-linecap="round" stroke-dasharray="${ds.dash || 'none'}"/>`
    }).join('')
    return `<svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto">${gridLines.join('')}${xLabels}${lines}</svg>`
  },

  // Score ring (inline, returns HTML string)
  scoreRing(value, max = 100, size = 60, color = null) {
    const r = (size - 8) / 2
    const circ = 2 * Math.PI * r
    const pct = Math.min(value / max, 1)
    const c = color || (pct >= 0.7 ? this.colors.success : pct >= 0.4 ? this.colors.warning : this.colors.danger)
    return `<div style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="position:absolute;top:0;left:0">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#1a2035" stroke-width="5"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${c}" stroke-width="5"
          stroke-dasharray="${pct * circ} ${circ - pct * circ}" stroke-linecap="round"
          transform="rotate(-90 ${size/2} ${size/2})"/>
      </svg>
      <span style="font-size:${size > 50 ? '13px' : '10px'};font-weight:700;color:${c};font-family:monospace;z-index:1">${value}</span>
    </div>`
  },

  // Sparkline (inline, returns HTML string)
  sparkline(data, options = {}) {
    const { width = 60, height = 20, color = this.colors.primary } = options
    if (!data || data.length < 2) return `<svg width="${width}" height="${height}"></svg>`
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 2) - 1
      return `${x},${y}`
    }).join(' ')
    const isUp = data[data.length - 1] >= data[0]
    const c = color === 'auto' ? (isUp ? this.colors.success : this.colors.danger) : color
    return `<svg width="${width}" height="${height}"><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/></svg>`
  },

  // Funnel — returns HTML string
  funnel(stages) {
    const maxVal = Math.max(...stages.map(s => s.value), 1)
    return stages.map((s, i) => {
      const pct = maxVal > 0 ? (s.value / maxVal) * 100 : 0
      const rate = i > 0 && stages[i - 1].value > 0
        ? ((s.value / stages[i - 1].value) * 100).toFixed(1)
        : (i === 0 ? '100' : '0')
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;font-size:12px">
        <span style="min-width:90px;color:#94a3b8">${s.label}</span>
        <div style="flex:1;background:#1a2035;border-radius:4px;height:8px">
          <div style="width:${pct}%;background:var(--accent-primary);height:100%;border-radius:4px;transition:width 0.4s"></div>
        </div>
        <span style="min-width:28px;text-align:right;font-family:monospace;color:#e2e8f0">${s.value}</span>
        <span style="min-width:40px;text-align:right;font-family:monospace;color:#64748b">${rate}%</span>
      </div>`
    }).join('')
  },

  // Radar chart — returns HTML string
  radar(datasets, axes, options = {}) {
    const { size = 240, levels = 4 } = options
    const cx = size / 2, cy = size / 2
    const radius = size / 2 - 30
    const angleStep = (2 * Math.PI) / axes.length
    const getPoint = (val, maxVal, axisIdx) => {
      const r = (val / maxVal) * radius
      const angle = axisIdx * angleStep - Math.PI / 2
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    }
    let grid = ''
    for (let l = 1; l <= levels; l++) {
      const pts = axes.map((_, i) => {
        const p = getPoint(l * (100 / levels), 100, i)
        return `${p.x},${p.y}`
      }).join(' ')
      grid += `<polygon points="${pts}" fill="none" stroke="${this.colors.grid}" stroke-width="1"/>`
    }
    let axisLines = ''
    axes.forEach((label, i) => {
      const p = getPoint(100, 100, i)
      const lp = getPoint(115, 100, i)
      axisLines += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${this.colors.grid}" stroke-width="1"/>`
      axisLines += `<text x="${lp.x}" y="${lp.y}" text-anchor="middle" dominant-baseline="middle" fill="${this.colors.text}" font-size="10">${label}</text>`
    })
    const dataPolys = datasets.map(ds => {
      const pts = ds.data.map((v, i) => {
        const p = getPoint(v, 100, i)
        return `${p.x},${p.y}`
      }).join(' ')
      return `<polygon points="${pts}" fill="${ds.color}" fill-opacity="0.15" stroke="${ds.color}" stroke-width="2"/>`
    }).join('')
    const legend = datasets.map((ds, i) =>
      `<text x="${size - 10}" y="${15 + i * 14}" text-anchor="end" fill="${ds.color}" font-size="10" font-weight="600">${ds.label}</text>`
    ).join('')
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${grid}${axisLines}${dataPolys}${legend}</svg>`
  },
}

export default Charts
