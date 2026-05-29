import { FinalAuditChecklist } from "@/components/admin/final-audit-checklist";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Phase 5 Final Audit — Admin",
};

export default function AdminFinalAuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Phase 5 Final Audit
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Read-only checklist for admin CMS, release workflow, analytics, tasks,
          activity log, rollback, and security readiness.
        </p>
      </section>
      <FinalAuditChecklist />
    </div>
  );
}
