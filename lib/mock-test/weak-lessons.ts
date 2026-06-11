import type { MockTestAnswerDetail, MockTestQuestionRow } from "@/lib/mock-test/types";

export type LessonTitleRow = {
  id: string;
  title: string;
  title_mn?: string | null;
};

export type WeakLessonRecommendation = {
  lessonId: string;
  title: string;
  wrongCount: number;
};

export function lessonDisplayTitle(row: LessonTitleRow): string {
  const mn = row.title_mn?.trim();
  if (mn) return mn;
  return row.title;
}

export function collectTargetLessonIds(
  questions: Array<{ target_lesson_id: string | null }>
): string[] {
  return [
    ...new Set(
      questions
        .map((q) => q.target_lesson_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
}

function countWrongByLesson(
  entries: Array<{ targetLessonId: string | null; isWrong: boolean }>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.isWrong || !entry.targetLessonId) continue;
    counts.set(
      entry.targetLessonId,
      (counts.get(entry.targetLessonId) ?? 0) + 1
    );
  }
  return counts;
}

export function buildWeakLessonRecommendations(
  wrongCounts: Map<string, number>,
  lessons: LessonTitleRow[],
  limit = 5
): WeakLessonRecommendation[] {
  const titleById = new Map(
    lessons.map((lesson) => [lesson.id, lessonDisplayTitle(lesson)])
  );

  return [...wrongCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .flatMap(([lessonId, wrongCount]) => {
      const title = titleById.get(lessonId);
      if (!title) return [];
      return [{ lessonId, title, wrongCount }];
    });
}

export function weakLessonsFromAnswerDetails(
  details: MockTestAnswerDetail[],
  questions: MockTestQuestionRow[],
  lessons: LessonTitleRow[],
  limit = 5
): WeakLessonRecommendation[] {
  const targetByQuestion = new Map(
    questions.map((q) => [q.id, q.target_lesson_id])
  );
  const counts = countWrongByLesson(
    details.map((detail) => ({
      targetLessonId: targetByQuestion.get(detail.questionId) ?? null,
      isWrong: detail.isCorrect === false,
    }))
  );
  return buildWeakLessonRecommendations(counts, lessons, limit);
}

export function weakLessonsFromResponses(
  responses: Array<{
    question_id: string;
    is_correct: boolean | null;
  }>,
  questions: MockTestQuestionRow[],
  lessons: LessonTitleRow[],
  limit = 5
): WeakLessonRecommendation[] {
  const targetByQuestion = new Map(
    questions.map((q) => [q.id, q.target_lesson_id])
  );
  const counts = countWrongByLesson(
    responses.map((response) => ({
      targetLessonId: targetByQuestion.get(response.question_id) ?? null,
      isWrong: response.is_correct === false,
    }))
  );
  return buildWeakLessonRecommendations(counts, lessons, limit);
}
