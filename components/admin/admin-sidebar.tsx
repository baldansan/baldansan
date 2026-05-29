"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_NAV_SECTIONS,
  ADMIN_NAV_SECONDARY,
} from "@/lib/admin/admin-nav";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar hidden w-[240px] shrink-0 flex-col lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Buunduu Surtsgaay
        </p>
        <p className="mt-1 text-base font-bold text-white">Content Factory</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {section.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = item.match(pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`admin-sidebar-link ${active ? "admin-sidebar-link-active" : ""}`}
                    >
                      <span aria-hidden className="text-base">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="border-t border-white/10 pt-4">
          <ul className="flex flex-col gap-0.5">
            {ADMIN_NAV_SECONDARY.map((item) => {
              const active = item.match(pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`admin-sidebar-link ${active ? "admin-sidebar-link-active" : ""}`}
                  >
                    <span aria-hidden className="text-base">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
