import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

/*
 * Google OAuth configuration
 * ---------------------------
 * In the Supabase dashboard, go to Authentication > Providers > Google
 * and enable it. Then add the following URLs to the allowed redirect URLs
 * (Authentication > URL Configuration > Redirect URLs):
 *   - https://<your-project>.supabase.co/auth/v1/callback  (for OAuth flow)
 *   - https://<your-app-origin>  (your deployed site origin, for the redirect back)
 * The signInWithGoogle() below uses `redirectTo: window.location.origin` so
 * Supabase sends the user back to the app root after the OAuth dance.
 */

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle(redirectTo?: string) {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo || window.location.origin,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession(): Promise<{ session: Session | null; user: User | null }> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { session: null, user: null };
  return { session: data.session, user: data.session?.user ?? null };
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
