"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_ITEMS, type MobileNavTab } from "@/lib/mobile-nav";

type Props = {
  active?: MobileNavTab;
};

export function MobileBottomNav({ active }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-50 rounded-t-[20px] border-t border-[var(--app-border)] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
      aria-label="App navigation"
    >
      <ul className="flex h-[68px] items-stretch px-1 pt-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = active
            ? item.id === active
            : item.match(pathname);
          return (
            <li key={item.id} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={`app-nav-link ${isActive ? "app-nav-link-active" : ""}`}
              >
                <span
                  className={`app-nav-pill ${isActive ? "app-nav-pill-active" : ""}`}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-bold leading-tight">
                    {item.label}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
