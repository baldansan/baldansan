import nextDynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { LessonUnavailable } from "@/components/lesson-unavailable";
import {
  findNextLessonId,
  getLessonsByCourseId,
  getPublicLessonSummariesByCourseId,
} from "@/lib/content";
import { trainingLessonIdCandidates } from "@/lib/lesson-player/resolve-training-lesson-id";
import { resolveLessonPageAccess } from "@/lib/lesson-public-access";
import { parsePreviewParam } from "@/lib/preview-params";
import { isHskStructuredLesson } from "@/lib/lesson/hsk-lesson-content";
import { toLessonListSummary } from "@/lib/lesson/lesson-summary";

const GuidedLessonPlayer = nextDynamic(
  () =>
    import("@/components/lesson-player/guided-lesson-player").then(
      (mod) => mod.GuidedLessonPlayer
    ),
  {
    loading: () => (
      <p className="py-16 text-center text-sm text-[var(--app-muted)]">
        Хичээл ачаалж байна...
      </p>
    ),
  }
);

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
    ? (await getLessonsByCourseId(lesson.courseId)).map(toLessonListSummary)
    : await getPublicLessonSummariesByCourseId(lesson.courseId);
  const nextLessonId = findNextLessonId(lesson.id, courseLessons);

  if (isHskStructuredLesson(lesson)) {
    return (
      <HskGuidedLessonPlayer
        lesson={lesson}
        nextLessonId={nextLessonId}
        adminPreview={adminPreview}
        routeLessonId={routeLessonId}
      />
    );
  }

  return (
    <GuidedLessonPlayer
      lesson={lesson}
      nextLessonId={nextLessonId}
      adminPreview={adminPreview}
      routeLessonId={routeLessonId}
    />
  );
}
