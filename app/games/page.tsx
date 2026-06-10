import { LanguageFilteredGamesView } from "@/components/mobile/language-filtered-games-view";
import { getAllPublicLessonSummariesProbe } from "@/lib/content";

/** Lesson id/title only — no per-lesson vocabulary enrichment. */
export const revalidate = 120;

export const metadata = {
  title: "Тоглоом — Бөөндөө Сурцгаая",
};

export default async function GamesPage() {
  const allLessons = await getAllPublicLessonSummariesProbe();
  return <LanguageFilteredGamesView allLessons={allLessons} />;
}
