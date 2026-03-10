import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { resolveMessagingChannel } from "../_shared/channels.ts";
import { sendGmailMessage } from "../_shared/gmail.ts";
import { compact, errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { admin, getAuthUser } from "../_shared/supabase.ts";
import { normalizePhone, sendWhatsAppText } from "../_shared/whatsapp.ts";

function inferChannelType({
  explicit,
  message,
  conversation,
  channel,
}: {
  explicit?: string | null;
  message?: Record<string, unknown> | null;
  conversation?: Record<string, unknown> | null;
  channel?: Record<string, unknown> | null;
}) {
  return compact(explicit)
    || compact(channel?.type)
    || compact(message?.metadata?.channel)
    || compact(conversation?.channel)
    || (compact(conversation?.external_id).includes(":") ? compact(conversation?.external_id).split(":")[0] : "")
    || "email";
}

async function loadMessage(messageId: string) {
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle();

  if (error) throw error;
  return data as any;
}

async function loadConversation(conversationId: string) {
  const { data, error } = await admin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw error;
  return data as any;
}

async function loadContact(contactId: string | null | undefined) {
  if (!contactId) return null;
  const { data, error } = await admin
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .maybeSingle();

  if (error) throw error;
  return data as any;
}

async function upsertOutboundMessage({
  messageId,
  conversationId,
  userId,
  channelId,
  content,
  subject,
  metadata,
  providerMessageId,
  externalId,
  status,
  rawPayload,
  errorMessage,
}: {
  messageId?: string | null;
  conversationId: string;
  userId: string | null;
  channelId?: string | null;
  content: string;
  subject?: string | null;
  metadata: Record<string, unknown>;
  providerMessageId?: string | null;
  externalId?: string | null;
  status: string;
  rawPayload?: Record<string, unknown>;
  errorMessage?: string | null;
}) {
  const payload = {
    user_id: userId,
    conversation_id: conversationId,
    channel_id: channelId || null,
    direction: "outbound",
    content,
    subject: subject || null,
    content_type: "text",
    status,
    metadata,
    provider_message_id: providerMessageId || null,
    external_id: externalId || null,
    raw_payload: rawPayload || {},
    error_message: errorMessage || null,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  };

  if (messageId) {
    const { data, error } = await admin
      .from("messages")
      .update(payload)
      .eq("id", messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await admin
    .from("messages")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const user = await getAuthUser(req);
    const userId = user?.id || null;
    const body = await readJson<{
      message_id?: string;
      conversation_id?: string;
      channel_id?: string;
      channel?: string;
      to?: string;
      subject?: string;
      body?: string;
      content?: string;
      metadata?: Record<string, unknown>;
    }>(req);

    const existingMessage: any = body.message_id ? await loadMessage(body.message_id) : null;
    const conversationId = body.conversation_id || compact(existingMessage?.conversation_id);
    if (!conversationId) {
      return errorResponse("conversation_id or message_id is required");
    }

    const conversation: any = await loadConversation(conversationId);
    if (!conversation) {
      return errorResponse("Conversation not found", 404);
    }

    const contact: any = await loadContact(compact(conversation.contact_id) || compact(body.metadata?.contact_id) || null);
    const channelType = inferChannelType({
      explicit: body.channel || null,
      message: existingMessage,
      conversation,
    });

    if (!["email", "whatsapp"].includes(channelType)) {
      return errorResponse(`${channelType} is not provider-backed yet. Use Gmail or WhatsApp.`, 400);
    }

    const channel = await resolveMessagingChannel(channelType, userId || compact(conversation.user_id) || null, body.channel_id || compact(conversation.channel_id) || null, ["active"]);
    if (!channel) {
      return errorResponse(`No active ${channelType} channel is connected`, 400);
    }

    const existingMetadata = (existingMessage?.metadata as Record<string, unknown>) || {};
    const subject = compact(body.subject) || compact(existingMessage?.subject) || compact(existingMetadata.subject) || null;
    const content = compact(body.body) || compact(body.content) || compact(existingMessage?.content);

    if (!content) {
      return errorResponse("Message content is required");
    }

    let recipient = compact(body.to);
    if (!recipient && channelType === "email") {
      recipient = compact(contact?.email) || compact(existingMetadata.email);
    }
    if (!recipient && channelType === "whatsapp") {
      recipient = normalizePhone(compact(contact?.phone) || compact(existingMetadata.phone));
    }

    if (!recipient) {
      return errorResponse(`No ${channelType === "email" ? "email" : "phone"} recipient found`);
    }

    const sendResult = channelType === "email"
      ? await sendGmailMessage(channel, {
        to: recipient,
        subject,
        body: content,
        threadId: compact(conversation.provider_thread_id) || null,
      })
      : await sendWhatsAppText(channel, recipient, content);

    const providerMessageId = channelType === "email"
      ? compact((sendResult as { id?: string }).id)
      : compact((sendResult as { messages?: Array<{ id?: string }> }).messages?.[0]?.id);
    const providerThreadId = channelType === "email"
      ? compact((sendResult as { threadId?: string }).threadId)
      : compact(conversation.provider_thread_id);

    const metadata = {
      ...(existingMetadata || {}),
      ...(body.metadata || {}),
      channel: channelType,
      subject,
      recipient,
      channel_id: channel.id,
    };

    const persistedMessage = await upsertOutboundMessage({
      messageId: body.message_id || null,
      conversationId,
      userId: userId || compact(conversation.user_id) || null,
      channelId: channel.id,
      content,
      subject,
      metadata,
      providerMessageId: providerMessageId || null,
      externalId: providerMessageId || null,
      status: "sent",
      rawPayload: sendResult as Record<string, unknown>,
    });

    await admin
      .from("conversations")
      .update({
        user_id: userId || conversation.user_id || null,
        company_id: conversation.company_id || contact?.company_id || null,
        channel_id: channel.id,
        channel: channelType,
        provider_thread_id: providerThreadId || null,
        status: "sent",
        last_message_at: new Date().toISOString(),
        last_outbound_at: new Date().toISOString(),
        metadata: {
          ...(conversation.metadata as Record<string, unknown> || {}),
          last_channel_type: channelType,
        },
      })
      .eq("id", conversationId);

    if (contact?.id) {
      await admin.from("crm_activities").insert({
        user_id: userId || conversation.user_id || null,
        contact_id: contact.id,
        company_id: contact.company_id || conversation.company_id || null,
        conversation_id: conversationId,
        type: "message_sent",
        subject: subject || `Outbound ${channelType}`,
        description: `Outbound ${channelType} sent to ${recipient}.`,
        metadata: {
          channel: channelType,
          message_id: persistedMessage.id,
          provider_message_id: providerMessageId || null,
        },
      });
    }

    return jsonResponse({
      ok: true,
      channel: channelType,
      message: persistedMessage,
      provider_response: sendResult,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Dispatch failed", 500);
  }
});
