"use client";

import { ExamLessonWatchClient } from "@/components/lesson/exam-lesson-watch";
import { TextbookLessonWatchClient } from "@/components/lesson/textbook-lesson-watch";
import { VideoLessonWatchClient } from "@/components/lesson/video-lesson-watch";
import { resolveLessonContentType } from "@/lib/lesson-content-type";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

export function LessonWatchClient({ lesson, adminPreview = false }: Props) {
  const contentType = resolveLessonContentType(lesson);

  if (contentType === "textbook") {
    return (
      <TextbookLessonWatchClient lesson={lesson} adminPreview={adminPreview} />
    );
  }

  if (contentType === "exam") {
    return <ExamLessonWatchClient lesson={lesson} adminPreview={adminPreview} />;
  }

  return <VideoLessonWatchClient lesson={lesson} adminPreview={adminPreview} />;
}
