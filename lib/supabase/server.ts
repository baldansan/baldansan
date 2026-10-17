import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { fetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasServerSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

/** Supabase client with the current user's session from cookies (Server Components / Route Handlers). */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  if (!hasServerSupabaseConfig) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    // Гацсан query 8с-д алдаа буцаана (fetch-with-timeout.ts).
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component that cannot set cookies — safe to ignore on read.
        }
      },
    },
  });
}

/**
 * Cookie-ГҮЙ anon клиент — нийтийн (RLS public read) дата, unstable_cache дотор ашиглана.
 * unstable_cache дотор cookies() дуудаж болдоггүй тул createServerSupabaseClient энд тохирохгүй.
 */
export function createAnonServerSupabaseClient(): SupabaseClient | null {
  if (!hasServerSupabaseConfig) return null;
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fetchWithTimeout },
  });
}
