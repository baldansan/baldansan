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
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
      <BrandLogo />
      <div className="flex min-w-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <PublicNavLinks active={active} />
        <NotificationBell />
        <AuthStatus />
      </div>
    </header>
  );
}
