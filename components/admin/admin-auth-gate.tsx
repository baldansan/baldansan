"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";

type Props = {
  children: ReactNode;
};

export function AdminAuthGate({ children }: Props) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!hasSupabaseConfig) {
        if (mounted) {
          setAllowed(false);
          setLoading(false);
        }
        return;
      }
      const { data } = await getCurrentUser();
      if (mounted) {
        setAllowed(Boolean(data));
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-center text-sm text-slate-500" aria-live="polite">
        Ачааллаж байна...
      </p>
    );
  }

  if (!allowed) {
    return (
      <EmptyState
        title="Admin хэсэгт нэвтрэх шаардлагатай"
        description="Контент удирдах хэсэгт хандахын тулд эхлээд нэвтэрнэ үү. Admin эрхийг дараагийн алхамд баталгаажуулна."
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

  return <>{children}</>;
}
