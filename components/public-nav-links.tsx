"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

export type PublicNavActive =
  | "home"
  | "courses"
  | "dashboard"
  | "review"
  | "profile"
  | "help";

type Props = {
  active?: PublicNavActive;
  className?: string;
};

function linkClass(isActive: boolean): string {
  return isActive
    ? "font-medium text-emerald-600"
    : "text-slate-600 transition-colors hover:text-emerald-600";
}

export function PublicNavLinks({ active, className = "" }: Props) {
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

  return (
    <nav
      className={`flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs sm:gap-x-4 sm:text-sm ${className}`}
      aria-label="Main"
    >
      <Link href="/courses" className={linkClass(active === "courses")}>
        Courses
      </Link>
      {loggedIn ? (
        <>
          <Link href="/dashboard" className={linkClass(active === "dashboard")}>
            Dashboard
          </Link>
          <Link href="/review" className={linkClass(active === "review")}>
            Review
          </Link>
          <Link href="/profile" className={linkClass(active === "profile")}>
            Profile
          </Link>
        </>
      ) : null}
      <Link
        href="/help"
        className={`hidden sm:inline ${linkClass(active === "help")}`}
      >
        Help
      </Link>
    </nav>
  );
}
