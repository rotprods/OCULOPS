import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";
import { analyzeWebsiteMarkup } from "../_shared/lead-intel.ts";
import { loadLeadById } from "../_shared/prospector.ts";

async function fetchWebsiteHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "OCULOPS-OS/1.0 (+https://oculops.os)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Website fetch failed (${response.status})`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body = await readJson<{
      website?: string;
      lead_id?: string;
    }>(req);

    let website = body.website?.trim() || "";
    const lead = body.lead_id ? await loadLeadById(body.lead_id) : null;

    if (!website && lead?.website) {
      website = String(lead.website);
    }

    if (!website) {
      return errorResponse("website or lead_id with website is required");
    }

    const html = await fetchWebsiteHtml(website);
    const analysis = analyzeWebsiteMarkup(website, html);

    let updatedLead = null;
    if (body.lead_id) {
      const { data, error } = await admin
        .from("prospector_leads")
        .update({
          tech_stack: analysis.techStack,
          social_profiles: analysis.socialProfiles,
          email: analysis.emails[0] || lead?.email || null,
          raw_payload: {
            ...(lead?.raw_payload as Record<string, unknown> || {}),
            analysis,
          },
          data: {
            ...(lead?.data as Record<string, unknown> || {}),
            analysis,
          },
        })
        .eq("id", body.lead_id)
        .select()
        .single();

      if (error) throw error;
      updatedLead = data;
    }

    return jsonResponse({
      ok: true,
      analysis,
      lead: updatedLead,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Website analysis failed", 500);
  }
});
