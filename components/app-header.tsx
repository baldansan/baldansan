import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

type Props = {
  active?: "courses" | "demo";
};

export function AppHeader({ active }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
      <BrandLogo />
      <nav className="flex items-center gap-3 text-xs sm:gap-5 sm:text-sm">
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
          href="/lessons/1"
          className={
            active === "demo"
              ? "font-medium text-emerald-600"
              : "text-slate-600 transition-colors hover:text-emerald-600"
          }
        >
          Demo
        </Link>
        <a
          href="#"
          className="text-slate-600 transition-colors hover:text-emerald-600"
        >
          Profile
        </a>
      </nav>
    </header>
  );
}
