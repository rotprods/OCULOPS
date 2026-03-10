import { createClient } from "jsr:@supabase/supabase-js@2";
import { getBearerToken } from "./http.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

export const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function getAuthUser(req: Request) {
  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await admin.auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
}

export function applyUserScope<T extends { eq: Function; is: Function }>(query: T, userId: string | null | undefined) {
  if (userId) return query.eq("user_id", userId);
  return query.is("user_id", null);
}

export async function selectScopedRows<T = Record<string, unknown>>(
  table: string,
  userId: string | null | undefined,
  fallbackToGlobal = true,
) {
  if (userId) {
    const { data, error } = await admin
      .from(table)
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    if ((data || []).length > 0 || !fallbackToGlobal) return (data || []) as T[];
  }

  const { data, error } = await admin
    .from(table)
    .select("*")
    .is("user_id", null);

  if (error) throw error;
  return (data || []) as T[];
}

export async function getScopedRowById<T = Record<string, unknown>>(
  table: string,
  id: string,
  userId: string | null | undefined,
) {
  let query = admin
    .from(table)
    .select("*")
    .eq("id", id);

  query = applyUserScope(query, userId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as T | null;
}
