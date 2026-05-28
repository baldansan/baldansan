"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { lessonWatchPath } from "@/lib/content";
import { markLessonStarted } from "@/lib/progress";

type Props = {
  lessonId: string;
  className?: string;
  children: ReactNode;
};

export function WatchLessonLink({ lessonId, className, children }: Props) {
  return (
    <Link
      href={lessonWatchPath(lessonId)}
      onClick={() => markLessonStarted(lessonId)}
      className={className}
    >
      {children}
    </Link>
  );
}
