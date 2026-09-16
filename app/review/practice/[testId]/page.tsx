import { notFound } from "next/navigation";
import { MockTestPracticeClient } from "@/components/mock-test/mock-test-practice-client";
import { collectTargetLessonIds } from "@/lib/mock-test/weak-lessons";
import {
  fetchAvailableLessonsByIds,
  fetchMockTestById,
  fetchMockTestQuestions,
} from "@/lib/supabase/mock-tests-server";

type Props = {
  params: Promise<{ testId: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { testId } = await params;
  const test = await fetchMockTestById(testId);
  return {
    title: test
      ? `${test.title} — сурах горим`
      : `Дасгал ${testId}`,
  };
}

export default async function MockTestPracticePage({ params }: Props) {
  const { testId } = await params;
  const test = await fetchMockTestById(testId);
  if (!test) notFound();

  const questions = await fetchMockTestQuestions(test.id);
  if (!questions.length) notFound();

  const lessonTitles = await fetchAvailableLessonsByIds(
    collectTargetLessonIds(questions)
  );

  return (
    <MockTestPracticeClient
      test={test}
      questions={questions}
      lessonTitles={lessonTitles}
    />
  );
}
