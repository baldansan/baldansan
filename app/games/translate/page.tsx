import { TranslateGameClient } from "@/components/games/translate-game-client";
import { getLessonGameContext } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Орчуулах — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function TranslateGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const context = await getLessonGameContext(lessonId);
  return (
    <TranslateGameClient
      lessonId={lessonId}
      courseId={context.courseId}
      vocabulary={context.vocabulary}
      isKorean={context.isKorean}
      isPrelesson={context.isPrelesson}
      labels={context.labels}
    />
  );
}
