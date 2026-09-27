import { notFound } from "next/navigation";
import { MockTestPracticeClient } from "@/components/mock-test/mock-test-practice-client";
import {
  devDemoPracticeData,
  withDemoTutorNote,
} from "@/lib/mock-test/dev-demo-tutor-note";
import { collectTargetLessonIds } from "@/lib/mock-test/weak-lessons";
import {
  fetchAvailableLessonsByIds,
  fetchMockTestById,
  fetchMockTestQuestions,
} from "@/lib/supabase/mock-tests-server";

type Props = {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

export default async function MockTestPracticePage({ params, searchParams }: Props) {
  const { testId } = await params;
  // Зөвхөн хөгжүүлэлт: ?demoTutor=1 → эхний асуултад жишээ тайлбар (production-д үйлчлэхгүй).
  const demoTutor =
    process.env.NODE_ENV !== "production" &&
    (await searchParams).demoTutor === "1";

  let test = await fetchMockTestById(testId);
  let loaded = test ? await fetchMockTestQuestions(test.id) : [];
  if (demoTutor && (!test || !loaded.length)) {
    // Өгөгдлийн сангүй (dummy env) орчинд картыг харахад л зориулсан жишээ.
    const demo = devDemoPracticeData(testId);
    if (demo) {
      test = demo.test;
      loaded = demo.questions;
    }
  }
  if (!test) notFound();
  if (!loaded.length) notFound();

  const questions = withDemoTutorNote(loaded, demoTutor);

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
