import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { bootstrapWhatsAppChannel } from "../_shared/channels.ts";
import { buildGmailOAuthUrl, exchangeGoogleCode, fetchGmailProfileFromAccessToken, activateGmailWatch } from "../_shared/gmail.ts";
import { errorResponse, handleCors, htmlResponse, jsonResponse, readJson } from "../_shared/http.ts";
import { admin, getAuthUser } from "../_shared/supabase.ts";

const appUrl = Deno.env.get("APP_URL") || Deno.env.get("PUBLIC_APP_URL") || "http://127.0.0.1:4173/messaging";

async function listChannels(userId: string | null) {
  let query = admin
    .from("messaging_channels")
    .select("*")
    .order("type", { ascending: true })
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (userId) query = query.or(`user_id.eq.${userId},user_id.is.null`);
  else query = query.is("user_id", null);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function callbackHtml(ok: boolean, message: string) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Messaging Channel</title>
    <style>
      body { font-family: sans-serif; background: #0b1017; color: #f5f7fb; display: grid; place-items: center; min-height: 100vh; margin: 0; }
      main { max-width: 440px; padding: 28px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
      h1 { margin: 0 0 8px; font-size: 20px; }
      p { margin: 0 0 16px; color: rgba(255,255,255,0.75); line-height: 1.5; }
      a, button { color: #111; background: #f5f7fb; border: 0; border-radius: 10px; padding: 10px 14px; cursor: pointer; text-decoration: none; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <h1>${ok ? "Channel connected" : "Connection failed"}</h1>
      <p>${message}</p>
      <button onclick="window.opener && window.opener.postMessage({ type: 'antigravity:channel-connected', ok: ${ok ? "true" : "false"} }, '*'); window.location.href='${appUrl}'">Back to app</button>
    </main>
  </body>
</html>`;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const user = await getAuthUser(req);
    const userId = user?.id || null;
    const url = new URL(req.url);

    if (req.method === "GET" && (url.searchParams.get("code") || url.searchParams.get("error"))) {
      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        return htmlResponse(callbackHtml(false, `Google returned: ${error}`), 400);
      }

      if (!state || !code) {
        return htmlResponse(callbackHtml(false, "Missing Google OAuth state or code."), 400);
      }

      const { data: channel, error: channelError } = await admin
        .from("messaging_channels")
        .select("*")
        .contains("metadata", { oauth_state: state })
        .maybeSingle();

      if (channelError || !channel) {
        return htmlResponse(callbackHtml(false, "OAuth channel state was not found."), 404);
      }

      const tokens = await exchangeGoogleCode(code);
      const profile = await fetchGmailProfileFromAccessToken(tokens.access_token);

      const { data: updatedChannel, error: updateError } = await admin
        .from("messaging_channels")
        .update({
          user_id: channel.user_id || userId || null,
          name: `Gmail · ${profile.emailAddress}`,
          type: "email",
          provider: "gmail",
          status: "active",
          is_default: true,
          email_address: profile.emailAddress,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || channel.refresh_token || null,
          token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          scope: (tokens.scope || "").split(/\s+/).filter(Boolean),
          last_history_id: Number(profile.historyId || 0) || channel.last_history_id || null,
          last_sync_at: new Date().toISOString(),
          last_error: null,
          metadata: {
            ...(channel.metadata || {}),
            oauth_state: null,
            email: profile.emailAddress,
          },
        })
        .eq("id", channel.id)
        .select()
        .single();

      if (updateError || !updatedChannel) {
        throw updateError || new Error("Unable to store Gmail channel");
      }

      try {
        const watch = await activateGmailWatch(updatedChannel);
        if (watch?.historyId) {
          await admin
            .from("messaging_channels")
            .update({
              last_history_id: Number(watch.historyId),
              metadata: {
                ...(updatedChannel.metadata || {}),
                gmail_watch_expiration: watch.expiration || null,
              },
            })
            .eq("id", updatedChannel.id);
        }
      } catch (watchError) {
        await admin
          .from("messaging_channels")
          .update({ last_error: watchError instanceof Error ? watchError.message : "Gmail watch failed" })
          .eq("id", updatedChannel.id);
      }

      return htmlResponse(callbackHtml(true, `${profile.emailAddress} is now connected to Messaging Hub.`));
    }

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const body = await readJson<{
      action?: string;
      channel?: string;
      channel_id?: string;
    }>(req);

    const action = body.action || "list";

    if (action === "list") {
      return jsonResponse({
        ok: true,
        channels: await listChannels(userId),
      });
    }

    if (action === "begin") {
      if ((body.channel || "email") !== "email") {
        return errorResponse("Only Gmail OAuth is supported by this endpoint");
      }

      const state = crypto.randomUUID();
      let existingQuery = admin
        .from("messaging_channels")
        .select("*")
        .eq("type", "email");

      existingQuery = userId ? existingQuery.eq("user_id", userId) : existingQuery.is("user_id", null);

      const { data: existingRows, error: existingError } = await existingQuery.limit(1);
      if (existingError) throw existingError;

      const payload = {
        user_id: userId,
        name: "Gmail",
        type: "email",
        provider: "gmail",
        status: "connecting",
        is_default: true,
        metadata: {
          oauth_state: state,
        },
      };

      let channel;
      if (existingRows?.[0]) {
        const { data, error } = await admin
          .from("messaging_channels")
          .update(payload)
          .eq("id", existingRows[0].id)
          .select()
          .single();
        if (error) throw error;
        channel = data;
      } else {
        const { data, error } = await admin
          .from("messaging_channels")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        channel = data;
      }

      if (!channel) {
        throw new Error("Unable to create Gmail channel");
      }

      return jsonResponse({
        ok: true,
        auth_url: buildGmailOAuthUrl(state),
        channel,
      });
    }

    if (action === "bootstrap_whatsapp") {
      const channel = await bootstrapWhatsAppChannel(userId);
      return jsonResponse({ ok: true, channel });
    }

    if (action === "disconnect") {
      const channelId = body.channel_id;
      if (!channelId) return errorResponse("channel_id is required");

      const { data, error } = await admin
        .from("messaging_channels")
        .update({
          status: "disconnected",
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
        })
        .eq("id", channelId)
        .select()
        .single();

      if (error) throw error;
      return jsonResponse({ ok: true, channel: data });
    }

    return errorResponse("Unsupported action", 400);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Channel connection failed", 500);
  }
});
