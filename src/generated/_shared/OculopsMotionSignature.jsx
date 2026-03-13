import React, { useRef, useEffect, useCallback } from 'react'

/**
 * OCULOPS Motion Signature — Brand Motion Graphics
 * ─────────────────────────────────────────────────
 * Full-screen Canvas 2D generative motion piece.
 * Golden neural constellation with breathing core,
 * orbiting agent nodes, data streams, and heartbeat pulse.
 *
 * Usage:
 *   <OculopsMotionSignature />                        // Full viewport
 *   <OculopsMotionSignature width={800} height={600} /> // Fixed size
 *   <OculopsMotionSignature theme="dark" />           // Dark mode
 */

const TAU = Math.PI * 2
const GOLD = { r: 255, g: 215, b: 0 }
const IVORY = { r: 250, g: 250, b: 248 }
const DARK = { r: 13, g: 13, b: 13 }

const AGENT_NAMES = ['ATLAS', 'HUNTER', 'ORACLE', 'FORGE', 'SENTINEL', 'SCRIBE', 'CORTEX']

function lerp(a, b, t) { return a + (b - a) * t }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }

const OculopsMotionSignature = ({
  width = null,
  height = null,
  theme = 'light',
  showLabels = true,
  intensity = 1,
}) => {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const frameRef = useRef(0)

  const isDark = theme === 'dark'
  const bg = isDark ? DARK : IVORY
  const textColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,26,0.5)'

  const init = useCallback((canvas) => {
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const baseRadius = Math.min(w, h) * 0.28

    // Core sphere
    const core = {
      x: cx,
      y: cy,
      radius: baseRadius * 0.12,
      phase: 0,
      breatheSpeed: 0.008,
    }

    // 7 agent nodes in constellation
    const agents = AGENT_NAMES.map((name, i) => {
      const angle = (i / 7) * TAU - Math.PI / 2
      const orbitRadius = baseRadius * (0.7 + Math.random() * 0.3)
      return {
        name,
        angle,
        orbitRadius,
        x: cx + Math.cos(angle) * orbitRadius,
        y: cy + Math.sin(angle) * orbitRadius,
        radius: 4 + Math.random() * 3,
        orbitSpeed: 0.0008 + Math.random() * 0.0006,
        phase: Math.random() * TAU,
        breatheSpeed: 0.012 + Math.random() * 0.008,
        pulsePhase: Math.random() * TAU,
        brightness: 0.4 + Math.random() * 0.4,
      }
    })

    // Data stream particles
    const streams = []
    for (let i = 0; i < 60; i++) {
      streams.push({
        fromAgent: Math.floor(Math.random() * 7),
        toAgent: Math.floor(Math.random() * 7),
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
        size: 1.5 + Math.random() * 2,
        opacity: 0.15 + Math.random() * 0.35,
      })
    }

    // Ambient particles (dust)
    const dust = []
    for (let i = 0; i < 40; i++) {
      dust.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.1 - Math.random() * 0.25,
        size: 1 + Math.random() * 2.5,
        opacity: 0.05 + Math.random() * 0.15,
        phase: Math.random() * TAU,
      })
    }

    // Heartbeat bar
    const heartbeat = {
      points: [],
      phase: 0,
      y: h - 40,
    }

    // Concentric rings
    const rings = [0.4, 0.65, 0.9].map((scale, i) => ({
      radius: baseRadius * scale,
      opacity: 0.04 + i * 0.02,
      rotationSpeed: 0.0003 * (i % 2 === 0 ? 1 : -1),
      rotation: 0,
      dashCount: 60 + i * 20,
    }))

    return { core, agents, streams, dust, heartbeat, rings, cx, cy, baseRadius, w, h }
  }, [])

  const render = useCallback((ctx, state, frame) => {
    const { core, agents, streams, dust, heartbeat, rings, cx, cy, baseRadius, w, h } = state
    const t = frame * intensity

    // Clear
    ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`
    ctx.fillRect(0, 0, w, h)

    // ── Concentric rings ──
    rings.forEach(ring => {
      ring.rotation += ring.rotationSpeed * intensity
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(ring.rotation)
      ctx.strokeStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${ring.opacity})`
      ctx.lineWidth = 0.5
      ctx.setLineDash([2, (TAU * ring.radius) / ring.dashCount - 2])
      ctx.beginPath()
      ctx.arc(0, 0, ring.radius, 0, TAU)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    })

    // ── Connection lines (agent to agent) ──
    agents.forEach((a, i) => {
      agents.forEach((b, j) => {
        if (j <= i) return
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const maxDist = baseRadius * 1.8
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.08
          ctx.strokeStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${alpha})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      })

      // Connection to core
      const coreAlpha = 0.06 + Math.sin(a.pulsePhase) * 0.03
      ctx.strokeStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${coreAlpha})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(core.x, core.y)
      ctx.lineTo(a.x, a.y)
      ctx.stroke()
    })

    // ── Data stream particles ──
    streams.forEach(s => {
      if (s.fromAgent === s.toAgent) return
      const from = agents[s.fromAgent]
      const to = agents[s.toAgent]
      s.t += s.speed * intensity
      if (s.t > 1) {
        s.t = 0
        s.fromAgent = Math.floor(Math.random() * 7)
        s.toAgent = Math.floor(Math.random() * 7)
      }
      const et = easeInOut(s.t)
      const px = lerp(from.x, to.x, et)
      const py = lerp(from.y, to.y, et)

      ctx.beginPath()
      ctx.arc(px, py, s.size, 0, TAU)
      ctx.fillStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${s.opacity})`
      ctx.shadowBlur = 6
      ctx.shadowColor = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.3)`
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // ── Dust particles ──
    dust.forEach(d => {
      d.x += d.vx * intensity
      d.y += d.vy * intensity
      d.phase += 0.01 * intensity
      d.x += Math.sin(d.phase) * 0.2

      if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w }
      if (d.x < -10) d.x = w + 10
      if (d.x > w + 10) d.x = -10

      ctx.beginPath()
      ctx.arc(d.x, d.y, d.size, 0, TAU)
      ctx.fillStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${d.opacity})`
      ctx.fill()
    })

    // ── Agent nodes ──
    agents.forEach(agent => {
      // Orbit
      agent.angle += agent.orbitSpeed * intensity
      agent.phase += agent.breatheSpeed * intensity
      agent.pulsePhase += 0.02 * intensity

      const wobble = Math.sin(agent.phase) * 4
      agent.x = cx + Math.cos(agent.angle) * (agent.orbitRadius + wobble)
      agent.y = cy + Math.sin(agent.angle) * (agent.orbitRadius + wobble)

      const breathe = 0.7 + Math.sin(agent.pulsePhase) * 0.3

      // Glow
      const glowRadius = agent.radius * 4
      const gradient = ctx.createRadialGradient(
        agent.x, agent.y, 0,
        agent.x, agent.y, glowRadius
      )
      gradient.addColorStop(0, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${0.15 * breathe})`)
      gradient.addColorStop(1, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0)`)
      ctx.beginPath()
      ctx.arc(agent.x, agent.y, glowRadius, 0, TAU)
      ctx.fillStyle = gradient
      ctx.fill()

      // Node
      ctx.beginPath()
      ctx.arc(agent.x, agent.y, agent.radius * breathe, 0, TAU)
      ctx.fillStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${agent.brightness * breathe})`
      ctx.shadowBlur = 12
      ctx.shadowColor = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},${0.5 * breathe})`
      ctx.fill()
      ctx.shadowBlur = 0

      // Label
      if (showLabels) {
        ctx.font = '9px JetBrains Mono, monospace'
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'
        ctx.fillText(agent.name, agent.x, agent.y + agent.radius + 14)
      }
    })

    // ── Core sphere ──
    core.phase += core.breatheSpeed * intensity
    const coreBreathe = 0.85 + Math.sin(core.phase) * 0.15
    const coreR = core.radius * coreBreathe

    // Outer glow
    const coreGlow = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, coreR * 6)
    coreGlow.addColorStop(0, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.12)`)
    coreGlow.addColorStop(0.5, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.04)`)
    coreGlow.addColorStop(1, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0)`)
    ctx.beginPath()
    ctx.arc(core.x, core.y, coreR * 6, 0, TAU)
    ctx.fillStyle = coreGlow
    ctx.fill()

    // Inner core — white-hot center
    const coreInner = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, coreR)
    coreInner.addColorStop(0, 'rgba(255,255,255,0.95)')
    coreInner.addColorStop(0.3, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.9)`)
    coreInner.addColorStop(0.7, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.5)`)
    coreInner.addColorStop(1, `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.1)`)
    ctx.beginPath()
    ctx.arc(core.x, core.y, coreR, 0, TAU)
    ctx.fillStyle = coreInner
    ctx.shadowBlur = 20
    ctx.shadowColor = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.6)`
    ctx.fill()
    ctx.shadowBlur = 0

    // OCULOPS text
    if (showLabels) {
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.fillStyle = textColor
      ctx.textAlign = 'center'
      ctx.letterSpacing = '4px'
      ctx.fillText('O C U L O P S', core.x, core.y + coreR + 24)
    }

    // ── Heartbeat bar ──
    heartbeat.phase += 0.04 * intensity
    const hbY = heartbeat.y
    const hbW = w * 0.6
    const hbX = (w - hbW) / 2

    ctx.strokeStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.15)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(hbX, hbY)

    for (let i = 0; i <= hbW; i++) {
      const progress = i / hbW
      const wave = Math.sin(progress * TAU * 3 + heartbeat.phase)
      const pulse = Math.exp(-Math.pow((progress - 0.5) * 6, 2)) * 8
      const y = hbY + wave * 2 + Math.sin(progress * TAU * 8 + heartbeat.phase * 2) * pulse

      ctx.lineTo(hbX + i, y)
    }
    ctx.stroke()

    // Gold dot on heartbeat
    const dotProgress = (heartbeat.phase / TAU) % 1
    const dotX = hbX + dotProgress * hbW
    const dotWave = Math.sin(dotProgress * TAU * 3 + heartbeat.phase)
    const dotPulse = Math.exp(-Math.pow((dotProgress - 0.5) * 6, 2)) * 8
    const dotY = hbY + dotWave * 2 + Math.sin(dotProgress * TAU * 8 + heartbeat.phase * 2) * dotPulse

    ctx.beginPath()
    ctx.arc(dotX, dotY, 3, 0, TAU)
    ctx.fillStyle = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.8)`
    ctx.shadowBlur = 10
    ctx.shadowColor = `rgba(${GOLD.r},${GOLD.g},${GOLD.b},0.6)`
    ctx.fill()
    ctx.shadowBlur = 0

  }, [bg, textColor, showLabels, intensity, isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      // Re-init state on resize
      stateRef.current = init({
        width: rect.width,
        height: rect.height,
      })
    }

    resize()
    window.addEventListener('resize', resize)

    let raf
    const loop = () => {
      if (!stateRef.current) return
      frameRef.current++
      render(ctx, stateRef.current, frameRef.current)
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [init, render])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: width || '100%',
        height: height || '100%',
        display: 'block',
        cursor: 'default',
      }}
    />
  )
}

export default OculopsMotionSignature
