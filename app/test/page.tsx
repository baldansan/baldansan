import { MockTestListClient } from "@/components/mock-test/mock-test-list-client";
import { loadMockTestListPageData } from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HSK загвар шалгалт",
};

export default async function TestListPage() {
  const { tests, latestScores } = await loadMockTestListPageData();
  return <MockTestListClient tests={tests} latestScores={latestScores} />;
}
