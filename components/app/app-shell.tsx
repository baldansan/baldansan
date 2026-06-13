import type { BottomNavTab } from "@/components/BottomNav";
import { AppSidebar } from "@/components/app/app-sidebar";
import PhoneFrame from "@/components/layout/PhoneFrame";
import { BottomNavChrome } from "@/components/mobile/bottom-nav-chrome";
import { MobileShellHeader } from "@/components/mobile/mobile-shell-header";
import { resolveBottomNavTab } from "@/lib/bottom-nav";
import type { MobileNavTab } from "@/lib/mobile-nav";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  activeTab?: MobileNavTab | BottomNavTab;
  showBottomNav?: boolean;
  /** Бичлэг тоглуулагч зэрэг бүтэн дэлгэцийн контент — padding/max-width байхгүй. */
  immersive?: boolean;
  /** Шалгалт зэрэг бүтэн дэлгэц — desktop sidebar нуугдана. */
  hideSidebar?: boolean;
  mainClassName?: string;
};

/**
 * Learner app shell: утас дээр доод nav + нарийн багана; lg (1024px)+ зүүн sidebar + өргөн контент.
 */
export function AppShell({
  children,
  activeTab,
  showBottomNav = true,
  immersive = false,
  hideSidebar = false,
  mainClassName = "",
}: Props) {
  const navTab = resolveBottomNavTab(activeTab);

  const mainClasses = immersive
    ? `relative flex-1 overflow-hidden p-0 lg:mx-0 lg:w-full lg:max-w-none ${mainClassName}`
    : `flex-1 overflow-x-hidden px-4 pt-5 lg:mx-auto lg:w-full lg:max-w-3xl lg:px-6 lg:pt-6 ${
        showBottomNav ? "pb-32 lg:pb-8" : "pb-6"
      } ${mainClassName}`;

  const rootClass = hideSidebar
    ? "bs-app-root bs-app-root--no-sidebar"
    : "bs-app-root lg:pl-60";

  return (
    <div className={rootClass}>
      <AppSidebar active={navTab} />

      <PhoneFrame>
        <div className="bs-app-shell-inner">
          <main className={mainClasses}>
            {!immersive ? <MobileShellHeader /> : null}
            {children}
          </main>
          {showBottomNav ? (
            <div className="absolute inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
              <BottomNavChrome active={navTab} />
            </div>
          ) : null}
        </div>
      </PhoneFrame>
    </div>
  );
}
