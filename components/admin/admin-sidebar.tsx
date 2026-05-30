"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_NAV_ADVANCED,
  ADMIN_NAV_PRIMARY,
  ADMIN_NAV_SECONDARY,
} from "@/lib/admin/admin-nav";

function NavLink({ item, pathname }: { item: (typeof ADMIN_NAV_PRIMARY)[0]; pathname: string }) {
  const active = item.match(pathname);
  return (
    <Link
      href={item.href}
      className={`admin-sidebar-link ${active ? "admin-sidebar-link-active" : ""}`}
    >
      <span aria-hidden className="text-base">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar hidden w-[240px] shrink-0 flex-col lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Buunduu Surtsgaay
        </p>
        <p className="mt-1 text-base font-bold text-white">Admin CMS</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {ADMIN_NAV_PRIMARY.map((item) => (
            <li key={item.href}>
              <NavLink item={item} pathname={pathname} />
            </li>
          ))}
        </ul>

        <details className="mt-5 border-t border-white/10 pt-4">
          <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 [&::-webkit-details-marker]:hidden">
            Advanced ▾
          </summary>
          <ul className="mt-1 flex flex-col gap-0.5">
            {ADMIN_NAV_ADVANCED.map((item) => (
              <li key={item.href}>
                <NavLink item={item} pathname={pathname} />
              </li>
            ))}
          </ul>
        </details>

        <div className="mt-5 border-t border-white/10 pt-4">
          <ul className="flex flex-col gap-0.5">
            {ADMIN_NAV_SECONDARY.map((item) => (
              <li key={item.href}>
                <NavLink item={item} pathname={pathname} />
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
