import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { executeTriggeredWorkflows } from "../_shared/automation.ts";
import { bootstrapWhatsAppChannel } from "../_shared/channels.ts";
import { compact, errorResponse, handleCors, jsonResponse } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";
import { normalizePhone, verifyMetaSignature } from "../_shared/whatsapp.ts";

const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
const META_APP_SECRET = Deno.env.get("META_APP_SECRET");

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

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
  referencedProviderMessageId,
}: {
  userId: string | null;
  channel: Record<string, unknown>;
  contact: Record<string, unknown>;
  messageAt: string;
  referencedProviderMessageId?: string | null;
}) {
  if (compact(referencedProviderMessageId)) {
    const { data: linkedMessages, error: linkedMessagesError } = await admin
      .from("messages")
      .select("conversation_id, user_id")
      .eq("provider_message_id", compact(referencedProviderMessageId))
      .limit(1);
    if (linkedMessagesError) throw linkedMessagesError;

    const linked = linkedMessages?.[0];
    if (compact(linked?.conversation_id)) {
      let linkedConversationQuery = admin
        .from("conversations")
        .select("*")
        .eq("id", compact(linked.conversation_id))
        .limit(1);
      linkedConversationQuery = userId
        ? linkedConversationQuery.eq("user_id", userId)
        : linkedConversationQuery.is("user_id", null);

      const { data: linkedConversations, error: linkedConversationError } = await linkedConversationQuery;
      if (linkedConversationError) throw linkedConversationError;
      if (linkedConversations?.[0]) {
        const { data: updatedLinked, error: updatedLinkedError } = await admin
          .from("conversations")
          .update({
            status: "open",
            unread_count: (linkedConversations[0].unread_count || 0) + 1,
            last_message_at: messageAt,
            last_inbound_at: messageAt,
            channel_id: channel.id,
            channel: "whatsapp",
          })
          .eq("id", linkedConversations[0].id)
          .select()
          .single();

        if (updatedLinkedError) throw updatedLinkedError;
        return updatedLinked;
      }
    }
  }

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

async function loadLatestOutreachQueueRow(field: "conversation_id" | "contact_id" | "recipient_email", value: string) {
  const { data, error } = await admin
    .from("outreach_queue")
    .select("id, status, metadata")
    .eq(field, value)
    .in("status", ["sent", "approved"])
    .order("sent_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function reconcileOutreachReply({
  conversation,
  contact,
  inboundMessageId,
  messageAt,
}: {
  conversation: Record<string, unknown>;
  contact: Record<string, unknown>;
  inboundMessageId: string;
  messageAt: string;
}) {
  let queueRow = await loadLatestOutreachQueueRow("conversation_id", compact(conversation.id));
  if (!queueRow && compact(contact.id)) {
    queueRow = await loadLatestOutreachQueueRow("contact_id", compact(contact.id));
  }
  if (!queueRow && compact(contact.email)) {
    queueRow = await loadLatestOutreachQueueRow("recipient_email", compact(contact.email));
  }
  if (!queueRow) return null;

  await admin
    .from("outreach_queue")
    .update({
      status: "replied",
      replied_at: messageAt,
      provider_status: "replied",
      provider_error: null,
      conversation_id: compact(conversation.id) || null,
      message_id: inboundMessageId,
      metadata: {
        ...asRecord(queueRow.metadata),
        last_reply: {
          at: messageAt,
          conversation_id: compact(conversation.id) || null,
          contact_id: compact(contact.id) || null,
          inbound_message_id: inboundMessageId,
          source: "whatsapp_webhook",
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", queueRow.id);

  return queueRow.id as string;
}

async function reconcileOutreachProviderStatus(input: {
  queueId: string;
  mappedStatus: string;
  statusAt: string;
  providerError: string | null;
  conversationId: string;
  messageId: string;
}) {
  const { data: queueRow, error: queueError } = await admin
    .from("outreach_queue")
    .select("id, status, metadata")
    .eq("id", input.queueId)
    .maybeSingle();
  if (queueError || !queueRow) return;

  const patch: Record<string, unknown> = {
    conversation_id: input.conversationId,
    message_id: input.messageId,
    provider_status: input.mappedStatus,
    provider_error: input.providerError,
    metadata: {
      ...asRecord(queueRow.metadata),
      last_provider_status: {
        at: input.statusAt,
        status: input.mappedStatus,
      },
    },
    updated_at: new Date().toISOString(),
  };

  if (input.mappedStatus === "failed") {
    patch.status = "approved";
  } else if (input.mappedStatus === "read") {
    patch.status = compact(queueRow.status) === "replied" ? "replied" : "sent";
    patch.opened_at = input.statusAt;
  } else if (input.mappedStatus === "delivered") {
    patch.status = compact(queueRow.status) === "replied" ? "replied" : "sent";
  }

  await admin
    .from("outreach_queue")
    .update(patch)
    .eq("id", queueRow.id);
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

  await reconcileOutreachReply({
    conversation,
    contact,
    inboundMessageId: String(data.id),
    messageAt,
  }).catch((reconcileError) => {
    console.error("[whatsapp-webhook] outreach reply reconcile failed:", reconcileError);
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

  const queueId = compact(asRecord(existing.metadata).outreach_queue_id);
  if (queueId) {
    await reconcileOutreachProviderStatus({
      queueId,
      mappedStatus,
      statusAt,
      providerError: compact(updatePayload.error_message) || null,
      conversationId: compact(existing.conversation_id),
      messageId: compact(existing.id),
    }).catch((reconcileError) => {
      console.error("[whatsapp-webhook] outreach provider status reconcile failed:", reconcileError);
    });
  }

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
          referencedProviderMessageId: compact(message.context?.id) || null,
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
