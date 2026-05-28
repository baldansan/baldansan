"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { getSession, hasSupabaseConfig, signUpWithEmail } from "@/lib/supabase/auth";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Нууц үг таарахгүй байна.");
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await signUpWithEmail(email, password);
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    const { data: session } = await getSession();
    setHasSession(Boolean(session));
    setSuccess(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 pb-16 sm:px-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">Бүртгүүлэх</h1>
          <p className="mt-2 text-sm text-slate-600">
            Аккаунт үүсгээд ахицаа дараа нь хадгалах боломжтой.
          </p>
        </section>

        {!hasSupabaseConfig ? (
          <section className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
            Supabase тохиргоо олдсонгүй. .env.local файлд URL болон anon key
            нэмнэ үү.
          </section>
        ) : success ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-200">
            <p className="text-sm leading-6 text-slate-700">
              Бүртгэл үүсгэлээ. Имэйл баталгаажуулалт шаардлагатай байж магадгүй.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {hasSession ? (
                <Link
                  href="/profile"
                  className="inline-flex justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Profile руу очих →
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Нэвтрэх хуудас руу →
                </Link>
              )}
            </div>
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
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-emerald-500 focus:border-emerald-300 focus:ring-2"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Нууц үг давтах
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {submitting ? "Бүртгэж байна..." : "Бүртгүүлэх"}
            </button>

            <p className="mt-4 text-center text-sm text-slate-600">
              Аль хэдийн бүртгэлтэй юу?{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-700 hover:text-emerald-600"
              >
                Нэвтрэх
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
