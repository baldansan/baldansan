"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

type Props = {
  children: ReactNode;
  requireLogin?: boolean;
  loginPrompt?: ReactNode;
};

export function TeacherAuthGate({
  children,
  requireLogin = false,
  loginPrompt,
}: Props) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoggedIn(false);
      return;
    }
    let mounted = true;
    getCurrentUser().then(({ data }) => {
      if (mounted) setLoggedIn(Boolean(data));
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (loggedIn === null) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </TeacherShell>
    );
  }

  if (requireLogin && !loggedIn) {
    return (
      loginPrompt ?? (
        <TeacherShell active="help" showBottomNav={false}>
          <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">Багшийн хэсэг</h1>
            <p className="mt-2 text-sm text-slate-600">
              Энэ хэсэгт нэвтрэх шаардлагатай.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/login?next=/teacher/today"
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Нэвтрэх
              </Link>
              <Link
                href="/demo"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800"
              >
                Demo үзэх
              </Link>
            </div>
          </section>
        </TeacherShell>
      )
    );
  }

  return <>{children}</>;
}

export function useTeacherAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoggedIn(false);
      return;
    }
    let mounted = true;
    getCurrentUser().then(({ data }) => {
      if (!mounted) return;
      setLoggedIn(Boolean(data));
      setEmail(data?.email ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { loggedIn, email };
}
