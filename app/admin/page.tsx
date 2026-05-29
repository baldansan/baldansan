import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminDashboardMetrics } from "@/lib/supabase/admin-analytics";
import { getAdminTaskCenterData } from "@/lib/supabase/admin-tasks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Buunduu Surtsgaay",
};

export default async function AdminPage() {
  const [metrics, taskCenter] = await Promise.all([
    getAdminDashboardMetrics(),
    getAdminTaskCenterData(),
  ]);

  const urgentTasks = taskCenter.tasks
    .filter(
      (task) => task.severity === "critical" || task.severity === "warning"
    )
    .slice(0, 5);

  return (
    <AdminDashboard
      metrics={metrics}
      taskSummary={taskCenter.summary}
      urgentTasks={urgentTasks}
    />
  );
}
