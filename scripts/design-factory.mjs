#!/usr/bin/env node
/**
 * OCULOPS Design Factory v1.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates complete screen packages (images + video + code + animations)
 * using Google AI Studio APIs:
 *   - Gemini 2.0 Flash → Image generation (Imagen 3)
 *   - Gemini 2.5 Pro   → Code generation (React + CSS + Canvas)
 *   - Veo 2            → Video generation (motion clips)
 *
 * Usage:
 *   node scripts/design-factory.mjs                     # All screens
 *   node scripts/design-factory.mjs --screen control-tower
 *   node scripts/design-factory.mjs --screen finance --only images
 *   node scripts/design-factory.mjs --screen all --only code
 *   node scripts/design-factory.mjs --list               # List available screens
 *
 * Env: GOOGLE_CLOUD_API_KEY or GEMINI_API_KEY
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Auto-load .env
const envPath = path.join(ROOT, '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
}
const OUT_DIR = path.join(ROOT, 'src', 'generated')
const DNA_PATH = path.join(ROOT, 'dashboard_screenshots', 'oculops-ui-dna-v3.json')
const PROMPTS_PATH = path.join(ROOT, 'dashboard_screenshots', 'oculops-stitch-prompts-v2.md')

// ─── Config ──────────────────────────────────────────────────────────────────

const API_KEY = process.env.GEMINI_API_KEY
  || process.env.GOOGLE_CLOUD_API_KEY
  || process.env.GOOGLE_AI_STUDIO_API_KEY

if (!API_KEY) {
  console.error('Missing API key. Set GEMINI_API_KEY or GOOGLE_CLOUD_API_KEY in .env')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(API_KEY)

// Models — use the best available
const IMAGE_MODEL = 'gemini-2.5-flash-image'        // Inline image generation
const IMAGEN_MODEL = 'imagen-4.0-generate-001'      // Imagen 4 for hero assets
const CODE_MODEL = 'gemini-3.1-pro-preview'          // Gemini 3.1 Pro — highest intelligence
const VIDEO_MODEL = 'veo-3.1-fast-generate-preview'  // Veo 3.1 Fast — latest

// ─── Load DNA + Parse Prompts ────────────────────────────────────────────────

function loadDNA() {
  return JSON.parse(fs.readFileSync(DNA_PATH, 'utf-8'))
}

function parseScreenPrompts() {
  const raw = fs.readFileSync(PROMPTS_PATH, 'utf-8')
  const screens = []
  const screenRegex = /### SCREEN (\d+): (.+?)\n\*\*base_screen_id\*\*.*?\n\n```\n([\s\S]*?)```/g
  let match
  while ((match = screenRegex.exec(raw)) !== null) {
    screens.push({
      number: parseInt(match[1]),
      name: match[2].trim(),
      slug: match[2].trim().toLowerCase().replace(/\s+/g, '-'),
      prompt: match[3].trim(),
    })
  }
  return screens
}

// ─── Screen Definitions (all 34 routes) ──────────────────────────────────────

const ALL_SCREENS = [
  'control-tower', 'pipeline', 'crm', 'intelligence', 'execution', 'finance',
  'markets', 'analytics', 'opportunities', 'reports',
  'agents', 'herald', 'prospector', 'automation', 'flight-deck', 'pixel-office', 'marketplace',
  'gtm', 'messaging', 'creative', 'niches',
  'knowledge', 'decisions', 'experiments', 'simulation', 'studies',
  'command-center', 'watchtower', 'world-monitor', 'portfolio', 'lab',
  'billing', 'team-settings', 'settings',
]

// ─── Image Generation (Gemini 2.0 Flash + Imagen 3) ─────────────────────────

async function generateHeroImage(screenName, screenPrompt, dna) {
  const model = genAI.getGenerativeModel({
    model: IMAGE_MODEL,
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  })

  const imagePrompt = `You are a world-class UI designer generating a hero visualization asset for a premium SaaS dashboard.

BRAND DNA:
- Canvas: ${dna.colors.background.canvas}
- Gold accent: ${dna.colors.accent.gold} (under 5% surface)
- Typography: Inter + JetBrains Mono
- Style: Bloomberg terminal redesigned by Apple — pressed ivory cardstock, warm parchment, breathing indicators
- NO blue, NO purple, NO gradients, NO glassmorphism

SCREEN: ${screenName}
CONTEXT: ${screenPrompt.substring(0, 800)}

Generate a HERO VISUALIZATION IMAGE for this screen:
- High-fidelity, production-ready asset
- 1440x900 aspect ratio (16:10)
- Premium, minimal, warm off-white palette with gold accents
- The image should be the hero section / main visualization of this dashboard screen
- Include data visualizations, charts, or golden energy elements as appropriate
- Pixel-perfect quality, no device mockups, no browser chrome
- This should look like a real $10,000/year SaaS product screenshot`

  try {
    const result = await model.generateContent(imagePrompt)
    const response = result.response
    const parts = response.candidates?.[0]?.content?.parts || []

    for (const part of parts) {
      if (part.inlineData) {
        return {
          data: Buffer.from(part.inlineData.data, 'base64'),
          mimeType: part.inlineData.mimeType || 'image/png',
        }
      }
    }
    console.log(`  [image] No image data returned for ${screenName}`)
    return null
  } catch (err) {
    console.error(`  [image] Error generating ${screenName}:`, err.message)
    return null
  }
}

// ─── Texture / Background / Icon Assets ──────────────────────────────────────

async function generateAssets(screenName, dna) {
  const model = genAI.getGenerativeModel({
    model: IMAGE_MODEL,
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  })

  const assets = []

  // Golden sphere / energy visualization
  const spherePrompt = `Generate a golden energy sphere visualization on a transparent/white background.
- Luminous golden orb (#FFD700) with white-hot core
- Radiating golden tendrils like neural dendrites
- Tiny floating gold particle effects
- Warm ambient glow: radial gradient from rgba(255,215,0,0.15)
- Size: 400x400px
- Style: TouchDesigner-inspired generative data visualization
- Premium, cinematic quality
- Background: pure white or very light cream (#FAFAF8)
- This is the brand signature element for OCULOPS AI operating system`

  try {
    const result = await model.generateContent(spherePrompt)
    const parts = result.response.candidates?.[0]?.content?.parts || []
    for (const part of parts) {
      if (part.inlineData) {
        assets.push({
          name: 'golden-sphere',
          data: Buffer.from(part.inlineData.data, 'base64'),
          mimeType: part.inlineData.mimeType || 'image/png',
        })
        break
      }
    }
  } catch (err) {
    console.error(`  [asset] Sphere error:`, err.message)
  }

  return assets
}

// ─── Code Generation (Gemini 2.5 Pro) ────────────────────────────────────────

async function generateReactCode(screenName, screenPrompt, dna) {
  const model = genAI.getGenerativeModel({
    model: CODE_MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 16384,
    },
  })

  const codePrompt = `You are a senior React developer building a premium SaaS dashboard module.

## UI DNA (design tokens — use these CSS variables):
\`\`\`json
${JSON.stringify({
    colors: dna.colors,
    typography: dna.typography,
    spacing: dna.spacing,
    borders: dna.borders,
    shadows: dna.shadows,
  }, null, 2).substring(0, 4000)}
\`\`\`

## SCREEN: ${screenName}
## DESIGN SPEC:
${screenPrompt.substring(0, 3000)}

## REQUIREMENTS:
1. Generate a complete React functional component (JSX)
2. Use inline styles with CSS custom properties from the DNA: var(--color-primary), var(--color-bg), etc.
3. Include ALL sections described in the design spec
4. Add CSS @keyframes for breathing/pulse animations as a <style> tag or CSS module
5. Use Inter font (var(--font-sans)) and JetBrains Mono (var(--font-mono))
6. Make it responsive (flex/grid)
7. Include realistic mock data inline
8. Export default the component
9. Import React, useState, useMemo from 'react'
10. NO external UI libraries — pure React + CSS
11. Gold accent: #FFD700 / var(--color-primary) — under 5% of visual surface
12. Canvas bg: var(--color-bg) or #FAFAF8
13. Cards: white with soft shadow (0 2px 8px rgba(0,0,0,0.05))
14. Borders: 1px solid #E5E5E0 or var(--color-border)

Return ONLY the React component code. No markdown fences, no explanation.
The component name should be: ${toPascalCase(screenName)}Generated`

  try {
    const result = await model.generateContent(codePrompt)
    let code = result.response.text()

    // Strip markdown fences if present
    code = code.replace(/^```(?:jsx?|tsx?|javascript|react)?\n?/m, '')
    code = code.replace(/\n?```\s*$/m, '')

    return code.trim()
  } catch (err) {
    console.error(`  [code] Error generating ${screenName}:`, err.message)
    return null
  }
}

// ─── Animation Generation ────────────────────────────────────────────────────

async function generateAnimations(screenName, screenPrompt, dna) {
  const model = genAI.getGenerativeModel({
    model: CODE_MODEL,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  })

  const animPrompt = `You are a motion design engineer creating premium CSS + JS animations for a luxury SaaS dashboard.

BRAND: Bloomberg meets Apple. Gold (#FFD700) accent. Warm ivory canvas. Breathing indicators.

SCREEN: ${screenName}

Generate a complete CSS animation module with:

1. @keyframes for:
   - breathe: slow pulse opacity 0.4→1→0.4 over 3s (for status indicators)
   - goldGlow: gold box-shadow pulse 0→8px→0 over 2s (for active elements)
   - slideIn: translateY(8px)→0 + opacity 0→1 over 0.4s (for cards on mount)
   - shimmer: background-position sweep for loading states
   - heartbeat: scale(1)→1.05→1 over 2s (for the gold heartbeat bar)
   - fadeFloat: opacity + translateY micro-animation for particles

2. Utility classes:
   - .animate-breathe, .animate-gold-glow, .animate-slide-in
   - .animate-shimmer, .animate-heartbeat, .animate-float
   - .hover-lift (transform + shadow on hover)
   - .hover-gold (gold border glow on hover)

3. Transition presets:
   - --transition-fast: 150ms ease
   - --transition-normal: 250ms ease
   - --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1)

4. A React hook: useAnimateOnMount(ref) that applies slideIn when element enters viewport

Return ONLY the code. CSS first, then the React hook. No markdown fences.`

  try {
    const result = await model.generateContent(animPrompt)
    let code = result.response.text()
    code = code.replace(/^```(?:css|jsx?|tsx?)?\n?/gm, '')
    code = code.replace(/\n?```\s*$/gm, '')
    return code.trim()
  } catch (err) {
    console.error(`  [anim] Error generating ${screenName}:`, err.message)
    return null
  }
}

// ─── Video Generation (Veo 3.1 via Gemini API) ──────────────────────────────

const VIDEO_PROMPTS = {
  'control-tower': 'A slow dolly shot of a premium AI command center dashboard materializing on screen. Golden data particles stream in from the edges, converging into a luminous health score ring at center. Warm off-white background. Cards with soft shadows slide in from below. A golden orb pulses gently. Cinematic lighting from top-left. Eye level, shallow focus.',
  'intelligence': 'A dramatic close-up of a golden energy sphere rotating slowly in empty space. White-hot core radiates golden neural tendrils that branch and pulse with data flow. Tiny floating data coordinates drift around it. Warm cream background. Macro lens, shallow focus. The sphere breathes — expanding and contracting subtly. TouchDesigner generative art aesthetic.',
  'pipeline': 'A smooth tracking shot across a Kanban board. Deal cards slide between columns with subtle physics. A golden energy arc connects the column headers, pulsing left-to-right. Warm ivory background. Clean minimal UI. Eye level, soft focus on the active column.',
  'agents': 'Seven small golden orbs arranged in a constellation pattern, each representing an AI agent. They pulse asynchronously. Thin golden connection lines between them shimmer. The central orb glows brightest. Warm off-white background. Overhead shot looking down. Meditative breathing rhythm.',
  'finance': 'A gold revenue chart line drawing itself across the screen left to right. The line emits a subtle golden glow trail. At data peaks tiny gold particle sparks burst upward. Clean warm white background with faint grid lines. Eye level, tracking the line.',
  'default': 'A premium SaaS dashboard loading sequence. Golden particles materialize from screen edges, converging at center. Cards with soft neumorphic shadows slide in from below, staggered. A small golden dot pulses steadily like a heartbeat. Warm off-white canvas. Eye level, static camera. Clean, minimal, expensive.',
}

async function generateMotionClip(screenName, screenDir, dna) {
  const prompt = VIDEO_PROMPTS[screenName] || VIDEO_PROMPTS.default
  const brandSuffix = ' No people, no text overlays. Color palette: warm off-white (#FAFAF8), gold (#FFD700), soft gray (#E5E5E0). Aspect ratio 16:9. Cinematic quality. Bloomberg meets Apple aesthetic.'
  const finalPrompt = prompt + brandSuffix

  console.log(`  [video] Model: ${VIDEO_MODEL}`)
  console.log(`  [video] Prompt: ${finalPrompt.substring(0, 100)}...`)

  try {
    // Veo 3.1 via Gemini API — uses predictLongRunning endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${VIDEO_MODEL}:predictLongRunning?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: finalPrompt }],
          parameters: {
            aspectRatio: '16:9',
            sampleCount: 1,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      if (errText.includes('402') || errText.toLowerCase().includes('paid')) {
        console.log(`  [video] Veo is a paid feature — requires billing enabled on API key`)
      } else {
        console.log(`  [video] Error (${response.status}): ${errText.substring(0, 200)}`)
      }
      // Save prompt as fallback metadata
      const meta = { screen: screenName, model: VIDEO_MODEL, prompt: finalPrompt, status: 'prompt_ready' }
      writeFile(path.join(screenDir, 'motion-video.json'), JSON.stringify(meta, null, 2))
      return null
    }

    const operation = await response.json()

    // Poll for completion (Veo generates async, ~60s)
    if (operation.name) {
      console.log(`  [video] Operation started: ${operation.name}`)
      let pollCount = 0
      const maxPolls = 15
      let op = operation

      while (!op.done && pollCount < maxPolls) {
        await new Promise(r => setTimeout(r, 20000))
        pollCount++
        console.log(`  [video] Poll ${pollCount}/${maxPolls}...`)

        const pollResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${op.name}?key=${API_KEY}`
        )
        if (pollResp.ok) {
          op = await pollResp.json()
        }
      }

      // Check for video in the response — Veo uses generateVideoResponse.generatedSamples
      const samples = op.response?.generateVideoResponse?.generatedSamples
        || op.response?.generatedVideos
        || []

      if (op.done && samples.length > 0) {
        for (let i = 0; i < samples.length; i++) {
          const vid = samples[i]
          const uri = vid.video?.uri
          if (uri) {
            // Download with API key and follow redirects
            const downloadUrl = `${uri}${uri.includes('?') ? '&' : '?'}key=${API_KEY}`
            console.log(`  [video] Downloading video ${i}...`)
            const videoResp = await fetch(downloadUrl, { redirect: 'follow' })
            if (videoResp.ok) {
              const buf = Buffer.from(await videoResp.arrayBuffer())
              writeFile(path.join(screenDir, `motion-${i}.mp4`), buf)
            } else {
              console.log(`  [video] Download failed: ${videoResp.status}`)
            }
          }
        }
        const meta = { screen: screenName, model: VIDEO_MODEL, prompt: finalPrompt, status: 'generated' }
        writeFile(path.join(screenDir, 'motion-video.json'), JSON.stringify(meta, null, 2))
        return true
      }
    }

    console.log(`  [video] Generation timed out or no video returned`)
    const meta = { screen: screenName, model: VIDEO_MODEL, prompt: finalPrompt, status: 'timeout' }
    writeFile(path.join(screenDir, 'motion-video.json'), JSON.stringify(meta, null, 2))
    return null
  } catch (err) {
    console.log(`  [video] Error:`, err.message)
    return null
  }
}

// ─── Canvas/WebGL Effect Generation ──────────────────────────────────────────

async function generateCanvasEffect(screenName, dna) {
  const model = genAI.getGenerativeModel({
    model: CODE_MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  })

  const prompt = `Generate a React component that renders a Canvas 2D golden particle effect.

Requirements:
- React functional component using useRef + useEffect + requestAnimationFrame
- Canvas fills its parent container (width: 100%, height: 100%)
- 20-40 tiny gold particles (#FFD700) at varying opacity (0.1 to 0.6)
- Particles drift slowly upward with slight horizontal oscillation (sine wave)
- Particles are 2-5px circles with soft glow (shadowBlur: 8, shadowColor: rgba(255,215,0,0.3))
- Background is transparent (the canvas overlays on top of content)
- Performance: use requestAnimationFrame, clean up on unmount
- When particles drift off top, they respawn at bottom with random x position
- Movement speed: very slow, meditative — 0.2-0.5px per frame
- Component name: GoldenParticles
- Props: { count?: number, speed?: number, opacity?: number }

Return ONLY the React component code. No markdown.`

  try {
    const result = await model.generateContent(prompt)
    let code = result.response.text()
    code = code.replace(/^```(?:jsx?|tsx?)?\n?/gm, '')
    code = code.replace(/\n?```\s*$/gm, '')
    return code.trim()
  } catch (err) {
    console.error(`  [canvas] Error:`, err.message)
    return null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPascalCase(str) {
  return str.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath))
  if (Buffer.isBuffer(content)) {
    fs.writeFileSync(filePath, content)
  } else {
    fs.writeFileSync(filePath, content, 'utf-8')
  }
  const size = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content)
  const kb = (size / 1024).toFixed(1)
  console.log(`  -> ${path.relative(ROOT, filePath)} (${kb}KB)`)
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

async function generateScreen(screenSlug, screenPrompts, dna, options = {}) {
  const only = options.only || 'all'
  const screenDir = path.join(OUT_DIR, screenSlug)
  ensureDir(screenDir)

  // Find matching prompt
  const promptData = screenPrompts.find(s =>
    s.slug === screenSlug ||
    s.name.toLowerCase().replace(/\s+/g, '-') === screenSlug
  )
  const prompt = promptData?.prompt || `Premium SaaS dashboard screen: ${screenSlug}`

  console.log(`\n[${'='.repeat(60)}]`)
  console.log(`  GENERATING: ${screenSlug.toUpperCase()}`)
  console.log(`[${'='.repeat(60)}]`)

  // 1. Hero Image
  if (only === 'all' || only === 'images') {
    console.log(`\n  [1/5] Hero Image (Gemini 2.0 Flash + Imagen 3)...`)
    const image = await generateHeroImage(screenSlug, prompt, dna)
    if (image) {
      const ext = image.mimeType.includes('png') ? 'png' : 'jpg'
      writeFile(path.join(screenDir, `hero.${ext}`), image.data)
    }
  }

  // 2. Assets (golden sphere, backgrounds)
  if (only === 'all' || only === 'images') {
    console.log(`  [2/5] Brand Assets...`)
    const assets = await generateAssets(screenSlug, dna)
    for (const asset of assets) {
      const ext = asset.mimeType.includes('png') ? 'png' : 'jpg'
      writeFile(path.join(screenDir, `${asset.name}.${ext}`), asset.data)
    }
  }

  // 3. React Component Code
  if (only === 'all' || only === 'code') {
    console.log(`  [3/5] React Component (Gemini 2.5 Pro)...`)
    const code = await generateReactCode(screenSlug, prompt, dna)
    if (code) {
      writeFile(path.join(screenDir, `${toPascalCase(screenSlug)}Generated.jsx`), code)
    }
  }

  // 4. Animations
  if (only === 'all' || only === 'animations') {
    console.log(`  [4/5] Animations + Motion...`)
    const anims = await generateAnimations(screenSlug, prompt, dna)
    if (anims) {
      writeFile(path.join(screenDir, 'animations.css'), anims)
    }
  }

  // 5. Video clip (Veo 3.1)
  if (only === 'all' || only === 'video') {
    console.log(`  [5/5] Motion Clip (Veo 3.1)...`)
    await generateMotionClip(screenSlug, screenDir, dna)
  }

  console.log(`\n  DONE: ${screenSlug}`)
}

async function generateSharedAssets(dna) {
  const sharedDir = path.join(OUT_DIR, '_shared')
  ensureDir(sharedDir)

  console.log(`\n[${'='.repeat(60)}]`)
  console.log(`  GENERATING: SHARED ASSETS`)
  console.log(`[${'='.repeat(60)}]`)

  // Golden Particles Canvas component
  console.log(`\n  [1/2] Golden Particles (Canvas 2D)...`)
  const particles = await generateCanvasEffect('shared', dna)
  if (particles) {
    writeFile(path.join(sharedDir, 'GoldenParticles.jsx'), particles)
  }

  // Shared animations CSS
  console.log(`  [2/2] Shared Animations...`)
  const anims = await generateAnimations('shared', 'Shared animation library for all screens', dna)
  if (anims) {
    writeFile(path.join(sharedDir, 'animations.css'), anims)
  }

  // Index file
  const indexContent = `// OCULOPS Design Factory — Shared Assets
// Auto-generated by scripts/design-factory.mjs
// Do not edit manually — regenerate with: npm run design:factory

export { default as GoldenParticles } from './GoldenParticles'
`
  writeFile(path.join(sharedDir, 'index.js'), indexContent)
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  // --list
  if (args.includes('--list')) {
    console.log('\nAvailable screens:')
    ALL_SCREENS.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s}`))
    console.log(`\nTotal: ${ALL_SCREENS.length} screens`)
    return
  }

  // Parse args
  const screenIdx = args.indexOf('--screen')
  const onlyIdx = args.indexOf('--only')
  const targetScreen = screenIdx >= 0 ? args[screenIdx + 1] : 'all'
  const only = onlyIdx >= 0 ? args[onlyIdx + 1] : 'all'

  // Load data
  console.log('\n  Loading UI DNA v3...')
  const dna = loadDNA()
  console.log('  Loading screen prompts...')
  const screenPrompts = parseScreenPrompts()
  console.log(`  Found ${screenPrompts.length} screen prompts`)

  // Ensure output directory
  ensureDir(OUT_DIR)

  const screens = targetScreen === 'all' ? ALL_SCREENS : [targetScreen]

  console.log(`\n  Pipeline: ${screens.length} screen(s) | Mode: ${only}`)
  console.log(`  Output: src/generated/`)
  console.log(`  Models: ${IMAGE_MODEL} (images) + ${CODE_MODEL} (code) + ${VIDEO_MODEL} (video)`)

  // Generate shared assets first
  await generateSharedAssets(dna)

  // Generate each screen
  for (const screen of screens) {
    await generateScreen(screen, screenPrompts, dna, { only })
    // Rate limiting — respect API quotas
    if (screens.length > 1) {
      console.log('  (waiting 2s for rate limit...)')
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // Generate master index
  const masterIndex = `// OCULOPS Design Factory — Master Index
// Auto-generated ${new Date().toISOString()}
// Regenerate: npm run design:factory

${screens.map(s => {
  const pascal = toPascalCase(s)
  return `export { default as ${pascal}Generated } from './${s}/${pascal}Generated'`
}).join('\n')}

export * from './_shared'
`
  writeFile(path.join(OUT_DIR, 'index.js'), masterIndex)

  console.log(`\n${'='.repeat(64)}`)
  console.log(`  DESIGN FACTORY COMPLETE`)
  console.log(`  Generated: ${screens.length} screens + shared assets`)
  console.log(`  Output: src/generated/`)
  console.log(`${'='.repeat(64)}\n`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
