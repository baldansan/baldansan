import { notFound } from "next/navigation";
import { GuidedLessonPlayer } from "@/components/lesson-player/guided-lesson-player";
import { LessonUnavailable } from "@/components/lesson-unavailable";
import {
  findNextLessonId,
  getLessonsByCourseId,
  getPublicLessonsByCourseId,
} from "@/lib/content";
import { trainingLessonIdCandidates } from "@/lib/lesson-player/resolve-training-lesson-id";
import { resolveLessonPageAccess } from "@/lib/lesson-public-access";
import { parsePreviewParam } from "@/lib/preview-params";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export const dynamic = "force-dynamic";

async function resolveTrainingLessonAccess(
  routeLessonId: string,
  preview: ReturnType<typeof parsePreviewParam>
) {
  for (const candidate of trainingLessonIdCandidates(routeLessonId)) {
    const access = await resolveLessonPageAccess(candidate, { preview });
    if (access.kind === "ok") {
      return { access, resolvedLessonId: candidate };
    }
    if (access.kind === "unavailable") {
      return { access, resolvedLessonId: candidate };
    }
  }

  const last = await resolveLessonPageAccess(routeLessonId, { preview });
  return { access: last, resolvedLessonId: routeLessonId };
}

export default async function LessonTrainingPage({
  params,
  searchParams,
}: PageProps) {
  const { lessonId: routeLessonId } = await params;
  const resolvedSearchParams = await searchParams;
  const preview = parsePreviewParam(resolvedSearchParams.preview);
  const { access, resolvedLessonId } = await resolveTrainingLessonAccess(
    routeLessonId,
    preview
  );

  if (access.kind === "not_found") {
    notFound();
  }

  if (access.kind === "unavailable") {
    return (
      <LessonUnavailable
        lessonId={resolvedLessonId}
        courseId={access.lesson.courseId}
        showAdminLink={access.showAdminLink}
        showAdminPreviewLink={access.showAdminPreviewLink}
        accessDenied={access.accessDenied}
      />
    );
  }

  const { lesson, adminPreview } = access;
  const courseLessons = adminPreview
    ? await getLessonsByCourseId(lesson.courseId)
    : await getPublicLessonsByCourseId(lesson.courseId);
  const nextLessonId = findNextLessonId(lesson.id, courseLessons);

  return (
    <GuidedLessonPlayer
      lesson={lesson}
      nextLessonId={nextLessonId}
      adminPreview={adminPreview}
      routeLessonId={routeLessonId}
    />
  );
}
