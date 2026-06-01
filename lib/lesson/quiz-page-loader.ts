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
