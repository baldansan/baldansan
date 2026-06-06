"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { getSelectedLanguage } from "@/lib/learner-onboarding";

export function MobileShellHeader() {
  const pathname = usePathname();
  const showChinese = useMemo(
    () => getSelectedLanguage() === "zh",
    [pathname]
  );

  if (!showChinese) return null;

  return (
    <header className="mb-3 flex items-center">
      <HskLevelSelector placement="header" />
    </header>
  );
}
