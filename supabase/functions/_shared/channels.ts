import { admin } from "./supabase.ts";

export interface MessagingChannelRow {
  id: string;
  user_id: string | null;
  name: string;
  type: string;
  provider: string;
  status: string;
  is_default: boolean;
  email_address?: string | null;
  phone_number?: string | null;
  phone_number_id?: string | null;
  external_account_id?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
  last_history_id?: number | null;
  last_sync_at?: string | null;
  last_error?: string | null;
}

export async function resolveMessagingChannel(
  type: string,
  userId: string | null | undefined,
  channelId?: string | null,
  statuses: string[] = ["active"],
) {
  if (channelId) {
    const { data, error } = await admin
      .from("messaging_channels")
      .select("*")
      .eq("id", channelId)
      .maybeSingle();

    if (error) throw error;
    return data as MessagingChannelRow | null;
  }

  const fetchByScope = async (scopeUserId: string | null) => {
    let query = admin
      .from("messaging_channels")
      .select("*")
      .eq("type", type);

    if (scopeUserId) query = query.eq("user_id", scopeUserId);
    else query = query.is("user_id", null);

    if (statuses.length === 1) query = query.eq("status", statuses[0]);
    else query = query.in("status", statuses);

    const { data, error } = await query
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return (data || [])[0] as MessagingChannelRow | undefined;
  };

  if (userId) {
    const scoped = await fetchByScope(userId);
    if (scoped) return scoped;
  }

  return (await fetchByScope(null)) || null;
}

export async function bootstrapWhatsAppChannel(userId: string | null | undefined) {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const wabaId = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID");
  const businessPhone = Deno.env.get("WHATSAPP_BUSINESS_PHONE_NUMBER");

  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required");
  }

  const scopeQuery = admin
    .from("messaging_channels")
    .select("*")
    .eq("type", "whatsapp");

  const { data: existingRows, error: existingError } = userId
    ? await scopeQuery.eq("user_id", userId).limit(1)
    : await scopeQuery.is("user_id", null).limit(1);

  if (existingError) throw existingError;

  const payload = {
    user_id: userId || null,
    name: businessPhone ? `WhatsApp · ${businessPhone}` : "WhatsApp Cloud",
    type: "whatsapp",
    provider: "whatsapp_cloud",
    status: "active",
    is_default: true,
    phone_number: businessPhone || null,
    phone_number_id: phoneNumberId,
    external_account_id: wabaId || null,
    access_token: token,
    metadata: {
      waba_id: wabaId || null,
      managed_by: "edge_runtime",
    },
    last_error: null,
  };

  if (existingRows?.[0]) {
    const { data, error } = await admin
      .from("messaging_channels")
      .update(payload)
      .eq("id", existingRows[0].id)
      .select()
      .single();

    if (error) throw error;
    return data as MessagingChannelRow;
  }

  const { data, error } = await admin
    .from("messaging_channels")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as MessagingChannelRow;
}
