import type { ReactNode } from "react";
import type { StudyPlanIconKind } from "@/lib/study-plan/weekly-plan";

const PATHS: Record<StudyPlanIconKind, ReactNode> = {
  book: (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v14l-5-3l-5 3V6a2 2 0 0 1 2-2" />
      <path d="M6 4v14" />
    </>
  ),
  vocabulary: (
    <>
      <path d="M4 19h16" />
      <path d="M8 5v14" />
      <path d="M12 5v14" />
      <path d="M16 5v14" />
    </>
  ),
  "help-circle": (
    <>
      <path d="M12 16v.01" />
      <path d="M12 13a2 2 0 0 1 2 -2c0 -1.5 -1.5 -2 -2 -2" />
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
      <path d="M4 13v-4h4" />
      <path d="M20 11v4h-4" />
    </>
  ),
  file: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" />
    </>
  ),
};

type Props = {
  name: StudyPlanIconKind;
  className?: string;
};

export function StudyPlanTablerIcon({ name, className = "" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
