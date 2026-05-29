import { GamesAppView } from "@/components/mobile/games-app-view";
import { getPublicLessonsByCourseId } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Тоглоом — Бөөндөө Сурцгаая",
};

export default async function GamesPage() {
  const lessons = await getPublicLessonsByCourseId("hsk5");
  return <GamesAppView lessonIds={lessons.map((l) => l.id)} />;
}
