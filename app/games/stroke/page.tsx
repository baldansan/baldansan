import { StrokeGameClient } from "@/components/games/stroke-game-client";
import { getLessonGameVocabulary } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дутуу зураас — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function StrokeGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const vocabulary = await getLessonGameVocabulary(lessonId);
  return <StrokeGameClient lessonId={lessonId} vocabulary={vocabulary} />;
}
