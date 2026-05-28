import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

function supabaseUrlHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return "(invalid-url)";
  }
}

console.log("[supabase-debug] client config", {
  readsUrlFrom: "NEXT_PUBLIC_SUPABASE_URL",
  readsAnonKeyFrom: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  urlConfigured: Boolean(supabaseUrl),
  anonKeyConfigured: Boolean(supabaseAnonKey),
  urlHost: supabaseUrlHost(supabaseUrl),
  hasSupabaseConfig,
});
