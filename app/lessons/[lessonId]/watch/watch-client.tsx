"use client";

import { useRouter } from "next/navigation";
import nextDynamic from "next/dynamic";
import { AppShell } from "@/components/app/app-shell";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { isHskStructuredLesson } from "@/lib/lesson/hsk-lesson-content";
import { resolveLessonContentType } from "@/lib/lesson-content-type";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";
import type { LessonDeepTeaching } from "@/types/lesson-deep-teaching";
import type { LessonContent } from "@/types/lesson-content";
import type { QuizQuestion } from "@/types/lesson";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";

function WatchLoading() {
  return (
    <p className="py-16 text-center text-sm text-[var(--app-muted)]">
      Хичээл ачаалж байна...
    </p>
  );
}

/*
 * Хичээлийн төрөл бүрт нэг л тоглуулагч хэрэгтэй — бүгдийг тусдаа chunk болгож,
 * тухайн хичээлийнхийг л татна (SSR хэвээр; сервер HTML-ийг бүтнээр өгдөг).
 */
const HskGuidedLessonPlayer = nextDynamic(
  () =>
    import("@/components/lesson/hsk-player/hsk-guided-lesson-player").then(
      (mod) => mod.HskGuidedLessonPlayer
    ),
  { loading: WatchLoading }
);

const LessonPathPlayer = nextDynamic(
  () => import("@/components/lesson/lesson-path-player"),
  { loading: WatchLoading }
);

const TextbookLessonWatchClient = nextDynamic(
  () =>
    import("@/components/lesson/textbook-lesson-watch").then(
      (mod) => mod.TextbookLessonWatchClient
    ),
  { loading: WatchLoading }
);

const ExamLessonWatchClient = nextDynamic(
  () =>
    import("@/components/lesson/exam-lesson-watch").then(
      (mod) => mod.ExamLessonWatchClient
    ),
  { loading: WatchLoading }
);

const VideoLessonWatchClient = nextDynamic(
  () =>
    import("@/components/lesson/video-lesson-watch").then(
      (mod) => mod.VideoLessonWatchClient
    ),
  { loading: WatchLoading }
);

type Props = {
  lesson: LessonContent;
  lessonPackage?: HskLessonPackage | null;
  quizQuestions?: QuizQuestion[];
  useDatabaseQuizOptions?: boolean;
  adminPreview?: boolean;
  nextLessonId?: string | null;
  /** Нэмэлт, гүнзгий заах агуулга (HSK1/HSK2). Байхгүй бол хуучнаараа. */
  deep?: LessonDeepTeaching | null;
};

function SchemaLessonWatchPlayer({
  lessonId,
  lesson,
  lessonPackage,
  quizQuestions = [],
  useDatabaseQuizOptions = false,
  nextLessonId = null,
  adminPreview = false,
  deep = null,
}: {
  lessonId: string;
  lesson: LessonContent;
  lessonPackage: HskLessonPackage;
  quizQuestions?: QuizQuestion[];
  useDatabaseQuizOptions?: boolean;
  nextLessonId?: string | null;
  adminPreview?: boolean;
  deep?: LessonDeepTeaching | null;
}) {
  const router = useRouter();

  return (
    <AppShell activeTab="study" showBottomNav={false} immersive>
      <div className="bs-app-shell-inner">
        {adminPreview ? <AdminPreviewBanner /> : null}
        <LessonPathPlayer
          lessonId={lessonId}
          lesson={lessonPackage}
          lessonContent={lesson}
          quizQuestions={quizQuestions}
          useDatabaseQuizOptions={useDatabaseQuizOptions}
          nextLessonId={nextLessonId}
          adminPreview={adminPreview}
          deep={deep}
          onExit={() => router.back()}
        />
      </div>
    </AppShell>
  );
}

export function LessonWatchClient({
  lesson,
  lessonPackage = null,
  quizQuestions = [],
  useDatabaseQuizOptions = false,
  adminPreview = false,
  nextLessonId = null,
  deep = null,
}: Props) {
  // Time-on-lesson (Оюу оноо): one tracker for every lesson-watch variant.
  useActivityTracker("lesson", lesson.id, !adminPreview);

  if (lessonPackage) {
    return (
      <SchemaLessonWatchPlayer
        lessonId={lesson.id}
        lesson={lesson}
        lessonPackage={lessonPackage}
        quizQuestions={quizQuestions}
        useDatabaseQuizOptions={useDatabaseQuizOptions}
        nextLessonId={nextLessonId}
        adminPreview={adminPreview}
        deep={deep}
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
