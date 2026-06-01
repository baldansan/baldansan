"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";

type GuardState = "loading" | "login" | "denied" | "admin";

type Props = {
  children: ReactNode;
};

export function AdminGuard({ children }: Props) {
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let mounted = true;

    async function check() {
      if (!hasSupabaseConfig) {
        if (mounted) setState("login");
        return;
      }

      const { data: user } = await getCurrentUser();
      if (!mounted) return;

      if (!user) {
        setState("login");
        return;
      }

      const admin = await isCurrentUserAdmin();
      if (!mounted) return;

      setState(admin ? "admin" : "denied");
    }

    check();
    return () => {
      mounted = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <div
        className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-slate-700">Admin шалгаж байна...</p>
        <p className="mt-1 text-xs text-slate-500">
          Нэвтрэлт болон эрхийг баталгаажуулж байна.
        </p>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (state === "login") {
    return (
      <EmptyState
        title="Admin хэсэгт нэвтрэх шаардлагатай"
        description={
          hasSupabaseConfig
            ? "Контент удирдах хэсэгт хандахын тулд эхлээд нэвтэрнэ үү."
            : "Supabase тохиргоо олдсонгүй. .env.local файлд NEXT_PUBLIC_SUPABASE_URL болон NEXT_PUBLIC_SUPABASE_ANON_KEY нэмнэ үү."
        }
        action={
          <Link
            href="/login"
            className="inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Нэвтрэх →
          </Link>
        }
      />
    );
  }

  if (state === "denied") {
    return (
      <EmptyState
        title="Admin эрх шаардлагатай"
        description="Энэ хэсэг зөвхөн контент удирдах эрхтэй хэрэглэгчдэд зориулагдсан."
        action={
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            Нүүр хуудас руу →
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
