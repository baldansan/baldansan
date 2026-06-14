import type { ReactNode } from "react";

export type ReviewTablerIconName =
  | "flame"
  | "bulb"
  | "calendar"
  | "clipboard-check"
  | "chevron-right"
  | "arrow-left"
  | "book"
  | "layout"
  | "player-play";

const PATHS: Record<ReviewTablerIconName, ReactNode> = {
  flame: <path d="M12 10.941c2.333-2.99 4-6.435 4-9.941 0-.553-.447-1-1-1h-4c-.553 0-1 .447-1 1 0 1.632-.835 3.048-2.137 3.88m-1.863 6.06c-1.5 1.5-3 3.5-3 5.5 0 3.314 2.686 6 6 6s6-2.686 6-6c0-2-1.5-4-3-5.5" />,
  bulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.5v2.5h8v-2.5a7 7 0 0 0-4-12.5" />
    </>
  ),
  calendar: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M16 3v4M8 3v4M4 11h16" />
    </>
  ),
  "clipboard-check": (
    <>
      <path d="M9 5h-2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2" />
      <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
      <path d="M9 14l2 2l4-4" />
    </>
  ),
  "chevron-right": <path d="M9 6l6 6l-6 6" />,
  "arrow-left": <path d="M5 12h14M5 12l4-4M5 12l4 4" />,
  book: (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v14l-5-3l-5 3V6a2 2 0 0 1 2-2" />
      <path d="M6 4v14" />
    </>
  ),
  layout: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M4 12h16M12 5v14" />
    </>
  ),
  "player-play": <path d="M8 5v14l11-7z" />,
};

type Props = {
  name: ReviewTablerIconName;
  className?: string;
};

export function ReviewTablerIcon({ name, className = "" }: Props) {
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
