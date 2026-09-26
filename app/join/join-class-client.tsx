"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { JoinClassForm } from "@/components/classroom/join-class-form";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { getSession, hasSupabaseConfig } from "@/lib/supabase/auth";
import { setPendingClassCode } from "@/lib/supabase/classrooms";

export function JoinClassClient({ initialCode }: { initialCode: string }) {
  const locale = useUiLocale();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    getSession().then(({ data }) => setSignedIn(Boolean(data)));
  }, []);

  const clean = initialCode.replace(/\D/g, "").slice(0, 6);

  return (
    <MobileAppShell activeTab="profile" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title={tr(locale, "Ангид орох")}
        subtitle={tr(locale, "Багшийн өгсөн 6 оронтой кодыг оруулаад ангидаа нэгдээрэй.")}
      />
      <MobileCard>
        {!hasSupabaseConfig ? (
          <p className="text-sm text-[var(--app-muted)]">Supabase тохиргоо олдсонгүй.</p>
        ) : signedIn === false ? (
          <div className="space-y-3">
            <JoinClassForm initialCode={clean} mode="peek" onCodeChange={(c, name) => setPendingClassCode(name ? c : null)} />
            <p className="text-sm text-[var(--app-muted)]">
              {tr(locale, "Ангид орохын тулд эхлээд бүртгүүлэх эсвэл нэвтэрнэ — код хадгалагдаж, нэвтэрмэгц автоматаар нэгдэнэ.")}
            </p>
            <div className="flex gap-2">
              <Link href={`/signup?code=${clean}`} className="app-btn-primary flex-1 text-center">
                {tr(locale, "Бүртгүүлэх")}
              </Link>
              <Link href="/login?next=/join" className="app-btn-secondary flex-1 text-center">
                {tr(locale, "Нэвтрэх")}
              </Link>
            </div>
          </div>
        ) : (
          <JoinClassForm initialCode={clean} />
        )}
      </MobileCard>
    </MobileAppShell>
  );
}
