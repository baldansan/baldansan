import { ReviewHubClient } from "@/components/review/review-hub-client";
import { fetchMockTests } from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const tests = await fetchMockTests();
  return <ReviewHubClient tests={tests} />;
}
