import { MatchGameClient } from "@/components/games/match-game-client";
import { getLessonGameVocabulary } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Холбох — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function MatchGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const vocabulary = await getLessonGameVocabulary(lessonId);
  return <MatchGameClient lessonId={lessonId} vocabulary={vocabulary} />;
}
