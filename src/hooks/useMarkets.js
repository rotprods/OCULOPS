// ═══════════════════════════════════════════════════
// ANTIGRAVITY OS — React Hook: useMarkets
// Live market snapshots with demo fallback and manual sync
// ═══════════════════════════════════════════════════

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useRealtime } from './useRealtime'
import { supabase } from '../lib/supabase'

const BASE = import.meta.env.VITE_SUPABASE_URL

const DEMO_WATCHLIST = [
  {
    symbol: 'AAPL',
    displayName: 'Apple',
    assetType: 'stock',
    source: 'demo',
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    volume: 51800000,
    marketCap: 3450000000000,
    decimals: 2,
    volatility: 1.6,
    prices: [225.1, 226.4, 227.2, 228.9, 229.4, 230.8, 231.2, 231.84],
  },
  {
    symbol: 'MSFT',
    displayName: 'Microsoft',
    assetType: 'stock',
    source: 'demo',
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    volume: 22500000,
    marketCap: 3120000000000,
    decimals: 2,
    volatility: 1.2,
    prices: [410.8, 411.3, 412.6, 413.7, 414.9, 415.6, 416.4, 417.42],
  },
  {
    symbol: 'NVDA',
    displayName: 'NVIDIA',
    assetType: 'stock',
    source: 'demo',
    baseCurrency: 'USD',
    quoteCurrency: 'USD',
    volume: 61200000,
    marketCap: 2810000000000,
    decimals: 2,
    volatility: 4.8,
    prices: [901.2, 908.5, 915.4, 921.8, 928.7, 934.1, 938.9, 942.33],
  },
  {
    symbol: 'EURUSD',
    displayName: 'EUR / USD',
    assetType: 'forex',
    source: 'demo',
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
    volume: null,
    marketCap: null,
    decimals: 4,
    volatility: 0.0018,
    prices: [1.0894, 1.0887, 1.0879, 1.0865, 1.0862, 1.0854, 1.0849, 1.0842],
  },
  {
    symbol: 'GBPUSD',
    displayName: 'GBP / USD',
    assetType: 'forex',
    source: 'demo',
    baseCurrency: 'GBP',
    quoteCurrency: 'USD',
    volume: null,
    marketCap: null,
    decimals: 4,
    volatility: 0.0016,
    prices: [1.2698, 1.2702, 1.2705, 1.2711, 1.2718, 1.2723, 1.2729, 1.2738],
  },
  {
    symbol: 'BTC',
    displayName: 'Bitcoin',
    assetType: 'crypto',
    source: 'demo',
    baseCurrency: 'BTC',
    quoteCurrency: 'USD',
    volume: 32500000000,
    marketCap: 1340000000000,
    decimals: 2,
    volatility: 420,
    prices: [66210, 66640, 66950, 67210, 67580, 67990, 68210, 68420.57],
  },
  {
    symbol: 'ETH',
    displayName: 'Ethereum',
    assetType: 'crypto',
    source: 'demo',
    baseCurrency: 'ETH',
    quoteCurrency: 'USD',
    volume: 17900000000,
    marketCap: 434000000000,
    decimals: 2,
    volatility: 34,
    prices: [3490, 3515, 3534, 3550, 3568, 3587, 3602, 3612.44],
  },
  {
    symbol: 'SOL',
    displayName: 'Solana',
    assetType: 'crypto',
    source: 'demo',
    baseCurrency: 'SOL',
    quoteCurrency: 'USD',
    volume: 2860000000,
    marketCap: 63200000000,
    decimals: 2,
    volatility: 2.4,
    prices: [132.8, 134.5, 136.1, 137.7, 139.4, 140.3, 141.5, 142.66],
  },
]

const GROUP_ORDER = ['stock', 'forex', 'crypto']

function round(value, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildDemoRows(revision = 0) {
  const now = Date.now()

  return DEMO_WATCHLIST.flatMap((asset, assetIndex) => {
    return asset.prices.map((basePrice, priceIndex) => {
      const oscillation = Math.sin((revision * 0.9) + assetIndex + (priceIndex * 0.6)) * asset.volatility
      const drift = (((revision % 5) - 2) * asset.volatility * 0.18)
      const price = round(basePrice + oscillation + drift, asset.decimals)
      const previous = priceIndex === 0 ? asset.prices[0] : asset.prices[priceIndex - 1]
      const change24h = previous
        ? round(((price - previous) / previous) * 100, 4)
        : 0

      return {
        symbol: asset.symbol,
        display_name: asset.displayName,
        asset_type: asset.assetType,
        source: asset.source,
        base_currency: asset.baseCurrency,
        quote_currency: asset.quoteCurrency,
        price,
        change_24h: change24h,
        volume: asset.volume,
        market_cap: asset.marketCap,
        snapshot_at: new Date(now - ((asset.prices.length - 1 - priceIndex) * 4 * 60 * 60 * 1000)).toISOString(),
        metadata: { demo: true },
      }
    })
  })
}

function normalizeMarketRow(row) {
  return {
    symbol: row.symbol,
    displayName: row.display_name || row.displayName || row.symbol,
    assetType: row.asset_type || row.assetType || 'stock',
    source: row.source || 'unknown',
    baseCurrency: row.base_currency || row.baseCurrency || 'USD',
    quoteCurrency: row.quote_currency || row.quoteCurrency || 'USD',
    price: toNumber(row.price) ?? 0,
    change24h: toNumber(row.change_24h ?? row.change24h) ?? 0,
    volume: toNumber(row.volume),
    marketCap: toNumber(row.market_cap ?? row.marketCap),
    snapshotAt: row.snapshot_at || row.snapshotAt || row.created_at || new Date().toISOString(),
    metadata: typeof row.metadata === 'object' && row.metadata !== null ? row.metadata : {},
  }
}

function deriveMarketState(rows) {
  const sortedRows = [...rows].sort((a, b) => new Date(a.snapshotAt) - new Date(b.snapshotAt))
  const seriesBySymbol = new Map()

  sortedRows.forEach((row) => {
    if (!seriesBySymbol.has(row.symbol)) {
      seriesBySymbol.set(row.symbol, [])
    }
    seriesBySymbol.get(row.symbol).push(row)
  })

  const assets = Array.from(seriesBySymbol.entries()).map(([symbol, series]) => {
    const recentSeries = series.slice(-8)
    const latest = recentSeries[recentSeries.length - 1]
    const first = recentSeries[0] || latest
    const previous = recentSeries[recentSeries.length - 2] || first
    const intervalChange = previous?.price
      ? ((latest.price - previous.price) / previous.price) * 100
      : latest.change24h

    return {
      ...latest,
      symbol,
      history: recentSeries.map((point) => ({
        price: point.price,
        snapshotAt: point.snapshotAt,
      })),
      intervalChange,
      rangeLow: Math.min(...recentSeries.map((point) => point.price)),
      rangeHigh: Math.max(...recentSeries.map((point) => point.price)),
    }
  })
    .sort((a, b) => {
      const groupWeight = GROUP_ORDER.indexOf(a.assetType) - GROUP_ORDER.indexOf(b.assetType)
      if (groupWeight !== 0) return groupWeight
      return a.symbol.localeCompare(b.symbol)
    })

  const groupedAssets = GROUP_ORDER.reduce((groups, key) => {
    groups[key] = assets.filter((asset) => asset.assetType === key)
    return groups
  }, {})

  const advancers = assets.filter((asset) => asset.change24h > 0).length
  const decliners = assets.filter((asset) => asset.change24h < 0).length
  const riskAssets = assets.filter((asset) => asset.assetType !== 'forex')
  const riskOnScore = riskAssets.length
    ? Math.round((riskAssets.filter((asset) => asset.change24h > 0).length / riskAssets.length) * 100)
    : 0
  const totalVolume = assets.reduce((sum, asset) => sum + (asset.volume || 0), 0)
  const topMover = [...assets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0] || null
  const lastUpdated = assets.reduce((latest, asset) => {
    return !latest || new Date(asset.snapshotAt) > new Date(latest) ? asset.snapshotAt : latest
  }, null)

  return {
    assets,
    groupedAssets,
    topMovers: [...assets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 3),
    lastUpdated,
    summary: {
      trackedCount: assets.length,
      advancers,
      decliners,
      riskOnScore,
      totalVolume,
      topMover,
    },
  }
}

export function useMarkets() {
  const { data, loading: realtimeLoading, error: realtimeError, refetch } = useRealtime('market_snapshots', {
    orderBy: 'snapshot_at',
    ascending: false,
    limit: 320,
  })
  const [demoRevision, setDemoRevision] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState(null)
  const bootstrappedRef = useRef(false)

  const liveRows = useMemo(() => (data || []).map(normalizeMarketRow), [data])
  const demoRows = useMemo(
    () => buildDemoRows(demoRevision).map(normalizeMarketRow),
    [demoRevision],
  )

  const usingStoredRows = liveRows.length > 0
  const derived = useMemo(
    () => deriveMarketState(usingStoredRows ? liveRows : demoRows),
    [usingStoredRows, liveRows, demoRows],
  )

  const storedRowsAreDemo = usingStoredRows
    && derived.assets.length > 0
    && derived.assets.every((asset) => asset.metadata?.demo)
  const storedRowsHaveDemo = usingStoredRows
    && derived.assets.some((asset) => asset.metadata?.demo)
  const storedRowsHaveLive = usingStoredRows
    && derived.assets.some((asset) => !asset.metadata?.demo)

  const dataMode = !usingStoredRows
    ? 'demo'
    : storedRowsHaveLive && storedRowsHaveDemo
      ? 'mixed'
      : storedRowsAreDemo
        ? 'demo'
        : 'live'

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setRefreshError(null)

    if (!supabase || !BASE) {
      setDemoRevision((revision) => revision + 1)
      setRefreshing(false)
      return { mode: 'demo-local' }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        if (!usingStoredRows) {
          setDemoRevision((revision) => revision + 1)
        }
        return { mode: usingStoredRows ? 'stored' : 'demo-local' }
      }

      const response = await fetch(`${BASE}/functions/v1/market-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ persist: true }),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => `HTTP ${response.status}`)
        throw new Error(message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      await refetch()
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sync market data'
      setRefreshError(message)
      if (!usingStoredRows) {
        setDemoRevision((revision) => revision + 1)
      }
      return { error: message }
    } finally {
      setRefreshing(false)
    }
  }, [refetch, usingStoredRows])

  useEffect(() => {
    if (!BASE || !supabase || refreshing || realtimeLoading || bootstrappedRef.current) return
    if (dataMode !== 'live') {
      bootstrappedRef.current = true
      refresh()
    }
  }, [dataMode, realtimeLoading, refresh, refreshing])

  return {
    ...derived,
    loading: realtimeLoading && usingStoredRows,
    error: refreshError || realtimeError,
    refreshError,
    refreshing,
    refresh,
    dataMode,
    hasLiveData: storedRowsHaveLive,
    runtimeConfigured: Boolean(supabase && BASE),
  }
}
