import { useMemo } from 'react'
import { buildApiIntelligencePresentation, getAgentTargetsForEntry } from '../../lib/publicApiCatalog.js'
import { getCategoryMeta, getTemplateByCatalogSlug } from '../../lib/publicApiConnectorTemplates.js'
import './ApiIntelligenceCard.css'

const STATUS_BADGE_MAP = {
  LIVE: 'badge-success',
  INSTALLED: 'badge-info',
  INSTALLABLE: 'badge-warning',
  CANDIDATE: 'badge-neutral',
  CATALOG: 'badge-muted',
}

function openDocs(url) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function stopAndRun(event, callback, payload) {
  event.stopPropagation()
  if (callback) callback(payload)
}

export default function ApiIntelligenceCard({
  entry,
  variant,
  installing = false,
  onInstall,
  onOpenNetwork,
  onOpenDetails,
  detailsLabel = 'Open',
}) {
  const presentation = useMemo(
    () => buildApiIntelligencePresentation(entry),
    [entry]
  )
  const categoryMeta = useMemo(
    () => getCategoryMeta(entry.category),
    [entry.category]
  )
  const template = useMemo(
    () => getTemplateByCatalogSlug(entry.slug),
    [entry.slug]
  )

  const cardVariant = variant || presentation.card_variant
  const installable = Boolean(template) && !template.internalOnly && !entry.is_installed
  const capabilities = (entry.capabilities || template?.capabilities || []).slice(0, cardVariant === 'compact' ? 2 : 3)
  const moduleTargets = (entry.module_targets || []).slice(0, cardVariant === 'compact' ? 2 : 3)
  const agentTargets = getAgentTargetsForEntry(entry).slice(0, cardVariant === 'compact' ? 2 : 3)
  const docsHost = presentation.brand_hint === 'unknown-host' ? 'source pending' : presentation.brand_hint
  const badgeClass = STATUS_BADGE_MAP[presentation.thumbnail.statusLabel] || 'badge-neutral'

  return (
    <article
      className={`api-intel-card api-intel-card--${cardVariant}`}
      onClick={onOpenDetails ? () => onOpenDetails(entry) : undefined}
      onKeyDown={onOpenDetails ? event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenDetails(entry)
        }
      } : undefined}
      role={onOpenDetails ? 'button' : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
      style={{
        '--api-card-accent': presentation.thumbnail.accentColor,
        '--api-card-accent-soft': presentation.thumbnail.accentSoft,
        '--api-card-secondary': presentation.thumbnail.secondaryColor,
        '--api-card-secondary-soft': presentation.thumbnail.secondarySoft,
      }}
    >
      <div
        className={`api-intel-card__cover api-intel-card__cover--${presentation.thumbnail_mode}`}
        style={{ backgroundImage: presentation.thumbnail.backgroundImage }}
      >
        <div className="api-intel-card__cover-row">
          <span className="api-intel-card__eyebrow">{presentation.thumbnail.eyebrow}</span>
          <span className={`badge ${badgeClass}`}>{presentation.thumbnail.statusLabel}</span>
        </div>

        <div className="api-intel-card__hero">
          <div className="api-intel-card__glyph" aria-hidden="true">
            {categoryMeta.icon}
          </div>
          <div className="api-intel-card__hero-copy">
            <span>{presentation.preview_metric}</span>
            <strong>{presentation.section_label}</strong>
          </div>
        </div>

        <div className="api-intel-card__cover-row api-intel-card__cover-row--bottom">
          <span className="api-intel-card__auth">{presentation.thumbnail.authLabel}</span>
          <span className="api-intel-card__watermark">{presentation.thumbnail.watermark}</span>
        </div>
      </div>

      <div className="api-intel-card__body">
        <div className="api-intel-card__heading">
          <div>
            <h3>{entry.name}</h3>
            <p>{entry.description}</p>
          </div>
          <div className="api-intel-card__score">
            <span>fit</span>
            <strong>{presentation.featured_score}</strong>
          </div>
        </div>

        <div className="api-intel-card__chips">
          <span className="badge badge-neutral">{entry.category}</span>
          {moduleTargets.map(target => (
            <span key={target} className="badge badge-info">{target.replace(/_/g, ' ')}</span>
          ))}
          {agentTargets.map(target => (
            <span key={target} className="badge badge-neutral">agent {target}</span>
          ))}
          {capabilities.map(capability => (
            <span key={capability} className="badge badge-neutral">{capability.replace(/_/g, ' ')}</span>
          ))}
        </div>

        <div className="api-intel-card__footer">
          <div className="api-intel-card__source">
            <span>Host</span>
            <strong>{docsHost}</strong>
          </div>

          <div className="api-intel-card__actions">
            {onOpenDetails && (
              <button className="btn btn-ghost btn-sm" onClick={event => stopAndRun(event, onOpenDetails, entry)}>
                {detailsLabel}
              </button>
            )}
            {onOpenNetwork && (
              <button className="btn btn-ghost btn-sm" onClick={event => stopAndRun(event, onOpenNetwork, entry)}>
                Network
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={event => {
              event.stopPropagation()
              openDocs(entry.docs_url)
            }}>
              Docs
            </button>
            {installable && onInstall && (
              <button className="btn btn-primary btn-sm" onClick={event => stopAndRun(event, onInstall, entry)} disabled={installing}>
                {installing ? 'Installing...' : 'Install'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
