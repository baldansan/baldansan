import { AuthStatus } from "@/components/auth-status";
import { NotificationBell } from "@/components/engagement/notification-bell";
import { BrandLogo } from "@/components/brand-logo";
import {
  PublicNavLinks,
  type PublicNavActive,
} from "@/components/public-nav-links";

type Props = {
  active?: PublicNavActive;
};

export function AppHeader({ active }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[960px] items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
        <BrandLogo />
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <PublicNavLinks active={active} className="hidden md:flex" />
          <div className="hidden sm:block">
            <NotificationBell />
          </div>
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
