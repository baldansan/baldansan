"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveAdminPageTitle } from "@/lib/admin/admin-nav";

export function AdminTopbar() {
  const pathname = usePathname();
  const title = resolveAdminPageTitle(pathname);

  return (
    <header className="admin-topbar sticky top-0 z-30 flex shrink-0 items-center gap-4 px-4 py-3 lg:px-6">
      <div className="min-w-0 flex-1 lg:hidden">
        <p className="truncate text-sm font-bold text-slate-900">{title}</p>
        <p className="text-[10px] font-medium text-slate-500">Content Factory</p>
      </div>
      <div className="hidden min-w-0 flex-1 lg:block">
        <label htmlFor="admin-global-search" className="sr-only">
          Search admin
        </label>
        <div className="relative max-w-md">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden
          >
            🔍
          </span>
          <input
            id="admin-global-search"
            type="search"
            placeholder="Search lessons, tasks, activity…"
            className="admin-input w-full !pl-9"
            readOnly
            aria-label="Search admin (use page filters)"
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 sm:inline">
          Admin CMS
        </span>
        <Link href="/" className="admin-btn-ghost text-xs sm:text-sm">
          Learner app →
        </Link>
      </div>
    </header>
  );
}
