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
      <ul className="flex h-[64px] items-stretch px-0.5 pt-0.5">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = active
            ? item.id === active
            : item.match(pathname);
          return (
            <li key={item.id} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={`app-nav-link h-full ${isActive ? "app-nav-link-active" : ""}`}
              >
                <span
                  className={`app-nav-pill w-full max-w-[72px] ${isActive ? "app-nav-pill-active" : ""}`}
                >
                  <span className="text-base leading-none sm:text-lg" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="max-w-full truncate text-[9px] font-bold leading-tight sm:text-[10px]">
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
