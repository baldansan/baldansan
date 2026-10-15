"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { ts } from "@/lib/social/i18n";
import { useChatUser } from "@/lib/social/use-chat-user";

/** Чатын бүх хуудсыг бүрхэнэ: зочин / хүүхдийн бүртгэлд агуулгыг харуулахгүй. */
export function ChatGate({
  children,
}: {
  children: (userId: string) => ReactNode;
}) {
  const locale = useUiLocale();
  const user = useChatUser();

  if (user.status === "loading") {
    return (
      <MobileAppShell activeTab="profile">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          {ts(locale, "Ачааллаж байна…")}
        </p>
      </MobileAppShell>
    );
  }

  if (user.status === "guest") {
    return (
      <MobileAppShell activeTab="profile">
        <div className="app-card p-5 text-center">
          <p className="text-sm font-bold text-[var(--app-text)]">
            {ts(locale, "Нэвтэрч орно уу")}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center app-btn-primary"
          >
            {ts(locale, "Нэвтрэх")}
          </Link>
        </div>
      </MobileAppShell>
    );
  }

  if (user.status === "kid") {
    return (
      <MobileAppShell activeTab="profile">
        <div className="app-card p-5 text-center text-sm text-[var(--app-muted)]">
          {ts(locale, "Хүүхдийн бүртгэлд чат нээгдэхгүй.")}
        </div>
      </MobileAppShell>
    );
  }

  return <>{children(user.userId)}</>;
}
