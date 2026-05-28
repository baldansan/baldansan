"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { lessonWatchPath } from "@/lib/content";
import { markLessonStartedSmart } from "@/lib/progress";

type Props = {
  lessonId: string;
  className?: string;
  children: ReactNode;
};

export function WatchLessonLink({ lessonId, className, children }: Props) {
  return (
    <Link
      href={lessonWatchPath(lessonId)}
      onClick={() => {
        void markLessonStartedSmart(lessonId);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
