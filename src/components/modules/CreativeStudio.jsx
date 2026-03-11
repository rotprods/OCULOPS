import { useState, useEffect, useMemo } from 'react'
import { useGenerativeMedia } from '../../hooks/useGenerativeMedia'
import { useCreativeAssets } from '../../hooks/useCreativeAssets'
import { useCreativeBriefs } from '../../hooks/useCreativeBriefs'
import './CreativeStudio.css'

// Assembles filled brief sections into a plain-text prompt string.
function buildBriefPrompt(template, values) {
  return [
    `BRIEF: ${template.title}`,
    ...template.sections.map(s => `${s.label}: ${values[s.label] || s.placeholder}`)
  ].join(' | ')
}

function BriefEditor({ template, onClose, onDeploy }) {
  const [values, setValues] = useState(() => Object.fromEntries(template.sections.map(s => [s.label, ''])))
  const [copied, setCopied] = useState(false)

  const assembledText = buildBriefPrompt(template, values)

  const exportBrief = () => {
    const text = [`BRIEF: ${template.title}`, `Categoria: ${template.category}`, '='.repeat(40), ...template.sections.map(s => `\n${s.label.toUpperCase()}:\n${values[s.label] || '(pendiente)'}`)].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="cs-modal-overlay">
      <div className="cs-modal card">
        <div className="cs-modal-header">
          <div>
            <div className="cs-modal-title">{template.title}</div>
            <div className="cs-tags-row">
              {template.tags.map(t => <span key={t} className="badge badge-neutral" style={{ fontSize: '10px' }}>{t}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm btn-primary" onClick={() => onDeploy(assembledText)}>DEPLOY</button>
            <button className="btn btn-sm" onClick={exportBrief}>{copied ? 'COPIADO' : 'COPIAR'}</button>
            <button className="btn btn-sm" onClick={onClose}>CERRAR</button>
          </div>
        </div>
        <div className="cs-modal-body">
          {template.sections.map(section => (
            <div key={section.label} className="input-group">
              <label className="mono cs-modal-label">{section.label}</label>
              <textarea
                className="input cs-modal-textarea"
                rows={3}
                placeholder={section.placeholder}
                value={values[section.label]}
                onChange={e => setValues(v => ({ ...v, [section.label]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Renders the correct preview for a gallery asset depending on type.
function AssetPreview({ asset }) {
  if (asset.status === 'generating') {
    return (
      <div className="cs-asset-loader">
        <div className="cs-loader-bar" />
      </div>
    )
  }
  if (asset.status === 'error') {
    return <div className="cs-asset-error">FAILED: {asset.error}</div>
  }
  if (asset.type === 'copy') {
    const text = typeof asset.content === 'string'
      ? asset.content
      : JSON.stringify(asset.content, null, 2)
    return <div className="cs-asset-copy-preview mono">{text?.slice(0, 300)}</div>
  }
  if (asset.type === 'video') {
    return <video src={asset.url} controls autoPlay muted loop className="cs-asset-media" />
  }
  return <img src={asset.url} alt="Generated asset" className="cs-asset-media" />
}

function CreativeStudio() {
  const [view, setView] = useState('deploy') // 'deploy' | 'briefs'

  // Media State
  const { generateImage, generateVideo, generateCopy, isGeneratingImage, isGeneratingVFX, isGeneratingCopy, error } = useGenerativeMedia()
  const { assets: dbAssets, loading: assetsLoading, persistGeneration } = useCreativeAssets()
  const [prompt, setPrompt] = useState('')
  const [modelTarget, setModelTarget] = useState('banana') // 'banana' | 'veo3' | 'forge'
  const [gallery, setGallery] = useState([])

  // Seed gallery from DB on first load (includes copy assets via metadata)
  useEffect(() => {
    if (!assetsLoading && gallery.length === 0 && dbAssets.length > 0) {
      setGallery(dbAssets.map(a => ({
        id: a.id,
        type: a.asset_type,
        prompt: a.prompt_used || '',
        url: a.public_url,
        status: a.status === 'ready' ? 'ready' : 'error',
        content: a.metadata?.content ?? null
      })))
    }
  }, [assetsLoading, dbAssets, gallery.length])

  // Briefs State
  const { briefs, loading: briefsLoading, trackUsage } = useCreativeBriefs()
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [filterCat, setFilterCat] = useState('Todos')
  const categories = useMemo(() => ['Todos', ...new Set(briefs.map(t => t.category))], [briefs])
  const filteredBriefs = useMemo(
    () => filterCat === 'Todos' ? briefs : briefs.filter(t => t.category === filterCat),
    [briefs, filterCat]
  )

  const handleDeploy = async () => {
    if (!prompt.trim()) return

    const localId = crypto.randomUUID()
    const capturedPrompt = prompt
    setPrompt('')

    // FORGE — copy generation (FORGE already writes creative_asset to DB)
    if (modelTarget === 'forge') {
      setGallery(prev => [{ id: localId, type: 'copy', prompt: capturedPrompt, status: 'generating', url: null, content: null }, ...prev])
      try {
        const result = await generateCopy(capturedPrompt)
        setGallery(prev => prev.map(item =>
          item.id === localId
            ? { id: result?.creative_asset_id || localId, type: 'copy', prompt: capturedPrompt, status: 'ready', url: null, content: result?.content ?? null }
            : item
        ))
      } catch (err) {
        setGallery(prev => prev.map(item =>
          item.id === localId ? { ...item, status: 'error', error: err.message } : item
        ))
      }
      return
    }

    // Image / Video — full persistence chain via useCreativeAssets
    const type = modelTarget === 'banana' ? 'image' : 'video'
    setGallery(prev => [{ id: localId, type, prompt: capturedPrompt, status: 'generating', url: null }, ...prev])

    const generatorFn = type === 'image'
      ? () => generateImage(capturedPrompt)
      : () => generateVideo(capturedPrompt)

    try {
      const asset = await persistGeneration(capturedPrompt, type, generatorFn)
      setGallery(prev => prev.map(item =>
        item.id === localId
          ? { id: asset.id, type: asset.asset_type, prompt: asset.prompt_used, status: 'ready', url: asset.public_url }
          : item
      ))
    } catch (err) {
      setGallery(prev => prev.map(item =>
        item.id === localId ? { ...item, status: 'error', error: err.message || 'API Payload Reject' } : item
      ))
    }
  }

  // Brief → Deploy: pre-fill prompt, switch to deploy tab, set FORGE model
  const handleBriefDeploy = (text) => {
    setPrompt(text)
    setModelTarget('forge')
    setView('deploy')
    setActiveTemplate(null)
  }

  const isWorking = isGeneratingImage || isGeneratingVFX || isGeneratingCopy

  return (
    <div className="creative-studio fade-in">
      {/* ── HEADER ── */}
      <div className="cs-header">
        <div>
          <h1 className="cs-header-title">MEDIA DEPLOYMENT</h1>
          <p className="mono cs-header-subtitle">
            CREATIVE STUDIO // AI ASSET GENERATION & BRIEF LIBRARY
          </p>
        </div>
        <div className="cs-view-toggles">
          <button className={`cs-view-btn ${view === 'deploy' ? 'cs-view-btn--active' : ''}`} onClick={() => setView('deploy')}>
            [ MEDIA OPS ]
          </button>
          <button className={`cs-view-btn ${view === 'briefs' ? 'cs-view-btn--active' : ''}`} onClick={() => setView('briefs')}>
            [ BRIEF DB ]
          </button>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {error && (
        <div className="cs-error-banner">
          <span className="cs-error-icon">⚠️</span>
          <span className="mono cs-error-text">SYS_ERR: {error}</span>
        </div>
      )}

      {/* ── CONTENT BODY ── */}
      <div className="cs-content">

        {/* ── VIEW: DEPLOY (MEDIA GENERATION) ── */}
        {view === 'deploy' && (
          <div className="cs-deploy-grid">

            {/* Left: Command Console */}
            <div className="cs-command-console">
              <div className="cs-panel-header">/// DEPLOYMENT PARAMETERS</div>
              <div className="cs-command-body">

                <div className="cs-input-group">
                  <label className="mono cs-label">TARGET LOGIC CORE</label>
                  <div className="cs-model-selector">
                    <button
                      className={`cs-model-btn ${modelTarget === 'banana' ? 'cs-model-btn--active' : ''}`}
                      onClick={() => setModelTarget('banana')}
                    >
                      <span className="cs-model-icon">🍌</span> NANO BANANA (IMAGE)
                    </button>
                    <button
                      className={`cs-model-btn ${modelTarget === 'veo3' ? 'cs-model-btn--active' : ''}`}
                      onClick={() => setModelTarget('veo3')}
                    >
                      <span className="cs-model-icon">🎥</span> VEO 3 (VIDEO)
                    </button>
                    <button
                      className={`cs-model-btn ${modelTarget === 'forge' ? 'cs-model-btn--active' : ''}`}
                      onClick={() => setModelTarget('forge')}
                    >
                      <span className="cs-model-icon">⚡</span> FORGE (COPY)
                    </button>
                  </div>
                </div>

                <div className="cs-input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label className="mono cs-label">NEURAL PROMPT SEQUENCE</label>
                  <textarea
                    className="input cs-prompt-input"
                    placeholder={modelTarget === 'forge' ? 'Topic or brief to generate copy for...' : 'Execute creative directive...'}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                  />
                </div>

                <button
                  className={`btn btn-primary mono cs-execute-btn ${isWorking ? 'cs-execute-btn--working' : ''}`}
                  onClick={handleDeploy}
                  disabled={isWorking || !prompt.trim()}
                >
                  {isWorking ? '[ GENERATING ASSET... ]' : '[ INITIATE GENERATION ]'}
                </button>

              </div>
            </div>

            {/* Right: Asset Gallery */}
            <div className="cs-gallery-panel">
              <div className="cs-panel-header">/// ACTIVE ASSET STREAM</div>
              <div className="cs-gallery-body">
                {gallery.length === 0 ? (
                  <div className="cs-empty-state">
                    <span className="mono cs-empty-text">AWAITING GENERATION PROTOCOL.</span>
                  </div>
                ) : (
                  <div className="cs-assets-grid">
                    {gallery.map(asset => (
                      <div key={asset.id} className={`cs-asset-card ${asset.status === 'error' ? 'cs-asset-card--error' : ''}`}>
                        <div className="cs-asset-header mono">
                          <span className="text-tertiary">
                            {asset.type?.toUpperCase()} · {asset.id.slice(-6)}
                          </span>
                          <span className={asset.status === 'ready' ? 'text-success' : asset.status === 'error' ? 'text-danger' : 'text-primary'}>
                            [{asset.status.toUpperCase()}]
                          </span>
                        </div>

                        <div className="cs-asset-preview">
                          <AssetPreview asset={asset} />
                        </div>

                        <div className="cs-asset-footer mono">
                          {asset.prompt}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}


        {/* ── VIEW: BRIEFS (LIBRARY) ── */}
        {view === 'briefs' && (
          <div className="cs-briefs-layout">
            <div className="cs-panel">
              <div className="cs-panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>/// LIBRARY DIRECTORY</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {categories.map(c => (
                    <button key={c} className={`cs-filter-btn mono ${filterCat === c ? 'cs-filter-btn--active' : ''}`} onClick={() => setFilterCat(c)}>
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="cs-briefs-grid">
                {briefsLoading && <div className="cs-empty-state"><span className="mono cs-empty-text">LOADING BRIEF LIBRARY...</span></div>}
                {!briefsLoading && filteredBriefs.map(template => (
                  <div key={template.id} className="cs-brief-card" onClick={() => { setActiveTemplate(template); trackUsage(template.id) }}>
                    <div className="cs-brief-card-header">
                      <div className="cs-brief-card-title">{template.title}</div>
                      <span className="mono text-tertiary text-xs">[{template.category.toUpperCase()}]</span>
                    </div>
                    <div className="cs-brief-tags">
                      {template.tags.map(t => (
                        <span key={t} className="cs-brief-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal */}
      {activeTemplate && (
        <BriefEditor
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
          onDeploy={handleBriefDeploy}
        />
      )}

    </div>
  )
}

export default CreativeStudio
