import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SystemCheckView } from "@/components/admin/system-check-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "System check — Admin",
};

export default function AdminSystemCheckPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="System Check"
        description="Read-only production readiness checks for Supabase env, auth, admin access, content reads, tasks, activity log, and storage."
      />
      <SystemCheckView />
    </div>
  );
}
