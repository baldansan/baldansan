import { LessonUnavailable } from "@/components/lesson-unavailable";
import { LessonPageError } from "@/components/lesson/lesson-page-error";
import { loadLessonWatchPage } from "@/lib/lesson/lesson-watch-loader";
import { resolvePreviewFromPageSearchParams } from "@/lib/lesson-public-access";
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

  return (
    <LessonWatchClient lesson={result.lesson} adminPreview={result.adminPreview} />
  );
}
