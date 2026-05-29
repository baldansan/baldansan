import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Stacked full-width CTAs on mobile; inline row on sm+. */
export function CtaButtonRow({ children, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${className}`}
    >
      {children}
    </div>
  );
}

export const ctaPrimaryClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 sm:w-auto";

export const ctaSecondaryClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 sm:w-auto";

export const ctaOutlineClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 sm:w-auto";
