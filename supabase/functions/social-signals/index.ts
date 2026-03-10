// ═══════════════════════════════════════════════════
// Edge Function: Social Signals
// Collects fast-moving demand signals from Reddit + Hacker News
// ═══════════════════════════════════════════════════

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Platform = "reddit" | "hackernews" | "demo";

type SocialSignal = {
    platform: Platform;
    external_id: string;
    topic: string;
    title: string;
    body_excerpt: string | null;
    author: string | null;
    permalink: string | null;
    published_at: string;
    engagement: number;
    comment_count: number;
    sentiment_score: number;
    velocity_score: number;
    opportunity_score: number;
    metadata: Record<string, unknown>;
    updated_at: string;
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const REDDIT_CLIENT_ID = Deno.env.get("REDDIT_CLIENT_ID");
const REDDIT_CLIENT_SECRET = Deno.env.get("REDDIT_CLIENT_SECRET");
const REDDIT_USER_AGENT = Deno.env.get("REDDIT_USER_AGENT") || "OCULOPS-OS/1.0 social-signals";
const APIFY_TOKEN = Deno.env.get("APIFY_TOKEN");
const APIFY_REDDIT_ACTOR_ID = Deno.env.get("APIFY_REDDIT_ACTOR_ID") || "trudax/reddit-scraper";

const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

const TOPICS = [
    { label: "AI marketing", query: "ai marketing", subreddit: "marketing" },
    { label: "SEO demand", query: "seo client", subreddit: "SEO" },
    { label: "Lead generation", query: "lead generation", subreddit: "sales" },
    { label: "Marketing automation", query: "marketing automation", subreddit: "smallbusiness" },
    { label: "Customer acquisition", query: "customer acquisition", subreddit: "Entrepreneur" },
] as const;

const POSITIVE_TERMS = [
    "growth",
    "growing",
    "demand",
    "won",
    "profitable",
    "pipeline",
    "scale",
    "scaled",
    "roi",
    "revenue",
    "traction",
    "hiring",
    "launch",
    "launched",
];

const NEGATIVE_TERMS = [
    "stalled",
    "decline",
    "down",
    "churn",
    "lost",
    "panic",
    "struggling",
    "problem",
    "issues",
    "dead",
    "worse",
    "layoff",
    "budget cut",
];

const OPPORTUNITY_TERMS = [
    "need",
    "looking for",
    "recommend",
    "agency",
    "help",
    "outsource",
    "tool",
    "service",
    "automation",
    "seo",
    "ads",
    "growth",
    "lead gen",
    "marketing",
];

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function round(value: number) {
    return Math.round(value);
}

function hoursSince(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    return Math.max(diff / 3_600_000, 0.5);
}

function scoreSentiment(text: string) {
    const haystack = text.toLowerCase();
    let score = 0;

    for (const term of POSITIVE_TERMS) {
        if (haystack.includes(term)) score += 1;
    }

    for (const term of NEGATIVE_TERMS) {
        if (haystack.includes(term)) score -= 1;
    }

    return clamp(score * 14, -100, 100);
}

function scoreOpportunity(text: string, engagement: number, commentCount: number, publishedAt: string) {
    const haystack = text.toLowerCase();
    const termHits = OPPORTUNITY_TERMS.filter((term) => haystack.includes(term)).length;
    const freshnessBoost = clamp(28 - hoursSince(publishedAt), 0, 28);
    const engagementBoost = clamp(Math.log10(engagement + 1) * 22, 0, 40);
    const discussionBoost = clamp(commentCount * 2, 0, 20);
    return clamp(round((termHits * 7) + freshnessBoost + engagementBoost + discussionBoost), 0, 100);
}

function scoreVelocity(engagement: number, publishedAt: string) {
    return clamp(round((engagement / hoursSince(publishedAt)) * 3.5), 0, 100);
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

async function fetchJson<T>(url: string, headers: HeadersInit = {}): Promise<T> {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return await response.json() as T;
}

async function getRedditAccessToken() {
    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) {
        return null;
    }

    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": REDDIT_USER_AGENT,
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} from https://www.reddit.com/api/v1/access_token`);
    }

    const payload = await response.json() as { access_token?: string };
    if (!payload.access_token) {
        throw new Error("Reddit access token missing in OAuth response");
    }

    return payload.access_token;
}

async function fetchApifyRedditSignals(topic: typeof TOPICS[number], collectedAt: string): Promise<SocialSignal[]> {
    if (!APIFY_TOKEN) return [];

    const url = new URL(`https://api.apify.com/v2/acts/${APIFY_REDDIT_ACTOR_ID.replace("/", "~")}/run-sync-get-dataset-items`);
    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${APIFY_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            maxItems: 4,
            maxPostCount: 4,
            maxComments: 0,
            searches: [topic.query],
            searchCommunityName: topic.subreddit,
            searchPosts: true,
            searchComments: false,
            searchCommunities: false,
            searchUsers: false,
            sort: "new",
            time: "week",
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} from Apify Reddit actor`);
    }

    const items = await response.json() as Array<Record<string, unknown>>;
    return items
        .filter((item) => item.dataType === "post" && typeof item.title === "string")
        .slice(0, 4)
        .map((item) => {
            const title = String(item.title ?? "");
            const body = String(item.body ?? "").slice(0, 280) || null;
            const publishedAt = typeof item.createdAt === "string" ? item.createdAt : collectedAt;
            const score = Number(item.upVotes) || 0;
            const comments = Number(item.numberOfComments) || 0;
            const text = [title, body ?? ""].join(" ");

            return {
                platform: "reddit" as const,
                external_id: String(item.parsedId ?? item.id ?? crypto.randomUUID()),
                topic: topic.label,
                title,
                body_excerpt: body,
                author: typeof item.username === "string" ? item.username : null,
                permalink: typeof item.url === "string" ? item.url : null,
                published_at: publishedAt,
                engagement: score + comments,
                comment_count: comments,
                sentiment_score: scoreSentiment(text),
                velocity_score: scoreVelocity(score + comments, publishedAt),
                opportunity_score: scoreOpportunity(text, score + comments, comments, publishedAt),
                metadata: {
                    subreddit: topic.subreddit,
                    score,
                    source: "apify",
                    collected_at: collectedAt,
                },
                updated_at: collectedAt,
            };
        });
}

async function fetchRedditSignals(collectedAt: string): Promise<SocialSignal[]> {
    let redditBaseUrl = "https://old.reddit.com";
    let redditHeaders: HeadersInit = { "User-Agent": REDDIT_USER_AGENT };

    try {
        const accessToken = await getRedditAccessToken();
        if (accessToken) {
            redditBaseUrl = "https://oauth.reddit.com";
            redditHeaders = {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": REDDIT_USER_AGENT,
            };
        }
    } catch {
        // Fall back to old.reddit.com JSON when the configured OAuth app is invalid or blocked.
    }

    const signals: SocialSignal[] = [];

    for (const topic of TOPICS) {
        const url = new URL(`${redditBaseUrl}/r/${topic.subreddit}/search.json`);
        url.searchParams.set("q", topic.query);
        url.searchParams.set("restrict_sr", "1");
        url.searchParams.set("sort", "new");
        url.searchParams.set("t", "week");
        url.searchParams.set("limit", "4");
        url.searchParams.set("raw_json", "1");

        const payload = await fetchJson<{
            data?: {
                children?: Array<{
                    data?: Record<string, unknown>;
                }>;
            };
        }>(
            url.toString(),
            redditHeaders,
        );

        for (const child of payload.data?.children ?? []) {
            const post = child.data ?? {};
            const title = String(post.title ?? "");
            if (!title) continue;

            const body = String(post.selftext ?? "").slice(0, 280) || null;
            const publishedAt = new Date((Number(post.created_utc) || 0) * 1000).toISOString();
            const score = Number(post.score) || 0;
            const comments = Number(post.num_comments) || 0;
            const text = [title, body ?? ""].join(" ");

            signals.push({
                platform: "reddit",
                external_id: String(post.id ?? crypto.randomUUID()),
                topic: topic.label,
                title,
                body_excerpt: body,
                author: typeof post.author === "string" ? post.author : null,
                permalink: typeof post.permalink === "string" ? `https://www.reddit.com${post.permalink}` : null,
                published_at: publishedAt,
                engagement: score + comments,
                comment_count: comments,
                sentiment_score: scoreSentiment(text),
                velocity_score: scoreVelocity(score + comments, publishedAt),
                opportunity_score: scoreOpportunity(text, score + comments, comments, publishedAt),
                metadata: {
                    subreddit: topic.subreddit,
                    score,
                    upvote_ratio: Number(post.upvote_ratio) || null,
                    collected_at: collectedAt,
                },
                updated_at: collectedAt,
            });
        }
    }

    if (signals.length === 0 && APIFY_TOKEN) {
        for (const topic of TOPICS) {
            signals.push(...await fetchApifyRedditSignals(topic, collectedAt));
        }
    }

    return signals;
}

async function fetchHackerNewsSignals(collectedAt: string): Promise<SocialSignal[]> {
    const signals: SocialSignal[] = [];

    for (const topic of TOPICS) {
        const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
        url.searchParams.set("query", topic.query);
        url.searchParams.set("tags", "story");
        url.searchParams.set("hitsPerPage", "4");

        const payload = await fetchJson<{
            hits?: Array<Record<string, unknown>>;
        }>(url.toString());

        for (const hit of payload.hits ?? []) {
            const title = String(hit.title ?? hit.story_title ?? "");
            if (!title) continue;

            const publishedAt = typeof hit.created_at === "string"
                ? hit.created_at
                : collectedAt;
            const points = Number(hit.points) || 0;
            const comments = Number(hit.num_comments) || 0;
            const excerpt = String(hit.story_text ?? hit.comment_text ?? "").replace(/<[^>]+>/g, "").slice(0, 280) || null;
            const text = [title, excerpt ?? ""].join(" ");

            signals.push({
                platform: "hackernews",
                external_id: String(hit.objectID ?? crypto.randomUUID()),
                topic: topic.label,
                title,
                body_excerpt: excerpt,
                author: typeof hit.author === "string" ? hit.author : null,
                permalink: typeof hit.url === "string" ? hit.url : (typeof hit.story_url === "string" ? hit.story_url : null),
                published_at: publishedAt,
                engagement: points + comments,
                comment_count: comments,
                sentiment_score: scoreSentiment(text),
                velocity_score: scoreVelocity(points + comments, publishedAt),
                opportunity_score: scoreOpportunity(text, points + comments, comments, publishedAt),
                metadata: {
                    points,
                    story_id: hit.story_id ?? null,
                    collected_at: collectedAt,
                },
                updated_at: collectedAt,
            });
        }
    }

    return signals;
}

function buildDemoSignals(collectedAt: string): SocialSignal[] {
    const now = Date.now();
    return [
        {
            platform: "demo",
            external_id: "demo-ai-marketing-demand",
            topic: "AI marketing",
            title: "Founders keep asking for AI-powered lead qualification that plugs into existing CRM workflows",
            body_excerpt: "Repeated requests point to pain around sales follow-up speed, data cleanup, and pipeline routing.",
            author: "demo-radar",
            permalink: null,
            published_at: new Date(now - (2 * 3_600_000)).toISOString(),
            engagement: 84,
            comment_count: 16,
            sentiment_score: 38,
            velocity_score: 72,
            opportunity_score: 81,
            metadata: { demo: true, collected_at: collectedAt },
            updated_at: collectedAt,
        },
        {
            platform: "demo",
            external_id: "demo-seo-repositioning",
            topic: "SEO demand",
            title: "Small businesses are shifting from broad SEO retainers to conversion-focused local visibility packages",
            body_excerpt: "The language is less about traffic and more about booked calls, reviews, and map ranking.",
            author: "demo-radar",
            permalink: null,
            published_at: new Date(now - (5 * 3_600_000)).toISOString(),
            engagement: 61,
            comment_count: 11,
            sentiment_score: 24,
            velocity_score: 58,
            opportunity_score: 74,
            metadata: { demo: true, collected_at: collectedAt },
            updated_at: collectedAt,
        },
        {
            platform: "demo",
            external_id: "demo-acquisition-budget-pressure",
            topic: "Customer acquisition",
            title: "Operators are openly discussing tighter paid media budgets and asking for faster attribution clarity",
            body_excerpt: "That pressure usually favors clear reporting, offer testing, and automation that reduces CAC waste.",
            author: "demo-radar",
            permalink: null,
            published_at: new Date(now - (8 * 3_600_000)).toISOString(),
            engagement: 47,
            comment_count: 7,
            sentiment_score: -12,
            velocity_score: 44,
            opportunity_score: 69,
            metadata: { demo: true, collected_at: collectedAt },
            updated_at: collectedAt,
        },
    ];
}

function dedupeSignals(signals: SocialSignal[]) {
    const deduped = new Map<string, SocialSignal>();

    for (const signal of signals) {
        const key = `${signal.platform}:${signal.external_id}`;
        if (!deduped.has(key)) {
            deduped.set(key, signal);
        }
    }

    return Array.from(deduped.values())
        .sort((a, b) => {
            const scoreDelta = b.opportunity_score - a.opportunity_score;
            if (scoreDelta !== 0) return scoreDelta;
            return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        })
        .slice(0, 40);
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

    const collectedAt = new Date().toISOString();
    const warnings: string[] = [];
    const liveSignals: SocialSignal[] = [];

    try {
        liveSignals.push(...await fetchRedditSignals(collectedAt));
    } catch (error) {
        warnings.push(`Reddit sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
        liveSignals.push(...await fetchHackerNewsSignals(collectedAt));
    } catch (error) {
        warnings.push(`Hacker News sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    const signals = liveSignals.length > 0
        ? dedupeSignals(liveSignals)
        : buildDemoSignals(collectedAt);

    let persisted = false;
    let persistenceError: string | null = null;

    if (persist) {
        if (!admin) {
            persistenceError = "Supabase service role is not configured.";
        } else {
            const { error } = await admin
                .from("social_signals")
                .upsert(signals, { onConflict: "platform,external_id" });

            if (error) {
                persistenceError = error.message;
            } else {
                persisted = true;
            }
        }
    }

    return jsonResponse({
        mode: liveSignals.length > 0 ? "live" : "demo",
        persisted,
        warnings,
        persistence_error: persistenceError,
        collected_at: collectedAt,
        count: signals.length,
        signals,
    });
});
