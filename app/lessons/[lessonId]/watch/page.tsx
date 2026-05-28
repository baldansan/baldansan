import { notFound } from "next/navigation";
import { LessonUnavailable } from "@/components/lesson-unavailable";
import { resolveLessonPageAccess } from "@/lib/lesson-public-access";
import { LessonWatchClient } from "./watch-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export const dynamic = "force-dynamic";

export default async function LessonWatchPage({
  params,
  searchParams,
}: PageProps) {
  const { lessonId } = await params;
  const { preview } = await searchParams;
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
      />
    );
  }

  return (
    <LessonWatchClient lesson={access.lesson} adminPreview={access.adminPreview} />
  );
}
