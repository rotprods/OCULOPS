import React from 'react'

/**
 * ModulePage — Standard wrapper for all module pages.
 * Provides consistent padding, header layout, and scrollable content.
 *
 * @param {string} title - Module page title
 * @param {string} subtitle - Module page subtitle
 * @param {React.ReactNode} actions - Header action buttons
 * @param {React.ReactNode} children - Page content
 * @param {string} className - Additional classes
 */
export default function ModulePage({ title, subtitle, actions, children, className = '' }) {
  return (
    <div className={`module-page ${className}`}>
      {(title || actions) && (
        <div className="module-page-header">
          <div>
            {title && <h1 className="module-page-title">{title}</h1>}
            {subtitle && <p className="module-page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
