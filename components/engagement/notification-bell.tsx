"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUnreadCountUnified } from "@/lib/engagement/engagement-service";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function load() {
      if (!hasSupabaseConfig) {
        setLoggedIn(false);
        setCount(0);
        return;
      }
      const { data } = await getCurrentUser();
      setLoggedIn(Boolean(data));
      setCount(await getUnreadCountUnified());
    }

    void load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  if (!loggedIn) return null;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
      aria-label="Notifications"
    >
      🔔
      {count > 0 ? (
        <span className="ml-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
