import Link from "next/link";
import { BRAND_NAME_MN } from "@/lib/brand";

const links = [
  { href: "/courses", label: "Курсууд" },
  { href: "/schools", label: "Schools" },
  { href: "/teachers", label: "Teachers" },
  { href: "/demo", label: "Demo" },
  { href: "/onboarding", label: "Заавар" },
  { href: "/help", label: "Тусламж" },
  { href: "/feedback", label: "Feedback" },
  { href: "/pricing", label: "Pricing" },
  { href: "/school-inquiry", label: "School inquiry" },
  { href: "/teacher-dashboard", label: "Teacher dashboard" },
  { href: "/login", label: "Нэвтрэх" },
  { href: "/profile", label: "Профайл" },
] as const;

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/80">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:px-6">
        <nav
          className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600"
          aria-label="Footer"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-emerald-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-slate-500">
          {BRAND_NAME_MN} — Short video Chinese learning.
        </p>
      </div>
    </footer>
  );
}
