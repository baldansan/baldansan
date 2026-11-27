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
import { resolveHskLessonPackageFromLesson } from "@/lib/lesson/resolve-hsk-lesson-package";
import { loadLessonQuizQuestionsForPage } from "@/lib/lesson/quiz-page-loader";
import { fetchLessonDeepTeaching } from "@/lib/supabase/lesson-deep-teaching";
import { toLessonListSummary } from "@/lib/lesson/lesson-summary";
import {
  applyTemeeLessonToPackage,
  loadTemeeLesson,
  temeeQuizQuestions,
} from "@/lib/temee-lesson/load";
import { LessonWatchClient } from "./watch-client";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ preview?: string; temee?: string }>;
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
  let lessonPackage = isHskStructuredLesson(lesson)
    ? resolveHskLessonPackageFromLesson(lesson)
    : null;
  // «Тэмээ багшийн хичээл» — repo доторх файл; байхгүй хичээлд null, юу ч өөрчлөгдөхгүй.
  // Ноорог хичээл зөвхөн `?temee=1` холбоосоор харагдана.
  const includeDraft = (await searchParams).temee === "1";
  const temee = lessonPackage ? await loadTemeeLesson(lesson.id, { includeDraft }) : null;
  if (lessonPackage && temee) {
    lessonPackage = applyTemeeLessonToPackage(lessonPackage, temee);
  }

  const courseLessons = adminPreview
    ? (await getLessonsByCourseId(lesson.courseId)).map(toLessonListSummary)
    : await getPublicLessonSummariesByCourseId(lesson.courseId);
  const nextLessonId = findNextLessonId(lesson.id, courseLessons);

  let quizQuestions: Awaited<
    ReturnType<typeof loadLessonQuizQuestionsForPage>
  >["questions"] = [];
  let useDatabaseQuizOptions = false;
  let deep: Awaited<ReturnType<typeof fetchLessonDeepTeaching>> = null;
  if (lessonPackage) {
    const quizData = await loadLessonQuizQuestionsForPage(lessonId, lesson);
    quizQuestions = quizData.questions;
    useDatabaseQuizOptions = quizData.fromDatabase;
    // Тэмээ багшийн сорил: зөвхөн заасан зүйлээр бичсэн асуултууд хуучныг орлоно.
    if (temee?.quiz?.length) {
      quizQuestions = temeeQuizQuestions(temee);
      useDatabaseQuizOptions = true;
    }
    // Нэмэлт агуулга — байхгүй бол null, хичээл урьдын адил ажиллана.
    deep = await fetchLessonDeepTeaching(lessonId);
  }

  return (
    <LessonWatchClient
      lesson={lesson}
      lessonPackage={lessonPackage}
      quizQuestions={quizQuestions}
      useDatabaseQuizOptions={useDatabaseQuizOptions}
      adminPreview={adminPreview}
      nextLessonId={nextLessonId}
      deep={deep}
      temee={temee}
    />
  );
}
