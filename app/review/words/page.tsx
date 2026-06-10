import { LanguageFilteredReviewView } from "@/components/mobile/language-filtered-review-view";
import { getAllPublicLessonSummariesProbe } from "@/lib/content";

export const revalidate = 120;

export default async function ReviewWordsPage() {
  const allLessons = await getAllPublicLessonSummariesProbe();
  return <LanguageFilteredReviewView allLessons={allLessons} />;
}
