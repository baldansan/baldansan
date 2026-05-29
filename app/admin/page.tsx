import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminDashboardMetrics } from "@/lib/supabase/admin-analytics";
import { getAdminB2BMetrics } from "@/lib/supabase/admin-b2b-metrics";
import {
  getAdminActivityLog,
  getRecentAdminActivity,
} from "@/lib/supabase/admin-activity-log";
import { getDashboardAdminTasks } from "@/lib/supabase/admin-tasks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Buunduu Surtsgaay",
};

export default async function AdminPage() {
  const [metrics, taskCenter, adminActivity, recentAdminActivity, b2bMetrics] =
    await Promise.all([
      getAdminDashboardMetrics(),
      getDashboardAdminTasks(5),
      getAdminActivityLog({ limit: 200 }),
      getRecentAdminActivity(5),
      getAdminB2BMetrics(),
    ]);

  return (
    <AdminDashboard
      metrics={metrics}
      b2bMetrics={b2bMetrics}
      taskSummary={taskCenter.summary}
      activeTasks={taskCenter.activeTasks}
      taskWarnings={taskCenter.warnings}
      adminActivitySummary={adminActivity.summary}
      recentAdminActivity={recentAdminActivity.rows}
      adminActivityWarnings={[
        ...adminActivity.warnings,
        ...recentAdminActivity.warnings,
      ]}
    />
  );
}
