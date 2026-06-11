"use client";
// components/BottomNav.tsx
// Доод цэс — Нүүр · Давтах · Бичлэг · Тоглоом · Профайл (цэвэр SVG дүрстэй).
// buunduu-theme.css доторх .bs-bottomnav классуудыг ашиглана.
// Идэвхтэй табыг `active` пропоор дамжуулна.

import Link from "next/link";
import type { ReactNode } from "react";

export type BottomNavTab = "home" | "review" | "clips" | "games" | "profile";

const TABS: { key: BottomNavTab; label: string; href: string; icon: ReactNode }[] = [
  {
    key: "home",
    label: "Нүүр",
    href: "/home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9.5V20h14V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "review",
    label: "Давтах",
    href: "/review",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M20 11a8 8 0 1 0-2.3 5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 5v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "clips",
    label: "Бичлэг",
    href: "/bichleg",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "games",
    label: "Тоглоом",
    href: "/games",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="2.5" y="6.5" width="19" height="11" rx="5.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 10.5v3M5.5 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16" cy="11" r="1.1" fill="currentColor" />
        <circle cx="18" cy="13.5" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "profile",
    label: "Профайл",
    href: "/profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BottomNav({
  active,
  embedded = false,
}: {
  active: BottomNavTab;
  /** Inside BottomNavChrome — skip outer card chrome. */
  embedded?: boolean;
}) {
  return (
    <nav
      className={embedded ? "bs-bottomnav bs-bottomnav-embedded" : "bs-bottomnav"}
      aria-label="App navigation"
    >
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} className={active === t.key ? "bs-on" : ""}>
          {t.icon}
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
