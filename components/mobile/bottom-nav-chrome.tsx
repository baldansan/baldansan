"use client";

import BottomNav, { type BottomNavTab } from "@/components/BottomNav";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { getSelectedLanguage } from "@/lib/learner-onboarding";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type Props = {
  active: BottomNavTab;
};

/** Bottom tab bar with always-visible HSK level picker (Chinese track only). */
export function BottomNavChrome({ active }: Props) {
  const pathname = usePathname();
  const showChinese = useMemo(
    () => getSelectedLanguage() === "zh",
    [pathname]
  );

  return (
    <div className="bs-bottomnav-shell">
      {showChinese ? (
        <div className="bs-bottomnav-hsk">
          <HskLevelSelector placement="nav" />
        </div>
      ) : null}
      <BottomNav active={active} embedded />
    </div>
  );
}
