import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { executeTriggeredWorkflows } from "../_shared/automation.ts";
import { bootstrapWhatsAppChannel } from "../_shared/channels.ts";
import { compact, errorResponse, handleCors, jsonResponse } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";
import { normalizePhone, verifyMetaSignature } from "../_shared/whatsapp.ts";

const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
const META_APP_SECRET = Deno.env.get("META_APP_SECRET");

async function resolveChannel(phoneNumberId: string | null) {
  let query = admin
    .from("messaging_channels")
    .select("*")
    .eq("type", "whatsapp")
    .eq("status", "active");

  if (phoneNumberId) query = query.eq("phone_number_id", phoneNumberId);

  const { data, error } = await query.limit(1);
  if (error) throw error;

  if (data?.[0]) return data[0];
  return bootstrapWhatsAppChannel(null);
}

async function findOrCreateContact(userId: string | null, phone: string, profileName: string | null) {
  let query = admin
    .from("contacts")
    .select("*")
    .eq("phone", phone)
    .limit(1);

  query = userId ? query.eq("user_id", userId) : query.is("user_id", null);

  const { data, error } = await query;
  if (error) throw error;
  if (data?.[0]) return data[0];

  const { data: created, error: insertError } = await admin
    .from("contacts")
    .insert({
      user_id: userId,
      name: profileName || phone,
      phone,
      whatsapp_number: phone,
      status: "contacted",
      source: "whatsapp_inbound",
      confidence: 72,
      role: "Owner / Front Desk",
      last_contacted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

async function findOrCreateConversation({
  userId,
  channel,
  contact,
  messageAt,
}: {
  userId: string | null;
  channel: Record<string, unknown>;
  contact: Record<string, unknown>;
  messageAt: string;
}) {
  let query = admin
    .from("conversations")
    .select("*")
    .eq("contact_id", contact.id)
    .eq("channel_id", channel.id)
    .limit(1);

  query = userId ? query.eq("user_id", userId) : query.is("user_id", null);

  const { data, error } = await query;
  if (error) throw error;

  if (data?.[0]) {
    const { data: updated, error: updateError } = await admin
      .from("conversations")
      .update({
        status: "open",
        unread_count: (data[0].unread_count || 0) + 1,
        last_message_at: messageAt,
        last_inbound_at: messageAt,
      })
      .eq("id", data[0].id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  const { data: created, error: insertError } = await admin
    .from("conversations")
    .insert({
      user_id: userId,
      contact_id: contact.id,
      company_id: contact.company_id || null,
      channel: "whatsapp",
      channel_id: channel.id,
      external_id: `whatsapp:${contact.id}`,
      status: "open",
      unread_count: 1,
      last_message_at: messageAt,
      last_inbound_at: messageAt,
      assigned_to: "Inbox",
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

function extractMessageContent(message: Record<string, unknown>) {
  const type = compact(message.type) || "text";
  if (type === "text") return compact(message.text?.body);
  if (type === "button") return compact(message.button?.text);
  if (type === "interactive") return compact(message.interactive?.button_reply?.title) || "[interactive]";
  return `[${type}]`;
}

async function insertInboundMessage({
  userId,
  channel,
  conversation,
  contact,
  message,
}: {
  userId: string | null;
  channel: Record<string, unknown>;
  conversation: Record<string, unknown>;
  contact: Record<string, unknown>;
  message: Record<string, unknown>;
}) {
  const providerMessageId = compact(message.id);
  const { data: existing, error: existingError } = await admin
    .from("messages")
    .select("*")
    .eq("provider_message_id", providerMessageId)
    .limit(1);

  if (existingError) throw existingError;
  if (existing?.[0]) return existing[0];

  const messageAt = message.timestamp
    ? new Date(Number(message.timestamp) * 1000).toISOString()
    : new Date().toISOString();
  const content = extractMessageContent(message);

  const { data, error } = await admin
    .from("messages")
    .insert({
      user_id: userId,
      conversation_id: conversation.id,
      channel_id: channel.id,
      direction: "inbound",
      content,
      content_type: compact(message.type) || "text",
      status: "received",
      provider_message_id: providerMessageId,
      external_id: providerMessageId,
      metadata: {
        channel: "whatsapp",
        from: contact.phone,
        profile_name: contact.name,
      },
      raw_payload: message,
      created_at: messageAt,
    })
    .select()
    .single();

  if (error) throw error;

  await admin.from("crm_activities").insert({
    user_id: userId,
    contact_id: contact.id,
    company_id: contact.company_id || null,
    conversation_id: conversation.id,
    type: "message_received",
    subject: "Inbound WhatsApp",
    description: `Inbound WhatsApp received from ${contact.phone}.`,
    metadata: {
      channel: "whatsapp",
      provider_message_id: providerMessageId,
    },
  });

  try {
    await executeTriggeredWorkflows({
      triggerKey: "message_in",
      userId,
      context: {
        user_id: userId,
        channel: "whatsapp",
        contact_id: contact.id,
        company_id: contact.company_id || null,
        conversation_id: conversation.id,
        message_id: data.id,
        body: content,
      },
      sendLive: false,
      source: "whatsapp_inbound",
    });
  } catch (automationError) {
    console.error("[whatsapp-webhook] automation trigger failed:", automationError);
  }

  return data;
}

async function updateOutboundStatus(channel: Record<string, unknown>, status: Record<string, unknown>) {
  const providerMessageId = compact(status.id);
  if (!providerMessageId) return null;

  const { data: messages, error } = await admin
    .from("messages")
    .select("*")
    .eq("provider_message_id", providerMessageId)
    .limit(1);

  if (error) throw error;
  const existing = messages?.[0];
  if (!existing) return null;

  const mappedStatus = compact(status.status) || "sent";
  const statusAt = status.timestamp
    ? new Date(Number(status.timestamp) * 1000).toISOString()
    : new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    status: mappedStatus,
    raw_payload: {
      ...(existing.raw_payload as Record<string, unknown> || {}),
      status_event: status,
    },
    error_message: compact(status.errors?.[0]?.title) || null,
  };

  if (mappedStatus === "delivered") updatePayload.delivered_at = statusAt;
  if (mappedStatus === "read") updatePayload.read_at = statusAt;
  if (mappedStatus === "failed") updatePayload.error_message = compact(status.errors?.[0]?.message) || updatePayload.error_message;

  const { data: updated, error: updateError } = await admin
    .from("messages")
    .update(updatePayload)
    .eq("id", existing.id)
    .select()
    .single();

  if (updateError) throw updateError;

  await admin
    .from("conversations")
    .update({
      channel_id: channel.id,
      channel: "whatsapp",
      status: mappedStatus === "read" ? "open" : mappedStatus,
      metadata: {
        ...(existing.metadata as Record<string, unknown> || {}),
        last_status: mappedStatus,
      },
    })
    .eq("id", existing.conversation_id);

  return updated;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const url = new URL(req.url);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge || "", { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Hub-Signature-256");

    if (!META_APP_SECRET || !signature || !(await verifyMetaSignature(META_APP_SECRET, rawBody, signature))) {
      return new Response("Forbidden", { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const changes = payload.entry?.flatMap((entry: Record<string, unknown>) => entry.changes || []) || [];
    let inboundCount = 0;
    let statusCount = 0;

    for (const change of changes) {
      const value = change.value || {};
      const metadata = value.metadata || {};
      const channel = await resolveChannel(compact(metadata.phone_number_id) || null);
      const userId = channel.user_id || null;

      for (const message of value.messages || []) {
        const phone = normalizePhone(compact(message.from));
        if (!phone) continue;

        const profileName = compact(value.contacts?.find((contact: Record<string, unknown>) => compact(contact.wa_id) === phone)?.profile?.name) || null;
        const contact = await findOrCreateContact(userId, phone, profileName);
        const messageAt = message.timestamp
          ? new Date(Number(message.timestamp) * 1000).toISOString()
          : new Date().toISOString();
        const conversation = await findOrCreateConversation({
          userId,
          channel,
          contact,
          messageAt,
        });

        await insertInboundMessage({
          userId,
          channel,
          conversation,
          contact,
          message,
        });

        inboundCount += 1;
      }

      for (const status of value.statuses || []) {
        const updated = await updateOutboundStatus(channel, status);
        if (updated) statusCount += 1;
      }
    }

    return jsonResponse({
      ok: true,
      inbound: inboundCount,
      statuses: statusCount,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "WhatsApp webhook failed", 500);
  }
});
