import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import type { MobileNavTab } from "@/lib/mobile-nav";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  activeTab?: MobileNavTab;
  showBottomNav?: boolean;
  mainClassName?: string;
};

/** Learner pages inside the mobile app shell. */
export function LearnerPageShell({
  children,
  activeTab = "home",
  showBottomNav = true,
  mainClassName = "",
}: Props) {
  return (
    <MobileAppShell
      activeTab={activeTab}
      showBottomNav={showBottomNav}
      mainClassName={mainClassName}
    >
      {children}
    </MobileAppShell>
  );
}
