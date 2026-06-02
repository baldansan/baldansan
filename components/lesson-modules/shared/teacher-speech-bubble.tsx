"use client";

import type { ReactNode } from "react";
import { LESSON_MODULE } from "./module-theme";

type Props = {
  children: ReactNode;
  className?: string;
  /** Mascot label — defaults to camel teacher */
  mascot?: ReactNode;
  teacherName?: string;
};

/**
 * Calm teacher voice — Тэмээ багш mascot slot, speech bubble on the right.
 */
export function TeacherSpeechBubble({
  children,
  className = "",
  mascot,
  teacherName = "Тэмээ багш",
}: Props) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm"
        style={{
          backgroundColor: LESSON_MODULE.primaryMuted,
          border: `1px solid ${LESSON_MODULE.primary}30`,
        }}
        aria-hidden
      >
        {mascot ?? "🐫"}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="mb-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: LESSON_MODULE.textSubtle }}
        >
          {teacherName}
        </p>
        <div
          className="rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed"
          style={{
            backgroundColor: LESSON_MODULE.surface,
            border: `1px solid ${LESSON_MODULE.border}`,
            boxShadow: LESSON_MODULE.shadow,
            color: LESSON_MODULE.text,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
