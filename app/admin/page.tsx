import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminDashboardError } from "@/components/admin/admin-dashboard-error";
import { getAdminDashboardMetrics } from "@/lib/supabase/admin-analytics";
import { getSupabaseEnvPresence } from "@/lib/dev/local-debug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Admin — Buunduu Surtsgaay",
};

export default async function AdminPage() {
  try {
    const metrics = await getAdminDashboardMetrics();
    return <AdminDashboard metrics={metrics} />;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load admin dashboard metrics.";
    const env = getSupabaseEnvPresence();
    const warnings: string[] = [];
    if (!env.supabaseUrlPresent || !env.supabaseAnonKeyPresent) {
      warnings.push(
        "Supabase env vars missing in .env.local — dashboard metrics require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return <AdminDashboardError errorMessage={message} warnings={warnings} />;
  }
}
