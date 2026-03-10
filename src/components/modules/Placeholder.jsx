// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Module Placeholder Component
// Temporary component for modules not yet migrated
// ═══════════════════════════════════════════════════

function Placeholder({ name, icon }) {
    return (
        <div className="fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            textAlign: 'center',
            gap: 'var(--space-4)',
        }}>
            <div style={{
                fontSize: '4rem',
                filter: 'drop-shadow(0 0 20px rgba(var(--accent-primary-rgb), 0.3))',
            }}>
                {icon}
            </div>
            <h2 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                {name}
            </h2>
            <p className="text-secondary" style={{ maxWidth: '400px' }}>
                Este módulo está pendiente de migración a React.
                Ejecuta Claude Code para completar la implementación.
            </p>
            <div className="badge badge-warning mono">
                EN DESARROLLO
            </div>
            <code className="mono text-xs text-tertiary" style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-5)',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
            }}>
                claude "Migrate {name} module from legacy/js/ to React component"
            </code>
        </div>
    )
}

export default Placeholder
