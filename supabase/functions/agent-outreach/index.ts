import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { runBrain } from "../_shared/agent-brain-v2.ts";
import { errorResponse, handleCors, jsonResponse, readJson, compact } from "../_shared/http.ts";
import { emitSystemEvent } from "../_shared/orchestration.ts";
import { admin } from "../_shared/supabase.ts";

const AGENT_CODE = "outreach";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

function asRecord(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function scopeByUser<T extends { eq: Function; is: Function }>(query: T, userId: string | null) {
  return userId ? query.eq("user_id", userId) : query.is("user_id", null);
}

function htmlToPlainText(value: string | null | undefined) {
  const html = compact(value);
  if (!html) return "";

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .split("\n")
    .map(line => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

async function loadLead(leadId: string | null | undefined) {
  if (!leadId) return null;
  const { data, error } = await admin
    .from("prospector_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;
  return data as Record<string, unknown> | null;
}

async function loadContact(contactId: string | null | undefined) {
  if (!contactId) return null;
  const { data, error } = await admin
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .maybeSingle();

  if (error) throw error;
  return data as Record<string, unknown> | null;
}

async function loadCompany(companyId: string | null | undefined) {
  if (!companyId) return null;
  const { data, error } = await admin
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw error;
  return data as Record<string, unknown> | null;
}

async function findOrCreateCompany({
  userId,
  lead,
}: {
  userId: string | null;
  lead: Record<string, unknown> | null;
}) {
  const leadCompanyId = compact(lead?.company_id) || null;
  const existingById = await loadCompany(leadCompanyId);
  if (existingById) return existingById;

  const companyName = compact(lead?.name) || compact(lead?.business_name);
  const website = compact(lead?.website) || null;

  if (website) {
    let query = admin
      .from("companies")
      .select("*")
      .eq("website", website)
      .limit(1);

    query = scopeByUser(query, userId);
    const { data, error } = await query;
    if (error) throw error;
    if (data?.[0]) return data[0] as Record<string, unknown>;
  }

  if (companyName) {
    let query = admin
      .from("companies")
      .select("*")
      .eq("name", companyName)
      .limit(1);

    query = scopeByUser(query, userId);
    const { data, error } = await query;
    if (error) throw error;
    if (data?.[0]) return data[0] as Record<string, unknown>;
  }

  if (!companyName) return null;

  const { data, error } = await admin
    .from("companies")
    .insert({
      user_id: userId,
      name: companyName,
      website,
      location: compact(lead?.address) || compact(lead?.city) || null,
      status: "prospect",
      source: "outreach_agent",
    })
    .select()
    .single();

  if (error) throw error;
  return data as Record<string, unknown>;
}

async function findOrCreateContact({
  userId,
  explicitContactId,
  companyId,
  recipientName,
  recipientEmail,
  lead,
}: {
  userId: string | null;
  explicitContactId: string | null;
  companyId: string | null;
  recipientName: string | null;
  recipientEmail: string;
  lead: Record<string, unknown> | null;
}) {
  const fromExplicit = await loadContact(explicitContactId);
  if (fromExplicit) return fromExplicit;

  const leadContactId = compact(lead?.contact_id) || null;
  const fromLeadId = await loadContact(leadContactId);
  if (fromLeadId) return fromLeadId;

  let query = admin
    .from("contacts")
    .select("*")
    .eq("email", recipientEmail)
    .limit(1);
  query = scopeByUser(query, userId);

  const { data: existingRows, error: existingError } = await query;
  if (existingError) throw existingError;

  const existing = existingRows?.[0] as Record<string, unknown> | undefined;
  if (existing) {
    if (!compact(existing.company_id) && companyId) {
      await admin
        .from("contacts")
        .update({ company_id: companyId })
        .eq("id", existing.id);
    }
    return existing;
  }

  const fallbackName = compact(recipientName) || compact(lead?.contact_name) || compact(lead?.name) || recipientEmail.split("@")[0];
  const { data, error } = await admin
    .from("contacts")
    .insert({
      user_id: userId,
      company_id: companyId,
      name: fallbackName,
      email: recipientEmail,
      phone: compact(lead?.phone) || null,
      role: compact(lead?.role) || "Owner / Front Desk",
      status: "contacted",
      source: "outreach_agent",
      confidence: 68,
      last_contacted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Record<string, unknown>;
}

async function ensureConversation({
  userId,
  contactId,
  companyId,
}: {
  userId: string | null;
  contactId: string;
  companyId: string | null;
}) {
  let query = admin
    .from("conversations")
    .select("*")
    .eq("contact_id", contactId)
    .eq("channel", "email")
    .limit(1);
  query = scopeByUser(query, userId);

  const { data, error } = await query;
  if (error) throw error;
  if (data?.[0]) return data[0] as Record<string, unknown>;

  const { data: created, error: insertError } = await admin
    .from("conversations")
    .insert({
      user_id: userId,
      contact_id: contactId,
      company_id: companyId || null,
      channel: "email",
      external_id: `email:${contactId}`,
      status: "pending",
      assigned_to: "Outreach",
      last_message_at: new Date().toISOString(),
      last_outbound_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created as Record<string, unknown>;
}

async function dispatchApprovedOutreach({
  queue,
  conversationId,
  contactId,
  companyId,
  correlationId,
}: {
  queue: Record<string, unknown>;
  conversationId: string;
  contactId: string;
  companyId: string | null;
  correlationId: string | null;
}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase runtime env is not configured");
  }

  const body = htmlToPlainText(compact(queue.html_body));
  if (!body) throw new Error("Outreach body is empty");

  const dispatchResponse = await fetch(`${SUPABASE_URL}/functions/v1/messaging-dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      channel: "email",
      to: compact(queue.recipient_email),
      subject: compact(queue.subject) || null,
      body,
      metadata: {
        source: "agent_outreach",
        outreach_queue_id: queue.id,
        lead_id: queue.lead_id || null,
        contact_id: contactId,
        company_id: companyId || null,
        correlation_id: correlationId || null,
        recipient_name: compact(queue.recipient_name) || null,
        html_body: compact(queue.html_body) || null,
      },
    }),
  });

  const dispatchResult = await dispatchResponse.json().catch(() => ({}));
  if (!dispatchResponse.ok) {
    const message = compact((dispatchResult as Record<string, unknown>).error) || "Messaging dispatch failed";
    throw new Error(message);
  }

  return dispatchResult as Record<string, unknown>;
}

function resolveQueueId(body: Record<string, unknown>) {
  return compact(body.id) || compact(body.email_id);
}

async function loadLatestOutreachApproval(queueId: string) {
  const { data, error } = await admin
    .from("approval_requests")
    .select("*")
    .eq("agent", AGENT_CODE)
    .eq("skill", "messaging-dispatch")
    .contains("payload", { outreach_queue_id: queueId })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] as Record<string, unknown> | null;
}

async function createOutreachApprovalRequest({
  queueRow,
  lead,
  reason,
}: {
  queueRow: Record<string, unknown>;
  lead: Record<string, unknown> | null;
  reason: string;
}) {
  const correlationId = crypto.randomUUID();
  const orgId = compact(queueRow.org_id) || compact(lead?.org_id) || null;
  const approvalPayload: Record<string, unknown> = {
    source: "agent_outreach",
    outreach_queue_id: queueRow.id,
    lead_id: queueRow.lead_id || null,
    contact_id: queueRow.contact_id || null,
    recipient_email: compact(queueRow.recipient_email) || null,
    recipient_name: compact(queueRow.recipient_name) || null,
    subject: compact(queueRow.subject) || null,
    channel: "email",
    preview: htmlToPlainText(compact(queueRow.html_body)).slice(0, 300),
    reason,
    correlation_id: correlationId,
  };

  const insertPayload: Record<string, unknown> = {
    agent: AGENT_CODE,
    skill: "messaging-dispatch",
    payload: approvalPayload,
    urgency: "high",
    status: "pending",
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
  if (orgId) insertPayload.org_id = orgId;

  const { data, error } = await admin
    .from("approval_requests")
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;

  emitSystemEvent({
    eventType: "outreach.approval_requested",
    sourceAgent: AGENT_CODE,
    correlationId,
    payload: {
      approval_id: data?.id || null,
      outreach_queue_id: queueRow.id,
      recipient_email: compact(queueRow.recipient_email) || null,
      urgency: "high",
    },
    metadata: {
      pathway: "outreach",
      stage: "approval_requested",
    },
  }).catch(() => {});

  return data as Record<string, unknown>;
}

async function ensureOutreachApprovalRequest({
  queueRow,
  lead,
  reason,
}: {
  queueRow: Record<string, unknown>;
  lead: Record<string, unknown> | null;
  reason: string;
}) {
  const queueId = compact(queueRow.id);
  if (!queueId) throw new Error("Queue row id is required");

  const latest = await loadLatestOutreachApproval(queueId);
  const latestStatus = compact(latest?.status);
  if (latest && ["pending", "approved"].includes(latestStatus)) return latest;

  return createOutreachApprovalRequest({ queueRow, lead, reason });
}

async function executeOutreachSend({
  queueRow,
  approval,
}: {
  queueRow: Record<string, unknown>;
  approval: Record<string, unknown> | null;
}) {
  const recipientEmail = compact(queueRow.recipient_email);
  if (!recipientEmail) {
    throw new Error("Approved email has no recipient_email");
  }

  const joinedLead = queueRow.prospector_leads;
  const leadFromJoin = Array.isArray(joinedLead) ? joinedLead[0] : joinedLead;
  const lead = (leadFromJoin as Record<string, unknown> | null) ||
    await loadLead(compact(queueRow.lead_id) || null);
  const userId = compact(lead?.user_id) || null;

  const company = await findOrCreateCompany({ userId, lead });
  const companyId = compact(company?.id) || compact(lead?.company_id) || null;

  const contact = await findOrCreateContact({
    userId,
    explicitContactId: compact(queueRow.contact_id) || null,
    companyId,
    recipientName: compact(queueRow.recipient_name) || null,
    recipientEmail,
    lead,
  });

  if (!contact?.id) {
    throw new Error("Contact could not be resolved for outreach");
  }

  const contactId = compact(contact.id);
  const conversation = await ensureConversation({
    userId,
    contactId,
    companyId: compact(contact.company_id) || companyId,
  });
  const conversationId = compact(conversation.id);
  const approvalPayload = asRecord(approval?.payload);
  const correlationId = compact(approvalPayload.correlation_id) || null;

  const dispatch = await dispatchApprovedOutreach({
    queue: queueRow,
    conversationId,
    contactId,
    companyId: compact(contact.company_id) || companyId,
    correlationId,
  });
  const dispatchMessage = asRecord(dispatch.message);
  const dispatchedMessageId = compact(dispatchMessage.id) || null;
  const dispatchedProviderMessageId = compact(dispatchMessage.provider_message_id) || compact(dispatchMessage.external_id) || null;
  const dispatchedProviderStatus = compact(dispatchMessage.status) || "sent";

  const leadPatch: Record<string, unknown> = {};
  if (lead?.id && !compact(lead.contact_id)) leadPatch.contact_id = contactId;
  if (lead?.id && !compact(lead.company_id) && (compact(contact.company_id) || companyId)) {
    leadPatch.company_id = compact(contact.company_id) || companyId;
  }
  if (lead?.id && Object.keys(leadPatch).length > 0) {
    await admin
      .from("prospector_leads")
      .update(leadPatch)
      .eq("id", lead.id);
  }

  const { data: updatedQueue, error: updateError } = await admin
    .from("outreach_queue")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      contact_id: contactId,
      conversation_id: conversationId,
      message_id: dispatchedMessageId,
      provider_message_id: dispatchedProviderMessageId,
      provider_status: dispatchedProviderStatus,
      provider_error: null,
      metadata: {
        ...asRecord(queueRow.metadata),
        last_dispatch: {
          at: new Date().toISOString(),
          channel: compact(dispatch.channel) || "email",
          message_id: dispatchedMessageId,
          provider_message_id: dispatchedProviderMessageId,
          provider_status: dispatchedProviderStatus,
        },
      },
    })
    .eq("id", queueRow.id)
    .select("*, prospector_leads(*)")
    .single();

  if (updateError) throw updateError;

  emitSystemEvent({
    eventType: "outreach.sent",
    sourceAgent: AGENT_CODE,
    correlationId,
    payload: {
      outreach_queue_id: updatedQueue?.id || queueRow.id,
      conversation_id: conversationId,
      contact_id: contactId,
      lead_id: queueRow.lead_id || null,
      approval_id: approval?.id || null,
    },
    metadata: {
      pathway: "outreach",
      stage: "sent",
    },
  }).catch(() => {});

  return {
    email: updatedQueue,
    conversation_id: conversationId,
    dispatch,
    approval,
  };
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
      email_id?: string;
      status?: string;
      niche?: string;
      user_id?: string;
      limit?: number;
      task_id?: string;
      approval_id?: string;
      decision?: "approved" | "rejected";
      comment?: string;
      approved_by?: string;
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
      const queueId = resolveQueueId(body as unknown as Record<string, unknown>);
      if (!queueId) return errorResponse("id is required");

      const { data, error } = await admin
        .from("outreach_queue")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", queueId)
        .select("*, prospector_leads(*)")
        .single();
      if (error) throw error;

      const joinedLead = data?.prospector_leads;
      const leadFromJoin = Array.isArray(joinedLead) ? joinedLead[0] : joinedLead;
      const lead = (leadFromJoin as Record<string, unknown> | null) ||
        await loadLead(compact(data?.lead_id) || null);
      const approval = await ensureOutreachApprovalRequest({
        queueRow: data as Record<string, unknown>,
        lead,
        reason: "Approved for outbound send from Outreach queue.",
      });

      return jsonResponse({
        ok: true,
        email: data,
        approval,
        approval_required: compact(approval?.status) !== "approved",
      });
    }

    if (action === "skip") {
      const queueId = resolveQueueId(body as unknown as Record<string, unknown>);
      if (!queueId) return errorResponse("id is required");

      const { data, error } = await admin
        .from("outreach_queue")
        .update({ status: "skipped" })
        .eq("id", queueId)
        .select()
        .single();
      if (error) throw error;
      return jsonResponse({ ok: true, email: data });
    }

    if (action === "send") {
      const queueId = resolveQueueId(body as unknown as Record<string, unknown>);
      if (!queueId) return errorResponse("id is required");

      const { data: queueRow, error: fetchError } = await admin
        .from("outreach_queue")
        .select("*, prospector_leads(*)")
        .eq("id", queueId)
        .eq("status", "approved")
        .single();

      if (fetchError || !queueRow) {
        return errorResponse("Approved email not found", 404);
      }

      const joinedLead = (queueRow as Record<string, unknown>).prospector_leads;
      const leadFromJoin = Array.isArray(joinedLead) ? joinedLead[0] : joinedLead;
      const lead = (leadFromJoin as Record<string, unknown> | null) ||
        await loadLead(compact(queueRow.lead_id) || null);
      const approval = await ensureOutreachApprovalRequest({
        queueRow: queueRow as Record<string, unknown>,
        lead,
        reason: "Manual send requested from Outreach queue.",
      });
      const approvalStatus = compact(approval?.status);

      if (approvalStatus !== "approved") {
        return jsonResponse({
          ok: true,
          sent: false,
          requires_approval: true,
          approval,
          reason: approvalStatus === "pending"
            ? "Pending human approval before external send."
            : "Approval required before external send.",
        });
      }

      const sendResult = await executeOutreachSend({
        queueRow: queueRow as Record<string, unknown>,
        approval,
      });

      return jsonResponse({
        ok: true,
        sent: true,
        ...sendResult,
      });
    }

    if (action === "resolve_approval") {
      const approvalId = compact(body.approval_id);
      if (!approvalId) return errorResponse("approval_id is required");

      const decision = compact(body.decision).toLowerCase();
      if (!["approved", "rejected"].includes(decision)) {
        return errorResponse("decision must be approved or rejected");
      }

      const { data: currentApproval, error: loadError } = await admin
        .from("approval_requests")
        .select("*")
        .eq("id", approvalId)
        .eq("status", "pending")
        .maybeSingle();

      if (loadError) throw loadError;
      if (!currentApproval) return errorResponse("Pending approval not found", 404);

      const approvedBy = compact(body.approved_by) || compact(body.user_id) || "operator";
      const userComment = compact(body.comment) || null;
      const { data: updatedApproval, error: updateApprovalError } = await admin
        .from("approval_requests")
        .update({
          status: decision,
          approved_by: approvedBy,
          user_comment: userComment,
        })
        .eq("id", approvalId)
        .select()
        .single();

      if (updateApprovalError) throw updateApprovalError;

      const approvalPayload = asRecord(updatedApproval?.payload);
      const correlationId = compact(approvalPayload.correlation_id) || null;
      emitSystemEvent({
        eventType: decision === "approved" ? "outreach.approval_approved" : "outreach.approval_rejected",
        sourceAgent: AGENT_CODE,
        correlationId,
        payload: {
          approval_id: approvalId,
          outreach_queue_id: compact(approvalPayload.outreach_queue_id) || null,
          decision,
          approved_by: approvedBy,
        },
        metadata: {
          pathway: "outreach",
          stage: "approval_resolved",
        },
      }).catch(() => {});

      const queueId = compact(approvalPayload.outreach_queue_id);
      if (!queueId) {
        return jsonResponse({
          ok: true,
          approval: updatedApproval,
          sent: false,
        });
      }

      if (decision === "rejected") {
        await admin
          .from("outreach_queue")
          .update({ status: "skipped" })
          .eq("id", queueId)
          .in("status", ["staged", "approved"]);

        return jsonResponse({
          ok: true,
          approval: updatedApproval,
          sent: false,
          queue_id: queueId,
        });
      }

      await admin
        .from("outreach_queue")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", queueId)
        .in("status", ["staged", "approved"]);

      const { data: queueRow, error: queueError } = await admin
        .from("outreach_queue")
        .select("*, prospector_leads(*)")
        .eq("id", queueId)
        .eq("status", "approved")
        .maybeSingle();

      if (queueError) throw queueError;
      if (!queueRow) {
        return errorResponse("Linked outreach queue item not found", 404);
      }

      const sendResult = await executeOutreachSend({
        queueRow: queueRow as Record<string, unknown>,
        approval: updatedApproval as Record<string, unknown>,
      });

      return jsonResponse({
        ok: true,
        approval: updatedApproval,
        sent: true,
        ...sendResult,
      });
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

    emitSystemEvent({ eventType: "agent.started", sourceAgent: AGENT_CODE, payload: { action, title: `${AGENT_CODE}: ${action}` } }).catch(() => {});

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
