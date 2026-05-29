import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  mainClassName?: string;
};

/** Active game layout — phone shell without bottom nav. */
export function GameShell({ children, mainClassName = "" }: Props) {
  return (
    <MobileAppShell activeTab="games" showBottomNav={false} mainClassName={mainClassName}>
      {children}
    </MobileAppShell>
  );
}
