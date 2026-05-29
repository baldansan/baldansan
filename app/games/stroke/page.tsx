import { StrokeGameClient } from "@/components/games/stroke-game-client";
import { getLessonGameContext } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дутуу зураас — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function StrokeGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const context = await getLessonGameContext(lessonId);
  return (
    <StrokeGameClient
      lessonId={lessonId}
      vocabulary={context.vocabulary}
      isKorean={context.isKorean}
      isPrelesson={context.isPrelesson}
      labels={context.labels}
    />
  );
}
