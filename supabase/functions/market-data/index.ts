// ═══════════════════════════════════════════════════
// Edge Function: Market Data
// Syncs a compact leadership watchlist from Alpha Vantage + CoinGecko
// ═══════════════════════════════════════════════════

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type AssetType = "stock" | "forex" | "crypto";

type MarketSnapshot = {
    symbol: string;
    display_name: string;
    asset_type: AssetType;
    source: string;
    base_currency: string;
    quote_currency: string;
    price: number;
    change_24h: number | null;
    volume: number | null;
    market_cap: number | null;
    snapshot_at: string;
    metadata: Record<string, unknown>;
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ALPHA_VANTAGE_KEY = Deno.env.get("ALPHA_VANTAGE_KEY") || Deno.env.get("ALPHAVANTAGE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

const STOCK_WATCHLIST = [
    { symbol: "AAPL", displayName: "Apple", marketCap: 3450000000000 },
    { symbol: "MSFT", displayName: "Microsoft", marketCap: 3120000000000 },
    { symbol: "NVDA", displayName: "NVIDIA", marketCap: 2810000000000 },
] as const;

const FOREX_WATCHLIST = [
    { symbol: "EURUSD", displayName: "EUR / USD", from: "EUR", to: "USD" },
    { symbol: "GBPUSD", displayName: "GBP / USD", from: "GBP", to: "USD" },
] as const;

const CRYPTO_WATCHLIST = [
    { id: "bitcoin", symbol: "BTC", displayName: "Bitcoin" },
    { id: "ethereum", symbol: "ETH", displayName: "Ethereum" },
    { id: "solana", symbol: "SOL", displayName: "Solana" },
] as const;

function toNumber(value: unknown): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const parsed = Number.parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
}

function round(value: number, precision = 4): number {
    const power = 10 ** precision;
    return Math.round(value * power) / power;
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(
        JSON.stringify(body),
        {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
    );
}

async function verifyCaller(req: Request) {
    const authHeader = req.headers.get("Authorization");

    if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
        return { type: "cron" as const };
    }

    if (!authHeader || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return null;
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) return null;

    return { type: "user" as const, userId: user.id };
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return await response.json() as T;
}

async function fetchStocks(snapshotAt: string): Promise<MarketSnapshot[]> {
    if (!ALPHA_VANTAGE_KEY) return [];

    const snapshots: MarketSnapshot[] = [];

    for (const stock of STOCK_WATCHLIST) {
        const url = new URL("https://www.alphavantage.co/query");
        url.searchParams.set("function", "GLOBAL_QUOTE");
        url.searchParams.set("symbol", stock.symbol);
        url.searchParams.set("apikey", ALPHA_VANTAGE_KEY);

        const data = await fetchJson<Record<string, Record<string, string>>>(url.toString());
        const quote = data["Global Quote"];
        if (!quote) continue;

        const price = toNumber(quote["05. price"]);
        if (price === null) continue;

        snapshots.push({
            symbol: stock.symbol,
            display_name: stock.displayName,
            asset_type: "stock",
            source: "alpha_vantage",
            base_currency: "USD",
            quote_currency: "USD",
            price: round(price, 2),
            change_24h: toNumber(quote["10. change percent"]),
            volume: toNumber(quote["06. volume"]),
            market_cap: stock.marketCap,
            snapshot_at: snapshotAt,
            metadata: {
                previous_close: toNumber(quote["08. previous close"]),
                latest_trading_day: quote["07. latest trading day"] ?? null,
            },
        });
    }

    return snapshots;
}

async function fetchForex(snapshotAt: string): Promise<MarketSnapshot[]> {
    if (!ALPHA_VANTAGE_KEY) return [];

    const snapshots: MarketSnapshot[] = [];

    for (const pair of FOREX_WATCHLIST) {
        const url = new URL("https://www.alphavantage.co/query");
        url.searchParams.set("function", "FX_DAILY");
        url.searchParams.set("from_symbol", pair.from);
        url.searchParams.set("to_symbol", pair.to);
        url.searchParams.set("outputsize", "compact");
        url.searchParams.set("apikey", ALPHA_VANTAGE_KEY);

        const data = await fetchJson<Record<string, Record<string, Record<string, string>>>>(url.toString());
        const series = data["Time Series FX (Daily)"];
        if (!series) continue;

        const dates = Object.keys(series).sort();
        const latest = series[dates.at(-1) ?? ""];
        const previous = series[dates.at(-2) ?? ""];
        const price = toNumber(latest?.["4. close"]);
        const previousClose = toNumber(previous?.["4. close"]);

        if (price === null) continue;

        const change24h = previousClose && previousClose !== 0
            ? ((price - previousClose) / previousClose) * 100
            : null;

        snapshots.push({
            symbol: pair.symbol,
            display_name: pair.displayName,
            asset_type: "forex",
            source: "alpha_vantage",
            base_currency: pair.from,
            quote_currency: pair.to,
            price: round(price, 4),
            change_24h: change24h === null ? null : round(change24h, 4),
            volume: null,
            market_cap: null,
            snapshot_at: snapshotAt,
            metadata: {
                latest_trading_day: dates.at(-1) ?? null,
                previous_close: previousClose,
            },
        });
    }

    return snapshots;
}

async function fetchCrypto(snapshotAt: string): Promise<MarketSnapshot[]> {
    const url = new URL("https://api.coingecko.com/api/v3/simple/price");
    url.searchParams.set("ids", CRYPTO_WATCHLIST.map((asset) => asset.id).join(","));
    url.searchParams.set("vs_currencies", "usd");
    url.searchParams.set("include_24hr_change", "true");
    url.searchParams.set("include_24hr_vol", "true");
    url.searchParams.set("include_market_cap", "true");

    const data = await fetchJson<Record<string, Record<string, number>>>(url.toString());

    return CRYPTO_WATCHLIST.flatMap((asset) => {
        const row = data[asset.id];
        const price = toNumber(row?.usd);
        if (price === null) return [];

        return [{
            symbol: asset.symbol,
            display_name: asset.displayName,
            asset_type: "crypto" as const,
            source: "coingecko",
            base_currency: asset.symbol,
            quote_currency: "USD",
            price: round(price, price >= 1000 ? 2 : 4),
            change_24h: toNumber(row?.usd_24h_change),
            volume: toNumber(row?.usd_24h_vol),
            market_cap: toNumber(row?.usd_market_cap),
            snapshot_at: snapshotAt,
            metadata: { id: asset.id },
        }];
    });
}

function buildDemoSnapshots(snapshotAt: string): MarketSnapshot[] {
    return [
        {
            symbol: "AAPL",
            display_name: "Apple",
            asset_type: "stock",
            source: "demo",
            base_currency: "USD",
            quote_currency: "USD",
            price: 231.84,
            change_24h: 1.62,
            volume: 51800000,
            market_cap: 3450000000000,
            snapshot_at: snapshotAt,
            metadata: { demo: true },
        },
        {
            symbol: "MSFT",
            display_name: "Microsoft",
            asset_type: "stock",
            source: "demo",
            base_currency: "USD",
            quote_currency: "USD",
            price: 417.42,
            change_24h: 0.94,
            volume: 22500000,
            market_cap: 3120000000000,
            snapshot_at: snapshotAt,
            metadata: { demo: true },
        },
        {
            symbol: "NVDA",
            display_name: "NVIDIA",
            asset_type: "stock",
            source: "demo",
            base_currency: "USD",
            quote_currency: "USD",
            price: 942.33,
            change_24h: 3.78,
            volume: 61200000,
            market_cap: 2810000000000,
            snapshot_at: snapshotAt,
            metadata: { demo: true },
        },
        {
            symbol: "EURUSD",
            display_name: "EUR / USD",
            asset_type: "forex",
            source: "demo",
            base_currency: "EUR",
            quote_currency: "USD",
            price: 1.0842,
            change_24h: -0.21,
            volume: null,
            market_cap: null,
            snapshot_at: snapshotAt,
            metadata: { demo: true },
        },
        {
            symbol: "GBPUSD",
            display_name: "GBP / USD",
            asset_type: "forex",
            source: "demo",
            base_currency: "GBP",
            quote_currency: "USD",
            price: 1.2738,
            change_24h: 0.15,
            volume: null,
            market_cap: null,
            snapshot_at: snapshotAt,
            metadata: { demo: true },
        },
        {
            symbol: "BTC",
            display_name: "Bitcoin",
            asset_type: "crypto",
            source: "demo",
            base_currency: "BTC",
            quote_currency: "USD",
            price: 68420.57,
            change_24h: 2.41,
            volume: 32500000000,
            market_cap: 1340000000000,
            snapshot_at: snapshotAt,
            metadata: { demo: true, id: "bitcoin" },
        },
        {
            symbol: "ETH",
            display_name: "Ethereum",
            asset_type: "crypto",
            source: "demo",
            base_currency: "ETH",
            quote_currency: "USD",
            price: 3612.44,
            change_24h: 1.87,
            volume: 17900000000,
            market_cap: 434000000000,
            snapshot_at: snapshotAt,
            metadata: { demo: true, id: "ethereum" },
        },
        {
            symbol: "SOL",
            display_name: "Solana",
            asset_type: "crypto",
            source: "demo",
            base_currency: "SOL",
            quote_currency: "USD",
            price: 142.66,
            change_24h: 4.12,
            volume: 2860000000,
            market_cap: 63200000000,
            snapshot_at: snapshotAt,
            metadata: { demo: true, id: "solana" },
        },
    ];
}

function mergeWithFallback(liveSnapshots: MarketSnapshot[], snapshotAt: string) {
    const fallback = buildDemoSnapshots(snapshotAt);
    const liveSymbols = new Set(liveSnapshots.map((snapshot) => snapshot.symbol));
    const missingFallback = fallback.filter((snapshot) => !liveSymbols.has(snapshot.symbol));

    const snapshots = [...liveSnapshots, ...missingFallback];
    const liveCount = liveSnapshots.length;

    return {
        mode: liveCount === 0 ? "demo" : liveCount === fallback.length ? "live" : "mixed",
        snapshots,
    };
}

async function collectSnapshots(snapshotAt: string) {
    const warnings: string[] = [];
    const liveSnapshots: MarketSnapshot[] = [];

    if (!ALPHA_VANTAGE_KEY) {
        warnings.push("ALPHA_VANTAGE_KEY is not configured; using demo coverage for stocks and forex.");
    } else {
        try {
            const stockSnapshots = await fetchStocks(snapshotAt);
            const forexSnapshots = await fetchForex(snapshotAt);
            liveSnapshots.push(...stockSnapshots);
            liveSnapshots.push(...forexSnapshots);

            if (stockSnapshots.length === 0 && forexSnapshots.length === 0) {
                warnings.push("Alpha Vantage returned no stock or forex coverage; demo fallback is being used.");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            warnings.push(`Alpha Vantage sync failed: ${message}`);
        }
    }

    try {
        liveSnapshots.push(...await fetchCrypto(snapshotAt));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`CoinGecko sync failed: ${message}`);
    }

    const { mode, snapshots } = mergeWithFallback(liveSnapshots, snapshotAt);
    return { mode, snapshots, warnings };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const caller = await verifyCaller(req);
    if (!caller) {
        return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let persist = true;
    try {
        const body = await req.json();
        if (typeof body?.persist === "boolean") {
            persist = body.persist;
        }
    } catch {
        // Empty request body is fine.
    }

    try {
        const snapshotAt = new Date().toISOString();
        const { mode, snapshots, warnings } = await collectSnapshots(snapshotAt);

        let persisted = false;
        let persistenceError: string | null = null;

        if (persist) {
            if (!admin) {
                persistenceError = "Supabase service role is not configured.";
            } else {
                const { error } = await admin.from("market_snapshots").insert(snapshots);
                if (error) {
                    persistenceError = error.message;
                } else {
                    persisted = true;
                }
            }
        }

        return jsonResponse({
            mode,
            persisted,
            warnings,
            persistence_error: persistenceError,
            snapshot_at: snapshotAt,
            count: snapshots.length,
            snapshots,
        });
    } catch (error) {
        console.error("[market-data] error:", error);
        const message = error instanceof Error ? error.message : "Internal server error";
        return jsonResponse({ error: message }, 500);
    }
});
