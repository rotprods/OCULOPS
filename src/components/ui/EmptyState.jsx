// Props: icon, title, description, action (React node)
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div style={{ fontSize: '2.5rem', opacity: 0.4 }}>{icon}</div>}
      <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>{title}</p>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  )
}
