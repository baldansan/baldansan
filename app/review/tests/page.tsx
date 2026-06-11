import { MockTestListClient } from "@/components/mock-test/mock-test-list-client";
import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import { loadMockTestListPageData } from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK загвар шалгалт — Бөөндөө Сурцгаая",
};

export default async function ReviewTestsPage() {
  const { tests, latestScores } = await loadMockTestListPageData();
  return (
    <ReviewSubScreen>
      <MockTestListClient
        tests={tests}
        latestScores={latestScores}
        embedded
      />
    </ReviewSubScreen>
  );
}
