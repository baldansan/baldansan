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
      mainClassName="max-w-[430px] mx-auto w-full px-0 pb-8"
    >
      <MockTestResultView
        test={review.test}
        result={review.result}
        weakLessons={review.weakLessons}
        backHref={`/test/${review.test.id}`}
        backLabel="Тест рүү буцах"
      />
    </MobileAppShell>
  );
}
