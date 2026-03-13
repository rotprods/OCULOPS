#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function parseEnvContent(content) {
  const parsed = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2] ?? "";
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function loadEnvFile(relativePath) {
  const filePath = path.resolve(projectRoot, relativePath);
  if (!existsSync(filePath)) return {};
  return parseEnvContent(readFileSync(filePath, "utf8"));
}

function resolveEnv(keys) {
  const merged = {
    ...loadEnvFile(".env"),
    ...loadEnvFile("supabase/.env.deploy"),
    ...process.env,
  };
  const out = {};
  for (const key of keys) out[key] = merged[key] || "";
  return out;
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function compact(value) {
  return value == null ? "" : String(value).trim();
}

async function rest({ baseUrl, serviceKey, method = "GET", pathName, query = "", body, preferRepresentation = false }) {
  const url = `${baseUrl}/rest/v1/${pathName}${query ? `?${query}` : ""}`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  if (preferRepresentation) {
    headers.Prefer = "return=representation";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { status: response.status, ok: response.ok, data };
}

async function callFunction({ baseUrl, serviceKey, functionName, body }) {
  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  return { status: response.status, ok: response.ok, data };
}

function buildMarkdown(report) {
  const lines = [];
  lines.push("# AG2-C6 Synthetic Smoke");
  lines.push("");
  lines.push(`Generated at: ${report.generated_at}`);
  lines.push(`Result: ${report.success ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## Flow");
  lines.push("");
  lines.push("- Create synthetic outbound queue + sent message");
  lines.push("- Trigger `gmail-inbound` synthetic inbound action");
  lines.push("- Verify `outreach_queue.status = replied` and message linkage");
  lines.push("");
  lines.push("## Verification");
  lines.push("");
  lines.push(`- Queue status: ${report.verification.queue_status}`);
  lines.push(`- Provider status: ${report.verification.provider_status}`);
  lines.push(`- Queue message_id == inbound message id: ${report.verification.queue_message_matches_inbound}`);
  lines.push(`- Conversation last_inbound_at set: ${report.verification.conversation_last_inbound_set}`);
  lines.push("");
  lines.push("## IDs");
  lines.push("");
  lines.push(`- org_id: \`${report.ids.org_id}\``);
  lines.push(`- channel_id: \`${report.ids.channel_id}\``);
  lines.push(`- contact_id: \`${report.ids.contact_id}\``);
  lines.push(`- conversation_id: \`${report.ids.conversation_id}\``);
  lines.push(`- queue_id: \`${report.ids.queue_id}\``);
  lines.push(`- outbound_message_id: \`${report.ids.outbound_message_id}\``);
  lines.push(`- inbound_message_id: \`${report.ids.inbound_message_id}\``);
  lines.push("");
  lines.push("## Artifacts");
  lines.push("");
  lines.push(`- JSON: \`${report.artifacts.json_path}\``);
  lines.push(`- Markdown: \`${report.artifacts.markdown_path}\``);
  return `${lines.join("\n")}\n`;
}

async function run() {
  const env = resolveEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const baseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  assertCondition(baseUrl, "Missing SUPABASE_URL.");
  assertCondition(serviceKey, "Missing SUPABASE_SERVICE_ROLE_KEY.");

  const orgRes = await rest({
    baseUrl,
    serviceKey,
    pathName: "organizations",
    query: "select=id,owner_id&order=created_at.asc&limit=1",
  });
  assertCondition(orgRes.ok, `Failed to resolve organization: HTTP ${orgRes.status}`);
  assertCondition(Array.isArray(orgRes.data) && orgRes.data.length > 0, "No organization row found.");
  const orgId = compact(orgRes.data[0]?.id);
  const ownerId = compact(orgRes.data[0]?.owner_id) || null;
  assertCondition(Boolean(orgId), "Organization id is empty.");

  const runTag = `synthetic-c6-${Date.now()}`;
  const correlationId = `c6-${crypto.randomUUID()}`;
  const recipientEmail = `${runTag}@example.com`;

  const existingChannelRes = await rest({
    baseUrl,
    serviceKey,
    pathName: "messaging_channels",
    query: "select=*&type=eq.email&provider=eq.synthetic_gmail&order=updated_at.desc&limit=1",
  });
  assertCondition(existingChannelRes.ok, `Failed to query synthetic channel: HTTP ${existingChannelRes.status}`);

  let channel = Array.isArray(existingChannelRes.data) ? existingChannelRes.data[0] : null;
  if (!channel) {
    const insertChannelRes = await rest({
      baseUrl,
      serviceKey,
      method: "POST",
      pathName: "messaging_channels",
      preferRepresentation: true,
      body: {
        org_id: orgId,
        user_id: ownerId,
        name: "Synthetic Gmail Harness",
        type: "email",
        provider: "synthetic_gmail",
        status: "active",
        is_default: true,
        email_address: "synthetic-harness@oculops.local",
        metadata: {
          synthetic_harness: true,
          created_by: "smoke-ag2-c6-synthetic",
        },
      },
    });
    assertCondition(insertChannelRes.ok, `Failed to create synthetic channel: HTTP ${insertChannelRes.status}`);
    channel = Array.isArray(insertChannelRes.data) ? insertChannelRes.data[0] : null;
  }
  assertCondition(Boolean(channel?.id), "Synthetic channel id is missing.");

  const contactRes = await rest({
    baseUrl,
    serviceKey,
    method: "POST",
    pathName: "contacts",
    preferRepresentation: true,
    body: {
      org_id: orgId,
      user_id: ownerId,
      name: `Synthetic Contact ${runTag}`,
      email: recipientEmail,
      status: "contacted",
      source: "synthetic_smoke",
      confidence: 80,
      last_contacted_at: new Date().toISOString(),
      data: { synthetic_harness: true, run_tag: runTag },
    },
  });
  assertCondition(contactRes.ok, `Failed to create synthetic contact: HTTP ${contactRes.status}`);
  const contact = Array.isArray(contactRes.data) ? contactRes.data[0] : null;
  assertCondition(Boolean(contact?.id), "Synthetic contact id is missing.");

  const conversationRes = await rest({
    baseUrl,
    serviceKey,
    method: "POST",
    pathName: "conversations",
    preferRepresentation: true,
    body: {
      org_id: orgId,
      user_id: ownerId,
      contact_id: contact.id,
      channel: "email",
      channel_id: channel.id,
      external_id: `email:${contact.id}`,
      subject: `Synthetic outreach ${runTag}`,
      status: "sent",
      unread_count: 0,
      assigned_to: "Inbox",
      metadata: {
        synthetic_harness: true,
        correlation_id: correlationId,
      },
      last_message_at: new Date().toISOString(),
      last_outbound_at: new Date().toISOString(),
    },
  });
  assertCondition(conversationRes.ok, `Failed to create synthetic conversation: HTTP ${conversationRes.status}`);
  const conversation = Array.isArray(conversationRes.data) ? conversationRes.data[0] : null;
  assertCondition(Boolean(conversation?.id), "Synthetic conversation id is missing.");

  const queueRes = await rest({
    baseUrl,
    serviceKey,
    method: "POST",
    pathName: "outreach_queue",
    preferRepresentation: true,
    body: {
      org_id: orgId,
      contact_id: contact.id,
      recipient_name: contact.name,
      recipient_email: recipientEmail,
      template_type: "cold",
      niche: "synthetic",
      subject: `Synthetic outbound ${runTag}`,
      html_body: `<p>Synthetic outbound body ${runTag}</p>`,
      status: "sent",
      approved_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      conversation_id: conversation.id,
      provider_status: "sent",
      provider_message_id: `synthetic-out-${crypto.randomUUID()}`,
      metadata: {
        synthetic_harness: true,
        correlation_id: correlationId,
        run_tag: runTag,
      },
    },
  });
  assertCondition(queueRes.ok, `Failed to create outreach_queue row: HTTP ${queueRes.status}`);
  const queueRow = Array.isArray(queueRes.data) ? queueRes.data[0] : null;
  assertCondition(Boolean(queueRow?.id), "Synthetic outreach_queue id is missing.");

  const outboundRes = await rest({
    baseUrl,
    serviceKey,
    method: "POST",
    pathName: "messages",
    preferRepresentation: true,
    body: {
      org_id: orgId,
      user_id: ownerId,
      conversation_id: conversation.id,
      channel_id: channel.id,
      direction: "outbound",
      content: `Synthetic outbound content ${runTag}`,
      content_type: "text",
      subject: queueRow.subject,
      status: "sent",
      provider_message_id: queueRow.provider_message_id,
      external_id: queueRow.provider_message_id,
      metadata: {
        channel: "email",
        recipient_email: recipientEmail,
        outreach_queue_id: queueRow.id,
        correlation_id: correlationId,
        synthetic_harness: true,
      },
      raw_payload: {
        synthetic_harness: true,
      },
      sent_at: new Date().toISOString(),
    },
  });
  assertCondition(outboundRes.ok, `Failed to create outbound message: HTTP ${outboundRes.status}`);
  const outboundMessage = Array.isArray(outboundRes.data) ? outboundRes.data[0] : null;
  assertCondition(Boolean(outboundMessage?.id), "Synthetic outbound message id is missing.");

  const queueLinkRes = await rest({
    baseUrl,
    serviceKey,
    method: "PATCH",
    pathName: "outreach_queue",
    query: `id=eq.${queueRow.id}`,
    preferRepresentation: true,
    body: {
      message_id: outboundMessage.id,
      metadata: {
        ...(queueRow.metadata || {}),
        synthetic_harness: true,
        correlation_id: correlationId,
      },
    },
  });
  assertCondition(queueLinkRes.ok, `Failed to link outreach_queue.message_id: HTTP ${queueLinkRes.status}`);

  const inboundAction = await callFunction({
    baseUrl,
    serviceKey,
    functionName: "gmail-inbound",
    body: {
      action: "synthetic_inbound",
      channel_id: channel.id,
      conversation_id: conversation.id,
      contact_id: contact.id,
      from_email: recipientEmail,
      from_name: contact.name,
      subject: `Re: ${queueRow.subject}`,
      body: `Synthetic inbound reply for ${runTag}`,
      correlation_id: correlationId,
      trigger_workflows: true,
    },
  });
  assertCondition(inboundAction.ok, `gmail-inbound synthetic action failed: HTTP ${inboundAction.status}`);
  assertCondition(inboundAction.data?.ok === true, "gmail-inbound synthetic action did not return ok=true");
  const inboundMessage = inboundAction.data?.inbound_message || null;
  const inboundMessageId = compact(inboundMessage?.id);
  assertCondition(Boolean(inboundMessageId), "Synthetic inbound message id missing from action response.");

  const queueVerifyRes = await rest({
    baseUrl,
    serviceKey,
    pathName: "outreach_queue",
    query: `select=id,status,provider_status,replied_at,message_id,metadata&id=eq.${queueRow.id}&limit=1`,
  });
  assertCondition(queueVerifyRes.ok, `Failed to verify outreach_queue row: HTTP ${queueVerifyRes.status}`);
  const queueVerify = Array.isArray(queueVerifyRes.data) ? queueVerifyRes.data[0] : null;
  assertCondition(Boolean(queueVerify), "Verification row for outreach_queue not found.");

  const conversationVerifyRes = await rest({
    baseUrl,
    serviceKey,
    pathName: "conversations",
    query: `select=id,last_inbound_at,last_message_at,unread_count,status&id=eq.${conversation.id}&limit=1`,
  });
  assertCondition(conversationVerifyRes.ok, `Failed to verify conversation row: HTTP ${conversationVerifyRes.status}`);
  const conversationVerify = Array.isArray(conversationVerifyRes.data) ? conversationVerifyRes.data[0] : null;

  const verification = {
    queue_status: compact(queueVerify?.status) || "unknown",
    provider_status: compact(queueVerify?.provider_status) || "unknown",
    queue_message_matches_inbound: compact(queueVerify?.message_id) === inboundMessageId,
    conversation_last_inbound_set: Boolean(compact(conversationVerify?.last_inbound_at)),
  };

  const success = verification.queue_status === "replied"
    && verification.provider_status === "replied"
    && verification.queue_message_matches_inbound
    && verification.conversation_last_inbound_set;

  const report = {
    generated_at: new Date().toISOString(),
    success,
    ids: {
      org_id: orgId,
      channel_id: channel.id,
      contact_id: contact.id,
      conversation_id: conversation.id,
      queue_id: queueRow.id,
      outbound_message_id: outboundMessage.id,
      inbound_message_id: inboundMessageId,
      correlation_id: correlationId,
    },
    verification,
    queue: queueVerify,
    conversation: conversationVerify,
    artifacts: {
      json_path: "docs/runbooks/ag2-c6-synthetic-smoke.latest.json",
      markdown_path: "docs/runbooks/ag2-c6-synthetic-smoke.md",
    },
  };

  assertCondition(success, `AG2-C6 synthetic verification failed: ${JSON.stringify(verification)}`);

  const runbookDir = path.resolve(projectRoot, "docs/runbooks");
  await mkdir(runbookDir, { recursive: true });
  const jsonPath = path.resolve(runbookDir, "ag2-c6-synthetic-smoke.latest.json");
  const markdownPath = path.resolve(runbookDir, "ag2-c6-synthetic-smoke.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, buildMarkdown(report), "utf8");

  console.log(JSON.stringify({
    ok: true,
    success,
    ids: report.ids,
    verification,
    artifacts: report.artifacts,
  }, null, 2));
}

run().catch((error) => {
  console.error("[smoke-ag2-c6-synthetic] failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

