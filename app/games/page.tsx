import { LanguageFilteredGamesView } from "@/components/mobile/language-filtered-games-view";
import { getAllPublicLessonsProbe } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Тоглоом — Бөөндөө Сурцгаая",
};

export default async function GamesPage() {
  const allLessons = await getAllPublicLessonsProbe();
  return <LanguageFilteredGamesView allLessons={allLessons} />;
}
