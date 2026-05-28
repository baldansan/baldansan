import Link from "next/link";
import { AuthStatus } from "@/components/auth-status";
import { BrandLogo } from "@/components/brand-logo";

type Props = {
  active?: "courses" | "review" | "profile";
};

export function AppHeader({ active }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <BrandLogo />
      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
        <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs sm:gap-x-5 sm:text-sm">
          <Link
            href="/courses"
            className={
              active === "courses"
                ? "font-medium text-emerald-600"
                : "text-slate-600 transition-colors hover:text-emerald-600"
            }
          >
            Courses
          </Link>
          <Link
            href="/review"
            className={
              active === "review"
                ? "font-medium text-emerald-600"
                : "text-slate-600 transition-colors hover:text-emerald-600"
            }
          >
            Review
          </Link>
          <Link
            href="/profile"
            className={
              active === "profile"
                ? "font-medium text-emerald-600"
                : "text-slate-600 transition-colors hover:text-emerald-600"
            }
          >
            Profile
          </Link>
        </nav>
        <AuthStatus />
      </div>
    </header>
  );
}
