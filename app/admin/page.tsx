import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminDashboardError } from "@/components/admin/admin-dashboard-error";
import { getAdminDashboardMetrics } from "@/lib/supabase/admin-analytics";
import { getActivityTimeOverview } from "@/lib/supabase/activity-time-analytics";
import { getSupabaseEnvPresence } from "@/lib/dev/local-debug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Хяналтын самбар — Админ",
};

/** Windows the dashboard offers; anything else falls back to 30 days. */
export const DASHBOARD_WINDOWS = [7, 30, 90] as const;
const DEFAULT_WINDOW = 30;

function resolveWindowDays(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return DASHBOARD_WINDOWS.includes(value as (typeof DASHBOARD_WINDOWS)[number])
    ? value
    : DEFAULT_WINDOW;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const windowDays = resolveWindowDays((await searchParams).days);

  let loaded: {
    metrics: Awaited<ReturnType<typeof getAdminDashboardMetrics>>;
    activity: Awaited<ReturnType<typeof getActivityTimeOverview>>;
  } | null = null;
  let loadError: string | null = null;

  try {
    // Two windows of activity so the cards can show change, not just a total.
    const [metrics, activity] = await Promise.all([
      getAdminDashboardMetrics(),
      getActivityTimeOverview(windowDays * 2),
    ]);
    loaded = { metrics, activity };
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load admin dashboard metrics.";
  }

  if (!loaded) {
    const env = getSupabaseEnvPresence();
    const warnings: string[] = [];
    if (!env.supabaseUrlPresent || !env.supabaseAnonKeyPresent) {
      warnings.push(
        "Supabase env vars missing in .env.local — dashboard metrics require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return (
      <AdminDashboardError
        errorMessage={loadError ?? "Unknown error"}
        warnings={warnings}
      />
    );
  }

  return (
    <AdminDashboard
      metrics={loaded.metrics}
      activity={loaded.activity}
      windowDays={windowDays}
    />
  );
}
