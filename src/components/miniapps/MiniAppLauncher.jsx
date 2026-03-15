// ═══════════════════════════════════════════════════
// OCULOPS — Mini-App Launcher
// Core apps + installed connectors + public API catalog
// ═══════════════════════════════════════════════════

import { useState, useMemo, useEffect, startTransition } from 'react'
import { filterCoreApps } from './MiniAppRegistry'
import MiniApp from './MiniApp'
import ApiIntelligenceCard from './ApiIntelligenceCard'
import { useApiActivationQueue } from '../../hooks/useApiActivationQueue'
import { useApiNetwork } from '../../hooks/useApiNetwork'
import { buildCatalogMiniApp, getTemplateByCatalogSlug } from '../../lib/publicApiConnectorTemplates'
import { groupApiIntelligenceEntries, groupCatalogEntriesByAccessBurden } from '../../lib/publicApiCatalog'

const PAGE_SIZE = 60
const CATALOG_VIEW_MODES = [
  { id: 'access', label: 'By Access' },
  { id: 'theme', label: 'By Theme' },
  { id: 'open_only', label: 'Open Only' },
]

const SECTIONS = [
  { id: 'core', label: 'Core', description: 'First-party live APIs, edge functions, and workflow bridges' },
  { id: 'installed', label: 'Installed', description: 'Connector proxies installed in Supabase' },
  { id: 'adapter_ready', label: 'Adapter Ready', description: 'Curated public APIs with install templates' },
  { id: 'activation_queue', label: 'Activation Queue', description: 'Bulk install + healthcheck pipeline to move APIs live faster' },
  { id: 'catalog', label: 'Catalog', description: 'Full imported public API directory' },
]

function getStatusMeta(status, app) {
  if (status === 'active') {
    return { color: 'var(--color-success)', dot: 'var(--color-success)', label: 'CONNECTED' }
  }

  if (status === 'degraded') {
    return { color: 'var(--warning)', dot: 'var(--warning)', label: 'LIMITED' }
  }

  if (status === 'pending') {
    return { color: 'var(--warning)', dot: 'var(--warning)', label: app.installable ? 'INSTALLABLE' : 'PENDING' }
  }

  return { color: 'var(--text-tertiary)', dot: 'var(--text-tertiary)', label: app.source === 'public_catalog' ? 'CATALOG' : 'PLANNED' }
}

function getQueueStatusMeta(status) {
  switch (status) {
    case 'live':
      return { label: 'LIVE', color: 'var(--color-success)', badge: 'badge-success' }
    case 'installing':
      return { label: 'INSTALLING', color: 'var(--warning)', badge: 'badge-warning' }
    case 'healthchecking':
      return { label: 'HEALTHCHECK', color: 'var(--accent-primary)', badge: 'badge-info' }
    case 'credentials_missing':
      return { label: 'CREDENTIALS MISSING', color: 'var(--warning)', badge: 'badge-warning' }
    case 'healthcheck_failed':
      return { label: 'HEALTHCHECK FAILED', color: 'var(--color-danger)', badge: 'badge-danger' }
    case 'needs_template':
      return { label: 'NEEDS TEMPLATE', color: 'var(--text-tertiary)', badge: 'badge-neutral' }
    default:
      return { label: 'READY', color: 'var(--text-secondary)', badge: 'badge-neutral' }
  }
}

function StatCard({ label, value, color }) {
  return (
    <div className="kpi-card" style={{ padding: '10px 14px', minWidth: '88px', textAlign: 'center' }}>
      <div className="kpi-value" style={{ fontSize: '18px', color: color || 'var(--text-primary)' }}>{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

function EmptyPanel({ title, description }) {
  return (
    <div style={{
      border: '1px dashed var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: '36px 20px',
      textAlign: 'center',
      color: 'var(--text-tertiary)',
    }}>
      <div style={{ fontSize: '2.25rem', marginBottom: '10px' }}>🕸️</div>
      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>{title}</div>
      <div style={{ fontSize: '12px' }}>{description}</div>
    </div>
  )
}

export default function MiniAppLauncher() {
  const [selectedApp, setSelectedApp] = useState(null)
  const [section, setSection] = useState('core')
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [catalogView, setCatalogView] = useState('access')
  const [page, setPage] = useState(1)
  const [installingSlug, setInstallingSlug] = useState(null)
  const {
    apps: runtimeCoreApps,
    stats: coreStats,
    loading: coreLoading,
    error: coreError,
    refresh: refreshCore,
  } = useApiNetwork()

  const {
    entries,
    loading,
    error,
    stats,
    syncRun,
    source,
    installedApps,
    adapterReadyEntries,
    installConnector,
    reload,
    items: activationQueueItems,
    queueStats,
    running: queueRunning,
    lastRun,
    activateBatch,
    activateOne,
    retryFailed,
    refresh,
  } = useApiActivationQueue({ search, moduleTarget: moduleFilter, agentTarget: agentFilter })
  const catalogEntries = entries

  const coreApps = useMemo(
    () => filterCoreApps(runtimeCoreApps, { search, moduleTarget: moduleFilter, agentTarget: agentFilter }),
    [agentFilter, moduleFilter, runtimeCoreApps, search]
  )

  useEffect(() => {
    setPage(1)
  }, [search, moduleFilter, agentFilter, section, catalogView])

  const connectorAppBySlug = useMemo(
    () => new Map(installedApps.map(app => [app.catalogSlug, app])),
    [installedApps]
  )

  const adapterReadyCatalogEntries = useMemo(
    () => adapterReadyEntries
      .filter(entry => !getTemplateByCatalogSlug(entry.slug)?.internalOnly)
      .filter(entry => agentFilter === 'all' || (entry.agent_targets || []).includes(agentFilter)),
    [adapterReadyEntries, agentFilter]
  )

  const installedCatalogEntries = useMemo(
    () => catalogEntries.filter(entry => connectorAppBySlug.has(entry.slug) && !getTemplateByCatalogSlug(entry.slug)?.internalOnly),
    [catalogEntries, connectorAppBySlug]
  )

  const visibleCatalogEntries = useMemo(
    () => catalogEntries.filter(entry => !getTemplateByCatalogSlug(entry.slug)?.internalOnly),
    [catalogEntries]
  )

  const filteredCatalogEntries = useMemo(
    () => catalogView === 'open_only'
      ? visibleCatalogEntries.filter(entry => entry.auth_type === 'none')
      : visibleCatalogEntries,
    [catalogView, visibleCatalogEntries]
  )

  const pageCount = Math.max(1, Math.ceil(filteredCatalogEntries.length / PAGE_SIZE))
  const pagedCatalogEntries = useMemo(
    () => filteredCatalogEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredCatalogEntries, page]
  )

  const sectionApps = {
    core: coreApps,
    installed: installedCatalogEntries,
    adapter_ready: adapterReadyCatalogEntries,
    activation_queue: activationQueueItems,
    catalog: pagedCatalogEntries,
  }

  const sectionCounts = {
    core: coreApps.length,
    installed: installedCatalogEntries.length,
    adapter_ready: adapterReadyCatalogEntries.length,
    activation_queue: activationQueueItems.length,
    catalog: filteredCatalogEntries.length,
  }

  const filters = useMemo(() => {
    return ['all', ...new Set([
      ...Object.keys(stats.countsByModuleTarget || {}),
      ...runtimeCoreApps.flatMap(app => app.moduleTargets || []),
    ])]
  }, [runtimeCoreApps, stats.countsByModuleTarget])

  const agentFilters = useMemo(() => {
    return ['all', ...new Set([
      ...Object.keys(stats.countsByAgentTarget || {}),
      ...runtimeCoreApps.flatMap(app => app.agentTargets || []),
    ])]
  }, [runtimeCoreApps, stats.countsByAgentTarget])

  const handleInstall = async (app) => {
    const slug = typeof app === 'string' ? app : app.catalogSlug || app.slug
    setInstallingSlug(slug)
    const result = await installConnector(slug)
    if (!result?.error) {
      startTransition(() => {
        reload()
        setSection('installed')
      })
    }
    setInstallingSlug(null)
  }

  const handleOpenCatalogEntry = (entry) => {
    const app = connectorAppBySlug.get(entry.slug) || buildCatalogMiniApp(entry)
    setSelectedApp(app)
  }

  const handleRefresh = () => {
    refresh()
    refreshCore()
  }

  const groupedSectionEntries = useMemo(() => {
    if (section === 'core' || section === 'activation_queue') return []

    const entriesForSection = section === 'installed'
      ? installedCatalogEntries
      : section === 'adapter_ready'
        ? adapterReadyCatalogEntries
        : pagedCatalogEntries

    if (section === 'catalog' && catalogView !== 'theme') {
      return groupCatalogEntriesByAccessBurden(entriesForSection).filter(group => group.entries.length > 0)
    }

    return groupApiIntelligenceEntries(entriesForSection).filter(group => group.entries.length > 0)
  }, [adapterReadyCatalogEntries, catalogView, installedCatalogEntries, pagedCatalogEntries, section])

  const catalogSummaryGroups = useMemo(() => {
    if (section !== 'catalog') return []

    if (catalogView !== 'theme') {
      return groupCatalogEntriesByAccessBurden(filteredCatalogEntries).filter(group => group.entries.length > 0)
    }

    return groupApiIntelligenceEntries(filteredCatalogEntries).filter(group => group.entries.length > 0)
  }, [catalogView, filteredCatalogEntries, section])
  const queueFailedCount = (queueStats.credentials_missing || 0) + (queueStats.healthcheck_failed || 0)

  if (selectedApp) {
    return (
      <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <MiniApp
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onInstall={handleInstall}
          installing={installingSlug === selectedApp.catalogSlug}
          onAfterExecute={() => {
            reload()
            refreshCore()
          }}
        />
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>API Network</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
            {coreStats.liveCount || 0} core live · {coreStats.degradedCount || 0} limited · {stats.installedCount || 0} installed · {stats.entryCount || 0} catalog APIs
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
            {syncRun?.repo_pushed_at
              ? `Source pushed: ${new Date(syncRun.repo_pushed_at).toLocaleDateString()}`
              : `Source: ${source === 'supabase' ? 'live catalog' : source === 'seed' ? 'offline seed' : 'unavailable'}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn btn-sm btn-ghost" onClick={handleRefresh} style={{ alignSelf: 'stretch' }}>Refresh</button>
          <StatCard label="Core Live" value={coreStats.liveCount || 0} color="var(--color-success)" />
          <StatCard label="Limited" value={coreStats.degradedCount || 0} color="var(--warning)" />
          <StatCard label="Installed" value={stats.installedCount || 0} color="var(--color-success)" />
          <StatCard label="Queue Ready" value={queueStats.ready || 0} color="var(--accent-primary)" />
          <StatCard label="Catalog" value={stats.entryCount || 0} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', flexShrink: 0 }}>
        {SECTIONS.map(item => (
          <button
            key={item.id}
            className={`btn btn-sm ${section === item.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSection(item.id)}
            style={{ fontSize: '11px' }}
          >
            {item.label} ({sectionCounts[item.id]})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.2fr) repeat(2, minmax(160px, 0.8fr))', gap: '12px', marginBottom: '16px', flexShrink: 0 }}>
        <div className="input-group" style={{ margin: 0 }}>
          <label>Search</label>
          <input
            className="input"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search API name, category, description, capability..."
          />
        </div>
        <div className="input-group" style={{ margin: 0 }}>
          <label>Target Module</label>
          <select
            className="input"
            value={moduleFilter}
            onChange={event => setModuleFilter(event.target.value)}
          >
            {filters.map(filter => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
        </div>
        <div className="input-group" style={{ margin: 0 }}>
          <label>Assigned Agent</label>
          <select
            className="input"
            value={agentFilter}
            onChange={event => setAgentFilter(event.target.value)}
          >
            {agentFilters.map(filter => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
        </div>
      </div>

      {(error || coreError) && (
        <div style={{
          marginBottom: '12px',
          padding: '10px 12px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--warning-bg)',
          color: 'var(--warning)',
          fontSize: '12px',
          flexShrink: 0,
        }}>
          API network fallback active: {error || coreError}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700 }}>{SECTIONS.find(item => item.id === section)?.label}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{SECTIONS.find(item => item.id === section)?.description}</div>
          {section === 'activation_queue' && lastRun && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Last run · processed {lastRun.processed} · live {lastRun.live} · credentials {lastRun.credentialsMissing} · failed {lastRun.failed}
            </div>
          )}
          {section === 'catalog' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {catalogSummaryGroups.map(group => (
                <span
                  key={group.key}
                  className="badge badge-neutral"
                  style={{
                    fontSize: '10px',
                    borderColor: `${group.color}55`,
                    color: group.color,
                  }}
                >
                  {group.label}: {group.entries.length}
                </span>
              ))}
            </div>
          )}
        </div>
        {section === 'catalog' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {CATALOG_VIEW_MODES.map(mode => (
                <button
                  key={mode.id}
                  className={`btn btn-sm ${catalogView === mode.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCatalogView(mode.id)}
                  style={{ fontSize: '10px' }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <button className="btn btn-sm btn-ghost" disabled={page === 1} onClick={() => setPage(current => Math.max(1, current - 1))}>← Prev</button>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Page {page} / {pageCount}</span>
            <button className="btn btn-sm btn-ghost" disabled={page === pageCount} onClick={() => setPage(current => Math.min(pageCount, current + 1))}>Next →</button>
          </div>
        )}
        {section === 'activation_queue' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className="badge badge-neutral">Ready: {queueStats.ready || 0}</span>
            <span className="badge badge-success">Live: {queueStats.live || 0}</span>
            <span className="badge badge-warning">Credentials: {queueStats.credentials_missing || 0}</span>
            <span className="badge badge-danger">Failed: {queueStats.healthcheck_failed || 0}</span>
            <button
              className="btn btn-sm btn-primary"
              disabled={queueRunning || queueStats.actionable === 0}
              onClick={() => activateBatch({ scope: 'top', limit: 10 })}
            >
              Activate top 10
            </button>
            <button
              className="btn btn-sm btn-ghost"
              disabled={queueRunning || queueStats.actionable === 0}
              onClick={() => activateBatch({ scope: 'visible' })}
            >
              Activate visible
            </button>
            <button
              className="btn btn-sm btn-ghost"
              disabled={queueRunning || queueFailedCount === 0}
              onClick={() => retryFailed()}
            >
              Retry failed
            </button>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflow: 'auto',
        flex: 1,
        paddingBottom: '16px',
      }}>
        {((section === 'core' && coreLoading && coreApps.length === 0) || (section !== 'core' && loading)) ? (
          <EmptyPanel
            title={section === 'core' ? 'Checking live APIs...' : section === 'activation_queue' ? 'Preparing activation queue...' : 'Loading catalog...'}
            description={section === 'core'
              ? 'Probing first-party functions and provider-backed services.'
              : section === 'activation_queue'
                ? 'Ranking APIs by activation priority and connector readiness.'
                : 'Fetching installed connectors and public API metadata.'}
          />
        ) : sectionApps[section].length === 0 ? (
          <EmptyPanel
            title={section === 'installed' ? 'No installed connectors' : section === 'activation_queue' ? 'No activation candidates' : 'No results'}
            description={section === 'installed'
              ? 'Install an adapter-ready connector to execute public APIs through the proxy.'
              : section === 'activation_queue'
                ? 'Try broadening your filters or syncing the catalog to queue activation candidates.'
                : 'Adjust the filters or sync the public API catalog.'}
          />
        ) : section === 'core' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
          }}>
            {sectionApps[section].map(app => {
              const statusMeta = getStatusMeta(app.status, app)

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                  onMouseEnter={event => {
                    event.currentTarget.style.borderColor = `${app.color}40`
                    event.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={event => {
                    event.currentTarget.style.borderColor = 'var(--border-subtle)'
                    event.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-lg)',
                      background: `${app.color}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}>
                      {app.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>{app.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{app.type}</div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    flex: 1,
                  }}>
                    {app.description}
                  </div>

                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {(app.moduleTargets || []).slice(0, 3).map(target => (
                      <span key={target} className="badge badge-neutral" style={{ fontSize: '9px' }}>{target}</span>
                    ))}
                    {app.activationTier && (
                      <span className="badge badge-neutral" style={{ fontSize: '9px' }}>{app.activationTier}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: statusMeta.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      <div className="pulse-dot" style={{
                        background: statusMeta.dot,
                      }} />
                      {statusMeta.label}
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: '9px', padding: '1px 6px' }}>
                      {app.source === 'core' ? 'edge' : app.runMode === 'connector_proxy' ? 'proxy' : 'docs'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : section === 'activation_queue' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {queueRunning && (
              <div style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-base)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}>
                Activation queue is running. Progress updates appear in row statuses.
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '8px',
            }}>
              <StatCard label="Total" value={queueStats.total || 0} />
              <StatCard label="Actionable" value={queueStats.actionable || 0} color="var(--accent-primary)" />
              <StatCard label="Live" value={queueStats.live || 0} color="var(--color-success)" />
              <StatCard label="Creds" value={queueStats.credentials_missing || 0} color="var(--warning)" />
              <StatCard label="Failed" value={queueStats.healthcheck_failed || 0} color="var(--color-danger)" />
              <StatCard label="No Template" value={queueStats.needs_template || 0} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(240px, 2fr) repeat(4, minmax(80px, 0.8fr)) minmax(180px, 1fr)',
              gap: '8px',
              padding: '8px 10px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '10px',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700,
            }}>
              <div>API</div>
              <div>State</div>
              <div>Priority</div>
              <div>Fit</div>
              <div>Auth</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {activationQueueItems.map(item => {
              const stateMeta = getQueueStatusMeta(item.status)
              return (
                <div
                  key={item.slug}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(240px, 2fr) repeat(4, minmax(80px, 0.8fr)) minmax(180px, 1fr)',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '10px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface-elevated)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {item.statusDetail || item.description}
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${stateMeta.badge}`} style={{ fontSize: '10px', color: stateMeta.color }}>
                      {stateMeta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>{item.integrationPriority}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>{item.businessFitScore}</div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase' }}>{item.authType}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenCatalogEntry(item.entry)}>Open details</button>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={queueRunning || !item.isActionable}
                      onClick={() => activateOne(item.slug)}
                    >
                      {item.status === 'installing' || item.status === 'healthchecking' ? 'Running...' : 'Activate now'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          groupedSectionEntries.map(group => (
            <section key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{group.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{group.description}</div>
                </div>
                <span
                  className="badge badge-neutral"
                  style={section === 'catalog'
                    ? {
                        borderColor: `${group.color}55`,
                        color: group.color,
                      }
                    : undefined}
                >
                  {group.entries.length} APIs
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '12px',
              }}>
                {group.entries.map(entry => (
                  <ApiIntelligenceCard
                    key={entry.slug}
                    entry={entry}
                    variant={section === 'catalog' ? 'compact' : 'standard'}
                    installing={installingSlug === entry.slug}
                    onInstall={handleInstall}
                    onOpenDetails={handleOpenCatalogEntry}
                    detailsLabel="Open"
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
