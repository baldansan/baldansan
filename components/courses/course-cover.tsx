"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Short label for the drawn fallback, e.g. "HSK 1". */
  label?: string;
};

/**
 * Courses whose cover image hasn't been uploaded yet used to render nothing,
 * so a catalog with some covers and some without looked broken. Those fall
 * back to a drawn spine in the same shape, tinted per level.
 */
const FALLBACK_GRADIENTS: Record<string, string> = {
  "1": "linear-gradient(150deg, #34d399, #0f766e)",
  "2": "linear-gradient(150deg, #60a5fa, #1e40af)",
  "3": "linear-gradient(150deg, #f59e0b, #b45309)",
  "4": "linear-gradient(150deg, #a78bfa, #5b21b6)",
  "5": "linear-gradient(150deg, #fb7185, #9f1239)",
  "6": "linear-gradient(150deg, #22d3ee, #0e7490)",
};

function fallbackBackground(label: string): string {
  const digit = label.match(/\d/)?.[0] ?? "";
  return FALLBACK_GRADIENTS[digit] ?? "linear-gradient(150deg, #94a3b8, #334155)";
}

/** Book-style course cover (3:4.2); draws a labelled spine when there is no art. */
export function CourseCover({
  src,
  alt,
  className = "app-course-cover",
  label,
}: Props) {
  const [failed, setFailed] = useState(false);
  const missing = !src.trim() || failed;

  if (missing) {
    if (!label?.trim()) return null;
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} flex flex-col items-center justify-center gap-0.5 text-white`}
        style={{ background: fallbackBackground(label) }}
      >
        <span className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
          {label.replace(/\s*\d.*$/, "") || "HSK"}
        </span>
        <span className="text-xl font-black leading-none">
          {label.match(/\d+/)?.[0] ?? "·"}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static public cover assets
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
