/**
 * EmptyState — Visual empty state with icon, title, description, and optional CTA.
 *
 * @param {React.ComponentType} icon - Heroicon component (or string emoji for legacy)
 * @param {string} title - Primary message
 * @param {string} description - Secondary explanation
 * @param {React.ReactNode} action - CTA button
 */
export default function EmptyState({ icon: IconComponent, title, description, action }) {
  return (
    <div className="empty-state">
      {IconComponent && (
        typeof IconComponent === 'string'
          ? <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: 'var(--space-3)' }}>{IconComponent}</div>
          : <IconComponent className="empty-state-icon" />
      )}
      {title && <div className="empty-state-title">{title}</div>}
      {description && <div className="empty-state-description">{description}</div>}
      {action && <div>{action}</div>}
    </div>
  )
}
