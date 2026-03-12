// ═══════════════════════════════════════════════════
// OCULOPS — Markets Module
// 100-Year UX: Leadership telemetry and macro indices
// ═══════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { useMarkets } from '../../hooks/useMarkets'
import './Markets.css'

const GROUP_LABELS = {
  stock: 'Equities',
  forex: 'FX (USD Base)',
  crypto: 'Crypto',
}

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function formatPrice(asset) {
  if (!asset) return '0'

  const digits = asset.assetType === 'forex'
    ? 4
    : asset.price >= 1000
      ? 2
      : asset.price >= 1
        ? 2
        : 4

  return asset.price.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatPercent(value) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatVolume(value) {
  if (!value) return '--'
  return compactNumber.format(value)
}

function formatTimestamp(value) {
  if (!value) return '--:--'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value)).toUpperCase()
}

function toneClass(change) {
  if (change > 0.05) return 'is-up'
  if (change < -0.05) return 'is-down'
  return 'is-flat'
}

function Sparkline({ points, tone = 'is-flat', detailed = false }) {
  if (!points || points.length < 2) {
    return <div className={`markets__sparkline markets__sparkline--empty ${detailed ? 'markets__sparkline--detail' : ''}`}>Insufficient data</div>
  }

  const width = detailed ? 640 : 120
  const height = detailed ? 280 : 60
  const padding = detailed ? 24 : 8
  const values = points.map((point) => point.price)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const chartPoints = points.map((point, index) => {
    const x = padding + ((width - (padding * 2)) * index) / Math.max(points.length - 1, 1)
    const y = height - padding - (((point.price - min) / range) * (height - (padding * 2)))
    return { x, y, price: point.price, snapshotAt: point.snapshotAt }
  })

  // Sharp terminal steps or raw lines? Raw lines, but sharp corners
  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `${polyline} ${chartPoints[chartPoints.length - 1].x},${height - padding} ${chartPoints[0].x},${height - padding}`

  return (
    <svg
      className={`markets__sparkline ${detailed ? 'markets__sparkline--detail' : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {detailed && (
        <>
          <line x1={0} y1={padding} x2={width} y2={padding} className="markets__sparkline-grid" />
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} className="markets__sparkline-grid" />
          <line x1={0} y1={height - padding} x2={width} y2={height - padding} className="markets__sparkline-grid" />
        </>
      )}
      <polygon points={area} className={`markets__sparkline-area ${tone}`} />
      <polyline points={polyline} className={`markets__sparkline-line ${tone}`} />
      {detailed && chartPoints.map((point) => (
        <circle
          key={`${point.snapshotAt}-${point.price}`}
          cx={point.x}
          cy={point.y}
          r="2.5"
          className={`markets__sparkline-dot ${tone}`}
        >
          <title>{`${formatTimestamp(point.snapshotAt)} // $${point.price.toLocaleString('en-US')}`}</title>
        </circle>
      ))}
    </svg>
  )
}

function buildInsights(selectedAsset, summary, topMovers) {
  if (!selectedAsset) return []

  const insights = []

  insights.push(
    summary.riskOnScore >= 60
      ? 'Risk appetite is constructive. Initiate campaign experiments while macro defensiveness is low.'
      : 'Risk appetite is cautious. Favor retention, hygiene, and tight CAC discipline.',
  )

  if (selectedAsset.assetType === 'forex') {
    insights.push(
      `${selectedAsset.displayName} is a margin signal. A stronger dollar pressures software/media acquisition.`,
    )
  } else if (selectedAsset.assetType === 'crypto') {
    insights.push(
      `${selectedAsset.displayName} acts as a sentiment proxy. Correlates with aggressive R&D spend.`,
    )
  } else {
    insights.push(
      `${selectedAsset.displayName} is a proxy for enterprise tech confidence. Long buying cycles expected if weak.`,
    )
  }

  const mover = topMovers[0]
  if (mover) {
    insights.push(
      `${mover.displayName} is the fastest mover at ${formatPercent(mover.change24h)}. Monitor spillover effects into vendor budgets.`,
    )
  }

  return insights
}

function Markets() {
  const {
    assets,
    groupedAssets,
    topMovers,
    summary,
    lastUpdated,
    refresh,
    refreshing,
    refreshError,
    dataMode,
    loading,
    runtimeConfigured,
  } = useMarkets()
  const [selectedSymbol, setSelectedSymbol] = useState(null)

  useEffect(() => {
    if (!selectedSymbol && assets[0]) {
      setSelectedSymbol(assets[0].symbol)
      return
    }

    if (selectedSymbol && assets.length > 0 && !assets.some((asset) => asset.symbol === selectedSymbol)) {
      setSelectedSymbol(assets[0].symbol)
    }
  }, [assets, selectedSymbol])

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.symbol === selectedSymbol) || assets[0] || null,
    [assets, selectedSymbol],
  )

  const insights = useMemo(
    () => buildInsights(selectedAsset, summary, topMovers),
    [selectedAsset, summary, topMovers],
  )

  const feedBadgeLabel = dataMode === 'live'
    ? 'Live'
    : dataMode === 'mixed'
      ? 'Mixed Feed'
      : runtimeConfigured
        ? 'Connecting...'
        : 'Simulated'

  if (loading && assets.length === 0) {
    return <div className="markets markets--loading fade-in">Establishing financial data link...</div>
  }

  return (
    <div className="markets fade-in">
      <div className="markets__header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--text-primary)', fontSize: '28px', margin: 0 }}>Macro Telemetry</h1>
          <p className="mono text-xs text-tertiary" style={{ marginTop: '8px' }}>Leadership context for macro-sensitive campaign decisions.</p>
        </div>
        <div className="markets__actions">
          <span className="mono text-xs" style={{ padding: '8px 12px', border: '1px solid var(--border-subtle)', color: 'var(--text-accent)' }}>
            {feedBadgeLabel}
          </span>
          <button className="btn btn-primary mono" style={{ padding: '8px 16px', fontSize: '11px' }} onClick={refresh} disabled={refreshing}>
            {refreshing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {refreshError && (
        <div className="markets__banner">
          <strong style={{ color: 'var(--color-warning)' }}>Error:</strong> {refreshError}
        </div>
      )}

      <section className="markets__stats">
        <article style={{ padding: '16px', background: 'var(--surface-raised)' }}>
          <span className="mono text-2xs text-tertiary" style={{ display: 'block', marginBottom: '8px' }}>Tracked Assets</span>
          <strong className="mono" style={{ display: 'block', fontSize: '24px', color: 'var(--text-primary)' }}>{summary.trackedCount}</strong>
          <span className="mono text-2xs" style={{ color: 'var(--color-success)', marginTop: '8px', display: 'block' }}>Cross-asset watchlist</span>
        </article>
        <article style={{ padding: '16px', background: 'var(--surface-raised)' }}>
          <span className="mono text-2xs text-tertiary" style={{ display: 'block', marginBottom: '8px' }}>A/D Line</span>
          <strong className="mono" style={{ display: 'block', fontSize: '24px', color: 'var(--text-primary)' }}>{summary.advancers} / {summary.decliners}</strong>
          <span className="mono text-2xs" style={{ color: summary.advancers >= summary.decliners ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '8px', display: 'block' }}>
            Breadth {summary.advancers >= summary.decliners ? 'supports' : 'pressures'} risk
          </span>
        </article>
        <article style={{ padding: '16px', background: 'var(--surface-raised)' }}>
          <span className="mono text-2xs text-tertiary" style={{ display: 'block', marginBottom: '8px' }}>Risk-On Score</span>
          <strong className="mono" style={{ display: 'block', fontSize: '24px', color: 'var(--text-primary)' }}>{summary.riskOnScore}%</strong>
          <span className="mono text-2xs" style={{ color: summary.riskOnScore >= 60 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '8px', display: 'block' }}>
            {summary.riskOnScore >= 60 ? 'Velocity approved' : 'Tighten spend logic'}
          </span>
        </article>
        <article style={{ padding: '16px', background: 'var(--surface-raised)' }}>
          <span className="mono text-2xs text-tertiary" style={{ display: 'block', marginBottom: '8px' }}>24h Exchange Vol</span>
          <strong className="mono" style={{ display: 'block', fontSize: '24px', color: 'var(--text-primary)' }}>{formatVolume(summary.totalVolume)}</strong>
          <span className="mono text-2xs" style={{ color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>Sync: {formatTimestamp(lastUpdated)}</span>
        </article>
      </section>

      <section className="markets__hero">
        <article className="markets__focus">
          <div className="markets__focus-header">
            <div>
              <span className="markets__eyebrow">Primary Target</span>
              <h2>{selectedAsset?.displayName || 'No target assigned'}</h2>
            </div>
            {selectedAsset && (
              <span className={`markets__delta ${toneClass(selectedAsset.change24h)}`}>
                {formatPercent(selectedAsset.change24h)}
              </span>
            )}
          </div>

          {selectedAsset && (
            <>
              <div className="markets__focus-meta">
                <div>
                  <span className="markets__meta-label">Last Price</span>
                  <strong className="markets__price">
                    {selectedAsset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice(selectedAsset)}
                  </strong>
                </div>
                <div>
                  <span className="markets__meta-label">Session Range</span>
                  <strong className="markets__range">
                    {selectedAsset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice({ ...selectedAsset, price: selectedAsset.rangeLow })}
                    {' '}➔{' '}
                    {selectedAsset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice({ ...selectedAsset, price: selectedAsset.rangeHigh })}
                  </strong>
                </div>
                <div>
                  <span className="markets__meta-label">Data Source</span>
                  <strong className="markets__range">{selectedAsset.source.replace('_', ' ')}</strong>
                </div>
              </div>

              <Sparkline points={selectedAsset.history} tone={toneClass(selectedAsset.change24h)} detailed />

              <div className="markets__focus-footer">
                <span className="badge">[{GROUP_LABELS[selectedAsset.assetType]}]</span>
                <span className="badge">[{selectedAsset.baseCurrency}/{selectedAsset.quoteCurrency}]</span>
                <span className="badge">[VOL: {formatVolume(selectedAsset.volume)}]</span>
                <span className="badge">[T:{formatTimestamp(selectedAsset.snapshotAt)}]</span>
              </div>
            </>
          )}
        </article>

        <article className="markets__intel">
          <div className="markets__intel-header">
            <div>
              <span className="markets__eyebrow">Analysis</span>
              <h2>Strategic Implications</h2>
            </div>
            {summary.topMover && (
              <span className={`markets__delta ${toneClass(summary.topMover.change24h)}`}>
                {summary.topMover.symbol} {formatPercent(summary.topMover.change24h)}
              </span>
            )}
          </div>

          <div className="markets__insights">
            {insights.map((insight) => (
              <div key={insight} className="markets__insight">
                <span className="markets__insight-dot" />
                <p>{insight}</p>
              </div>
            ))}
          </div>

          <div className="markets__movers">
            <span className="markets__eyebrow" style={{ padding: '0 0 8px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>Highest Volatility</span>
            {topMovers.map((asset) => (
              <button
                key={asset.symbol}
                type="button"
                className={`markets__mover ${selectedAsset?.symbol === asset.symbol ? 'is-active' : ''}`}
                onClick={() => setSelectedSymbol(asset.symbol)}
              >
                <div>
                  <strong>{asset.symbol}</strong>
                  <span>{asset.displayName}</span>
                </div>
                <span className={`markets__delta ${toneClass(asset.change24h)}`} style={{ background: 'transparent', padding: 0 }}>{formatPercent(asset.change24h)}</span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="markets__groups">
        {Object.entries(groupedAssets).map(([group, entries]) => (
          <article key={group} className="markets__group">
            <div className="markets__group-header">
              <div>
                <span className="markets__eyebrow">{GROUP_LABELS[group]}</span>
                <h2>{entries.length} Assets</h2>
              </div>
            </div>
            <div className="markets__asset-list">
              {entries.map((asset) => (
                <button
                  key={asset.symbol}
                  type="button"
                  className={`markets__asset ${selectedAsset?.symbol === asset.symbol ? 'is-selected' : ''}`}
                  onClick={() => setSelectedSymbol(asset.symbol)}
                >
                  <div className="markets__asset-copy">
                    <strong>{asset.symbol}</strong>
                    <span>{asset.displayName}</span>
                  </div>
                  <div className="markets__asset-chart">
                    <Sparkline points={asset.history} tone={toneClass(asset.change24h)} />
                  </div>
                  <div className="markets__asset-metrics">
                    <strong style={{ color: 'var(--text-primary)' }}>{asset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice(asset)}</strong>
                    <span className={toneClass(asset.change24h)}>{formatPercent(asset.change24h)}</span>
                  </div>
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="markets__table-card">
        <div className="markets__table-header">
          <div>
            <span className="markets__eyebrow">Full Summary</span>
            <h2>Market Snapshot</h2>
          </div>
          <span className="mono text-xs text-secondary">[ T:{formatTimestamp(lastUpdated)} ]</span>
        </div>

        <div className="markets__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset / Ticker</th>
                <th>Class</th>
                <th>Latest Quote</th>
                <th>Delta (24h)</th>
                <th>24h Vol</th>
                <th>Trajectory</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.symbol}>
                  <td>
                    <button
                      type="button"
                      className="markets__table-symbol"
                      onClick={() => setSelectedSymbol(asset.symbol)}
                      style={{ background: 'transparent', border: 'none', color: 'inherit' }}
                    >
                      <strong style={{ color: 'var(--text-accent)' }}>{asset.symbol}</strong>
                      <span>{asset.displayName}</span>
                    </button>
                  </td>
                  <td>{GROUP_LABELS[asset.assetType]}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{asset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice(asset)}</td>
                  <td>
                    <span className={`markets__delta ${toneClass(asset.change24h)}`} style={{ background: 'transparent', padding: 0 }}>
                      {formatPercent(asset.change24h)}
                    </span>
                  </td>
                  <td>{formatVolume(asset.volume)}</td>
                  <td className="markets__table-chart">
                    <Sparkline points={asset.history} tone={toneClass(asset.change24h)} />
                  </td>
                  <td>{asset.source.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Markets
