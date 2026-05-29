import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import type { PublicNavActive } from "@/components/public-nav-links";

type Props = {
  children: React.ReactNode;
  active?: PublicNavActive;
  showBottomNav?: boolean;
  showFooter?: boolean;
  mainClassName?: string;
};

export function PublicPageShell({
  children,
  active,
  showBottomNav = true,
  showFooter = true,
  mainClassName = "",
}: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active={active} />
      <main
        className={`mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-2 sm:gap-8 sm:px-6 ${
          showBottomNav ? "pb-24 md:pb-10" : "pb-10"
        } ${mainClassName}`}
      >
        {children}
      </main>
      {showFooter ? <AppFooter /> : null}
      {showBottomNav ? <BottomNav active={active} /> : null}
    </div>
  );
}
