"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { getSelectedLanguage } from "@/lib/learner-onboarding";

function isHomePath(pathname: string): boolean {
  return pathname === "/home" || pathname === "/";
}

function isActiveGamePath(pathname: string): boolean {
  return pathname.startsWith("/games/") && pathname !== "/games";
}

export function MobileShellHeader() {
  const pathname = usePathname() ?? "";
  const showChinese = useMemo(
    () => getSelectedLanguage() === "zh",
    [pathname]
  );

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
          aria-label="Буцах"
        >
          ← Буцах
        </Link>
      </header>
    );
  }

  return null;
}
