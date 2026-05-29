import { ArrangeGameClient } from "@/components/games/arrange-game-client";
import { getLessonGameVocabulary } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дараалал — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function ArrangeGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const vocabulary = await getLessonGameVocabulary(lessonId);
  return <ArrangeGameClient lessonId={lessonId} vocabulary={vocabulary} />;
}
