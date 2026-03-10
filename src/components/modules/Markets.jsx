// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Markets Module
// Leadership market context for budget, timing, and risk appetite
// ═══════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { useMarkets } from '../../hooks/useMarkets'
import './Markets.css'

const GROUP_LABELS = {
  stock: 'Equities',
  forex: 'FX',
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
  if (!value) return '—'
  return compactNumber.format(value)
}

function formatTimestamp(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function toneClass(change) {
  if (change > 0.05) return 'is-up'
  if (change < -0.05) return 'is-down'
  return 'is-flat'
}

function Sparkline({ points, tone = 'is-flat', detailed = false }) {
  if (!points || points.length < 2) {
    return <div className={`markets__sparkline markets__sparkline--empty ${detailed ? 'markets__sparkline--detail' : ''}`}>No trend yet</div>
  }

  const width = detailed ? 640 : 120
  const height = detailed ? 240 : 44
  const padding = detailed ? 18 : 4
  const values = points.map((point) => point.price)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const chartPoints = points.map((point, index) => {
    const x = padding + ((width - (padding * 2)) * index) / Math.max(points.length - 1, 1)
    const y = height - padding - (((point.price - min) / range) * (height - (padding * 2)))
    return { x, y, price: point.price, snapshotAt: point.snapshotAt }
  })

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
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="markets__sparkline-grid" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} className="markets__sparkline-grid" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="markets__sparkline-grid" />
        </>
      )}
      <polygon points={area} className={`markets__sparkline-area ${tone}`} />
      <polyline points={polyline} className={`markets__sparkline-line ${tone}`} />
      {detailed && chartPoints.map((point) => (
        <circle
          key={`${point.snapshotAt}-${point.price}`}
          cx={point.x}
          cy={point.y}
          r="3"
          className={`markets__sparkline-dot ${tone}`}
        >
          <title>{`${formatTimestamp(point.snapshotAt)} · $${point.price.toLocaleString('en-US')}`}</title>
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
      ? 'Risk appetite is constructive. Push faster campaign tests and outbound experiments while buyers are less defensive.'
      : 'Risk appetite is cautious. Favor retention, pipeline hygiene, and tighter CAC discipline before scaling spend.',
  )

  if (selectedAsset.assetType === 'forex') {
    insights.push(
      `${selectedAsset.displayName} is a margin signal. A stronger dollar can squeeze software, media, or contractor costs billed in USD.`,
    )
  } else if (selectedAsset.assetType === 'crypto') {
    insights.push(
      `${selectedAsset.displayName} is acting as a sentiment proxy. Strong upside usually lines up with higher founder optimism and looser experimentation.`,
    )
  } else {
    insights.push(
      `${selectedAsset.displayName} is a proxy for enterprise tech confidence. If leadership names weaken, expect longer buying cycles and stricter approvals.`,
    )
  }

  const mover = topMovers[0]
  if (mover) {
    insights.push(
      `${mover.displayName} is the fastest mover on the board at ${formatPercent(mover.change24h)}. Watch how narrative volatility changes decision speed in sales conversations.`,
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
  const feedBadgeClass = dataMode === 'live'
    ? 'badge-success'
    : dataMode === 'mixed'
      ? 'badge-warning'
      : runtimeConfigured
        ? 'badge-info'
        : 'badge-muted'
  const feedBadgeLabel = dataMode === 'live'
    ? 'live feed'
    : dataMode === 'mixed'
      ? 'mixed live'
      : runtimeConfigured
        ? 'syncing live'
        : 'demo feed'

  if (loading && assets.length === 0) {
    return <div className="markets markets--loading fade-in">Loading market feed...</div>
  }

  return (
    <div className="markets fade-in">
      <div className="module-header markets__header">
        <div>
          <h1>Markets</h1>
          <p>Leadership context for budget timing, buyer confidence, and macro-sensitive campaign decisions.</p>
        </div>
        <div className="markets__actions">
          <span className={`badge ${feedBadgeClass}`}>
            {feedBadgeLabel}
          </span>
          <button className="btn btn-primary" onClick={refresh} disabled={refreshing}>
            {refreshing ? 'Syncing…' : 'Sync Market Data'}
          </button>
        </div>
      </div>

      {refreshError && (
        <div className="markets__banner">
          <strong>Sync notice:</strong> {refreshError}
        </div>
      )}

      <section className="markets__stats">
        <article className="stat-card">
          <span className="stat-label">Tracked Assets</span>
          <strong className="stat-value">{summary.trackedCount}</strong>
          <span className="stat-change up">Cross-asset leadership watchlist</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Advancers / Decliners</span>
          <strong className="stat-value">{summary.advancers} / {summary.decliners}</strong>
          <span className={`stat-change ${summary.advancers >= summary.decliners ? 'up' : 'down'}`}>
            Breadth {summary.advancers >= summary.decliners ? 'supports' : 'pressures'} risk appetite
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Risk-On Score</span>
          <strong className="stat-value">{summary.riskOnScore}%</strong>
          <span className={`stat-change ${summary.riskOnScore >= 60 ? 'up' : 'down'}`}>
            {summary.riskOnScore >= 60 ? 'Campaign velocity can stay high' : 'Operate with tighter spend control'}
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-label">24H Volume</span>
          <strong className="stat-value">{formatVolume(summary.totalVolume)}</strong>
          <span className="stat-change up">Last sync {formatTimestamp(lastUpdated)}</span>
        </article>
      </section>

      <section className="markets__hero">
        <article className="card markets__focus">
          <div className="markets__focus-header">
            <div>
              <span className="markets__eyebrow">Market Focus</span>
              <h2>{selectedAsset?.displayName || 'No asset selected'}</h2>
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
                  <span className="markets__meta-label">Price</span>
                  <strong className="markets__price">
                    {selectedAsset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice(selectedAsset)}
                  </strong>
                </div>
                <div>
                  <span className="markets__meta-label">Session Range</span>
                  <strong className="markets__range">
                    {selectedAsset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice({ ...selectedAsset, price: selectedAsset.rangeLow })}
                    {' '}→{' '}
                    {selectedAsset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice({ ...selectedAsset, price: selectedAsset.rangeHigh })}
                  </strong>
                </div>
                <div>
                  <span className="markets__meta-label">Source</span>
                  <strong className="markets__range">{selectedAsset.source.replace('_', ' ')}</strong>
                </div>
              </div>

              <Sparkline points={selectedAsset.history} tone={toneClass(selectedAsset.change24h)} detailed />

              <div className="markets__focus-footer">
                <span className="badge badge-muted">{GROUP_LABELS[selectedAsset.assetType]}</span>
                <span className="badge badge-muted">{selectedAsset.baseCurrency}/{selectedAsset.quoteCurrency}</span>
                <span className="badge badge-muted">Volume {formatVolume(selectedAsset.volume)}</span>
                <span className="badge badge-muted">Updated {formatTimestamp(selectedAsset.snapshotAt)}</span>
              </div>
            </>
          )}
        </article>

        <article className="card markets__intel">
          <div className="markets__intel-header">
            <div>
              <span className="markets__eyebrow">Operating Read</span>
              <h2>What this means for the SaaS</h2>
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
            <span className="markets__eyebrow">Top Movers</span>
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
                <span className={toneClass(asset.change24h)}>{formatPercent(asset.change24h)}</span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="markets__groups">
        {Object.entries(groupedAssets).map(([group, entries]) => (
          <article key={group} className="card markets__group">
            <div className="markets__group-header">
              <div>
                <span className="markets__eyebrow">{GROUP_LABELS[group]}</span>
                <h2>{entries.length} assets</h2>
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
                    <strong>{asset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice(asset)}</strong>
                    <span className={toneClass(asset.change24h)}>{formatPercent(asset.change24h)}</span>
                  </div>
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="card markets__table-card">
        <div className="markets__table-header">
          <div>
            <span className="markets__eyebrow">Watchlist</span>
            <h2>Snapshot board</h2>
          </div>
          <span className="badge badge-muted">Last sync {formatTimestamp(lastUpdated)}</span>
        </div>

        <div className="markets__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Price</th>
                <th>24H</th>
                <th>Volume</th>
                <th>Trend</th>
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
                    >
                      <strong>{asset.symbol}</strong>
                      <span>{asset.displayName}</span>
                    </button>
                  </td>
                  <td>{GROUP_LABELS[asset.assetType]}</td>
                  <td>{asset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice(asset)}</td>
                  <td>
                    <span className={`markets__delta ${toneClass(asset.change24h)}`}>
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
