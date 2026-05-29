import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
};

export function MobilePageHeader({ title, subtitle, badge, action }: Props) {
  return (
    <header className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-[var(--app-text)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {badge ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {badge}
          </span>
        ) : null}
        {action}
      </div>
    </header>
  );
}
