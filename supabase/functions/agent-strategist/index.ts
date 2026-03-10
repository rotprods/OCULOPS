import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { runAgentTask, sendAgentMessage } from "../_shared/agents.ts";
import { buildStrategicBrief } from "../_shared/lead-intel.ts";
import { compact, errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";

async function loadLeads({
  leadId,
  scanId,
  userId,
  limit,
}: {
  leadId?: string | null;
  scanId?: string | null;
  userId?: string | null;
  limit: number;
}) {
  if (leadId) {
    const { data, error } = await admin
      .from("prospector_leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (error) throw error;
    return data ? [data] : [];
  }

  let query = admin
    .from("prospector_leads")
    .select("*")
    .neq("status", "dismissed")
    .order("ai_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (scanId) query = query.eq("scan_id", scanId);
  if (userId) query = query.eq("user_id", userId);
  else query = query.is("user_id", null);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
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
      lead_id?: string;
      scan_id?: string;
      user_id?: string;
      limit?: number;
    }>(req);

    const action = body.action || "cycle";
    const result = await runAgentTask({
      codeName: "strategist",
      action,
      title: `STRATEGIST ${action}`,
      payload: body as Record<string, unknown>,
      handler: async () => {
        const leads = await loadLeads({
          leadId: body.lead_id || null,
          scanId: body.scan_id || null,
          userId: body.user_id || null,
          limit: Math.max(1, Math.min(10, body.limit || 5)),
        });

        const briefs = [];

        for (const lead of leads) {
          const brief = await buildStrategicBrief(lead);

          await admin
            .from("prospector_leads")
            .update({
              ai_reasoning: [
                compact(lead.ai_reasoning),
                brief.positioning,
                ...(brief.pain_points || []),
              ].filter(Boolean).join(" "),
              raw_payload: {
                ...(lead.raw_payload as Record<string, unknown> || {}),
                strategist: brief,
              },
              data: {
                ...(lead.data as Record<string, unknown> || {}),
                strategist: brief,
              },
            })
            .eq("id", lead.id);

          briefs.push({
            lead_id: lead.id,
            lead_name: lead.name,
            brief,
          });
        }

        if (briefs.length > 0) {
          await sendAgentMessage("strategist", "outreach", "Strategic outreach brief ready", {
            leads: briefs.map(item => ({
              lead_id: item.lead_id,
              recommended_channel: item.brief.recommended_channel,
            })),
          });
        }

        return {
          briefs,
        };
      },
    });

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "STRATEGIST failed", 500);
  }
});
