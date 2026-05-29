import { MatchGameClient } from "@/components/games/match-game-client";
import { getLessonGameContext } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Холбох — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function MatchGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const { vocabulary, courseId } = await getLessonGameContext(lessonId);
  return (
    <MatchGameClient
      lessonId={lessonId}
      courseId={courseId}
      vocabulary={vocabulary}
    />
  );
}
