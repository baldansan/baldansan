export type SupabaseEnvPresence = {
  supabaseUrlPresent: boolean;
  supabaseAnonKeyPresent: boolean;
};

export function getSupabaseEnvPresence(): SupabaseEnvPresence {
  return {
    supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function shouldShowLocalDebugDetails(): boolean {
  return process.env.NODE_ENV === "development";
}

export function formatEnvPresence(presence: SupabaseEnvPresence): {
  url: "yes" | "no";
  anonKey: "yes" | "no";
} {
  return {
    url: presence.supabaseUrlPresent ? "yes" : "no",
    anonKey: presence.supabaseAnonKeyPresent ? "yes" : "no",
  };
}
