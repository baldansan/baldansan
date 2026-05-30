import { AdminEditLessonNotFound } from "@/components/admin/admin-edit-lesson-not-found";
import { LessonEditForm } from "@/components/admin/lesson-edit-form";
import {
  getAdminLessonById,
  getAdminLessonOrderIndex,
} from "@/lib/admin/lesson-fetch";
import { analyzeLessonQa } from "@/lib/admin/lesson-qa";
import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { normalizeLessonRouteId } from "@/lib/lesson-id";
import {
  getLessonCompleteness,
  type LessonCompleteness,
} from "@/lib/supabase/admin-content";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lessonId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  return { title: `Edit lesson ${lessonId} — Admin` };
}

export default async function AdminEditLessonPage({ params }: Props) {
  const { lessonId } = await params;
  const normalizedId = normalizeLessonRouteId(lessonId);

  const lesson = await getAdminLessonById(normalizedId);

  if (!lesson) {
    return <AdminEditLessonNotFound lessonId={normalizedId} />;
  }

  const resolvedId = lesson.id;
  const serverClient = await createServerSupabaseClient();
  const completenessResult = serverClient
    ? await getLessonCompleteness(resolvedId, serverClient, {
        skipAdminGate: true,
      })
    : await getLessonCompleteness(resolvedId);
  const initialCompleteness: LessonCompleteness =
    completenessResult.data ?? completenessFromLesson(lesson);

  const orderIndexFromServer = await getAdminLessonOrderIndex(resolvedId);
  const orderIndex =
    orderIndexFromServer ??
    (Number.isFinite(Number(resolvedId)) ? Number(resolvedId) : 1);

  return (
    <LessonEditForm
      lesson={lesson}
      orderIndex={orderIndex}
      initialCompleteness={initialCompleteness}
    />
  );
}

function completenessFromLesson(
  lesson: Awaited<ReturnType<typeof getAdminLessonById>>
) {
  if (!lesson) {
    return {
      hasMetadata: false,
      subtitleCount: 0,
      vocabularyCount: 0,
      quizCount: 0,
      readyToPublish: false,
    };
  }
  const qa = analyzeLessonQa(lesson);
  const prelesson = isPrelessonPackage(lesson);
  return {
    hasMetadata: qa.hasMetadata,
    subtitleCount: qa.subtitleCount,
    vocabularyCount: qa.vocabularyActual,
    quizCount: qa.quizActual,
    readyToPublish:
      qa.hasMetadata &&
      (prelesson || qa.subtitleCount > 0) &&
      qa.vocabularyActual >= 5 &&
      qa.quizActual >= 3,
  };
}
