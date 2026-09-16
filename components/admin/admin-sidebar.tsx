"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_NAV_ADVANCED,
  ADMIN_NAV_SECONDARY,
  ADMIN_NAV_SECTIONS,
  type AdminNavItem,
} from "@/lib/admin/admin-nav";

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: AdminNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = item.match(pathname);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`admin-sidebar-link ${active ? "admin-sidebar-link-active" : ""}`}
    >
      <span aria-hidden className="w-5 shrink-0 text-center text-base">
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-3 pb-1.5 pt-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        {title}
      </p>
      <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/** Shared nav body — rendered in the desktop rail and the mobile drawer. */
export function AdminNavBody({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <SectionHeading
            title={section.title}
            description={section.description}
          />
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <details
        className="mt-4 border-t border-white/10 pt-3"
        open={ADMIN_NAV_ADVANCED.some((item) => item.match(pathname))}
      >
        <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 [&::-webkit-details-marker]:hidden">
          Нэмэлт хэрэгсэл ▾
        </summary>
        <ul className="mt-1 flex flex-col gap-0.5">
          {ADMIN_NAV_ADVANCED.map((item) => (
            <li key={item.href}>
              <NavLink item={item} pathname={pathname} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-4 border-t border-white/10 pt-3">
        <ul className="flex flex-col gap-0.5">
          {ADMIN_NAV_SECONDARY.map((item) => (
            <li key={item.href}>
              <NavLink item={item} pathname={pathname} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar hidden w-[240px] shrink-0 flex-col lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-sidebar-active)] text-lg"
        >
          🐫
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            Бөөндөө Сурцгаая
          </p>
          <p className="text-[10px] text-slate-400">Удирдлагын хэсэг</p>
        </div>
      </div>
      <nav
        aria-label="Админ цэс"
        className="flex-1 overflow-y-auto px-3 pb-6 pt-1"
      >
        <AdminNavBody pathname={pathname} />
      </nav>
    </aside>
  );
}
