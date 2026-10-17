import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Энэ singleton-ийг lib/supabase/content.ts server дээр ч (anon, нийтийн агуулга) ашигладаг.
 * Зөвхөн server (window байхгүй) үед 8с timeout-тэй fetch өгнө — browser-ийн зан хэвээр.
 */
const serverOnlyGlobal =
  typeof window === "undefined" ? { global: { fetch: fetchWithTimeout } } : {};

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createBrowserClient(supabaseUrl!, supabaseAnonKey!, serverOnlyGlobal)
  : null;
