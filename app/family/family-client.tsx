"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { KidCreateForm } from "@/components/kids/kid-create-form";
import { KidEditForm } from "@/components/kids/kid-edit-form";
import { KidPinPad } from "@/components/kids/kid-pin-pad";
import { KidsServiceRoleNotice } from "@/components/kids/kids-service-role-notice";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { deleteKidProfile, exitKidMode, fetchKids, loginAsKid } from "@/lib/kids/client";
import { formatKidLastActive } from "@/lib/kids/format";
import { isKidEmail, type KidProfile } from "@/lib/kids/types";
import { getSession, hasSupabaseConfig } from "@/lib/supabase/auth";

type SessionState = "loading" | "guest" | "kid" | "adult";
type Panel = { childUserId: string; kind: "login" | "edit" } | null;

/** /family — эцэг эхийн самбар: хүүхдийн бүртгэл үүсгэх, засах, хүүхдээр нэвтрэх. */
export function FamilyClient() {
  const locale = useUiLocale();
  const [sessionState, setSessionState] = useState<SessionState>(hasSupabaseConfig ? "loading" : "guest");
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceRoleMissing, setServiceRoleMissing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinReset, setPinReset] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchKids();
    setLoading(false);
    if (!res.data) {
      setServiceRoleMissing(Boolean(res.serviceRoleMissing));
      setError(res.serviceRoleMissing ? null : res.error);
      return;
    }
    setError(null);
    setKids(res.data);
    if (res.data.length === 0) setShowAdd(true);
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    getSession().then(({ data }) => {
      const user = data?.user;
      if (!user) setSessionState("guest");
      else if (user.user_metadata?.kid === true || isKidEmail(user.email)) setSessionState("kid");
      else {
        setSessionState("adult");
        void load();
      }
    });
  }, [load]);

  async function handlePin(childUserId: string, pin: string) {
    setPinBusy(true);
    setPinError(null);
    const res = await loginAsKid(childUserId, pin);
    if (!res.data) {
      setPinBusy(false);
      setPinError(res.error);
      setPinReset((n) => n + 1);
      return;
    }
    window.location.assign("/home");
  }

  async function handleDelete(kid: KidProfile) {
    const ok = window.confirm(
      `${kid.displayName} — ${tr(locale, "бүртгэл, сурах явц бүгд бүрмөсөн устана. Үргэлжлүүлэх үү?")}`
    );
    if (!ok) return;
    setDeletingId(kid.childUserId);
    const res = await deleteKidProfile(kid.childUserId);
    setDeletingId(null);
    if (!res.data) {
      setError(res.error);
      return;
    }
    setKids((list) => list.filter((k) => k.childUserId !== kid.childUserId));
  }

  function togglePanel(childUserId: string, kind: "login" | "edit") {
    setPinError(null);
    setPinBusy(false);
    setPanel((p) => (p?.childUserId === childUserId && p.kind === kind ? null : { childUserId, kind }));
  }

  return (
    <MobileAppShell activeTab="profile" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title={tr(locale, "Гэр бүл — хүүхдийн бүртгэл")}
        subtitle={tr(locale, "Имэйлгүй хүүхдэдээ бүртгэл үүсгээд, утсан дээр avatar + 4 оронтой PIN-ээр нэвтрүүлээрэй.")}
      />

      {!hasSupabaseConfig ? (
        <MobileCard className="text-sm text-[var(--app-muted)]">Supabase тохиргоо олдсонгүй.</MobileCard>
      ) : sessionState === "loading" ? (
        <p className="py-10 text-center text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
      ) : sessionState === "guest" ? (
        <MobileCard className="space-y-3 text-center">
          <p className="text-sm text-[var(--app-text)]">
            {tr(locale, "Хүүхдийн бүртгэлийг удирдахын тулд эцэг эх эхлээд өөрийн имэйлээр нэвтэрнэ.")}
          </p>
          <Link href="/login?next=/family" className="app-btn-primary inline-flex w-full justify-center">
            {tr(locale, "Нэвтрэх")}
          </Link>
          <Link href="/signup?next=/family" className="block text-sm font-semibold text-emerald-600">
            {tr(locale, "Бүртгүүлэх")}
          </Link>
        </MobileCard>
      ) : sessionState === "kid" ? (
        <MobileCard className="space-y-3 text-center">
          <p className="text-sm text-[var(--app-text)]">
            {tr(locale, "Одоо хүүхдийн бүртгэлээр нэвтэрсэн байна. Эцэг эх нэвтэрч байж энэ хуудсыг ашиглана.")}
          </p>
          <button type="button" onClick={() => void exitKidMode("/family")} className="app-btn-primary w-full">
            👨‍👩‍👧 {tr(locale, "Эцэг эх рүү буцах")}
          </button>
        </MobileCard>
      ) : serviceRoleMissing ? (
        <KidsServiceRoleNotice />
      ) : (
        <>
          {error ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">{error}</p>
          ) : null}

          {loading ? (
            <p className="py-6 text-center text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {kids.map((kid) => {
                const open = panel?.childUserId === kid.childUserId ? panel.kind : null;
                return (
                  <MobileCard key={kid.childUserId}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl" aria-hidden>
                        {kid.avatar}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-[var(--app-text)]" translate="no">
                          {kid.displayName}
                        </p>
                        {kid.classroomName ? (
                          <p className="truncate text-xs text-emerald-700">
                            🏫 <span translate="no">{kid.classroomName}</span>
                          </p>
                        ) : null}
                        <p className="text-xs text-[var(--app-muted)]">
                          {formatKidLastActive(locale, kid.lastActiveAt)}
                          {kid.currentStreak > 0 ? ` · 🔥 ${kid.currentStreak}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => togglePanel(kid.childUserId, "login")}
                        className="app-btn-primary flex-1 !min-h-0 !py-2 text-sm"
                      >
                        🧒 {tr(locale, "Хүүхдээр нэвтрэх")}
                      </button>
                      {kid.isGuardian ? (
                        <>
                          <button
                            type="button"
                            onClick={() => togglePanel(kid.childUserId, "edit")}
                            className="app-btn-secondary !min-h-0 !py-2 text-sm"
                          >
                            {tr(locale, "Засах")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(kid)}
                            disabled={deletingId === kid.childUserId}
                            className="rounded-full px-3 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 disabled:opacity-50"
                          >
                            {deletingId === kid.childUserId ? tr(locale, "Устгаж байна…") : tr(locale, "Устгах")}
                          </button>
                        </>
                      ) : null}
                    </div>

                    {open === "login" ? (
                      <div className="mt-4 border-t border-[var(--app-border)] pt-4">
                        <p className="mb-3 text-center text-sm font-medium text-[var(--app-text)]">
                          {tr(locale, "Хүүхдийн PIN-г оруулна уу")}
                        </p>
                        <KidPinPad
                          key={pinReset}
                          busy={pinBusy}
                          error={pinError}
                          onComplete={(pin) => void handlePin(kid.childUserId, pin)}
                        />
                      </div>
                    ) : null}

                    {open === "edit" ? (
                      <KidEditForm
                        kid={kid}
                        onCancel={() => setPanel(null)}
                        onSaved={(updated) => {
                          setKids((list) => list.map((k) => (k.childUserId === updated.childUserId ? updated : k)));
                          setPanel(null);
                        }}
                      />
                    ) : null}
                  </MobileCard>
                );
              })}

              {showAdd ? (
                <MobileCard>
                  <h2 className="mb-3 text-base font-bold text-[var(--app-text)]">
                    {tr(locale, "Хүүхэд нэмэх")}
                  </h2>
                  <KidCreateForm
                    onCreated={(kid) => {
                      setKids((list) => [...list, kid]);
                      setShowAdd(false);
                    }}
                    onCancel={kids.length > 0 ? () => setShowAdd(false) : undefined}
                  />
                </MobileCard>
              ) : (
                <button type="button" onClick={() => setShowAdd(true)} className="app-btn-secondary w-full">
                  ＋ {tr(locale, "Хүүхэд нэмэх")}
                </button>
              )}

              {kids.length > 0 ? (
                <Link href="/kids" className="bs-tm-card mt-2">
                  <span className="bs-tm-card-ic" aria-hidden>
                    🧒
                  </span>
                  <span className="flex-1">
                    <span className="bs-tm-card-title">{tr(locale, "Хүүхэд сонгох дэлгэц")}</span>
                    <span className="block text-xs text-[var(--app-muted)]">
                      {tr(locale, "Хүүхэд өөрөө avatar-аа дараад PIN-ээр нэвтэрнэ")}
                    </span>
                  </span>
                  <span className="bs-tm-card-chev" aria-hidden>›</span>
                </Link>
              ) : null}

              <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
                {tr(locale, "Хүүхдийн бүртгэлд имэйл хэрэггүй, ямар ч имэйл илгээгдэхгүй. Сурах явц нь хүүхэд бүрийн өөрийн бүртгэлд хадгалагдана. Хүүхэд нэвтэрсэн үед дээд талын «Эцэг эх» товчоор буцаж нэвтэрнэ.")}
              </p>
            </div>
          )}
        </>
      )}
    </MobileAppShell>
  );
}
