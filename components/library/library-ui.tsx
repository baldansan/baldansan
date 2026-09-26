import Link from "next/link";
import type { ReactNode } from "react";
import type { UiLocale } from "@/lib/i18n/locale-types";
import { L } from "@/components/books/book-ui";

/** Хуудаслалт: ?page=N — бусад query параметрүүдийг хадгална. */
export function Pager({
  locale,
  page,
  pages,
  total,
  hrefFor,
}: {
  locale: UiLocale;
  page: number;
  pages: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-2 text-sm" aria-label="pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="app-btn-secondary min-h-0 px-3 py-1.5">
          ‹ {L(locale, "上一页", "Өмнөх")}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-xs text-[var(--app-muted)]">
        {page} / {pages} · {total.toLocaleString("en-US")}
      </span>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className="app-btn-secondary min-h-0 px-3 py-1.5">
          {L(locale, "下一页", "Дараах")} ›
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/** Сонголтын товчнууд (түвшин, төрөл). */
export function Chips({
  items,
}: {
  items: Array<{ href: string; label: string; active: boolean }>;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
            it.active
              ? "bg-emerald-600 text-white ring-emerald-600"
              : "bg-white text-[var(--app-text)] ring-slate-200 active:bg-slate-50"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

/** Хайлтын талбар — GET form, бусад параметрүүдийг hidden-ээр дамжуулна. */
export function SearchForm({
  locale,
  action,
  q,
  hidden = {},
  placeholder,
}: {
  locale: UiLocale;
  action: string;
  q: string;
  hidden?: Record<string, string>;
  placeholder?: string;
}) {
  return (
    <form action={action} method="get" className="mb-3 flex gap-2">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder ?? L(locale, "搜索…", "Хайх…")}
        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
      <button type="submit" className="app-btn-primary px-4">
        {L(locale, "搜索", "Хайх")}
      </button>
    </form>
  );
}

/** Эх сурвалж, лиценз — хуудасны доод хэсэгт. */
export function SourceNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 text-[11px] leading-5 text-[var(--app-muted)]" translate="no">
      {children}
    </p>
  );
}

export function LevelBadge({ level }: { level: number | string | null | undefined }) {
  if (level === null || level === undefined) return null;
  const txt = typeof level === "number" ? (level >= 7 ? "HSK 7–9" : `HSK ${level}`) : level;
  return (
    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
      {txt}
    </span>
  );
}
