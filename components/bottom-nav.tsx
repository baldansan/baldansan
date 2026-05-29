"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

type NavItem = {
  href: string;
  label: string;
  key: string;
  match: (path: string) => boolean;
};

const loggedOutItems: NavItem[] = [
  {
    href: "/",
    label: "Нүүр",
    key: "home",
    match: (p) => p === "/",
  },
  {
    href: "/courses",
    label: "Курсууд",
    key: "courses",
    match: (p) => p.startsWith("/courses"),
  },
  {
    href: "/onboarding",
    label: "Заавар",
    key: "onboarding",
    match: (p) => p.startsWith("/onboarding"),
  },
  {
    href: "/login",
    label: "Нэвтрэх",
    key: "login",
    match: (p) => p.startsWith("/login") || p.startsWith("/signup"),
  },
];

const loggedInItems: NavItem[] = [
  {
    href: "/",
    label: "Нүүр",
    key: "home",
    match: (p) => p === "/",
  },
  {
    href: "/courses",
    label: "Курсууд",
    key: "courses",
    match: (p) => p.startsWith("/courses"),
  },
  {
    href: "/dashboard",
    label: "Самбар",
    key: "dashboard",
    match: (p) => p.startsWith("/dashboard"),
  },
  {
    href: "/review",
    label: "Давталт",
    key: "review",
    match: (p) => p.startsWith("/review"),
  },
  {
    href: "/profile",
    label: "Профайл",
    key: "profile",
    match: (p) => p.startsWith("/profile"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let mounted = true;
    getCurrentUser().then(({ data }) => {
      if (mounted) setLoggedIn(Boolean(data));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const items = loggedIn ? loggedInItems : loggedOutItems;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="mx-auto flex max-w-5xl items-stretch justify-around px-1 py-2">
        {items.map((item) => {
          const isActive = item.match(pathname);
          return (
            <li key={item.key} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl px-1 py-2 text-[11px] font-semibold leading-tight ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "text-slate-600 active:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
