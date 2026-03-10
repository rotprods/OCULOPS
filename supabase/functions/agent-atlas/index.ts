import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { runAgentTask, sendAgentMessage } from "../_shared/agents.ts";
import { errorResponse, handleCors, jsonResponse, readJson, safeNumber } from "../_shared/http.ts";
import { persistProspectorScan } from "../_shared/prospector.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
    }>(req);

    const action = body.action || "cycle";

    const result = await runAgentTask({
      codeName: "atlas",
      action,
      title: `ATLAS ${action}`,
      payload: body as Record<string, unknown>,
      handler: async () => {
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
        await sendAgentMessage("atlas", "hunter", "Fresh zone scan", {
          scan_id: persisted.scan.id,
          summary,
        });

        return {
          scan: persisted.scan,
          leads: persisted.leads,
          area: data.area || null,
          search_center: data.search_center || null,
          summary,
        };
      },
    });

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "ATLAS failed", 500);
  }
});
