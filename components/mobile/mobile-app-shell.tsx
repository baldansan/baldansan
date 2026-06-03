import BottomNav from "@/components/BottomNav";
import type { BottomNavTab } from "@/components/BottomNav";
import PhoneFrame from "@/components/layout/PhoneFrame";
import { resolveBottomNavTab } from "@/lib/bottom-nav";
import type { MobileNavTab } from "@/lib/mobile-nav";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  activeTab?: MobileNavTab | BottomNavTab;
  showBottomNav?: boolean;
  mainClassName?: string;
};

/** Centered phone-width learner app container with bottom tab bar. */
export function MobileAppShell({
  children,
  activeTab,
  showBottomNav = true,
  mainClassName = "",
}: Props) {
  return (
    <PhoneFrame>
      <div className="bs-app-shell-inner">
        <main
          className={`flex-1 overflow-x-hidden px-4 pt-5 ${
            showBottomNav ? "pb-24" : "pb-6"
          } ${mainClassName}`}
        >
          {children}
        </main>
        {showBottomNav ? (
          <div className="absolute inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            <BottomNav active={resolveBottomNavTab(activeTab)} />
          </div>
        ) : null}
      </div>
    </PhoneFrame>
  );
}
