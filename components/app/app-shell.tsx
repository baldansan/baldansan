import type { BottomNavTab } from "@/components/BottomNav";
import PhoneFrame from "@/components/layout/PhoneFrame";
import { KidModeBar } from "@/components/kids/kid-mode-bar";
import { BottomNavChrome } from "@/components/mobile/bottom-nav-chrome";
import { MobileShellHeader } from "@/components/mobile/mobile-shell-header";
import { DesktopTopNav } from "@/components/app/desktop-top-nav";
import { resolveBottomNavTab } from "@/lib/bottom-nav";
import type { MobileNavTab } from "@/lib/mobile-nav";
import type { ReactNode } from "react";
import "./desktop-shell.css";

export type DesktopWidth = "narrow" | "wide" | "full";

type Props = {
  children: ReactNode;
  activeTab?: MobileNavTab | BottomNavTab;
  showBottomNav?: boolean;
  /** Бичлэг тоглуулагч зэрэг бүтэн дэлгэцийн контент — padding/max-width байхгүй. */
  immersive?: boolean;
  /** @deprecated Sidebar арилгасан — дээд цэс (DesktopTopNav) ашиглана. */
  hideSidebar?: boolean;
  mainClassName?: string;
  /**
   * PC (≥920px) дээрх агуулгын өргөн. narrow=760px (унших), wide=1120px (grid),
   * full=хязгааргүй. Утсан дээр нөлөөгүй.
   */
  desktopWidth?: DesktopWidth;
  /** PC (≥920px) дээр агуулгын баруун талд харагдах самбар. Утсан дээр нуугдана. */
  rightRail?: ReactNode;
};

/**
 * Learner app shell.
 * Утас (<920px): доод nav + төвд max-w-[480px] багана — өмнөхөөс өөрчлөлтгүй.
 * PC (≥920px): дээд цэс + агуулгын багана (desktopWidth) + баруун самбар (rightRail).
 */
export function AppShell({
  children,
  activeTab,
  showBottomNav = true,
  immersive = false,
  mainClassName = "",
  desktopWidth = "narrow",
  rightRail,
}: Props) {
  const navTab = resolveBottomNavTab(activeTab);

  const mainClasses = immersive
    ? `bs-desk-main--immersive relative flex-1 overflow-hidden p-0 ${mainClassName}`
    : `bs-desk-main flex w-full flex-1 min-w-0 justify-center overflow-x-hidden pt-5 ${
        showBottomNav ? "pb-32" : "pb-6"
      }`;

  const columnClasses = immersive
    ? mainClassName
    : `bs-desk-col bs-desk-col--${desktopWidth} w-full max-w-[480px] min-w-0 px-4 ${mainClassName}`.trim();

  const content = (
    <>
      {!immersive ? <KidModeBar /> : null}
      {!immersive ? (
        <div className="bs-desk-hide">
          <MobileShellHeader />
        </div>
      ) : null}
      {children}
    </>
  );

  return (
    <div className="bs-app-root bs-app-root--phone-layout">
      <DesktopTopNav active={navTab} />
      <PhoneFrame>
        <div className="bs-app-shell-inner">
          <main className={mainClasses}>
            {immersive ? (
              content
            ) : (
              <>
                <div className={columnClasses}>{content}</div>
                {rightRail ? <aside className="bs-desk-rail">{rightRail}</aside> : null}
              </>
            )}
          </main>
          {showBottomNav ? (
            <div className="bs-desk-hide absolute inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
              <BottomNavChrome active={navTab} />
            </div>
          ) : null}
        </div>
      </PhoneFrame>
    </div>
  );
}
