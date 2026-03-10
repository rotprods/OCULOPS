// ═══════════════════════════════════════════════════
// Edge Function: ManyChat Sync
// Sync conversations from ManyChat to unified inbox
// ═══════════════════════════════════════════════════

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MANYCHAT_API_KEY = Deno.env.get("MANYCHAT_API_KEY");

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        if (!MANYCHAT_API_KEY) {
            return new Response(
                JSON.stringify({ error: "ManyChat API key not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { action, subscriber_id, page_size } = await req.json();

        switch (action) {
            case "list_subscribers": {
                const res = await fetch(
                    `https://api.manychat.com/fb/subscriber/getSubscribers?page_size=${page_size || 50}`,
                    {
                        headers: {
                            Authorization: `Bearer ${MANYCHAT_API_KEY}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                const data = await res.json();
                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            case "get_subscriber": {
                const res = await fetch(
                    `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${subscriber_id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${MANYCHAT_API_KEY}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                const data = await res.json();
                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            case "sync_all": {
                // Fetch all subscribers and sync to Supabase
                const res = await fetch(
                    `https://api.manychat.com/fb/subscriber/getSubscribers?page_size=100`,
                    {
                        headers: {
                            Authorization: `Bearer ${MANYCHAT_API_KEY}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                const data = await res.json();
                const subscribers = data.data || [];

                let synced = 0;
                for (const sub of subscribers) {
                    // Upsert conversation
                    await supabase.from("conversations").upsert(
                        {
                            external_id: `manychat_${sub.id}`,
                            status: sub.live_chat_url ? "open" : "resolved",
                            last_message_at: sub.last_interaction || new Date().toISOString(),
                        },
                        { onConflict: "external_id" }
                    );
                    synced++;
                }

                return new Response(
                    JSON.stringify({ synced, total: subscribers.length }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            default:
                return new Response(
                    JSON.stringify({ error: "Unknown action. Use: list_subscribers, get_subscriber, sync_all" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
        }
    } catch (err) {
        console.error("[manychat-sync] error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
