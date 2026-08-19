"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { getSelectedLanguage } from "@/lib/learner-onboarding";

function isHomePath(pathname: string): boolean {
  return pathname === "/home" || pathname === "/";
}

function isActiveGamePath(pathname: string): boolean {
  return pathname.startsWith("/games/") && pathname !== "/games";
}

export function MobileShellHeader() {
  const locale = useUiLocale();
  const pathname = usePathname() ?? "";
  // Сервер дээр localStorage байхгүй тул render үед уншвал hydration
  // warning өгдөг байсан — mount-ын дараа л шалгана.
  const [showChinese, setShowChinese] = useState(false);
  useEffect(() => {
    setShowChinese(getSelectedLanguage() === "zh");
  }, [pathname]);

  if (!showChinese) return null;

  if (isHomePath(pathname)) {
    return (
      <header className="mb-3 flex items-center">
        <HskLevelSelector placement="header" />
      </header>
    );
  }

  if (isActiveGamePath(pathname)) {
    return (
      <header className="mb-3 flex items-center">
        <Link
          href="/games"
          className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-3.5 py-1.5 text-sm font-bold text-[var(--app-text)] shadow-sm active:bg-slate-50"
          aria-label={tr(locale, "Буцах")}
        >
          ← {tr(locale, "Буцах")}
        </Link>
      </header>
    );
  }

  return null;
}
