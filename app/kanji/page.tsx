import { LanguageFilteredKanjiView } from "@/components/mobile/language-filtered-kanji-view";
import { getAllPublicLessonSummariesProbe } from "@/lib/content";

export const revalidate = 120;

export const metadata = {
  title: "Үсэг — Бөөндөө Сурцгаая",
};

export default async function KanjiPage() {
  const allLessons = await getAllPublicLessonSummariesProbe();
  return <LanguageFilteredKanjiView allLessons={allLessons} />;
}
