"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { markLessonStartedSmart } from "@/lib/progress";

type Props = {
  lessonId: string;
  className?: string;
  adminPreview?: boolean;
  children: ReactNode;
};

export function WatchLessonLink({
  lessonId,
  className,
  adminPreview = false,
  children,
}: Props) {
  return (
    <Link
      href={lessonPreviewPath(lessonId, {
        adminPreview,
        subpath: "watch",
      })}
      onClick={() => {
        void markLessonStartedSmart(lessonId);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
