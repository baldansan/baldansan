import { LanguageFilteredKanjiView } from "@/components/mobile/language-filtered-kanji-view";
import { getAllPublicLessonsProbe } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ханз — Бөөндөө Сурцгаая",
};

export default async function KanjiPage() {
  const allLessons = await getAllPublicLessonsProbe();
  return <LanguageFilteredKanjiView allLessons={allLessons} />;
}
