"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import type { PublicNavActive } from "@/components/public-nav-links";

const baseItems = [
  { href: "/", label: "Home", key: "home" as const },
  { href: "/courses", label: "Courses", key: "courses" as const },
] as const;

const loggedInItems = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" as const },
  { href: "/review", label: "Review", key: "review" as const },
  { href: "/profile", label: "Profile", key: "profile" as const },
] as const;

type Props = {
  active?: PublicNavActive;
};

export function BottomNav({ active }: Props) {
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

  const items = loggedIn ? [...baseItems, ...loggedInItems] : baseItems;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="mx-auto flex max-w-5xl items-stretch justify-around px-1 py-1.5">
        {items.map((item) => {
          const isActive = active === item.key;
          return (
            <li key={item.key} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center rounded-lg px-1 py-2 text-[10px] font-medium leading-tight sm:text-xs ${
                  isActive
                    ? "text-emerald-600"
                    : "text-slate-600 transition-colors hover:text-emerald-600"
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
