import { ReviewMenuHubClient } from "@/components/review/review-menu-hub-client";
import { fetchMockTests } from "@/lib/supabase/mock-tests-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Давтах — Бөөндөө Сурцгаая",
};

export default async function ReviewPage() {
  const tests = await fetchMockTests();
  return <ReviewMenuHubClient testCount={tests.length} />;
}
