import { MockTestPracticeListClient } from "@/components/mock-test/mock-test-practice-list-client";
import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import {
  fetchMockTests,
  fetchTutorNoteCounts,
} from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Шалгалтын дасгал — Бөөндөө Сурцгаая",
};

export default async function MockTestPracticeListPage() {
  const tests = await fetchMockTests();
  const tutorCounts = await fetchTutorNoteCounts(tests.map((test) => test.id));
  return (
    <ReviewSubScreen>
      <MockTestPracticeListClient tests={tests} tutorCounts={tutorCounts} />
    </ReviewSubScreen>
  );
}
