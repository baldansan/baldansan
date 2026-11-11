"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { getSession, onAuthStateChange, updatePassword } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

const INPUT =
  "mt-1 w-full rounded-xl border border-[var(--app-border)] px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500";

/**
 * Имэйлийн сэргээх линк энд буцна. Supabase линкний #access_token-ийг өөрөө
 * уншиж түр session үүсгэнэ (PASSWORD_RECOVERY) — дараа нь шинэ нууц үг хадгална.
 */
export default function ResetPasswordPage() {
  const locale = useUiLocale();
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    let settled = false;
    // Линкний алдаа (?error= — /auth/confirm-оос; #error_description= — Supabase-ээс шууд).
    try {
      const sp = new URLSearchParams(window.location.search);
      const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const msg = sp.get("error") || hp.get("error_description") || hp.get("error");
      if (msg) {
        setLinkError(msg);
        setReady("invalid");
        settled = true;
      }
      // Линк шууд ?code= тэй энд ирсэн бол (хуучин линк) энд солилцоно.
      const code = sp.get("code");
      if (code && supabase && !settled) {
        void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error && !settled) {
            settled = true;
            setLinkError(error.message);
            setReady("invalid");
          }
        });
      }
    } catch {
      /* ignore */
    }
    const off = onAuthStateChange((event, session) => {
      if (settled) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        settled = true;
        setReady("ok");
      }
    });
    // Линк аль хэдийн боловсруулагдсан бол session бэлэн байна.
    getSession().then(({ data }) => {
      if (settled) return;
      if (data) {
        settled = true;
        setReady("ok");
      }
    });
    // Линкгүй / хугацаа дууссан линк → 6 сек дотор session үүсэхгүй.
    const t = setTimeout(() => {
      if (!settled) setReady("invalid");
    }, 6000);
    return () => {
      off();
      clearTimeout(t);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(tr(locale, "Нууц үг дор хаяж 6 тэмдэгт байх ёстой."));
      return;
    }
    if (password !== confirm) {
      setError(tr(locale, "Хоёр нууц үг таарахгүй байна."));
      return;
    }
    setBusy(true);
    const { error: err } = await updatePassword(password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  }

  return (
    <MobileAppShell activeTab="profile" showBottomNav={false}>
      <section className="py-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
          {tr(locale, "Шинэ нууц үг")}
        </h1>
      </section>

      <MobileCard>
        {ready === "checking" ? (
          <p className="text-sm text-[var(--app-muted)]">{tr(locale, "Линк шалгаж байна...")}</p>
        ) : ready === "invalid" ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
              {tr(locale, "Сэргээх линк буруу эсвэл хугацаа нь дууссан байна. Дахин хүсэлт илгээнэ үү.")}
              {linkError ? <span className="mt-1 block text-xs opacity-80">{linkError}</span> : null}
            </p>
            <p className="text-xs text-[var(--app-muted)]">
              {tr(locale, "Зөвлөмж: линкийг «Сэргээх линк илгээх» дарсан тэр браузер дээрээ нээнэ үү (имэйл апп дотроос биш). Линк нэг л удаа, 1 цаг хүчинтэй.")}
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white"
            >
              {tr(locale, "Дахин линк авах")}
            </Link>
          </div>
        ) : done ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {tr(locale, "Нууц үг солигдлоо. Та нэвтэрсэн байна — үндсэн хуудас руу шилжиж байна.")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block text-sm font-medium text-[var(--app-text)]">
              {tr(locale, "Шинэ нууц үг")}
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT}
              />
            </label>
            <label className="block text-sm font-medium text-[var(--app-text)]">
              {tr(locale, "Шинэ нууц үг (давтах)")}
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {tr(locale, busy ? "Хадгалж байна..." : "Нууц үг хадгалах")}
            </button>
          </form>
        )}
      </MobileCard>
    </MobileAppShell>
  );
}
