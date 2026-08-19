"use client";

import Link from "next/link";
import { APP_NAV_ITEMS, type AppNavTab } from "@/lib/app-navigation";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

export type BottomNavTab = AppNavTab;

export default function BottomNav({
  active,
  embedded = false,
}: {
  active: BottomNavTab;
  /** Inside BottomNavChrome — skip outer card chrome. */
  embedded?: boolean;
}) {
  const locale = useUiLocale();
  return (
    <nav
      className={embedded ? "bs-bottomnav bs-bottomnav-embedded" : "bs-bottomnav"}
      aria-label="App navigation"
    >
      {APP_NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={active === item.key ? "bs-on" : ""}
        >
          {item.icon}
          {tr(locale, item.label)}
        </Link>
      ))}
    </nav>
  );
}
