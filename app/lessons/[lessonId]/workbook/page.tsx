import { notFound } from "next/navigation";
import { LessonUnavailable } from "@/components/lesson-unavailable";
import { resolveLessonPageAccess } from "@/lib/lesson-public-access";
import { parsePreviewParam } from "@/lib/preview-params";
import { HSK1_L01_V13_WORKBOOK_SECTIONS } from "@/lib/lesson/hsk1-l01-v13/workbook";
import { LessonWorkbookClient } from "./workbook-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export const dynamic = "force-dynamic";

export default async function LessonWorkbookPage({
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

  const sections =
    access.lesson.hskStudy?.workbook?.length
      ? access.lesson.hskStudy.workbook
      : HSK1_L01_V13_WORKBOOK_SECTIONS;

  return (
    <LessonWorkbookClient
      lesson={access.lesson}
      sections={sections}
      adminPreview={access.adminPreview}
    />
  );
}
