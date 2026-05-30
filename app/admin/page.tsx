import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminDashboardMetrics } from "@/lib/supabase/admin-analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Buunduu Surtsgaay",
};

export default async function AdminPage() {
  const metrics = await getAdminDashboardMetrics();

  return <AdminDashboard metrics={metrics} />;
}
