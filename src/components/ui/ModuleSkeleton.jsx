// ═══════════════════════════════════════════════════
// OCULOPS — ModuleSkeleton v2
// Route-aware loading skeletons
// ═══════════════════════════════════════════════════

/**
 * @param {Object} props
 * @param {string} [props.title] - Optional module title
 * @param {number} [props.rows=4] - Number of skeleton rows
 * @param {'table'|'cards'|'kpi'|'dashboard'|'kanban'|'chat'|'detail'|'map'|'settings'} [props.variant='table']
 */
export default function ModuleSkeleton({ title, rows = 4, variant = 'table' }) {
    const S = STYLES

    // ── Dashboard (ControlTower-style): hero + KPI strip + 2-col grid ──
    if (variant === 'dashboard') {
        return (
            <div className="fade-in" style={S.page}>
                {/* Hero */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className="skeleton" style={{ width: 220, height: 24 }} />
                        <div className="skeleton" style={{ width: 300, height: 12 }} />
                    </div>
                    <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 'var(--radius-full)' }} />
                </div>
                {/* KPI strip */}
                <div style={S.kpiGrid}>
                    {[0,1,2,3,4,5].map(i => (
                        <div key={i} style={S.kpiCell}>
                            <div className="skeleton" style={{ width: 80, height: 10 }} />
                            <div className="skeleton" style={{ width: 60, height: 22 }} />
                            <div className="skeleton" style={{ width: 50, height: 8 }} />
                        </div>
                    ))}
                </div>
                {/* 2-col content */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-md)' }} />
                        <div className="skeleton" style={{ flex: 1, minHeight: 120, borderRadius: 'var(--radius-md)' }} />
                    </div>
                    <div className="skeleton" style={{ minHeight: 300, borderRadius: 'var(--radius-md)' }} />
                </div>
            </div>
        )
    }

    // ── KPI: strip + table rows ──
    if (variant === 'kpi') {
        return (
            <div className="fade-in" style={S.page}>
                {title && <div className="skeleton" style={{ width: 200, height: 20 }} />}
                <div style={S.kpiGrid4}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} style={S.kpiCell}>
                            <div className="skeleton" style={{ width: 80, height: 10 }} />
                            <div className="skeleton" style={{ width: 50, height: 22 }} />
                        </div>
                    ))}
                </div>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ width: '100%', height: 40 }} />
                ))}
            </div>
        )
    }

    // ── Kanban (Pipeline-style): header + 4 columns ──
    if (variant === 'kanban') {
        return (
            <div className="fade-in" style={S.page}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 180, height: 20 }} />
                    <div className="skeleton" style={{ width: 100, height: 32, borderRadius: 'var(--radius-sm)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', flex: 1 }}>
                    {[0,1,2,3].map(col => (
                        <div key={col} style={S.kanbanCol}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div className="skeleton" style={{ width: 80, height: 12 }} />
                                <div className="skeleton" style={{ width: 24, height: 16, borderRadius: 'var(--radius-full)' }} />
                            </div>
                            {[0,1,2].map(card => (
                                <div key={card} style={S.kanbanCard}>
                                    <div className="skeleton" style={{ width: '80%', height: 12 }} />
                                    <div className="skeleton" style={{ width: '50%', height: 10 }} />
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <div className="skeleton" style={{ width: 40, height: 10 }} />
                                        <div className="skeleton" style={{ width: 50, height: 10 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // ── Chat (Herald/CommandCenter): sidebar + messages ──
    if (variant === 'chat') {
        return (
            <div className="fade-in" style={{ ...S.page, flexDirection: 'row' }}>
                <div style={{ width: 260, borderRight: '1px solid var(--border-default)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ width: '100%', height: 32, borderRadius: 'var(--radius-sm)' }} />
                    {[0,1,2,3,4].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
                            <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', flexShrink: 0 }} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div className="skeleton" style={{ width: '70%', height: 10 }} />
                                <div className="skeleton" style={{ width: '40%', height: 8 }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--space-6)', gap: 16 }}>
                    {[0,1,2].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', maxWidth: '60%' }}>
                            <div className="skeleton" style={{ width: '100%', minWidth: 200, height: 48, borderRadius: 'var(--radius-md)' }} />
                        </div>
                    ))}
                    <div style={{ marginTop: 'auto' }}>
                        <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--radius-md)' }} />
                    </div>
                </div>
            </div>
        )
    }

    // ── Detail (agent detail, contact detail): sidebar info + main ──
    if (variant === 'detail') {
        return (
            <div className="fade-in" style={{ ...S.page, flexDirection: 'row' }}>
                <div style={{ width: 300, borderRight: '1px solid var(--border-default)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)' }} />
                    <div className="skeleton" style={{ width: 160, height: 16 }} />
                    <div className="skeleton" style={{ width: 120, height: 10 }} />
                    <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[0,1,2,3].map(i => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div className="skeleton" style={{ width: 60, height: 10 }} />
                                <div className="skeleton" style={{ width: 80, height: 10 }} />
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ flex: 1, padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="skeleton" style={{ width: 200, height: 20 }} />
                    {[0,1,2,3].map(i => (
                        <div key={i} className="skeleton" style={{ width: '100%', height: 44 }} />
                    ))}
                </div>
            </div>
        )
    }

    // ── Map (FlightDeck/WorldMonitor): header + big map rect ──
    if (variant === 'map') {
        return (
            <div className="fade-in" style={S.page}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ width: 200, height: 20 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 'var(--radius-sm)' }} />
                        <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 'var(--radius-sm)' }} />
                    </div>
                </div>
                <div className="skeleton" style={{ flex: 1, minHeight: 400, borderRadius: 'var(--radius-md)' }} />
            </div>
        )
    }

    // ── Settings: form fields ──
    if (variant === 'settings') {
        return (
            <div className="fade-in" style={{ ...S.page, maxWidth: 640 }}>
                <div className="skeleton" style={{ width: 180, height: 20 }} />
                {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div className="skeleton" style={{ width: 100, height: 10 }} />
                        <div className="skeleton" style={{ width: '100%', height: 40, borderRadius: 'var(--radius-sm)' }} />
                    </div>
                ))}
                <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 'var(--radius-sm)', marginTop: 8 }} />
            </div>
        )
    }

    // ── Cards grid ──
    if (variant === 'cards') {
        return (
            <div className="fade-in" style={S.page}>
                {title && <div className="skeleton" style={{ width: 200, height: 20 }} />}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} style={S.card}>
                            <div className="skeleton" style={{ width: '60%', height: 14 }} />
                            <div className="skeleton" style={{ width: '100%', height: 10 }} />
                            <div className="skeleton" style={{ width: '40%', height: 10 }} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // ── Default: table rows ──
    return (
        <div className="fade-in" style={S.page}>
            {title && <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 8 }} />}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 60, height: 12 }} />
                    <div className="skeleton" style={{ flex: 1, height: 12 }} />
                    <div className="skeleton" style={{ width: 80, height: 12 }} />
                </div>
            ))}
        </div>
    )
}

// ── Route → skeleton variant mapping ──
const ROUTE_SKELETON = {
    '/control-tower': 'dashboard',
    '/pipeline':      'kanban',
    '/crm':           'table',
    '/intelligence':  'kpi',
    '/execution':     'table',
    '/finance':       'kpi',
    '/agents':        'cards',
    '/herald':        'chat',
    '/command-center':'chat',
    '/prospector':    'table',
    '/automation':    'cards',
    '/knowledge':     'cards',
    '/watchtower':    'kpi',
    '/lab':           'cards',
    '/flight-deck':   'map',
    '/world-monitor': 'map',
    '/messaging':     'chat',
    '/gtm':           'kpi',
    '/creative':      'cards',
    '/niches':        'cards',
    '/experiments':   'table',
    '/studies':       'cards',
    '/decisions':     'table',
    '/simulation':    'cards',
    '/portfolio':     'kpi',
    '/reports':       'table',
    '/settings':      'settings',
    '/team-settings': 'settings',
    '/billing':       'settings',
}

/**
 * Smart skeleton that picks the right variant based on current route
 */
export function RouteAwareSkeleton() {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/'
    const variant = ROUTE_SKELETON[path] || 'table'
    return <ModuleSkeleton variant={variant} rows={6} />
}


// ── Extracted styles for perf ──
const STYLES = {
    page: {
        padding: 'var(--space-8)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        height: '100%',
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-4)',
    },
    kpiGrid4: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'var(--border-default)',
        border: '1px solid var(--border-default)',
    },
    kpiCell: {
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    kanbanCol: {
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    kanbanCard: {
        background: 'var(--surface-base)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    card: {
        border: '1px solid var(--border-default)',
        background: 'var(--surface-raised)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
}
