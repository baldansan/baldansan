import { notFound } from "next/navigation";
import { MockTestExamClient } from "@/components/mock-test/mock-test-exam-client";
import {
  fetchMockTestById,
  fetchMockTestQuestions,
} from "@/lib/supabase/mock-tests-server";

type Props = {
  params: Promise<{ testId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { testId } = await params;
  const test = await fetchMockTestById(testId);
  return { title: test?.title ?? `Шалгалт ${testId}` };
}

export default async function TestExamPage({ params }: Props) {
  const { testId } = await params;
  const test = await fetchMockTestById(testId);
  if (!test) notFound();

  const questions = await fetchMockTestQuestions(test.id);
  if (!questions.length) notFound();

  return <MockTestExamClient test={test} questions={questions} />;
}
