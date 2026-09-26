"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminNavBody } from "@/components/admin/admin-sidebar";
import { resolveAdminPageTitle } from "@/lib/admin/admin-nav";
import { LocaleToggle } from "@/components/i18n/locale-toggle";

export function AdminTopbar() {
  const pathname = usePathname();
  const title = resolveAdminPageTitle(pathname);

  // Held as "which route is the drawer open for", so navigating away closes it
  // without an effect that re-renders on every route change.
  const [openForRoute, setOpenForRoute] = useState<string | null>(null);
  const menuOpen = openForRoute === pathname;
  const setMenuOpen = (open: boolean) => setOpenForRoute(open ? pathname : null);

  return (
    <header className="admin-topbar sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="admin-mobile-nav"
          className="admin-btn-ghost shrink-0 px-3 lg:hidden"
        >
          <span aria-hidden>☰</span>
          <span className="sr-only">Цэс нээх</span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 lg:text-base">
            {title}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Бөөндөө Сурцгаая · Удирдлага
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleToggle />
          <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 sm:inline">
            Админ
          </span>
          <Link href="/" className="admin-btn-ghost text-xs sm:text-sm">
            Сурагчийн апп →
          </Link>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="admin-mobile-nav"
          aria-label="Админ цэс"
          className="admin-sidebar max-h-[70vh] overflow-y-auto px-3 pb-5 pt-2 lg:hidden"
        >
          <AdminNavBody
            pathname={pathname}
            onNavigate={() => setMenuOpen(false)}
          />
        </nav>
      ) : null}
    </header>
  );
}
