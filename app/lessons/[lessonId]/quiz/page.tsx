import { notFound } from "next/navigation";
import { LessonUnavailable } from "@/components/lesson-unavailable";
import {
  findNextLessonId,
  getLessonsByCourseId,
  getPublicLessonsByCourseId,
} from "@/lib/content";
import { resolveLessonPageAccess, resolvePreviewFromPageSearchParams } from "@/lib/lesson-public-access";
import { loadLessonQuizQuestionsForPage } from "@/lib/lesson/quiz-page-loader";
import { LessonQuizClient } from "./quiz-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LessonQuizPage({
  params,
  searchParams,
}: PageProps) {
  const { lessonId } = await params;
  const preview = await resolvePreviewFromPageSearchParams(searchParams);
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

  const { lesson, adminPreview } = access;
  const { questions: quizQuestions, fromDatabase } =
    await loadLessonQuizQuestionsForPage(lessonId, lesson);
  const courseLessons = adminPreview
    ? await getLessonsByCourseId(lesson.courseId)
    : await getPublicLessonsByCourseId(lesson.courseId);
  const nextLessonId = findNextLessonId(lessonId, courseLessons);

  return (
    <LessonQuizClient
      lesson={lesson}
      quizQuestions={quizQuestions}
      useDatabaseQuizOptions={fromDatabase}
      nextLessonId={nextLessonId}
      adminPreview={adminPreview}
    />
  );
}
