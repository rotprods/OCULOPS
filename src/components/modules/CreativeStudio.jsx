// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Creative Studio Module
// 100-Year UX: tactical deployment screens utilizing 1px grid
// ═══════════════════════════════════════════════════

import { useState } from 'react'
import { useGenerativeMedia } from '../../hooks/useGenerativeMedia'
import { useAppStore } from '../../stores/useAppStore'

const ASSET_TYPES = [
  { id: 'image', label: 'STATIC INTEL (IMG)', icon: '[IMG]' },
  { id: 'video', label: 'KINETIC INTEL (VID)', icon: '[VID]' }
]

function CreativeStudio() {
  const { generateVideo, generateImage, isGeneratingVFX, isGeneratingImage, error } = useGenerativeMedia()
  const { toast } = useAppStore(s => ({ toast: s.toast }))

  const [prompt, setPrompt] = useState('')
  const [assetType, setAssetType] = useState('image')
  const [mediaVault, setMediaVault] = useState([]) // Mock local store for session assets

  const handleDeploy = async () => {
    if (!prompt.trim()) return

    try {
      if (assetType === 'image') {
        const result = await generateImage(prompt)
        // Assume result contains an imageUrl or base64
        setMediaVault(prev => [{
          id: Date.now(),
          type: 'image',
          url: result?.output_url || result?.image || 'https://via.placeholder.com/600x400/000000/FFD700?text=AI+ASSET+DEPLOYED', // mock fallback
          prompt,
          timestamp: new Date().toISOString()
        }, ...prev])
        toast('TARGET IMAGE ASSET EXTRACTED TO VAULT.', 'success')
      } else {
        const result = await generateVideo(prompt)
        // Assume result contains videoUrl
        setMediaVault(prev => [{
          id: Date.now(),
          type: 'video',
          url: result?.url || result?.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4', // mock fallback
          prompt,
          timestamp: new Date().toISOString()
        }, ...prev])
        toast('TARGET VIDEO ASSET EXTRACTED TO VAULT.', 'success')
      }
    } catch (err) {
      toast(`FAILED TO EXTRACT ASSET: ${err.message}`, 'error')
    }
  }

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', margin: 0 }}>CREATIVE LAB</h1>
          <span className="mono text-xs text-tertiary">TACTICAL ASSET GENERATION // GENERATIVE MEDIA PROTOCOL</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="mono text-xs" style={{ padding: '6px 12px', border: `1px solid ${isGeneratingImage ? 'var(--color-warning)' : 'var(--color-success)'}`, color: isGeneratingImage ? 'var(--color-warning)' : 'var(--color-success)', background: '#000' }}>
            NANO BANANA: {isGeneratingImage ? 'ACTIVE' : 'READY'}
          </div>
          <div className="mono text-xs" style={{ padding: '6px 12px', border: `1px solid ${isGeneratingVFX ? 'var(--color-warning)' : 'var(--color-success)'}`, color: isGeneratingVFX ? 'var(--color-warning)' : 'var(--color-success)', background: '#000' }}>
            VEO 3 API: {isGeneratingVFX ? 'ACTIVE' : 'READY'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) minmax(500px, 1.5fr)', gap: '24px' }}>

        {/* ── COMMAND TERMINAL ── */}
        <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column' }}>
          <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>/// COMMAND INPUT</span>
            <span style={{ color: 'var(--color-success)' }}>[ AWAITING DIRECTIVE ]</span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="mono text-2xs text-tertiary">TARGET ASSET TYPE</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {ASSET_TYPES.map(t => (
                  <button
                    key={t.id}
                    className="btn btn-ghost mono"
                    style={{ flex: 1, padding: '12px', fontSize: '11px', border: assetType === t.id ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)', background: assetType === t.id ? 'var(--color-primary)' : '#000', color: assetType === t.id ? '#000' : 'var(--color-text)' }}
                    onClick={() => setAssetType(t.id)}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="mono text-2xs text-tertiary">GENERATION DIRECTIVE</label>
              <textarea
                className="mono"
                style={{ flex: 1, background: '#000', border: '1px solid var(--border-subtle)', padding: '16px', color: 'var(--color-primary)', fontSize: '12px', outline: 'none', resize: 'none' }}
                placeholder="ENTER TACTICAL PARAMETERS FOR ASSET GENERATION..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ padding: '12px', background: 'var(--color-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}>
                <span className="mono text-xs font-bold">ERR: </span>{error.toUpperCase()}
              </div>
            )}

            <button
              className="btn btn-ghost mono"
              style={{ width: '100%', padding: '16px', fontSize: '12px', fontWeight: 'bold', background: isGeneratingVFX || isGeneratingImage ? 'transparent' : 'var(--color-primary)', color: isGeneratingVFX || isGeneratingImage ? 'var(--color-warning)' : '#000', border: isGeneratingVFX || isGeneratingImage ? '1px solid var(--color-warning)' : '1px solid var(--color-primary)' }}
              onClick={handleDeploy}
              disabled={isGeneratingVFX || isGeneratingImage || !prompt.trim()}
            >
              {isGeneratingVFX || isGeneratingImage ? 'DEPLOYING ASSET (WAIT)...' : 'INITIATE GENERATION SEQUENCE'}
            </button>
          </div>
        </div>

        {/* ── SECURE MEDIA VAULT ── */}
        <div style={{ border: '1px solid var(--border-default)', background: 'var(--color-bg-2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="mono text-xs font-bold" style={{ padding: '12px 16px', background: 'var(--border-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>/// SECURE MEDIA VAULT</span>
            <span style={{ color: 'var(--text-tertiary)' }}>{mediaVault.length} ASSETS LOGGED</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mediaVault.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div className="mono">
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>[   ]</div>
                  VAULT IS EMPTY.<br />READY FOR INBOUND ASSETS.
                </div>
              </div>
            ) : (
              mediaVault.map(asset => (
                <div key={asset.id} style={{ border: '1px solid var(--border-subtle)', background: '#000' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', borderBottom: '1px solid var(--border-subtle)' }}>
                    {asset.type === 'video' ? (
                      <video src={asset.url} controls autoPlay loop muted style={{ width: '100%', maxHeight: '350px', objectFit: 'contain' }} />
                    ) : (
                      <img src={asset.url} alt="Generated Asset" style={{ width: '100%', maxHeight: '350px', objectFit: 'contain' }} />
                    )}
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="mono text-xs font-bold" style={{ color: 'var(--color-primary)' }}>{asset.type.toUpperCase()} ASSET</span>
                      <span className="mono text-xs text-secondary">{new Date(asset.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="mono text-xs" style={{ color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                      &gt; {asset.prompt.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CreativeStudio
