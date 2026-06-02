"use client";

import type { ReactNode } from "react";
import { AnimatedProgressBar } from "@/components/motion/animated-progress-bar";
import { LESSON_MODULE } from "./module-theme";

type Props = {
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  onRestart?: () => void;
  trailing?: ReactNode;
};

export function LessonProgressHeader({
  title,
  subtitle,
  stepIndex,
  totalSteps,
  onBack,
  onRestart,
  trailing,
}: Props) {
  const progress = Math.round(((stepIndex + 1) / Math.max(totalSteps, 1)) * 100);

  return (
    <header className="mb-4 shrink-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm"
          style={{ border: `1px solid ${LESSON_MODULE.border}` }}
          aria-label="Буцах"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-semibold"
            style={{ color: LESSON_MODULE.text }}
          >
            {title}
          </p>
          {subtitle ? (
            <p
              className="truncate text-xs"
              style={{ color: LESSON_MODULE.textMuted }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {onRestart ? (
          <button
            type="button"
            onClick={onRestart}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium"
            style={{ color: LESSON_MODULE.textMuted }}
          >
            ↺
          </button>
        ) : null}
        {trailing}
      </div>
      <div className="mt-3">
        <AnimatedProgressBar
          value={progress}
          trackClassName="h-1 overflow-hidden rounded-full bg-neutral-100"
          fillClassName="h-full rounded-full bg-[#1FB85A]"
        />
        <p
          className="mt-1.5 text-center text-[10px] font-medium tracking-wide"
          style={{ color: LESSON_MODULE.textSubtle }}
        >
          {stepIndex + 1} / {totalSteps}
        </p>
      </div>
    </header>
  );
}
