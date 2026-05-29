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
    <div className="min-h-screen bg-[var(--app-outer)] flex justify-center">
      <div className="relative flex w-full max-w-[430px] min-h-screen flex-col border-x border-slate-200/70 bg-[var(--app-bg)] shadow-[0_0_40px_rgba(15,23,42,0.08)]">
        <main
          className={`flex-1 overflow-x-hidden px-4 pt-4 ${
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
