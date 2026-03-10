// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — Markets Module
// 100-Year UX: Leadership telemetry and macro indices
// ═══════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { useMarkets } from '../../hooks/useMarkets'
import './Markets.css'

const GROUP_LABELS = {
  stock: 'EQUITIES',
  forex: 'FX [USD BASE]',
  crypto: 'CRYPTO PROTOCOLS',
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
    return <div className={`markets__sparkline markets__sparkline--empty ${detailed ? 'markets__sparkline--detail' : ''}`}>[ INSUFFICIENT DATA ]</div>
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
      ? 'RISK APPETITE IS CONSTRUCTIVE. INITIATE CAMPAIGN EXPERIMENTS WHILE MACRO DEFENSIVENESS IS LOW.'
      : 'RISK APPETITE IS CAUTIOUS. FAVOR RETENTION, HYGIENE, AND TIGHT CAC DISCIPLINE.',
  )

  if (selectedAsset.assetType === 'forex') {
    insights.push(
      `${selectedAsset.displayName.toUpperCase()} IS A MARGIN SIGNAL. A STRONGER DOLLAR PRESSURES SOFTWARE/MEDIA ACQUISITION.`,
    )
  } else if (selectedAsset.assetType === 'crypto') {
    insights.push(
      `${selectedAsset.displayName.toUpperCase()} ACTS AS A SENTIMENT PROXY. CORRELATES WITH AGGRESSIVE R&D SPEND.`,
    )
  } else {
    insights.push(
      `${selectedAsset.displayName.toUpperCase()} IS A PROXY FOR ENTERPRISE TECH CONFIDENCE. LONG BUYING CYCLES EXPECTED IF WEAK.`,
    )
  }

  const mover = topMovers[0]
  if (mover) {
    insights.push(
      `${mover.displayName.toUpperCase()} IS FASTEST MOVER AT ${formatPercent(mover.change24h)}. MONITOR SPILLOVER EFFECTS INTO VENDOR BUDGETS.`,
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
    ? '[ LIVE SYNC ]'
    : dataMode === 'mixed'
      ? '[ MIXED FEED ]'
      : runtimeConfigured
        ? '[ SECURING SYNC ]'
        : '[ SIMULATED FEED ]'

  if (loading && assets.length === 0) {
    return <div className="markets markets--loading fade-in">/// ESTABLISHING FINANCIAL DATA LINK...</div>
  }

  return (
    <div className="markets fade-in">
      <div className="markets__header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-editorial)', color: 'var(--color-primary)', letterSpacing: '0.05em', fontSize: '28px', margin: 0 }}>MACRO TELEMETRY</h1>
          <p className="mono text-xs text-tertiary" style={{ marginTop: '8px' }}>LEADERSHIP CONTEXT FOR MACRO-SENSITIVE CAMPAIGN DECISIONS.</p>
        </div>
        <div className="markets__actions">
          <span className="mono text-xs" style={{ padding: '8px 12px', border: '1px solid var(--border-subtle)', color: 'var(--color-primary)' }}>
            {feedBadgeLabel}
          </span>
          <button className="btn btn-primary mono" style={{ padding: '8px 16px', fontSize: '11px', letterSpacing: '0.05em' }} onClick={refresh} disabled={refreshing}>
            {refreshing ? '[ SYNCING ]' : 'INITIATE SYNC'}
          </button>
        </div>
      </div>

      {refreshError && (
        <div className="markets__banner">
          <strong style={{ color: 'var(--color-warning)' }}>ERR:</strong> {refreshError.toUpperCase()}
        </div>
      )}

      <section className="markets__stats">
        <article style={{ padding: '16px', background: '#000' }}>
          <span className="mono text-2xs text-tertiary" style={{ display: 'block', marginBottom: '8px' }}>TRACKED ASSETS</span>
          <strong className="mono" style={{ display: 'block', fontSize: '24px', color: 'var(--color-primary)' }}>{summary.trackedCount}</strong>
          <span className="mono text-2xs" style={{ color: 'var(--color-success)', marginTop: '8px', display: 'block' }}>CROSS-ASSET WATCHLIST</span>
        </article>
        <article style={{ padding: '16px', background: '#000' }}>
          <span className="mono text-2xs text-tertiary" style={{ display: 'block', marginBottom: '8px' }}>A/D LINE</span>
          <strong className="mono" style={{ display: 'block', fontSize: '24px', color: 'var(--color-primary)' }}>{summary.advancers} / {summary.decliners}</strong>
          <span className="mono text-2xs" style={{ color: summary.advancers >= summary.decliners ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '8px', display: 'block' }}>
            BREADTH {summary.advancers >= summary.decliners ? 'SUPPORTS' : 'PRESSURES'} RISK
          </span>
        </article>
        <article style={{ padding: '16px', background: '#000' }}>
          <span className="mono text-2xs text-tertiary" style={{ display: 'block', marginBottom: '8px' }}>RISK-ON CONFIG</span>
          <strong className="mono" style={{ display: 'block', fontSize: '24px', color: 'var(--color-primary)' }}>{summary.riskOnScore}%</strong>
          <span className="mono text-2xs" style={{ color: summary.riskOnScore >= 60 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '8px', display: 'block' }}>
            {summary.riskOnScore >= 60 ? 'VELOCITY APPROVED' : 'TIGHTEN SPEND LOGIC'}
          </span>
        </article>
        <article style={{ padding: '16px', background: '#000' }}>
          <span className="mono text-2xs text-tertiary" style={{ display: 'block', marginBottom: '8px' }}>24H EXCHANGE VOL</span>
          <strong className="mono" style={{ display: 'block', fontSize: '24px', color: 'var(--color-primary)' }}>{formatVolume(summary.totalVolume)}</strong>
          <span className="mono text-2xs" style={{ color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>SYNC: {formatTimestamp(lastUpdated)}</span>
        </article>
      </section>

      <section className="markets__hero">
        <article className="markets__focus">
          <div className="markets__focus-header">
            <div>
              <span className="markets__eyebrow">/// PRIMARY TARGET</span>
              <h2>{selectedAsset?.displayName.toUpperCase() || 'NO TARGET ASSIGNED'}</h2>
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
                  <span className="markets__meta-label">LAST BLOCK PRICE</span>
                  <strong className="markets__price">
                    {selectedAsset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice(selectedAsset)}
                  </strong>
                </div>
                <div>
                  <span className="markets__meta-label">SESSION VARIANCE</span>
                  <strong className="markets__range">
                    {selectedAsset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice({ ...selectedAsset, price: selectedAsset.rangeLow })}
                    {' '}➔{' '}
                    {selectedAsset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice({ ...selectedAsset, price: selectedAsset.rangeHigh })}
                  </strong>
                </div>
                <div>
                  <span className="markets__meta-label">DATA UPLINK</span>
                  <strong className="markets__range" style={{ textTransform: 'uppercase' }}>{selectedAsset.source.replace('_', ' ')}</strong>
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
              <span className="markets__eyebrow">/// MACHINE ANALYSIS</span>
              <h2>STRATEGIC IMPLICATIONS</h2>
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
            <span className="markets__eyebrow" style={{ padding: '0 0 8px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>/// HIGHEST VOLATILITY</span>
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
                <span className="markets__eyebrow">/// {GROUP_LABELS[group]}</span>
                <h2>{entries.length} LOGGED</h2>
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
                    <strong style={{ color: 'var(--color-text)' }}>{asset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice(asset)}</strong>
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
            <span className="markets__eyebrow">/// FULL RADAR SUMMARY</span>
            <h2>MARKET SNAPSHOT</h2>
          </div>
          <span className="mono text-xs text-secondary">[ T:{formatTimestamp(lastUpdated)} ]</span>
        </div>

        <div className="markets__table-wrap">
          <table>
            <thead>
              <tr>
                <th>ASSET / TICKER</th>
                <th>CLASS</th>
                <th>LATEST QUOTE</th>
                <th>DELTA (24H)</th>
                <th>24H VOL</th>
                <th>TRAJECTORY</th>
                <th>UPLINK SOURCE</th>
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
                      <strong style={{ color: 'var(--color-primary)' }}>{asset.symbol}</strong>
                      <span>{asset.displayName}</span>
                    </button>
                  </td>
                  <td>{GROUP_LABELS[asset.assetType]}</td>
                  <td style={{ color: 'var(--color-text)' }}>{asset.quoteCurrency === 'USD' ? '$' : ''}{formatPrice(asset)}</td>
                  <td>
                    <span className={`markets__delta ${toneClass(asset.change24h)}`} style={{ background: 'transparent', padding: 0 }}>
                      {formatPercent(asset.change24h)}
                    </span>
                  </td>
                  <td>{formatVolume(asset.volume)}</td>
                  <td className="markets__table-chart">
                    <Sparkline points={asset.history} tone={toneClass(asset.change24h)} />
                  </td>
                  <td style={{ textTransform: 'uppercase' }}>{asset.source.replace('_', ' ')}</td>
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
