import Link from "next/link";

type AuditStatus = "ready" | "needs check" | "planned";

type AuditItem = {
  label: string;
  status: AuditStatus;
  href?: string;
  note?: string;
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
        label: "admin_profiles bootstrap (Supabase SQL Editor)",
        status: "needs check",
        href: "/admin/final-audit",
        note: "Run supabase/admin/001_admin_profiles_setup.sql",
      },
      { label: "Admin role check (is_admin)", status: "ready", href: "/admin" },
      {
        label: "Admin link visible only for admins",
        status: "ready",
        href: "/",
        note: "Header AuthStatus component",
      },
    ],
  },
  {
    title: "Content management",
    items: [
      { label: "Draft lesson creation", status: "ready", href: "/admin/lessons/new" },
      { label: "Metadata edit/save", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Subtitle editor", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Vocabulary editor", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Quiz editor", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Bulk JSON import", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Prompt generator + import QA", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Export backup JSON", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Duplicate / restore", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Guided Lesson Builder", status: "ready", href: "/admin/lesson-builder" },
      { label: "Prompt library", status: "ready", href: "/admin/prompts" },
    ],
  },
  {
    title: "Release workflow",
    items: [
      { label: "QA readiness checklist", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Approve for publish", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Publish / unpublish / archive", status: "ready", href: "/admin/lessons/5/edit" },
      { label: "Public course list (available only)", status: "ready", href: "/courses/hsk5" },
      {
        label: "Admin preview (?preview=admin)",
        status: "ready",
        href: "/lessons/5?preview=admin",
      },
      {
        label: "Non-admin blocked from draft preview",
        status: "ready",
        href: "/lessons/5?preview=admin",
      },
    ],
  },
  {
    title: "Media",
    items: [
      { label: "Media metadata fields", status: "ready", href: "/admin/lessons/5/edit" },
      {
        label: "Storage bucket lesson-media",
        status: "needs check",
        note: "Run supabase/storage/001_lesson_media_bucket_policies.sql",
      },
      { label: "Media upload + URL paste", status: "ready", href: "/admin/lessons/5/edit" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Admin dashboard metrics", status: "ready", href: "/admin" },
      { label: "Per-lesson analytics", status: "ready", href: "/admin/analytics/lessons/5" },
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
      {
        label: "Persistent admin tasks (006)",
        status: "needs check",
        href: "/admin/tasks",
        note: "Requires migration 006 in Supabase",
      },
      {
        label: "Activity log display (client session)",
        status: "ready",
        href: "/admin/activity",
      },
      {
        label: "Activity detail + diff + rollback",
        status: "ready",
        href: "/admin/activity",
      },
      { label: "Export activity CSV/JSON", status: "ready", href: "/admin/activity" },
    ],
  },
  {
    title: "Supabase migrations (manual SQL Editor)",
    items: [
      { label: "001_initial_schema.sql", status: "needs check" },
      { label: "002_lesson_media_fields.sql", status: "needs check" },
      { label: "003_lesson_route_status.sql", status: "needs check" },
      { label: "004_admin_lesson_bundle.sql", status: "needs check" },
      { label: "005_grant_is_admin_rpc.sql", status: "needs check" },
      { label: "005_lesson_release_workflow.sql", status: "needs check" },
      { label: "006_admin_tasks.sql", status: "needs check" },
      { label: "007_admin_activity_log.sql", status: "needs check" },
      { label: "008_admin_activity_snapshots.sql", status: "needs check" },
      {
        label: "Auth + admin RLS policies",
        status: "needs check",
        note: "001_auth_rls + 002_admin_content_policies",
      },
    ],
  },
  {
    title: "Security",
    items: [
      { label: ".env.local gitignored", status: "ready" },
      { label: "No service_role in client code", status: "ready" },
      { label: "No secret keys in repo", status: "ready" },
      {
        label: "RLS applied in production Supabase",
        status: "needs check",
        note: "Verify before Phase 6 deploy",
      },
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
      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
        <h2 className="text-base font-semibold text-slate-900">
          Phase 5 Final Audit — May 2026
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Code audit complete. Items marked <strong>needs check</strong> require
          manual verification in your Supabase project (migrations, RLS, storage).
          Activity log reads use the browser admin session — same as writes.
        </p>
      </section>

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
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-3">
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
                  {item.note ? (
                    <p className="text-xs text-slate-500">{item.note}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100">
        <h2 className="text-base font-semibold text-slate-900">Phase 6 next</h2>
        <p className="mt-2 text-sm text-slate-700">
          Deployment / production readiness: hosting, env setup, apply all RLS
          policies, smoke-test public + admin routes, and production Supabase
          verification.
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
          <Link
            href="/courses/hsk5"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Public course
          </Link>
        </div>
      </section>
    </div>
  );
}
