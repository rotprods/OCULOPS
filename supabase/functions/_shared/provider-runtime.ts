import { compact } from "./http.ts";

export interface ProviderRuntimeStatus {
  provider: "gmail" | "whatsapp";
  ready: boolean;
  checks: Record<string, boolean>;
  required_missing: string[];
  optional_missing: string[];
  capabilities: Record<string, boolean>;
  notes: string[];
}

function envPresent(key: string) {
  return Boolean(compact(Deno.env.get(key)));
}

function deriveMissing(
  checks: Record<string, boolean>,
  requiredKeys: string[],
) {
  return requiredKeys.filter((key) => !checks[key]);
}

export function getGmailRuntimeStatus(): ProviderRuntimeStatus {
  const checks = {
    GOOGLE_OAUTH_CLIENT_ID: envPresent("GOOGLE_OAUTH_CLIENT_ID"),
    GOOGLE_OAUTH_CLIENT_SECRET: envPresent("GOOGLE_OAUTH_CLIENT_SECRET"),
    GMAIL_OAUTH_REDIRECT_URL: envPresent("GMAIL_OAUTH_REDIRECT_URL"),
    GMAIL_PUBSUB_TOPIC_NAME: envPresent("GMAIL_PUBSUB_TOPIC_NAME"),
  };

  const requiredKeys = [
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GMAIL_OAUTH_REDIRECT_URL",
  ];
  const requiredMissing = deriveMissing(checks, requiredKeys);
  const optionalMissing = checks.GMAIL_PUBSUB_TOPIC_NAME ? [] : ["GMAIL_PUBSUB_TOPIC_NAME"];

  const capabilities = {
    oauth_begin: checks.GOOGLE_OAUTH_CLIENT_ID && checks.GMAIL_OAUTH_REDIRECT_URL,
    oauth_callback: checks.GOOGLE_OAUTH_CLIENT_ID && checks.GOOGLE_OAUTH_CLIENT_SECRET && checks.GMAIL_OAUTH_REDIRECT_URL,
    outbound_dispatch: checks.GOOGLE_OAUTH_CLIENT_ID && checks.GOOGLE_OAUTH_CLIENT_SECRET,
    inbound_manual_sync: checks.GOOGLE_OAUTH_CLIENT_ID && checks.GOOGLE_OAUTH_CLIENT_SECRET,
    inbound_push_watch: checks.GMAIL_PUBSUB_TOPIC_NAME,
  };

  const notes: string[] = [];
  if (!checks.GMAIL_PUBSUB_TOPIC_NAME) {
    notes.push("Gmail watch/push is disabled without GMAIL_PUBSUB_TOPIC_NAME; manual sync still works.");
  }

  return {
    provider: "gmail",
    ready: requiredMissing.length === 0,
    checks,
    required_missing: requiredMissing,
    optional_missing: optionalMissing,
    capabilities,
    notes,
  };
}

export function getWhatsAppRuntimeStatus(): ProviderRuntimeStatus {
  const checks = {
    WHATSAPP_TOKEN: envPresent("WHATSAPP_TOKEN"),
    WHATSAPP_PHONE_NUMBER_ID: envPresent("WHATSAPP_PHONE_NUMBER_ID"),
    WHATSAPP_BUSINESS_ACCOUNT_ID: envPresent("WHATSAPP_BUSINESS_ACCOUNT_ID"),
    WHATSAPP_BUSINESS_PHONE_NUMBER: envPresent("WHATSAPP_BUSINESS_PHONE_NUMBER"),
    WHATSAPP_VERIFY_TOKEN: envPresent("WHATSAPP_VERIFY_TOKEN"),
    META_APP_SECRET: envPresent("META_APP_SECRET"),
  };

  const outboundRequired = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"];
  const inboundRequired = ["WHATSAPP_VERIFY_TOKEN", "META_APP_SECRET"];
  const requiredMissing = deriveMissing(checks, outboundRequired);
  const optionalMissing = ["WHATSAPP_BUSINESS_ACCOUNT_ID", "WHATSAPP_BUSINESS_PHONE_NUMBER"].filter((key) => !checks[key]);

  const capabilities = {
    outbound_dispatch: outboundRequired.every((key) => checks[key]),
    inbound_verify_handshake: checks.WHATSAPP_VERIFY_TOKEN,
    inbound_signature_validation: checks.META_APP_SECRET,
    inbound_webhook: inboundRequired.every((key) => checks[key]),
  };

  const notes: string[] = [];
  if (!capabilities.inbound_webhook) {
    notes.push("Inbound webhook verification needs WHATSAPP_VERIFY_TOKEN and META_APP_SECRET.");
  }

  return {
    provider: "whatsapp",
    ready: requiredMissing.length === 0,
    checks,
    required_missing: requiredMissing,
    optional_missing: optionalMissing,
    capabilities,
    notes,
  };
}

export function collectMessagingRuntimeStatus() {
  const gmail = getGmailRuntimeStatus();
  const whatsapp = getWhatsAppRuntimeStatus();

  return {
    generated_at: new Date().toISOString(),
    providers: {
      gmail,
      whatsapp,
    },
    summary: {
      ready_all_required: gmail.ready && whatsapp.ready,
      outbound_ready: {
        gmail: gmail.capabilities.outbound_dispatch,
        whatsapp: whatsapp.capabilities.outbound_dispatch,
      },
      inbound_ready: {
        gmail: gmail.capabilities.inbound_manual_sync,
        whatsapp: whatsapp.capabilities.inbound_webhook,
      },
    },
  };
}

