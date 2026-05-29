import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

type Props = {
  title?: string;
  backHref?: string;
  backLabel?: string;
};

export function AdminHeader({
  title = "Admin",
  backHref = "/admin",
  backLabel = "← Admin",
}: Props) {
  return (
    <header className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-col gap-2">
        <BrandLogo />
        <p className="text-sm font-medium text-emerald-700">{title}</p>
      </div>
      <nav className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
        <Link
          href={backHref}
          className="font-medium text-slate-600 transition-colors hover:text-emerald-600"
        >
          {backLabel}
        </Link>
        <Link
          href="/admin/activity"
          className="text-slate-600 transition-colors hover:text-emerald-600"
        >
          Activity
        </Link>
        <Link
          href="/admin/final-audit"
          className="text-slate-600 transition-colors hover:text-emerald-600"
        >
          Final Audit
        </Link>
        <Link
          href="/admin/tasks"
          className="text-slate-600 transition-colors hover:text-emerald-600"
        >
          Tasks
        </Link>
        <Link
          href="/admin/lesson-builder"
          className="text-slate-600 transition-colors hover:text-emerald-600"
        >
          Lesson Builder
        </Link>
        <Link
          href="/admin/prompts"
          className="text-slate-600 transition-colors hover:text-emerald-600"
        >
          Prompts
        </Link>
        <Link
          href="/admin/analytics"
          className="text-slate-600 transition-colors hover:text-emerald-600"
        >
          Analytics
        </Link>
        <Link
          href="/admin/lessons"
          className="text-slate-600 transition-colors hover:text-emerald-600"
        >
          Хичээлүүд
        </Link>
        <Link
          href="/"
          className="text-slate-600 transition-colors hover:text-emerald-600"
        >
          Апп руу буцах
        </Link>
      </nav>
    </header>
  );
}
