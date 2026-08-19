"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ReviewTablerIcon } from "@/components/review/review-tabler-icon";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { SHELL_MAIN_REVIEW } from "@/lib/app-shell-classes";

type Props = {
  children: ReactNode;
};

export function ReviewSubScreen({ children }: Props) {
  const locale = useUiLocale();
  return (
    <MobileAppShell
      activeTab="study"
      showBottomNav
      mainClassName={SHELL_MAIN_REVIEW}
    >
      <div className="bs-review-sub">
        <Link href="/review" className="bs-review-back" aria-label={tr(locale, "Давтах цэс")}>
          <ReviewTablerIcon name="arrow-left" className="bs-review-back-icon" />
        </Link>
        {children}
      </div>
    </MobileAppShell>
  );
}
