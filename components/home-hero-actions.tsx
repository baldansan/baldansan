"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

export function HomeHeroActions() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(!hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let mounted = true;
    getCurrentUser().then(({ data }) => {
      if (mounted) {
        setLoggedIn(Boolean(data));
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/courses/hsk5"
          className="w-full rounded-full bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          Хичээлүүд үзэх
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Link
        href="/courses"
        className="w-full rounded-full bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600 sm:w-auto"
      >
        Хичээлүүд үзэх
      </Link>
      <Link
        href="/courses/hsk5"
        className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-center text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:w-auto"
      >
        HSK5 эхлэх
      </Link>
      {loggedIn ? (
        <Link
          href="/profile"
          className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 sm:w-auto"
        >
          Миний самбар
        </Link>
      ) : (
        <Link
          href="/login"
          className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 sm:w-auto"
        >
          Нэвтрэх
        </Link>
      )}
      <Link
        href="/onboarding"
        className="w-full rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-center text-sm font-semibold text-slate-600 transition-colors hover:border-emerald-200 sm:w-auto"
      >
        App хэрхэн ажилладаг вэ?
      </Link>
    </div>
  );
}
