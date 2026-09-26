"use client";

import Link from "next/link";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { getSession, hasSupabaseConfig, signUpWithEmail } from "@/lib/supabase/auth";
import { resetProgressSyncDismiss } from "@/lib/supabase/progress-sync";
import { JoinClassForm } from "@/components/classroom/join-class-form";
import { joinClassroomByCode, setPendingClassCode } from "@/lib/supabase/classrooms";

export function SignupForm() {
  const locale = useUiLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Ангийн код (заавал биш): ?code=482917 эсвэл гараар
  const [classCode, setClassCode] = useState<string>(
    (searchParams.get("code") ?? "").replace(/\D/g, "").slice(0, 6)
  );
  const [classCodeValid, setClassCodeValid] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(tr(locale, "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой."));
      return;
    }

    if (password !== confirmPassword) {
      setError(tr(locale, "Нууц үг таарахгүй байна."));
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
    const signedIn = Boolean(session);
    if (classCode.length === 6 && classCodeValid) {
      // Шууд нэвтэрсэн бол одоо нэгдэнэ; үгүй бол имэйл баталгаажуулсны дараа автоматаар
      setPendingClassCode(classCode);
      if (signedIn) {
        const { data: joined } = await joinClassroomByCode(classCode);
        if (joined) setPendingClassCode(null);
      }
    }
    if (signedIn) {
      resetProgressSyncDismiss();
      router.push(nextPath);
      router.refresh();
      return;
    }
    setHasSession(signedIn);
    setSuccess(true);
  }

  return (
    <MobileAppShell activeTab="profile" showBottomNav={false}>
      <section className="py-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
          {tr(locale, "Бүртгүүлэх")}
        </h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {tr(locale, "Аккаунт үүсгээд ахицаа хадгалах боломжтой.")}
        </p>
      </section>

      {!hasSupabaseConfig ? (
        <MobileCard className="text-sm text-[var(--app-muted)]">
          Supabase тохиргоо олдсонгүй. .env.local файлд URL болон anon key
          нэмнэ үү.
        </MobileCard>
      ) : success ? (
        <MobileCard>
          <p className="text-sm leading-6 text-[var(--app-text)]">
            {tr(locale, "Бүртгэл үүсгэлээ. Имэйл баталгаажуулалт шаардлагатай байж магадгүй.")}
          </p>
          <div className="mt-4">
            {hasSession ? (
              <Link
                href={nextPath}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white"
              >
                {tr(locale, "Профайл руу →")}
              </Link>
            ) : (
              <Link
                href={
                  searchParams.get("next")
                    ? `/login?next=${encodeURIComponent(searchParams.get("next")!)}`
                    : "/login"
                }
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white"
              >
                {tr(locale, "Нэвтрэх")} →
              </Link>
            )}
          </div>
        </MobileCard>
      ) : (
        <MobileCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block text-sm font-medium text-[var(--app-text)]">
              {tr(locale, "Имэйл")}
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--app-border)] px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <label className="block text-sm font-medium text-[var(--app-text)]">
              {tr(locale, "Нууц үг")}
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--app-border)] px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <label className="block text-sm font-medium text-[var(--app-text)]">
              {tr(locale, "Нууц үг давтах")}
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--app-border)] px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <JoinClassForm
                initialCode={classCode}
                mode="peek"
                onCodeChange={(c, name) => {
                  setClassCode(c);
                  setClassCodeValid(Boolean(name));
                }}
              />
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {tr(locale, "Сургууль/ангийн сурагч биш бол хоосон орхино.")}
              </p>
            </div>

            {error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {tr(locale, submitting ? "Бүртгэж байна..." : "Бүртгүүлэх")}
            </button>

            <p className="text-center text-sm text-[var(--app-muted)]">
              {tr(locale, "Бүртгэлтэй юу?")}{" "}
              <Link
                href={
                  searchParams.get("next")
                    ? `/login?next=${encodeURIComponent(searchParams.get("next")!)}`
                    : "/login"
                }
                className="font-medium text-emerald-700"
              >
                {tr(locale, "Нэвтрэх")}
              </Link>
            </p>
          </form>
        </MobileCard>
      )}
    </MobileAppShell>
  );
}
