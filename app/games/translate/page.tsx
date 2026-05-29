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
  const { vocabulary, courseId } = await getLessonGameContext(lessonId);
  return (
    <TranslateGameClient
      lessonId={lessonId}
      courseId={courseId}
      vocabulary={vocabulary}
    />
  );
}
