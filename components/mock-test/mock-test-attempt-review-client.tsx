"use client";

import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MockTestResultView } from "@/components/mock-test/mock-test-result-view";
import type { MockTestAttemptReview } from "@/lib/supabase/mock-tests-server";

type Props = {
  review: MockTestAttemptReview;
};

export function MockTestAttemptReviewClient({ review }: Props) {
  return (
    <MobileAppShell
      activeTab="games"
      showBottomNav={false}
      mainClassName="mx-auto w-full max-w-[430px] px-0 pb-8"
    >
      <MockTestResultView
        test={review.test}
        result={review.result}
        hsk={review.hsk}
        questions={review.questions}
        weakLessons={review.weakLessons}
        completedLessonIds={review.completedLessonIds}
        backHref={`/test/${review.test.id}`}
        backLabel="Тест рүү буцах"
      />
    </MobileAppShell>
  );
}
