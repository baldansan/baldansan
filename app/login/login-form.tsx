"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  getCurrentUser,
  hasSupabaseConfig,
  resendSignupConfirmationEmail,
  signInWithEmail,
} from "@/lib/supabase/auth";
import { RESEND_CONFIRMATION_SUCCESS_MESSAGE } from "@/lib/auth/auth-error-messages";
import { resetProgressSyncDismiss } from "@/lib/supabase/progress-sync";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
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
    setResendMessage(null);
    setShowResendConfirmation(false);
    setSubmitting(true);

    const { data, error: signInError, emailNotConfirmed } = await signInWithEmail(
      email,
      password
    );
    setSubmitting(false);

    if (signInError) {
      setError(signInError);
      setShowResendConfirmation(Boolean(emailNotConfirmed));
      return;
    }

    if (data) {
      resetProgressSyncDismiss();
      router.push(nextPath);
      router.refresh();
    }
  }

  async function handleResendConfirmation() {
    if (!email.trim()) {
      setResendMessage("Эхлээд имэйл хаягаа оруулна уу.");
      return;
    }

    setResending(true);
    setResendMessage(null);
    const { error: resendError } = await resendSignupConfirmationEmail(email);
    setResending(false);

    if (resendError) {
      setResendMessage(resendError);
      return;
    }

    setResendMessage(RESEND_CONFIRMATION_SUCCESS_MESSAGE);
  }

  return (
    <MobileAppShell activeTab="profile" showBottomNav={false}>
      <section className="py-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
          Нэвтрэх
        </h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          Суралцах ахицаа хадгалахын тулд нэвтэрнэ үү.
        </p>
      </section>

      {checkingSession ? (
        <p className="text-sm text-[var(--app-muted)]">Шалгаж байна...</p>
      ) : alreadyLoggedIn ? (
        <MobileCard>
          <p className="text-sm text-[var(--app-text)]">
            Та аль хэдийн нэвтэрсэн байна.
            {loggedInEmail ? ` (${loggedInEmail})` : null}
          </p>
          <Link
            href={nextPath}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white"
          >
            Үргэлжлүүлэх →
          </Link>
        </MobileCard>
      ) : !hasSupabaseConfig ? (
        <MobileCard className="text-sm text-[var(--app-muted)]">
          Supabase тохиргоо олдсонгүй. .env.local файлд URL болон anon key
          нэмнэ үү.
        </MobileCard>
      ) : (
        <MobileCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block text-sm font-medium text-[var(--app-text)]">
              Имэйл
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
              Нууц үг
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--app-border)] px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
                <p>{error}</p>
                {showResendConfirmation ? (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="mt-3 min-h-[40px] w-full rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-800 disabled:opacity-50"
                  >
                    {resending
                      ? "Илгээж байна..."
                      : "Баталгаажуулах имэйл дахин илгээх"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {resendMessage ? (
              <p
                className={`rounded-xl px-4 py-3 text-sm ring-1 ${
                  resendMessage === RESEND_CONFIRMATION_SUCCESS_MESSAGE
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                    : "bg-red-50 text-red-800 ring-red-200"
                }`}
              >
                {resendMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </button>

            <p className="text-center text-sm text-[var(--app-muted)]">
              Бүртгэл байхгүй юу?{" "}
              <Link
                href={
                  searchParams.get("next")
                    ? `/signup?next=${encodeURIComponent(searchParams.get("next")!)}`
                    : "/signup"
                }
                className="font-medium text-emerald-700"
              >
                Бүртгүүлэх
              </Link>
            </p>
          </form>
        </MobileCard>
      )}
    </MobileAppShell>
  );
}
