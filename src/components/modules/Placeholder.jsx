// ═══════════════════════════════════════════════════
// OCULOPS — Module Placeholder Component
// 100-Year UX: Strict Terminal Paradigm
// ═══════════════════════════════════════════════════

function Placeholder({ name, icon }) {
    return (
        <div className="fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            gap: '24px',
            background: 'var(--surface-inset)',
            border: '1px solid var(--border-default)',
            padding: '48px',
        }}>
            <div style={{
                fontSize: '48px',
                color: 'var(--text-tertiary)',
            }}>
                {icon}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <h2 className="mono" style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'var(--accent-primary)',
                    textTransform: 'uppercase',
                    margin: 0
                }}>
                    {name}
                </h2>
                <div className="mono text-xs" style={{ color: 'var(--color-warning)', border: '1px solid var(--border-subtle)', padding: '4px 12px' }}>
                    [ MODULE OFFLINE. AWAITING DEPLOYMENT ]
                </div>
            </div>

            <p className="mono font-bold" style={{ maxWidth: '400px', fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.6, textTransform: 'uppercase' }}>
                THIS NODE IS PENDING 100-YEAR UX ARCHITECTURE SPECIFICATIONS.
                EXECUTE CORTEX DEPLOYMENT BATCH OR FALLBACK TO LEGACY SYSTEM OVERRIDE.
            </p>

            <code className="mono font-bold" style={{
                marginTop: '16px',
                padding: '16px 24px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-default)',
                color: 'var(--accent-primary)',
                fontSize: '11px'
            }}>
                &gt; BUILD_SEQUENCE --target="{name.toUpperCase()}" --protocol=100YR_UX
            </code>
        </div>
    )
}

export default Placeholder
