"use client";

import { useRouter } from "next/navigation";
import nextDynamic from "next/dynamic";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import LessonPlayer from "@/components/lesson/LessonPlayer";
import { ExamLessonWatchClient } from "@/components/lesson/exam-lesson-watch";
import { TextbookLessonWatchClient } from "@/components/lesson/textbook-lesson-watch";
import { VideoLessonWatchClient } from "@/components/lesson/video-lesson-watch";
import { isHskStructuredLesson } from "@/lib/lesson/hsk-lesson-content";
import { resolveLessonContentType } from "@/lib/lesson-content-type";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import type { LessonContent } from "@/types/lesson-content";

const HskGuidedLessonPlayer = nextDynamic(
  () =>
    import("@/components/lesson/hsk-player/hsk-guided-lesson-player").then(
      (mod) => mod.HskGuidedLessonPlayer
    ),
  {
    loading: () => (
      <p className="py-16 text-center text-sm text-[var(--app-muted)]">
        Хичээл ачаалж байна...
      </p>
    ),
  }
);

type Props = {
  lesson: LessonContent;
  lessonPackage?: HskLessonPackage | null;
  adminPreview?: boolean;
  nextLessonId?: string | null;
};

function SchemaLessonWatchPlayer({
  lessonPackage,
  adminPreview = false,
}: {
  lessonPackage: HskLessonPackage;
  adminPreview?: boolean;
}) {
  const router = useRouter();

  return (
    <>
      {adminPreview ? <AdminPreviewBanner /> : null}
      <LessonPlayer
        lesson={lessonPackage}
        onExit={() => router.back()}
      />
    </>
  );
}

export function LessonWatchClient({
  lesson,
  lessonPackage = null,
  adminPreview = false,
  nextLessonId = null,
}: Props) {
  if (lessonPackage) {
    return (
      <SchemaLessonWatchPlayer
        lessonPackage={lessonPackage}
        adminPreview={adminPreview}
      />
    );
  }

  if (isHskStructuredLesson(lesson)) {
    return (
      <HskGuidedLessonPlayer
        lesson={lesson}
        nextLessonId={nextLessonId}
        adminPreview={adminPreview}
        routeLessonId={lesson.id}
      />
    );
  }

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
