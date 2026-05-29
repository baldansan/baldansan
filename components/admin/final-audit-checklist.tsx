import Link from "next/link";

type AuditStatus = "ready" | "needs check" | "planned";

type AuditItem = {
  label: string;
  status: AuditStatus;
  href?: string;
};

type AuditSection = {
  title: string;
  items: AuditItem[];
};

const SECTIONS: AuditSection[] = [
  {
    title: "Admin access",
    items: [
      { label: "AdminGuard on /admin routes", status: "ready", href: "/admin" },
      {
        label: "admin_profiles table + bootstrap",
        status: "needs check",
        href: "/admin/final-audit",
      },
      { label: "Admin role check (is_admin)", status: "ready", href: "/admin" },
    ],
  },
  {
    title: "Content management",
    items: [
      { label: "Draft lesson creation", status: "ready", href: "/admin/lessons/new" },
      { label: "Metadata edit/save", status: "ready", href: "/admin/lessons" },
      { label: "Subtitle editor", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Vocabulary editor", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Quiz editor", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Bulk JSON import", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Export backup", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Duplicate / restore", status: "ready", href: "/admin/lessons/5/edit" },
    ],
  },
  {
    title: "Release workflow",
    items: [
      { label: "QA readiness checklist", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Approve for publish", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Publish / unpublish / archive", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Public visibility (available only)", status: "ready", href: "/courses/hsk5" },
    ],
  },
  {
    title: "Media",
    items: [
      { label: "Media metadata fields", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Storage bucket lesson-media", status: "needs check" },
      { label: "Thumbnail / video / audio URLs", status: "ready", href: "/admin/lessons/5/edit" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Admin dashboard metrics", status: "ready", href: "/admin" },
      { label: "Per-lesson analytics", status: "ready", href: "/admin/analytics" },
      { label: "Question analytics", status: "ready", href: "/admin/analytics/questions" },
      {
        label: "Vocabulary analytics",
        status: "ready",
        href: "/admin/analytics/vocabulary",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Task center", status: "ready", href: "/admin/tasks" },
      { label: "Persistent admin tasks", status: "ready", href: "/admin/tasks" },
      { label: "Activity log", status: "ready", href: "/admin/activity" },
      { label: "Rollback preview + execution", status: "ready", href: "/admin/activity" },
      { label: "Export activity CSV/JSON", status: "ready", href: "/admin/activity" },
    ],
  },
  {
    title: "Security",
    items: [
      { label: ".env.local gitignored", status: "ready" },
      { label: "No service_role in client", status: "ready" },
      { label: "RLS policy reminders documented", status: "needs check" },
      { label: "No secret keys in repo", status: "needs check" },
    ],
  },
];

function statusClass(status: AuditStatus): string {
  if (status === "ready") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (status === "needs check") {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function FinalAuditChecklist() {
  return (
    <div className="flex flex-col gap-8">
      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {section.items.map((item) => (
              <li
                key={item.label}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${statusClass(item.status)}`}
                  >
                    {item.status}
                  </span>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-slate-900">
                      {item.label}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
        <h2 className="text-base font-semibold text-slate-900">Next steps</h2>
        <p className="mt-2 text-sm text-slate-700">
          Run Supabase migrations 001–008, verify RLS and storage policies in
          production, then spot-check Lesson 5 edit → activity → rollback flow.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Admin dashboard
          </Link>
          <Link
            href="/admin/activity"
            className="inline-flex rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Activity log
          </Link>
        </div>
      </section>
    </div>
  );
}
