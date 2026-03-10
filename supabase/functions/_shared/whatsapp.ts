import { compact } from "./http.ts";
import type { MessagingChannelRow } from "./channels.ts";

const META_GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v22.0";

export function normalizePhone(value: string | null | undefined) {
  return compact(value).replace(/[^\d]/g, "");
}

export async function verifyMetaSignature(secret: string, payload: string, signature: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = "sha256=" + Array.from(new Uint8Array(signed))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");

  return expected === signature;
}

export function resolveWhatsAppConfig(channel?: MessagingChannelRow | null) {
  const token = channel?.access_token || Deno.env.get("WHATSAPP_TOKEN");
  const phoneNumberId = channel?.phone_number_id || Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const businessPhone = channel?.phone_number || Deno.env.get("WHATSAPP_BUSINESS_PHONE_NUMBER") || null;
  const externalAccountId = channel?.external_account_id || Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID") || null;

  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp channel is not configured");
  }

  return {
    token,
    phoneNumberId,
    businessPhone,
    externalAccountId,
  };
}

export async function sendWhatsAppText(channel: MessagingChannelRow | null | undefined, to: string, body: string) {
  const config = resolveWhatsAppConfig(channel);
  const normalizedTo = normalizePhone(to);

  if (!normalizedTo) {
    throw new Error("Missing WhatsApp recipient phone");
  }

  const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "text",
      text: {
        preview_url: false,
        body,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "WhatsApp send failed");
  }

  return data as {
    messages?: Array<{ id?: string }>;
    contacts?: Array<{ wa_id?: string; input?: string }>;
  };
}
