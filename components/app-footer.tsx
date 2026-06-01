import Link from "next/link";
import { features } from "@/lib/features";
import { LEARNER_NAV } from "@/lib/learner-labels";
import { BRAND_NAME_MN } from "@/lib/brand";

const learnerLinks = [
  { href: "/courses", label: LEARNER_NAV.courses },
  { href: "/onboarding", label: LEARNER_NAV.onboarding },
  { href: "/help", label: LEARNER_NAV.help },
  { href: "/feedback", label: "Санал хүсэлт" },
  { href: "/pricing", label: "Үнийн санал" },
  { href: "/login", label: LEARNER_NAV.login },
  { href: "/profile", label: LEARNER_NAV.profile },
] as const;

const b2bLinks = [
  { href: "/schools", label: "Сургууль" },
  { href: "/teachers", label: "Багш" },
  { href: "/demo", label: "Demo" },
  { href: "/school-inquiry", label: "School inquiry" },
  { href: "/teacher-dashboard", label: "Teacher dashboard" },
] as const;

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/80 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-8 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Суралцах
          </p>
          <nav
            className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600"
            aria-label="Footer learner links"
          >
            {learnerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-emerald-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {features.b2b ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Байгууллага / B2B
          </p>
          <nav
            className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500"
            aria-label="Footer B2B links"
          >
            {b2bLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-emerald-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        ) : null}
        <p className="text-xs text-slate-500">
          {BRAND_NAME_MN} — богино бичлэг, үгийн сан, quiz-ээр Хятад хэл сур.
        </p>
      </div>
    </footer>
  );
}
