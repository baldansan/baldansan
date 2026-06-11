"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Book-style course cover (3:4.2); hides itself on load error. */
export function CourseCover({ src, alt, className = "app-course-cover" }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src.trim() || failed) {
    return null;
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
