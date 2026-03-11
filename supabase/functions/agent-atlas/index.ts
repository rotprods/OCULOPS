import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { runBrain } from "../_shared/agent-brain-v2.ts";
import { errorResponse, handleCors, jsonResponse, readJson, safeNumber } from "../_shared/http.ts";
import { persistProspectorScan } from "../_shared/prospector.ts";
import { admin } from "../_shared/supabase.ts";

const AGENT_CODE = "atlas";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// ═══════════════════════════════════════════════════════════════════════════════
// ATLAS — Prospector Agent
//
// v2: Uses agent-brain-v2 for intelligent prospect analysis.
//     Core flow: Google Maps scan → persist → brain reasoning (qualify zone,
//     detect signals, store memory, create contacts for high-value prospects).
// ═══════════════════════════════════════════════════════════════════════════════

async function callMapsSearch(payload: Record<string, unknown>) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase runtime env is not configured");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/google-maps-search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `google-maps-search failed (${response.status})`);
  }

  return data as Record<string, unknown>;
}

function summarizeZone(results: Array<Record<string, unknown>>) {
  const withWebsite = results.filter(item => Boolean(item.website || item.website_url)).length;
  const ratings = results.map(item => safeNumber(item.rating, NaN)).filter(Number.isFinite);
  const categoryMap = results.reduce<Record<string, number>>((acc, item) => {
    const key = String(item.category || item.primary_type || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    total: results.length,
    with_website: withWebsite,
    without_website: results.length - withWebsite,
    avg_rating: ratings.length ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2)) : null,
    top_categories: Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
  };
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const startTime = Date.now();

  try {
    const body = await readJson<{
      action?: string;
      query?: string;
      location?: string;
      lat?: number;
      lng?: number;
      radius?: number;
      user_id?: string;
      source?: string;
      maxResults?: number;
      task_id?: string;
    }>(req);

    const action = body.action || "cycle";
    const { task_id } = body;

    // ── Agent lifecycle: start ──
    const { data: agent } = await admin
      .from("agent_registry")
      .select("*")
      .eq("code_name", AGENT_CODE)
      .single();
    if (!agent) throw new Error("Agent not found");

    await admin
      .from("agent_registry")
      .update({ status: "running", last_run_at: new Date().toISOString() })
      .eq("id", agent.id);

    if (task_id)
      await admin
        .from("agent_tasks")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", task_id);

    let result: Record<string, unknown> = {};

    if (action === "cycle" || action === "scan") {
      // ── 1. Google Maps scan (deterministic) ──
      const mapsPayload = {
        query: body.query || "businesses",
        location: body.location,
        lat: body.lat,
        lng: body.lng,
        radius: body.radius || 5000,
        maxResults: body.maxResults || 20,
      };
      const data = await callMapsSearch(mapsPayload);
      const results = [
        ...((data.places as Array<Record<string, unknown>>) || []),
        ...((data.leads as Array<Record<string, unknown>>) || []),
      ].reduce<Array<Record<string, unknown>>>((acc, item) => {
        const id = String(item.place_id || item.google_maps_id || item.id || crypto.randomUUID());
        if (!acc.some(row => String(row.place_id || row.google_maps_id || row.id) === id)) acc.push(item);
        return acc;
      }, []);

      // ── 2. Persist scan results ──
      const persisted = await persistProspectorScan({
        userId: body.user_id || null,
        query: body.query || "businesses",
        location: body.location || (data.area as Record<string, unknown> | undefined)?.formatted_address as string | undefined || null,
        radius: body.radius || 5000,
        source: body.source || "atlas",
        area: (data.area as Record<string, unknown>) || null,
        searchCenter: (data.search_center as Record<string, unknown>) || null,
        results,
        rawPayload: data,
      });

      const summary = summarizeZone(results);

      // ── 3. Brain-v2: analyze zone + qualify prospects ──
      const brainResult = await runBrain({
        agent: "atlas",
        goal: `Analyze this prospecting scan and take intelligent action:

1. ASSESS the zone quality: Is this a high-value zone for an AI agency? Look at business types, ratings, website presence.
2. For businesses WITHOUT websites (${summary.without_website} found), these are prime prospects — they need digital presence. Create a task to follow up on the top 3.
3. If you spot a pattern (e.g., cluster of restaurants, clinics, or retail), create a signal about this market opportunity.
4. Store a zone intelligence summary in memory so HUNTER and OUTREACH can use it later.
5. If the zone has >5 prospects with no website and avg rating >4.0, this is a high-opportunity zone — flag it.

Your final answer should summarize: zone quality (1-10), top opportunities, and recommended next steps.`,
        context: {
          scan_id: persisted.scan.id,
          query: body.query || "businesses",
          location: body.location || null,
          summary,
          sample_results: results.slice(0, 10).map((r) => ({
            name: r.name || r.business_name,
            category: r.category || r.primary_type,
            rating: r.rating,
            has_website: Boolean(r.website || r.website_url),
            phone: r.phone || r.international_phone_number,
          })),
        },
        systemPromptExtra: `You are ATLAS: the prospector. You find gold where others see dirt.
Focus on businesses that could benefit from AI automation, chatbots, CRM, or digital marketing.
Think like a sales strategist — which of these businesses would pay €1500-5000/mo for AI services?`,
        maxRounds: 4,
      }).catch((e) => ({
        ok: false,
        answer: `Brain error: ${e.message}`,
        skills_used: [] as Array<{ name: string; args: Record<string, unknown>; result: unknown }>,
        rounds: 0,
        trace_id: undefined as string | undefined,
      }));

      result = {
        scan: persisted.scan,
        leads: persisted.leads,
        area: data.area || null,
        search_center: data.search_center || null,
        summary,
        brain: {
          analysis: brainResult.answer,
          skills_used: brainResult.skills_used?.length || 0,
          rounds: brainResult.rounds || 0,
          trace_id: brainResult.trace_id,
        },
      };
    }

    // ── Agent lifecycle: close ──
    const duration = Date.now() - startTime;
    await admin
      .from("agent_registry")
      .update({
        status: "online",
        total_runs: (agent.total_runs || 0) + 1,
        avg_duration_ms: Math.round(
          ((agent.avg_duration_ms || 0) * (agent.total_runs || 0) + duration) /
            ((agent.total_runs || 0) + 1),
        ),
      })
      .eq("id", agent.id);

    if (task_id)
      await admin
        .from("agent_tasks")
        .update({ status: "completed", result, completed_at: new Date().toISOString() })
        .eq("id", task_id);

    await admin.from("agent_logs").insert({
      agent_id: agent.id,
      agent_code_name: AGENT_CODE,
      task_id,
      action,
      input: body,
      output: result,
      duration_ms: duration,
    });

    return jsonResponse({
      success: true,
      agent: AGENT_CODE,
      ...result,
      duration_ms: duration,
    });
  } catch (error) {
    await admin
      .from("agent_registry")
      .update({ status: "error" })
      .eq("code_name", AGENT_CODE);
    return errorResponse(error instanceof Error ? error.message : "ATLAS failed", 500);
  }
});
