"use client";

import { useRouter } from "next/navigation";
import nextDynamic from "next/dynamic";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import PhoneFrame from "@/components/layout/PhoneFrame";
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
  lessonId,
  lessonPackage,
  adminPreview = false,
}: {
  lessonId: string;
  lessonPackage: HskLessonPackage;
  adminPreview?: boolean;
}) {
  const router = useRouter();

  return (
    <PhoneFrame>
      <div className="bs-app-shell-inner">
        {adminPreview ? <AdminPreviewBanner /> : null}
        <LessonPlayer
          lessonId={lessonId}
          lesson={lessonPackage}
          onExit={() => router.back()}
        />
      </div>
    </PhoneFrame>
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
        lessonId={lesson.id}
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
