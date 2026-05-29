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
      className="absolute inset-x-0 bottom-0 z-50 border-t border-[var(--app-border)] bg-white pb-[env(safe-area-inset-bottom)]"
      aria-label="App navigation"
    >
      <ul className="flex h-16 items-stretch">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = active
            ? item.id === active
            : item.match(pathname);
          return (
            <li key={item.id} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 px-1 ${
                  isActive
                    ? "text-[var(--app-primary)]"
                    : "text-[var(--app-muted)]"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
