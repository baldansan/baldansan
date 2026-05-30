import { notFound } from "next/navigation";
import { LessonUnavailable } from "@/components/lesson-unavailable";
import { resolveLessonPageAccess } from "@/lib/lesson-public-access";
import { parsePreviewParam } from "@/lib/preview-params";
import { LessonVocabularyClient } from "./vocabulary-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string; view?: string }>;
};

export const dynamic = "force-dynamic";

export default async function LessonVocabularyPage({
  params,
  searchParams,
}: PageProps) {
  const { lessonId } = await params;
  const resolvedSearchParams = await searchParams;
  const preview = parsePreviewParam(resolvedSearchParams.preview);
  const access = await resolveLessonPageAccess(lessonId, { preview });

  if (access.kind === "not_found") {
    notFound();
  }

  if (access.kind === "unavailable") {
    return (
      <LessonUnavailable
        lessonId={lessonId}
        courseId={access.lesson.courseId}
        showAdminLink={access.showAdminLink}
        showAdminPreviewLink={access.showAdminPreviewLink}
        accessDenied={access.accessDenied}
      />
    );
  }

  return (
    <LessonVocabularyClient
      lesson={access.lesson}
      adminPreview={access.adminPreview}
      initialView={resolvedSearchParams.view}
    />
  );
}
