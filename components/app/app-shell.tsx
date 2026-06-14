import type { BottomNavTab } from "@/components/BottomNav";
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
  /** @deprecated Sidebar арилгасан — ижил phone layout ашиглана. */
  hideSidebar?: boolean;
  mainClassName?: string;
};

/**
 * Learner app shell: бүх дэлгэцэнд утасны доод nav + төвд max-w-[480px] багана.
 * PC дээр хоёр талд саарал фон, гар утасны харагдац хэвээр.
 */
export function AppShell({
  children,
  activeTab,
  showBottomNav = true,
  immersive = false,
  mainClassName = "",
}: Props) {
  const navTab = resolveBottomNavTab(activeTab);

  const mainClasses = immersive
    ? `relative flex-1 overflow-hidden p-0 ${mainClassName}`
    : `flex w-full flex-1 min-w-0 justify-center overflow-x-hidden pt-5 ${
        showBottomNav ? "pb-32" : "pb-6"
      }`;

  const columnClasses = immersive
    ? mainClassName
    : `w-full max-w-[480px] min-w-0 px-4 ${mainClassName}`.trim();

  const content = (
    <>
      {!immersive ? <MobileShellHeader /> : null}
      {children}
    </>
  );

  return (
    <div className="bs-app-root bs-app-root--phone-layout">
      <PhoneFrame>
        <div className="bs-app-shell-inner">
          <main className={mainClasses}>
            {immersive ? (
              content
            ) : (
              <div className={columnClasses}>{content}</div>
            )}
          </main>
          {showBottomNav ? (
            <div className="absolute inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
              <BottomNavChrome active={navTab} />
            </div>
          ) : null}
        </div>
      </PhoneFrame>
    </div>
  );
}
