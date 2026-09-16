"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LocalDebugPanel } from "@/components/dev/local-debug-panel";
import { shouldShowLocalDebugDetails } from "@/lib/dev/local-debug";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[admin] route error", error);
  }, [error]);

  const showDebug = shouldShowLocalDebugDetails();

  return (
    <div className="flex items-start justify-center py-6">
      <section className="admin-panel w-full max-w-xl p-6">
        <h1 className="text-xl font-bold text-slate-900">
          Хуудас ачаалахад алдаа гарлаа
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Энэ админ хуудсыг гаргах үед алдаа гарлаа. Дахин оролдох эсвэл тодорхой
          хэрэгсэл рүү шууд орно уу.
        </p>
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error.message || "Unknown error"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Дахин оролдох
          </button>
          <Link
            href="/admin"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Хяналтын самбар →
          </Link>
          <Link
            href="/admin/import/chinese"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Хятад импорт →
          </Link>
        </div>
        {showDebug ? (
          <LocalDebugPanel
            route={typeof window !== "undefined" ? window.location.pathname : "/admin"}
            errorMessage={error.message}
            extra={{ digest: error.digest }}
          />
        ) : null}
      </section>
    </div>
  );
}
