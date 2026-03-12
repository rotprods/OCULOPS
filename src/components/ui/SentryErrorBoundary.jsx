// OCULOPS — Sentry Error Boundary
// Wraps app to catch and report React errors

import * as Sentry from '@sentry/react'

export function SentryErrorBoundary({ children }) {
    return (
        <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100vh', background: 'var(--surface-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', gap: '16px', padding: '32px'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 600 }}>Something went wrong</div>
                    <div style={{ color: 'var(--color-danger)', fontSize: '13px', maxWidth: '600px', textAlign: 'center', lineHeight: '1.6' }}>
                        {error?.message || 'Unknown error'}
                    </div>
                    <button
                        onClick={resetError}
                        style={{ marginTop: '24px', padding: '12px 32px', background: 'var(--accent-primary)', color: 'var(--text-primary)', border: 'none', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', borderRadius: '8px' }}
                    >
                        Reload
                    </button>
                </div>
            )}
            showDialog
        >
            {children}
        </Sentry.ErrorBoundary>
    )
}
