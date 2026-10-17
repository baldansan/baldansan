import "server-only";

import { getLocalLessonById } from "@/lib/content";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { getSupabaseQuizQuestionsByLessonIdWithClient } from "@/lib/supabase/content";
import { normalizeLessonRouteId } from "@/lib/lesson-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { QuizQuestion } from "@/types/lesson";
import type { LessonContent } from "@/types/lesson-content";

export type LessonQuizPageData = {
  questions: QuizQuestion[];
  /** True when rows came from public.quiz_questions (options must not be rewritten). */
  fromDatabase: boolean;
};

/**
 * Quiz page loader: DB quiz_questions wins over embedded lesson/static seed.
 * Fetches on every request when Supabase is configured.
 */
export async function loadLessonQuizQuestionsForPage(
  lessonId: string,
  lesson: LessonContent
): Promise<LessonQuizPageData> {
  const normalizedId = normalizeLessonRouteId(lessonId);

  // Хичээл Supabase-аас (кэштэй getPublicLessonById / admin loader) ирсэн бол
  // quizQuestions нь яг энэ quiz_questions хүснэгтийн мөрүүд (ижил mapper) —
  // зочин бүрт дахин кэшгүй query явуулах шаардлагагүй. Хоосон бол л (RLS/түр
  // алдаа) хуучин замаар шууд уншина.
  if (hasSupabaseConfig && lesson.quizQuestions.length > 0) {
    return { questions: lesson.quizQuestions, fromDatabase: true };
  }

  if (hasSupabaseConfig) {
    const client = await createServerSupabaseClient();
    if (client) {
      const fromDb = await getSupabaseQuizQuestionsByLessonIdWithClient(
        normalizedId,
        client
      );
      if (fromDb.length > 0) {
        return { questions: fromDb, fromDatabase: true };
      }
    }
  }

  const localLesson = getLocalLessonById(normalizedId);
  if (localLesson?.quizQuestions.length) {
    return { questions: localLesson.quizQuestions, fromDatabase: false };
  }

  return { questions: lesson.quizQuestions, fromDatabase: false };
}
