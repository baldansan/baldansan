import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import type { PublicNavActive } from "@/components/public-nav-links";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  active?: PublicNavActive;
  showBottomNav?: boolean;
  mainClassName?: string;
};

/** Learner lesson sub-pages: header, padded main, bottom nav. */
export function LearnerPageShell({
  children,
  active,
  showBottomNav = true,
  mainClassName = "",
}: Props) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active={active} />
      <main
        className={`mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 pb-32 pt-2 sm:gap-8 sm:px-6 md:pb-10 ${mainClassName}`}
      >
        {children}
      </main>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
