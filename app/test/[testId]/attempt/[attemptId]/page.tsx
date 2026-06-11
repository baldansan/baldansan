import { notFound } from "next/navigation";
import { MockTestAttemptReviewClient } from "@/components/mock-test/mock-test-attempt-review-client";
import { fetchMockTestAttemptReview } from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ testId: string; attemptId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { attemptId } = await params;
  const review = await fetchMockTestAttemptReview(attemptId);
  return { title: review?.test.title ?? "Тестийн үр дүн" };
}

export default async function MockTestAttemptReviewPage({ params }: Props) {
  const { testId, attemptId } = await params;
  const review = await fetchMockTestAttemptReview(attemptId);

  if (!review || review.test.id.toUpperCase() !== testId.toUpperCase()) {
    notFound();
  }

  return <MockTestAttemptReviewClient review={review} />;
}
