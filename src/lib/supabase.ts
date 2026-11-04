import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof (globalThis as any).process !== "undefined" && (globalThis as any).process.env?.VITE_SUPABASE_URL) ||
  "https://placeholder.supabase.co";
const supabaseAnonKey =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof (globalThis as any).process !== "undefined" && (globalThis as any).process.env?.VITE_SUPABASE_ANON_KEY) ||
  "placeholder-key";

const isAuthCallback =
  typeof window !== "undefined" &&
  (window.location.hash.includes("access_token") ||
    (window.location.search.includes("code=") &&
      (window.location.pathname.includes("/login") || window.location.pathname.includes("/auth"))));

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: isAuthCallback,
  },
});
