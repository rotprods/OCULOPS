// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Layout v5
// Premium Sidebar — Bloomberg Terminal / War Room
// ═══════════════════════════════════════════════════

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from '../../lib/supabase'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import './Layout.css'

// ── Section grouping (matches module `group` field) ──
const SECTION_ORDER = [
    'CORE',
    'INTELLIGENCE',
    'AUTOMATION',
    'ANALYTICS',
    'KNOWLEDGE',
    'WORLD',
    'OPERATIONS',
]

// ── Command Palette (mounted only when open) ──
function CommandPalette({ modules, onClose }) {
    const [query, setQuery] = useState('')
    const inputRef = useRef(null)
    const navigate = useNavigate()

    useLayoutEffect(() => {
        inputRef.current?.focus()
    }, [])

    const filtered = modules.filter(m =>
        m.label.toLowerCase().includes(query.toLowerCase()) ||
        m.id.toLowerCase().includes(query.toLowerCase())
    )

    const handleSelect = useCallback((mod) => {
        navigate(`/${mod.id}`)
        onClose()
    }, [navigate, onClose])

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0])
    }, [filtered, handleSelect, onClose])

    return (
        <div className="command-backdrop" onClick={onClose}>
            <div className="command-palette" onClick={e => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    className="command-input"
                    placeholder="Buscar módulos..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="command-results">
                    {filtered.map(mod => (
                        <div
                            key={mod.id}
                            className="command-item"
                            onClick={() => handleSelect(mod)}
                        >
                            <span className="cmd-icon">{mod.icon}</span>
                            <span className="cmd-label">{mod.label}</span>
                            <span className="cmd-shortcut">/{mod.id}</span>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="command-empty">
                            Sin resultados para "{query}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Build section map from modules array ──
function buildSections(modules) {
    const map = new Map()
    for (const mod of modules) {
        const group = mod.group || 'OTHER'
        if (!map.has(group)) map.set(group, [])
        map.get(group).push(mod)
    }
    // Return sections ordered by SECTION_ORDER, then any remaining
    const ordered = []
    for (const key of SECTION_ORDER) {
        if (map.has(key)) ordered.push({ label: key, items: map.get(key) })
    }
    for (const [key, items] of map.entries()) {
        if (!SECTION_ORDER.includes(key)) ordered.push({ label: key, items })
    }
    return ordered
}

function Layout({ children, modules, sidebarCollapsed, onToggleSidebar, user }) {
    const location = useLocation()
    const currentModule = modules.find(m => location.pathname === `/${m.id}`) || modules[0]
    const [commandOpen, setCommandOpen] = useState(false)
    const { status, isOnline } = useConnectionStatus()

    const sections = buildSections(modules)

    // ⌘K global shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setCommandOpen(prev => !prev)
            }
            if (e.key === 'Escape') setCommandOpen(false)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    return (
        <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>

            {commandOpen && (
                <CommandPalette
                    modules={modules}
                    onClose={() => setCommandOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>

                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        {!sidebarCollapsed && (
                            <span className="sidebar-logo-wordmark">
                                ANTIGRAVITY<span className="sidebar-logo-dot"> OS</span>
                            </span>
                        )}
                        {sidebarCollapsed && (
                            <span className="sidebar-logo-dot-only">●</span>
                        )}
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={onToggleSidebar}
                        title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        {sidebarCollapsed ? '›' : '‹'}
                    </button>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    {sections.map(({ label, items }) => (
                        <div key={label} className="sidebar-section">
                            {!sidebarCollapsed && (
                                <div className="sidebar-section-label">{label}</div>
                            )}
                            {items.map(mod => (
                                <NavLink
                                    key={mod.id}
                                    to={`/${mod.id}`}
                                    className={({ isActive }) =>
                                        `sidebar-item${isActive ? ' active' : ''}`
                                    }
                                    title={sidebarCollapsed ? mod.label : undefined}
                                >
                                    <span className="sidebar-item-icon">{mod.icon}</span>
                                    {!sidebarCollapsed && (
                                        <span className="sidebar-item-label">{mod.label}</span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    {!sidebarCollapsed ? (
                        <>
                            <div className="sidebar-footer-info">
                                <span className="sidebar-footer-email">
                                    {user?.email || 'usuario'}
                                </span>
                                <span className="sidebar-footer-version">v10.3</span>
                            </div>
                            <button
                                className="sidebar-signout"
                                onClick={() => signOut()}
                                title="Cerrar sesión"
                            >
                                ⎋
                            </button>
                        </>
                    ) : (
                        <button
                            className="sidebar-signout sidebar-signout--icon"
                            onClick={() => signOut()}
                            title="Cerrar sesión"
                        >
                            ⎋
                        </button>
                    )}
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-left">
                        <span className="header-icon">{currentModule?.icon}</span>
                        <h1 className="header-title">{currentModule?.label}</h1>
                    </div>
                    <div className="header-right">
                        <button className="search-trigger" onClick={() => setCommandOpen(true)}>
                            <span>⌕</span>
                            <span>Buscar...</span>
                            <span className="search-shortcut">⌘K</span>
                        </button>
                        <div className="connection-status">
                            <div
                                className="live-dot"
                                style={{ background: isOnline ? undefined : status === 'connecting' ? 'var(--warning)' : 'var(--danger)' }}
                            />
                            <span>{isOnline ? 'LIVE' : status === 'connecting' ? 'SYNC' : 'OFFLINE'}</span>
                        </div>
                    </div>
                </header>
                <div className="content-area">
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    )
}

export default Layout
