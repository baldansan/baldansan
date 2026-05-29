"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { getCurrentUser, hasSupabaseConfig, signInWithEmail } from "@/lib/supabase/auth";
import { resetProgressSyncDismiss } from "@/lib/supabase/progress-sync";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState<string | undefined>();

  useEffect(() => {
    async function check() {
      if (!hasSupabaseConfig) {
        setCheckingSession(false);
        return;
      }
      const { data } = await getCurrentUser();
      if (data) {
        setAlreadyLoggedIn(true);
        setLoggedInEmail(data.email);
      }
      setCheckingSession(false);
    }
    check();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signInError } = await signInWithEmail(email, password);
    setSubmitting(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    if (data) {
      resetProgressSyncDismiss();
      router.push(nextPath);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active="profile" />

      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 pb-16 sm:px-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">Нэвтрэх</h1>
          <p className="mt-2 text-sm text-slate-600">
            Суралцах ахицаа хадгалахын тулд нэвтэрнэ үү.
          </p>
        </section>

        {checkingSession ? (
          <p className="text-sm text-slate-500">Шалгаж байна...</p>
        ) : alreadyLoggedIn ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-200">
            <p className="text-sm text-slate-700">
              Та аль хэдийн нэвтэрсэн байна.
              {loggedInEmail ? ` (${loggedInEmail})` : null}
            </p>
            <Link
              href={nextPath}
              className="mt-4 inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              {nextPath.startsWith("/invite/")
                ? "Continue to invitation →"
                : "Continue →"}
            </Link>
          </section>
        ) : !hasSupabaseConfig ? (
          <section className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
            Supabase тохиргоо олдсонгүй. .env.local файлд URL болон anon key
            нэмнэ үү.
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <label className="block text-sm font-medium text-slate-700">
              Имэйл
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-emerald-500 focus:border-emerald-300 focus:ring-2"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Нууц үг
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-emerald-500 focus:border-emerald-300 focus:ring-2"
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              {submitting ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </button>

            <p className="mt-4 text-center text-sm text-slate-600">
              Бүртгэл байхгүй юу?{" "}
              <Link
                href={
                  searchParams.get("next")
                    ? `/signup?next=${encodeURIComponent(searchParams.get("next")!)}`
                    : "/signup"
                }
                className="font-medium text-emerald-700 hover:text-emerald-600"
              >
                Бүртгүүлэх
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
