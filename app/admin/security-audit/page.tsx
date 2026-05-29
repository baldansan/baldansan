import { SecurityAuditView } from "@/components/admin/security-audit-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Security / RLS Audit — Admin",
};

export default function AdminSecurityAuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Security / RLS Audit
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Production launch өмнөх auth, RLS, storage, admin access, secret safety
          шалгалт.
        </p>
      </section>
      <SecurityAuditView />
    </div>
  );
}
