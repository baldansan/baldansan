import Link from "next/link";
import type { ReactNode } from "react";
import type { UiLocale } from "@/lib/i18n/locale-types";

/** Сервер компонентод хэлээр текст сонгох. */
export function L(locale: UiLocale, zh: string, mn: string): string {
  return locale === "zh" ? zh : mn;
}

export function BookCrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-[var(--app-muted)]" aria-label="breadcrumb">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 ? <span>›</span> : null}
          {it.href ? (
            <Link href={it.href} className="font-semibold text-emerald-700">
              {it.label}
            </Link>
          ) : (
            <span>{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function BookCard({
  href,
  locked,
  children,
}: {
  href: string | null;
  locked?: boolean;
  children: ReactNode;
}) {
  const cls = `app-card block p-4 ${locked ? "opacity-60" : "transition-colors active:bg-slate-50"}`;
  if (!href || locked) return <div className={cls}>{children}</div>;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
