import { AppShell } from "@/components/app/app-shell";
import type { BottomNavTab } from "@/components/BottomNav";
import type { MobileNavTab } from "@/lib/mobile-nav";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  activeTab?: MobileNavTab | BottomNavTab;
  showBottomNav?: boolean;
  immersive?: boolean;
  hideSidebar?: boolean;
  mainClassName?: string;
};

/** Learner app shell — утас + desktop (lg+) sidebar. */
export function MobileAppShell(props: Props) {
  return <AppShell {...props} />;
}

export { AppShell };
