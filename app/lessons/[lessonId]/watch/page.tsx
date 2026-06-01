import { LessonUnavailable } from "@/components/lesson-unavailable";
import { LessonPageError } from "@/components/lesson/lesson-page-error";
import { loadLessonWatchPage } from "@/lib/lesson/lesson-watch-loader";
import { resolvePreviewFromPageSearchParams } from "@/lib/lesson-public-access";
import {
  findNextLessonId,
  getLessonsByCourseId,
  getPublicLessonSummariesByCourseId,
} from "@/lib/content";
import { isHskStructuredLesson } from "@/lib/lesson/hsk-lesson-content";
import { toLessonListSummary } from "@/lib/lesson/lesson-summary";
import { LessonWatchClient } from "./watch-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LessonWatchPage({
  params,
  searchParams,
}: PageProps) {
  const { lessonId } = await params;
  const preview = await resolvePreviewFromPageSearchParams(searchParams);
  const result = await loadLessonWatchPage(lessonId, { preview });

  if (result.kind === "error") {
    return (
      <LessonPageError
        failureKind={result.failureKind}
        debug={result.debug}
        retryHref={`/lessons/${lessonId}/watch${
          preview ? `?preview=${encodeURIComponent(String(preview))}` : ""
        }`}
      />
    );
  }

  if (result.kind === "unavailable") {
    return (
      <LessonUnavailable
        lessonId={lessonId}
        courseId={result.lesson.courseId}
        showAdminLink={result.showAdminLink}
        showAdminPreviewLink={result.showAdminPreviewLink}
        accessDenied={result.accessDenied}
      />
    );
  }

  const { lesson, adminPreview } = result;
  let nextLessonId: string | null = null;
  if (isHskStructuredLesson(lesson)) {
    const courseLessons = adminPreview
      ? (await getLessonsByCourseId(lesson.courseId)).map(toLessonListSummary)
      : await getPublicLessonSummariesByCourseId(lesson.courseId);
    nextLessonId = findNextLessonId(lesson.id, courseLessons);
  }

  return (
    <LessonWatchClient
      lesson={lesson}
      adminPreview={adminPreview}
      nextLessonId={nextLessonId}
    />
  );
}
