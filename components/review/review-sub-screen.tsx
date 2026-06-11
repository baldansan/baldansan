"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ReviewTablerIcon } from "@/components/review/review-tabler-icon";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_REVIEW } from "@/lib/app-shell-classes";

type Props = {
  children: ReactNode;
};

export function ReviewSubScreen({ children }: Props) {
  return (
    <MobileAppShell
      activeTab="study"
      showBottomNav
      mainClassName={SHELL_MAIN_REVIEW}
    >
      <div className="bs-review-sub">
        <Link href="/review" className="bs-review-back" aria-label="Давтах цэс">
          <ReviewTablerIcon name="arrow-left" className="bs-review-back-icon" />
        </Link>
        {children}
      </div>
    </MobileAppShell>
  );
}
