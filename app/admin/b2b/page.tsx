import { AdminB2BCrmHome } from "@/components/admin/b2b/admin-b2b-crm-home";
import { getAdminB2BMetrics } from "@/lib/supabase/admin-b2b-metrics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "B2B CRM — Admin",
};

export default async function AdminB2BPage() {
  const metrics = await getAdminB2BMetrics();

  return (
    <AdminB2BCrmHome
      initialSummary={metrics.summary}
      initialRecent={metrics.recentInquiries}
      initialWarnings={metrics.warnings}
    />
  );
}
