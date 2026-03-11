// ═══════════════════════════════════════════════════
// Edge Function: TikTok Business Search
// Detects business accounts creating content without websites
// ═══════════════════════════════════════════════════

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const TIKTOK_API_KEY = Deno.env.get("TIKTOK_API_KEY");
const TIKTOK_API_SECRET = Deno.env.get("TIKTOK_API_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyCaller(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return { type: "cron" as const };
    if (!authHeader || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) return null;
    return { type: "user" as const, userId: user.id };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const caller = await verifyCaller(req);
        if (!caller) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { keywords, category, location, limit } = await req.json();

        if (!TIKTOK_API_KEY) {
            return new Response(
                JSON.stringify({ error: "TikTok API key not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // TikTok Research API — search for business-related content
        // Note: Requires TikTok Research API access (applied separately)
        const searchQuery = {
            query: {
                and: [
                    ...(keywords ? [{ field_name: "keyword", operation: "IN", field_values: keywords }] : []),
                    ...(location ? [{ field_name: "region_code", operation: "IN", field_values: [location] }] : []),
                ],
            },
            max_count: limit || 20,
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
        };

        const res = await fetch("https://open.tiktokapis.com/v2/research/video/query/", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${TIKTOK_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(searchQuery),
        });

        const data = await res.json();

        // Process and score results
        const videos = data.data?.videos || [];
        const uniqueUsers = new Map();

        for (const video of videos) {
            const userId = video.username;
            if (!uniqueUsers.has(userId)) {
                uniqueUsers.set(userId, {
                    tiktok_id: userId,
                    display_name: video.display_name || userId,
                    follower_count: video.author_follower_count || 0,
                    video_count: 1,
                    total_likes: video.like_count || 0,
                    total_views: video.view_count || 0,
                    has_business_keywords: /tienda|shop|restaurant|clínica|servicio|oferta|promo|negocio|empresa|venta/i.test(
                        video.video_description || ""
                    ),
                    sample_content: video.video_description?.substring(0, 200) || "",
                });
            } else {
                const user = uniqueUsers.get(userId);
                user.video_count++;
                user.total_likes += video.like_count || 0;
                user.total_views += video.view_count || 0;
            }
        }

        const results = Array.from(uniqueUsers.values())
            .map((u) => ({
                ...u,
                engagement_rate: u.follower_count > 0
                    ? ((u.total_likes / u.video_count / u.follower_count) * 100).toFixed(2)
                    : 0,
                content_frequency: u.video_count >= 10 ? "daily" : u.video_count >= 4 ? "weekly" : "monthly",
                lead_score: Math.min(
                    100,
                    (u.has_business_keywords ? 30 : 0) +
                    Math.min(u.follower_count / 100, 30) +
                    Math.min(u.video_count * 5, 20) +
                    Math.min(parseFloat(u.engagement_rate || "0") * 5, 20)
                ),
            }))
            .sort((a, b) => b.lead_score - a.lead_score);

        return new Response(
            JSON.stringify({
                total_videos: videos.length,
                unique_accounts: results.length,
                potential_leads: results.filter((r) => r.lead_score >= 50).length,
                results,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("[tiktok-business-search] error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
