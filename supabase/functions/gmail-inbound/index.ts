import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { executeTriggeredWorkflows } from "../_shared/automation.ts";
import { getHeader, extractMessageText, fetchGmailMessage, listGmailHistory } from "../_shared/gmail.ts";
import { base64UrlDecode, compact, errorResponse, handleCors, jsonResponse, readJson } from "../_shared/http.ts";
import { admin } from "../_shared/supabase.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function isServiceRoleRequest(req: Request) {
  const serviceRole = compact(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const apiKey = compact(req.headers.get("apikey") || req.headers.get("x-api-key"));
  const authHeader = compact(req.headers.get("authorization") || req.headers.get("Authorization"));
  const bearer = authHeader.toLowerCase().startsWith("bearer ") ? compact(authHeader.slice(7)) : "";
  const bearerClaimsServiceRole = (() => {
    if (!bearer) return false;
    const parts = bearer.split(".");
    if (parts.length !== 3) return false;
    try {
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      return compact(payload?.role) === "service_role";
    } catch {
      return false;
    }
  })();

  if (!serviceRole) return false;
  return apiKey === serviceRole || bearer === serviceRole || bearerClaimsServiceRole;
}

async function classifyMessage(content: string, subject: string | null): Promise<Record<string, unknown> | null> {
  if (!OPENAI_API_KEY || !content || content.length < 10) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Classify this inbound email response. Return JSON only:
{ "intent": "interested|not_interested|meeting_request|auto_reply|question|unsubscribe", "confidence": 0.0-1.0, "summary": "one sentence summary", "suggested_action": "create_meeting|send_followup|mark_closed|none" }`,
          },
          {
            role: "user",
            content: `Subject: ${subject || "(none)"}\n\n${content.slice(0, 2000)}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 150,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    return JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
  } catch {
    return null;
  }
}

function parseMailbox(value: string | null) {
  const raw = compact(value);
  if (!raw) return { name: null, email: null };

  const match = raw.match(/^(.*?)(?:<([^>]+)>)?$/);
  const email = (match?.[2] || match?.[1] || "").trim().replace(/^["']|["']$/g, "");
  const name = match?.[2] ? match?.[1]?.trim().replace(/^["']|["']$/g, "") : null;

  return {
    name: name || null,
    email: email.includes("@") ? email.toLowerCase() : null,
  };
}

async function resolveChannel({
  channelId,
  emailAddress,
}: {
  channelId?: string | null;
  emailAddress?: string | null;
}) {
  let query = admin
    .from("messaging_channels")
    .select("*")
    .eq("type", "email")
    .eq("status", "active");

  if (channelId) query = query.eq("id", channelId);
  else if (emailAddress) query = query.eq("email_address", emailAddress);

  const { data, error } = await query.limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

async function loadConversationById(conversationId: string) {
  const { data, error } = await admin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function loadContactById(contactId: string) {
  const { data, error } = await admin
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function findOrCreateContact(userId: string | null, inboxMessage: {
  fromEmail: string;
  fromName: string | null;
}) {
  let query = admin
    .from("contacts")
    .select("*")
    .eq("email", inboxMessage.fromEmail)
    .limit(1);

  query = userId ? query.eq("user_id", userId) : query.is("user_id", null);

  const { data, error } = await query;
  if (error) throw error;

  if (data?.[0]) return data[0];

  const { data: created, error: insertError } = await admin
    .from("contacts")
    .insert({
      user_id: userId,
      name: inboxMessage.fromName || inboxMessage.fromEmail.split("@")[0],
      email: inboxMessage.fromEmail,
      status: "contacted",
      source: "gmail_inbound",
      confidence: 70,
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
  channelId,
  contact,
  threadId,
  messageAt,
}: {
  userId: string | null;
  channelId: string;
  contact: Record<string, unknown>;
  threadId: string | null;
  messageAt: string;
}) {
  if (threadId) {
    let threadQuery = admin
      .from("conversations")
      .select("*")
      .eq("channel_id", channelId)
      .eq("provider_thread_id", threadId)
      .limit(1);

    threadQuery = userId ? threadQuery.eq("user_id", userId) : threadQuery.is("user_id", null);
    const { data: threadedRows, error: threadedError } = await threadQuery;
    if (threadedError) throw threadedError;

    if (threadedRows?.[0]) {
      const { data: updatedByThread, error: updateByThreadError } = await admin
        .from("conversations")
        .update({
          status: "open",
          unread_count: (threadedRows[0].unread_count || 0) + 1,
          last_message_at: messageAt,
          last_inbound_at: messageAt,
          provider_thread_id: threadId,
        })
        .eq("id", threadedRows[0].id)
        .select()
        .single();

      if (updateByThreadError) throw updateByThreadError;
      return updatedByThread;
    }
  }

  let query = admin
    .from("conversations")
    .select("*")
    .eq("contact_id", contact.id)
    .eq("channel_id", channelId)
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
        provider_thread_id: threadId || data[0].provider_thread_id || null,
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
      channel: "email",
      channel_id: channelId,
      external_id: `email:${contact.id}`,
      provider_thread_id: threadId || null,
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

async function loadLatestOutreachQueueRow(field: "conversation_id" | "contact_id" | "recipient_email", value: string) {
  const { data, error } = await admin
    .from("outreach_queue")
    .select("id, metadata")
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
          source: "gmail_inbound",
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", queueRow.id);

  return queueRow.id as string;
}

async function persistInboundMessage({
  userId,
  channel,
  conversation,
  contact,
  gmailMessage,
}: {
  userId: string | null;
  channel: Record<string, unknown>;
  conversation: Record<string, unknown>;
  contact: Record<string, unknown>;
  gmailMessage: Record<string, unknown>;
}) {
  const payload = gmailMessage.payload as Record<string, unknown> | undefined;
  const headers = (payload?.headers as Array<{ name?: string; value?: string }> | undefined) || [];
  const messageId = compact(gmailMessage.id);
  const subject = getHeader(headers, "Subject");
  const content = extractMessageText(gmailMessage);
  const messageAt = gmailMessage.internalDate
    ? new Date(Number(gmailMessage.internalDate)).toISOString()
    : new Date().toISOString();

  const { data: existingRows, error: existingError } = await admin
    .from("messages")
    .select("*")
    .eq("provider_message_id", messageId)
    .limit(1);

  if (existingError) throw existingError;
  if (existingRows?.[0]) return existingRows[0];

  const { data, error } = await admin
    .from("messages")
    .insert({
      user_id: userId,
      conversation_id: conversation.id,
      channel_id: channel.id,
      direction: "inbound",
      subject,
      content,
      content_type: "text",
      status: "received",
      provider_message_id: messageId,
      external_id: messageId,
      metadata: {
        channel: "email",
        from: contact.email,
        subject,
      },
      raw_payload: gmailMessage,
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
    subject: subject || "Inbound Gmail",
    description: `Inbound email received from ${contact.email}.`,
    metadata: {
      channel: "email",
      provider_message_id: messageId,
    },
  });

  await reconcileOutreachReply({
    conversation,
    contact,
    inboundMessageId: String(data.id),
    messageAt,
  }).catch((reconcileError) => {
    console.error("[gmail-inbound] outreach reply reconcile failed:", reconcileError);
  });

  try {
    await executeTriggeredWorkflows({
      triggerKey: "message_in",
      userId,
      context: {
        user_id: userId,
        channel: "email",
        contact_id: contact.id,
        company_id: contact.company_id || null,
        conversation_id: conversation.id,
        message_id: data.id,
        subject,
        body: content,
      },
      sendLive: false,
      source: "gmail_inbound",
    });
  } catch (automationError) {
    console.error("[gmail-inbound] automation trigger failed:", automationError);
  }

  // AI classification is best-effort and runs after message_in trigger.
  try {
    const classification = await classifyMessage(content || "", subject);
    if (classification) {
      await admin
        .from("messages")
        .update({ classification })
        .eq("id", data.id);

      // Emit classified event for downstream automation
      await admin.from("event_log").insert({
        event_type: "message.classified",
        payload: {
          message_id: data.id,
          contact_id: contact.id,
          conversation_id: conversation.id,
          intent: classification.intent,
          confidence: classification.confidence,
          suggested_action: classification.suggested_action,
        },
        user_id: userId,
      });
    }
  } catch (classifyError) {
    console.error("[gmail-inbound] classification failed:", classifyError);
  }

  return data;
}

async function syncChannel(channel: Record<string, unknown>, currentHistoryId?: string | number | null) {
  const channelHistoryId = channel.last_history_id || currentHistoryId || null;

  if (!channelHistoryId) {
    await admin
      .from("messaging_channels")
      .update({
        last_history_id: currentHistoryId ? Number(currentHistoryId) : null,
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", channel.id);

    return { synced: 0, historyId: currentHistoryId || null };
  }

  const history = await listGmailHistory(channel as any, channelHistoryId);
  const addedMessageIds = (history.history || [])
    .flatMap(item => item.messagesAdded || [])
    .map(item => compact(item.message?.id))
    .filter(Boolean);

  let processed = 0;

  for (const messageId of addedMessageIds) {
    const gmailMessage = await fetchGmailMessage(channel as any, messageId);
    const payload = gmailMessage.payload as Record<string, unknown> | undefined;
    const headers = (payload?.headers as Array<{ name?: string; value?: string }> | undefined) || [];
    const fromMailbox = parseMailbox(getHeader(headers, "From"));

    if (!fromMailbox.email || fromMailbox.email.toLowerCase() === compact(channel.email_address).toLowerCase()) {
      continue;
    }

    const messageAt = gmailMessage.internalDate
      ? new Date(Number(gmailMessage.internalDate)).toISOString()
      : new Date().toISOString();
    const contact = await findOrCreateContact(channel.user_id || null, {
      fromEmail: fromMailbox.email,
      fromName: fromMailbox.name,
    });
    const conversation = await findOrCreateConversation({
      userId: channel.user_id || null,
      channelId: channel.id,
      contact,
      threadId: compact(gmailMessage.threadId) || null,
      messageAt,
    });

    await persistInboundMessage({
      userId: channel.user_id || null,
      channel,
      conversation,
      contact,
      gmailMessage,
    });

    processed += 1;
  }

  await admin
    .from("messaging_channels")
    .update({
      last_history_id: Number(history.historyId || currentHistoryId || channel.last_history_id || 0) || null,
      last_sync_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", channel.id);

  return {
    synced: processed,
    historyId: history.historyId || currentHistoryId || channel.last_history_id || null,
  };
}

async function processSyntheticInbound(body: {
  channel_id?: string;
  conversation_id?: string;
  contact_id?: string;
  from_email?: string;
  from_name?: string;
  subject?: string;
  body?: string;
  message_at?: string;
  provider_message_id?: string;
  correlation_id?: string;
  trigger_workflows?: boolean;
}) {
  const channelId = compact(body.channel_id);
  const conversationId = compact(body.conversation_id);
  const contactId = compact(body.contact_id);
  const content = compact(body.body);

  if (!channelId) return errorResponse("channel_id is required", 400);
  if (!conversationId) return errorResponse("conversation_id is required", 400);
  if (!contactId) return errorResponse("contact_id is required", 400);
  if (!content) return errorResponse("body is required", 400);

  const channel = await resolveChannel({ channelId, emailAddress: null });
  if (!channel) return errorResponse("Gmail channel not found", 404);

  const conversation = await loadConversationById(conversationId);
  if (!conversation) return errorResponse("Conversation not found", 404);

  const contact = await loadContactById(contactId);
  if (!contact) return errorResponse("Contact not found", 404);

  const messageAt = compact(body.message_at) || new Date().toISOString();
  const providerMessageId = compact(body.provider_message_id) || `synthetic-gmail-${crypto.randomUUID()}`;
  const subject = compact(body.subject) || "Synthetic inbound reply";
  const correlationId = compact(body.correlation_id) || null;

  const syntheticPayload = {
    id: providerMessageId,
    threadId: compact(conversation.provider_thread_id) || `synthetic-thread-${crypto.randomUUID()}`,
    internalDate: String(Date.parse(messageAt) || Date.now()),
    payload: {
      headers: [
        { name: "From", value: compact(body.from_email) || compact(contact.email) || "synthetic@oculops.local" },
        { name: "Subject", value: subject },
      ],
      body: {
        data: "",
      },
    },
    synthetic: true,
  };

  const { data: insertedMessage, error: insertError } = await admin
    .from("messages")
    .insert({
      org_id: conversation.org_id || contact.org_id || null,
      user_id: conversation.user_id || contact.user_id || null,
      conversation_id: conversation.id,
      channel_id: channel.id,
      direction: "inbound",
      subject,
      content,
      content_type: "text",
      status: "received",
      provider_message_id: providerMessageId,
      external_id: providerMessageId,
      metadata: {
        channel: "email",
        from: compact(body.from_email) || compact(contact.email) || null,
        from_name: compact(body.from_name) || compact(contact.name) || null,
        subject,
        correlation_id: correlationId,
        synthetic: true,
      },
      raw_payload: syntheticPayload,
      created_at: messageAt,
      updated_at: messageAt,
    })
    .select()
    .single();
  if (insertError || !insertedMessage) {
    throw insertError || new Error("Unable to insert synthetic inbound message");
  }

  await admin
    .from("conversations")
    .update({
      status: "open",
      unread_count: Number(conversation.unread_count || 0) + 1,
      last_message_at: messageAt,
      last_inbound_at: messageAt,
      channel_id: channel.id,
      channel: "email",
      metadata: {
        ...(asRecord(conversation.metadata)),
        last_channel_type: "email",
        synthetic_last_inbound: {
          at: messageAt,
          provider_message_id: providerMessageId,
        },
      },
    })
    .eq("id", conversation.id);

  const reconciledQueueId = await reconcileOutreachReply({
    conversation,
    contact,
    inboundMessageId: String(insertedMessage.id),
    messageAt,
  }).catch((reconcileError) => {
    console.error("[gmail-inbound synthetic] outreach reply reconcile failed:", reconcileError);
    return null;
  });

  if (body.trigger_workflows !== false) {
    try {
      await executeTriggeredWorkflows({
        triggerKey: "message_in",
        userId: compact(conversation.user_id) || null,
        context: {
          user_id: compact(conversation.user_id) || null,
          channel: "email",
          contact_id: conversation.contact_id || contact.id,
          company_id: conversation.company_id || contact.company_id || null,
          conversation_id: conversation.id,
          message_id: insertedMessage.id,
          subject,
          body: content,
          synthetic: true,
        },
        sendLive: false,
        source: "gmail_inbound_synthetic",
      });
    } catch (automationError) {
      console.error("[gmail-inbound synthetic] automation trigger failed:", automationError);
    }
  }

  let queueRow = null;
  if (reconciledQueueId) {
    const { data, error } = await admin
      .from("outreach_queue")
      .select("id,status,provider_status,replied_at,message_id,metadata")
      .eq("id", reconciledQueueId)
      .maybeSingle();
    if (!error) queueRow = data || null;
  }

  return jsonResponse({
    ok: true,
    synthetic: true,
    inbound_message: insertedMessage,
    reconciled_queue_id: reconciledQueueId,
    queue: queueRow,
  });
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
      channel_id?: string;
      email_address?: string;
      history_id?: string;
      conversation_id?: string;
      contact_id?: string;
      from_email?: string;
      from_name?: string;
      subject?: string;
      body?: string;
      message_at?: string;
      provider_message_id?: string;
      correlation_id?: string;
      trigger_workflows?: boolean;
      message?: {
        data?: string;
      };
    }>(req);

    if (body.action === "synthetic_inbound") {
      if (!isServiceRoleRequest(req)) {
        return errorResponse("Forbidden", 403);
      }
      return processSyntheticInbound(body);
    }

    if (body.action === "sync") {
      const channel = await resolveChannel({
        channelId: body.channel_id || null,
        emailAddress: body.email_address || null,
      });

      if (!channel) return errorResponse("Gmail channel not found", 404);

      const result = await syncChannel(channel, body.history_id || null);
      return jsonResponse({ ok: true, ...result });
    }

    const envelope = body.message?.data ? JSON.parse(base64UrlDecode(body.message.data)) : null;
    const emailAddress = compact(envelope?.emailAddress);
    const historyId = compact(envelope?.historyId);
    const channel = await resolveChannel({ emailAddress });

    if (!channel) {
      return jsonResponse({ ok: true, skipped: true, reason: "unknown channel" });
    }

    const result = await syncChannel(channel, historyId || null);
    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Gmail inbound sync failed", 500);
  }
});
