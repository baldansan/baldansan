import Link from "next/link";
import { AdminCollapsibleSection } from "@/components/admin/admin-editor-ui";
import { ADMIN_NAV_ADVANCED } from "@/lib/admin/admin-nav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings — Admin",
};

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Нэмэлт admin хэрэгслүүд — өдөр тутмын ажилд ихэвчлэн хэрэггүй.
        </p>
      </section>

      <AdminCollapsibleSection
        title="Advanced tools"
        description="Activity log, tasks, analytics, system checks, and audits."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_NAV_ADVANCED.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-800"
            >
              <span aria-hidden className="mr-2">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </AdminCollapsibleSection>

      <p className="text-sm text-slate-500">
        <Link href="/" className="text-emerald-700 hover:text-emerald-800">
          ← Learner app
        </Link>
      </p>
    </div>
  );
}
