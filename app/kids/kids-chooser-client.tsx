"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KidPinPad } from "@/components/kids/kid-pin-pad";
import { KidsServiceRoleNotice } from "@/components/kids/kids-service-role-notice";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { exitKidMode, fetchKids, loginAsKid } from "@/lib/kids/client";
import { isKidEmail, type KidProfile } from "@/lib/kids/types";
import { getSession, hasSupabaseConfig } from "@/lib/supabase/auth";

type SessionState = "loading" | "guest" | "kid" | "adult";

/** /kids — хүүхэд сонгох дэлгэц: том avatar → 4 оронтой PIN → /home. */
export function KidsChooserClient() {
  const locale = useUiLocale();
  const [sessionState, setSessionState] = useState<SessionState>(hasSupabaseConfig ? "loading" : "guest");
  const [kidName, setKidName] = useState<string | null>(null);
  const [kids, setKids] = useState<KidProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceRoleMissing, setServiceRoleMissing] = useState(false);
  const [selected, setSelected] = useState<KidProfile | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinReset, setPinReset] = useState(0);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    getSession().then(async ({ data }) => {
      const user = data?.user;
      if (!user) {
        setSessionState("guest");
        return;
      }
      if (user.user_metadata?.kid === true || isKidEmail(user.email)) {
        setKidName(String(user.user_metadata?.display_name ?? ""));
        setSessionState("kid");
        return;
      }
      setSessionState("adult");
      const res = await fetchKids();
      if (!res.data) {
        setServiceRoleMissing(Boolean(res.serviceRoleMissing));
        setError(res.error);
        setKids([]);
        return;
      }
      setKids(res.data);
    });
  }, []);

  async function handlePin(pin: string) {
    if (!selected) return;
    setPinBusy(true);
    setPinError(null);
    const res = await loginAsKid(selected.childUserId, pin);
    if (!res.data) {
      setPinBusy(false);
      setPinError(res.error);
      setPinReset((n) => n + 1);
      return;
    }
    window.location.assign("/home");
  }

  return (
    <MobileAppShell activeTab="profile" showBottomNav={false} mainClassName={SHELL_MAIN_NARROW}>
      <section className="py-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
          🧒 {tr(locale, "Хэн сурах вэ?")}
        </h1>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          {tr(locale, "Өөрийнхөө зураг дээр дараад PIN-ээ оруулаарай.")}
        </p>
      </section>

      {!hasSupabaseConfig ? (
        <MobileCard className="text-sm text-[var(--app-muted)]">Supabase тохиргоо олдсонгүй.</MobileCard>
      ) : sessionState === "loading" ? (
        <p className="py-10 text-center text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
      ) : sessionState === "guest" ? (
        <MobileCard className="space-y-3 text-center">
          <p className="text-sm text-[var(--app-text)]">
            {tr(locale, "Энэ утсан дээр эхлээд эцэг эх (эсвэл багш) нэг удаа нэвтэрнэ. Дараа нь хүүхэд avatar + PIN-ээр өөрөө орно.")}
          </p>
          <Link href="/login?next=/kids" className="app-btn-primary inline-flex w-full justify-center">
            👨‍👩‍👧 {tr(locale, "Эцэг эх нэвтрэх")}
          </Link>
        </MobileCard>
      ) : sessionState === "kid" ? (
        <MobileCard className="space-y-3 text-center">
          <p className="text-sm text-[var(--app-text)]">
            {tr(locale, "Одоо нэвтэрсэн:")} <strong translate="no">{kidName || tr(locale, "Хүүхэд")}</strong>
          </p>
          <Link href="/home" className="app-btn-primary inline-flex w-full justify-center">
            {tr(locale, "Үргэлжлүүлэх")} →
          </Link>
          <button type="button" onClick={() => void exitKidMode("/kids")} className="app-btn-secondary w-full">
            {tr(locale, "Өөр хүүхэд — эцэг эх нэвтрэх")}
          </button>
        </MobileCard>
      ) : serviceRoleMissing ? (
        <KidsServiceRoleNotice />
      ) : kids === null ? (
        <p className="py-10 text-center text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
      ) : selected ? (
        <MobileCard className="flex flex-col items-center gap-3 !py-6">
          <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 text-6xl" aria-hidden>
            {selected.avatar}
          </span>
          <p className="text-lg font-bold text-[var(--app-text)]" translate="no">
            {selected.displayName}
          </p>
          <KidPinPad key={pinReset} busy={pinBusy} error={pinError} onComplete={(pin) => void handlePin(pin)} />
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setPinError(null);
            }}
            className="mt-2 text-sm font-semibold text-[var(--app-muted)]"
          >
            ← {tr(locale, "Буцах")}
          </button>
        </MobileCard>
      ) : (
        <>
          {error ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">{error}</p>
          ) : null}
          {kids.length === 0 ? (
            <MobileCard className="space-y-3 text-center">
              <p className="text-sm text-[var(--app-text)]">{tr(locale, "Хүүхдийн бүртгэл хараахан алга.")}</p>
              <Link href="/family" className="app-btn-primary inline-flex w-full justify-center">
                {tr(locale, "Хүүхэд нэмэх")}
              </Link>
            </MobileCard>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {kids.map((kid) => (
                <button
                  key={kid.childUserId}
                  type="button"
                  onClick={() => {
                    setSelected(kid);
                    setPinError(null);
                    setPinBusy(false);
                  }}
                  className="app-card flex flex-col items-center gap-2 p-4 active:bg-emerald-50"
                >
                  <span className="text-6xl" aria-hidden>
                    {kid.avatar}
                  </span>
                  <span className="w-full truncate text-base font-bold text-[var(--app-text)]" translate="no">
                    {kid.displayName}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 text-center">
            <Link href="/family" className="text-sm font-semibold text-emerald-700">
              👨‍👩‍👧 {tr(locale, "Гэр бүлийн самбар")}
            </Link>
          </div>
        </>
      )}
    </MobileAppShell>
  );
}
