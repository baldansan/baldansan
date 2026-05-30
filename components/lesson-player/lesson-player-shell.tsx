"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  stepIndex: number;
  totalSteps: number;
  onClose: () => void;
  onRestart: () => void;
  bottomCta?: ReactNode;
  hideBottomCta?: boolean;
};

export function LessonPlayerShell({
  children,
  stepIndex,
  totalSteps,
  onClose,
  onRestart,
  bottomCta,
  hideBottomCta = false,
}: Props) {
  const progressPercent =
    totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col">
      <header className="mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
            aria-label="Хаах"
          >
            ✕
          </button>
          <div className="min-w-0 flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs font-medium text-slate-500">
              Алхам {Math.min(stepIndex + 1, totalSteps)} / {totalSteps}
            </p>
          </div>
          <details className="relative shrink-0">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-white text-lg text-slate-600 shadow-sm ring-1 ring-slate-200 [&::-webkit-details-marker]:hidden">
              ⋮
            </summary>
            <div className="absolute right-0 z-20 mt-1 min-w-[10rem] overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200">
              <button
                type="button"
                onClick={onRestart}
                className="block w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Дахин эхлэх
              </button>
            </div>
          </details>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4">
        {children}
      </div>

      {!hideBottomCta && bottomCta ? (
        <div className="sticky bottom-0 shrink-0 border-t border-slate-100 bg-[var(--app-outer)] pt-3">
          {bottomCta}
        </div>
      ) : null}
    </div>
  );
}

export function LessonPlayerCard({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-[430px] overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      {children}
    </article>
  );
}

export function TeacherBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl shadow-sm"
        aria-hidden
      >
        🐸
      </span>
      <div className="relative min-w-0 flex-1 rounded-2xl rounded-tl-md bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
        <div className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 bg-emerald-50 ring-1 ring-emerald-100" />
        <div className="relative text-sm leading-6 text-slate-800">{children}</div>
      </div>
    </div>
  );
}

export function lessonPlayerPrimaryBtnClass(disabled = false): string {
  return `app-btn-primary w-full max-w-[430px] mx-auto block ${disabled ? "opacity-50 pointer-events-none" : ""}`;
}
