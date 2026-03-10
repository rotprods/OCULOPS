// ═══════════════════════════════════════════════════
// Edge Function: Meta Business Discovery
// Detects Instagram/Facebook business accounts
// creating content but lacking proper web presence
// ═══════════════════════════════════════════════════

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { hashtags, location_id, category, limit } = await req.json();

        if (!META_ACCESS_TOKEN) {
            return new Response(
                JSON.stringify({ error: "Meta API access token not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const results = [];

        // Search for business accounts by hashtag
        if (hashtags && hashtags.length > 0) {
            for (const hashtag of hashtags) {
                // Step 1: Get hashtag ID
                const hashtagRes = await fetch(
                    `https://graph.facebook.com/v18.0/ig_hashtag_search?q=${encodeURIComponent(hashtag)}&user_id=me&access_token=${META_ACCESS_TOKEN}`
                );
                const hashtagData = await hashtagRes.json();

                if (hashtagData.data && hashtagData.data.length > 0) {
                    const hashtagId = hashtagData.data[0].id;

                    // Step 2: Get recent media for this hashtag
                    const mediaRes = await fetch(
                        `https://graph.facebook.com/v18.0/${hashtagId}/recent_media?fields=id,caption,media_type,like_count,comments_count,permalink,timestamp&user_id=me&access_token=${META_ACCESS_TOKEN}&limit=${limit || 25}`
                    );
                    const mediaData = await mediaRes.json();

                    if (mediaData.data) {
                        for (const media of mediaData.data) {
                            results.push({
                                source: "instagram",
                                hashtag,
                                post_id: media.id,
                                caption: media.caption || "",
                                media_type: media.media_type,
                                likes: media.like_count || 0,
                                comments: media.comments_count || 0,
                                permalink: media.permalink,
                                posted_at: media.timestamp,
                            });
                        }
                    }
                }
            }
        }

        // Analyze results for business potential
        const scored = results.map((r) => ({
            ...r,
            engagement_score:
                (r.likes || 0) + (r.comments || 0) * 3, // Comments weighted 3x
            is_business_account: /tienda|shop|restaurante|clínica|consultor|agencia|servicio|negocio|empresa/i.test(
                r.caption
            ),
        }));

        // Sort by engagement and filter potential businesses
        scored.sort((a, b) => b.engagement_score - a.engagement_score);

        return new Response(
            JSON.stringify({
                total: scored.length,
                potential_businesses: scored.filter((s) => s.is_business_account).length,
                results: scored,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("[meta-business-discovery] error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
