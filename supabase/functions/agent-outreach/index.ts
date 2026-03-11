import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { runBrain } from "../_shared/agent-brain-v2.ts";
import { errorResponse, handleCors, jsonResponse, readJson, compact } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";

const AGENT_CODE = "outreach";

// ═══════════════════════════════════════════════════════════════════════════════
// OUTREACH — Email Staging & Delivery Agent
//
// v2: Uses agent-brain-v2 for intelligent email personalization during cycle.
//     CRUD actions (list, approve, skip, send, batch_approve) stay deterministic.
//     Only "cycle" and "generate" actions invoke brain for reasoning.
// ═══════════════════════════════════════════════════════════════════════════════

function inferEmailFromWebsite(website: string | null | undefined) {
  const value = compact(website);
  if (!value) return null;

  try {
    const hostname = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.replace(/^www\./i, "");
    return `info@${hostname}`;
  } catch {
    return null;
  }
}

function buildEmailDraft(lead: Record<string, unknown>) {
  const name = compact(lead.contact_name) || compact(lead.name) || "equipo";
  const company = compact(lead.name) || compact(lead.business_name) || "tu negocio";
  const niche = compact(lead.category) || "local";
  const subject = `Idea rápida para escalar ${company}`;
  const html_body = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <p>Hola ${name.split(/\s+/)[0]},</p>
      <p>He analizado ${company} con Atlas y veo una oportunidad clara para automatizar captación, respuesta y seguimiento comercial.</p>
      <p>El potencial estimado para este tipo de negocio está alrededor de <strong>${lead.estimated_deal_value || 1500}€/mes</strong> si se conecta web, canal de mensajería y CRM en el mismo flujo.</p>
      <p>Si tiene sentido, te enseño en 10 minutos qué montar primero y dónde está el mayor retorno.</p>
      <p>Un saludo,<br/>Roberto</p>
    </div>
  `.trim();

  return { niche, subject, html_body };
}

async function existingQueueRow(leadId: string) {
  const { data, error } = await admin
    .from("outreach_queue")
    .select("*")
    .eq("lead_id", leadId)
    .in("status", ["staged", "approved", "sent", "replied"])
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function stageOutreachForLead(lead: Record<string, unknown>) {
  const recipientEmail = compact(lead.email) || inferEmailFromWebsite(compact(lead.website));
  if (!recipientEmail) return null;

  const existing = await existingQueueRow(String(lead.id));
  if (existing) return existing;

  const draft = buildEmailDraft(lead);
  const { data, error } = await admin
    .from("outreach_queue")
    .insert({
      lead_id: lead.id,
      contact_id: lead.contact_id || null,
      template_type: "cold",
      niche: draft.niche,
      recipient_name: compact(lead.contact_name) || compact(lead.name),
      recipient_email: recipientEmail,
      subject: draft.subject,
      html_body: draft.html_body,
      status: "staged",
    })
    .select("*, prospector_leads(*)")
    .single();

  if (error) throw error;
  return data;
}

async function loadLeadsForOutreach(userId: string | null, limit: number, niche?: string | null) {
  let query = admin
    .from("prospector_leads")
    .select("*")
    .in("status", ["qualified", "pursuing", "promoted"])
    .order("ai_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (userId) query = query.eq("user_id", userId);
  else query = query.is("user_id", null);
  if (niche) query = query.ilike("category", `%${niche}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function listEmails(status: string) {
  const { data, error } = await admin
    .from("outreach_queue")
    .select("*, prospector_leads(*)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getStats() {
  const { data, error } = await admin
    .from("outreach_queue")
    .select("status");

  if (error) throw error;
  const rows = data || [];

  return {
    staged: rows.filter(row => row.status === "staged").length,
    approved: rows.filter(row => row.status === "approved").length,
    sent: rows.filter(row => row.status === "sent").length,
    replied: rows.filter(row => row.status === "replied").length,
    total: rows.length,
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
      id?: string;
      status?: string;
      niche?: string;
      user_id?: string;
      limit?: number;
      task_id?: string;
    }>(req);

    const action = body.action || "list";

    // ── Deterministic CRUD actions (no brain needed) ──

    if (action === "list") {
      return jsonResponse({ ok: true, emails: await listEmails(body.status || "staged") });
    }

    if (action === "stats") {
      return jsonResponse({ ok: true, stats: await getStats() });
    }

    if (action === "approve") {
      const { data, error } = await admin
        .from("outreach_queue")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return jsonResponse({ ok: true, email: data });
    }

    if (action === "skip") {
      const { data, error } = await admin
        .from("outreach_queue")
        .update({ status: "skipped" })
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return jsonResponse({ ok: true, email: data });
    }

    if (action === "send") {
      const { data: email, error: fetchError } = await admin
        .from("outreach_queue")
        .select("*")
        .eq("id", body.id)
        .eq("status", "approved")
        .single();

      if (fetchError || !email) {
        return errorResponse("Approved email not found", 404);
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_body,
          outreach_queue_id: email.id,
        }),
      });

      const sendResult = await sendRes.json();
      if (!sendRes.ok) {
        return errorResponse(sendResult.error || "Send failed", 502);
      }
      return jsonResponse({ ok: true, sent: true, result: sendResult });
    }

    if (action === "batch_approve") {
      let query = admin
        .from("outreach_queue")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("status", "staged");
      if (body.niche) query = query.eq("niche", body.niche);
      const { data, error } = await query.select();
      if (error) throw error;
      return jsonResponse({ ok: true, approved_count: (data || []).length });
    }

    // ── Generative actions: cycle / generate (brain-v2) ──

    const { task_id } = body;

    // Agent lifecycle: start
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

    // ── 1. Load qualified leads and stage emails ──
    const leads = await loadLeadsForOutreach(
      body.user_id || null,
      Math.max(1, Math.min(30, body.limit || 12)),
      body.niche || null,
    );

    const staged = [];
    for (const lead of leads) {
      const item = await stageOutreachForLead(lead);
      if (item) staged.push(item);
    }

    // ── 2. Brain-v2: personalization + strategy reasoning ──
    const brainResult = await runBrain({
      agent: "outreach",
      goal: `Review the ${staged.length} staged outreach emails and provide strategic guidance:

1. Analyze the batch: what sectors are represented? What's the average deal potential?
2. Recall any previous outreach memory to check if we've contacted similar businesses before.
3. Store a summary of this batch in memory for future reference.
4. If any lead has a strategic brief with recommended_channel = "whatsapp", create a task to set up WhatsApp outreach.
5. Provide recommendations: which emails should be prioritized for approval? Any that should be revised?

Your final answer should be a concise batch review with prioritized send order.`,
      context: {
        staged_count: staged.length,
        leads_summary: staged.slice(0, 10).map((s) => ({
          recipient: s.recipient_name,
          email: s.recipient_email,
          niche: s.niche,
          lead_score: s.prospector_leads?.ai_score,
          deal_value: s.prospector_leads?.estimated_deal_value,
        })),
        niche_filter: body.niche || null,
      },
      systemPromptExtra: `You are OUTREACH: the communications specialist. You craft and orchestrate cold outreach.
Focus on prioritization — limited sends per day means we must pick the highest-ROI leads first.
Never send anything without human approval — your job is to stage, analyze, and recommend.`,
      maxRounds: 3,
    }).catch((e) => ({
      ok: false,
      answer: `Brain error: ${e.message}`,
      skills_used: [] as Array<{ name: string; args: Record<string, unknown>; result: unknown }>,
      rounds: 0,
      trace_id: undefined as string | undefined,
    }));

    const result = {
      staged_count: staged.length,
      emails: staged,
      brain: {
        analysis: brainResult.answer,
        skills_used: brainResult.skills_used?.length || 0,
        rounds: brainResult.rounds || 0,
        trace_id: brainResult.trace_id,
      },
    };

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
    return errorResponse(error instanceof Error ? error.message : "OUTREACH failed", 500);
  }
});
