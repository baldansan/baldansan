import { TranslateGameClient } from "@/components/games/translate-game-client";
import { getLessonGameVocabulary } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Орчуулах — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function TranslateGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const vocabulary = await getLessonGameVocabulary(lessonId);
  return <TranslateGameClient lessonId={lessonId} vocabulary={vocabulary} />;
}
