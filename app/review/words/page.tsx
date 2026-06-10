import { LanguageFilteredReviewView } from "@/components/mobile/language-filtered-review-view";
import { getAllPublicLessonsProbe } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ReviewWordsPage() {
  const allLessons = await getAllPublicLessonsProbe();
  return <LanguageFilteredReviewView allLessons={allLessons} />;
}
