import { MockTestPracticeListClient } from "@/components/mock-test/mock-test-practice-list-client";
import { ReviewSubScreen } from "@/components/review/review-sub-screen";
import { fetchMockTests } from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Шалгалтын дасгал — Бөөндөө Сурцгаая",
};

export default async function MockTestPracticeListPage() {
  const tests = await fetchMockTests();
  return (
    <ReviewSubScreen>
      <MockTestPracticeListClient tests={tests} />
    </ReviewSubScreen>
  );
}
