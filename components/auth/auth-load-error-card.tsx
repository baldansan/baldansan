"use client";

import Link from "next/link";
import { LocalDebugPanel } from "@/components/dev/local-debug-panel";
import { shouldShowLocalDebugDetails } from "@/lib/dev/local-debug";
import type { ClientAuthCheckResult } from "@/lib/auth/client-auth-check";

type Props = {
  title?: string;
  description?: string;
  result: Pick<
    ClientAuthCheckResult,
    "error" | "timedOut" | "sessionPresent" | "env" | "supabaseConfigured" | "userEmail"
  >;
  route: string;
  onRetry?: () => void;
};

export function AuthLoadErrorCard({
  title = "Auth шалгалт хэт удаж байна",
  description = "Supabase нэвтрэлт эсвэл профайл шалгалт амжилтгүй боллоо. Дахин оролдоно уу.",
  result,
  route,
  onRetry,
}: Props) {
  const displayTitle = result.timedOut
    ? "Auth шалгалт хэт удаж байна"
    : result.supabaseConfigured
      ? title
      : "Supabase тохиргоо дутуу байна";

  const displayDescription = result.supabaseConfigured
    ? description
    : ".env.local файлд NEXT_PUBLIC_SUPABASE_URL болон NEXT_PUBLIC_SUPABASE_ANON_KEY нэмнэ үү.";

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{displayTitle}</h2>
      <p className="mt-2 text-sm text-slate-600">{displayDescription}</p>
      {result.error ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {result.error}
        </p>
      ) : null}
      <dl className="mt-4 space-y-1 text-xs text-slate-600">
        <div>
          <dt className="inline font-medium">route: </dt>
          <dd className="inline break-all">{route}</dd>
        </div>
        <div>
          <dt className="inline font-medium">user session: </dt>
          <dd className="inline">{result.sessionPresent ? "yes" : "no"}</dd>
        </div>
        {result.userEmail ? (
          <div>
            <dt className="inline font-medium">user email: </dt>
            <dd className="inline break-all">{result.userEmail}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline font-medium">NEXT_PUBLIC_SUPABASE_URL: </dt>
          <dd className="inline">{result.env.supabaseUrlPresent ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt className="inline font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY: </dt>
          <dd className="inline">
            {result.env.supabaseAnonKeyPresent ? "yes" : "no"}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Дахин оролдох
          </button>
        ) : null}
        <Link
          href="/debug/local-health"
          className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
        >
          Local health
        </Link>
        {!result.sessionPresent ? (
          <Link
            href="/login"
            className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            Нэвтрэх
          </Link>
        ) : null}
      </div>
      {shouldShowLocalDebugDetails() ? (
        <LocalDebugPanel route={route} errorMessage={result.error ?? undefined} />
      ) : null}
    </div>
  );
}
