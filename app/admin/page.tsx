import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminDashboardMetrics } from "@/lib/supabase/admin-analytics";
import { getDashboardAdminTasks } from "@/lib/supabase/admin-tasks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Buunduu Surtsgaay",
};

export default async function AdminPage() {
  const [metrics, taskCenter] = await Promise.all([
    getAdminDashboardMetrics(),
    getDashboardAdminTasks(5),
  ]);

  return (
    <AdminDashboard
      metrics={metrics}
      taskSummary={taskCenter.summary}
      activeTasks={taskCenter.activeTasks}
      taskWarnings={taskCenter.warnings}
    />
  );
}
