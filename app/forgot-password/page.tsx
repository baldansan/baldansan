"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { sendPasswordResetEmail } from "@/lib/supabase/auth";

const INPUT =
  "mt-1 w-full rounded-xl border border-[var(--app-border)] px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500";

export default function ForgotPasswordPage() {
  const locale = useUiLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await sendPasswordResetEmail(email);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
  }

  return (
    <MobileAppShell activeTab="profile" showBottomNav={false}>
      <section className="py-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
          {tr(locale, "Нууц үг сэргээх")}
        </h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          {tr(locale, "Бүртгэлтэй имэйлээ оруулбал нууц үг солих линк илгээнэ.")}
        </p>
      </section>

      <MobileCard>
        {sent ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
              {tr(locale, "Имэйл илгээлээ. Шуудангаа (Spam хавтас хүртэл) шалгаад линк дээр дарна уу. Линк 1 цаг хүчинтэй.")}
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-[var(--app-border)] px-6 py-3 text-sm font-semibold text-[var(--app-text)]"
            >
              ← {tr(locale, "Нэвтрэх хуудас руу")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block text-sm font-medium text-[var(--app-text)]">
              {tr(locale, "Имэйл")}
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT}
              />
            </label>
            {error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="min-h-[44px] w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {tr(locale, busy ? "Илгээж байна..." : "Сэргээх линк илгээх")}
            </button>
            <p className="text-center text-sm text-[var(--app-muted)]">
              <Link href="/login" className="font-medium text-emerald-700">
                ← {tr(locale, "Нэвтрэх")}
              </Link>
            </p>
          </form>
        )}
      </MobileCard>
    </MobileAppShell>
  );
}
