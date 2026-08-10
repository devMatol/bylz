import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Operator/job authorization for edge functions that act on the whole platform
 * with the service role key.
 *
 * `verify_jwt` proves nothing about identity: the anon key is published in the
 * browser bundle and satisfies it. A caller is therefore only accepted when it
 * presents the service role key, a scheduler secret, or a session belonging to
 * a platform admin.
 */
export type OperatorCheck = { allowed: boolean; userId: string | null };

export async function requireOperator(req: Request): Promise<OperatorCheck> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const cronSecret = Deno.env.get("CRON_SECRET") || "";

  const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  const headerSecret = req.headers.get("x-cron-secret") || "";

  // Internal scheduler calls.
  if (serviceKey && jwt === serviceKey) return { allowed: true, userId: null };
  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    return { allowed: true, userId: null };
  }

  // Anonymous (or anon-key-only) callers are never operators.
  if (!jwt || jwt === anonKey) return { allowed: false, userId: null };

  const admin = createClient(supabaseUrl, serviceKey);
  const { data } = await admin.auth.getUser(jwt);
  const user = data?.user;
  if (!user) return { allowed: false, userId: null };

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return { allowed: profile?.is_admin === true, userId: user.id };
}

/** Resolve the caller's user id, or null when the request is anonymous. */
export async function resolveCaller(req: Request): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  if (!jwt || jwt === anonKey) return null;
  const admin = createClient(supabaseUrl, serviceKey);
  const { data } = await admin.auth.getUser(jwt);
  return data?.user?.id ?? null;
}

export function unauthorized(corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: "Non autorisé" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
