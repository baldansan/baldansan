import { MockTestListClient } from "@/components/mock-test/mock-test-list-client";
import { fetchMockTests } from "@/lib/supabase/mock-tests-server";

export const metadata = {
  title: "HSK загвар шалгалт",
};

export default async function TestListPage() {
  const tests = await fetchMockTests();
  return <MockTestListClient tests={tests} />;
}
