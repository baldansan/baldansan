import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import type { MobileNavTab } from "@/lib/mobile-nav";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  activeTab?: MobileNavTab;
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
    <div className="min-h-screen bg-[var(--app-outer)] flex justify-center px-0 sm:px-4">
      <div className="app-shell-frame">
        <main
          className={`flex-1 overflow-x-hidden px-4 pt-5 ${
            showBottomNav ? "pb-24" : "pb-6"
          } ${mainClassName}`}
        >
          {children}
        </main>
        {showBottomNav ? <MobileBottomNav active={activeTab} /> : null}
      </div>
    </div>
  );
}
