import { MissingWordGameClient } from "@/components/games/missing-word-game-client";
import { getLessonGameContext } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дутуу үг — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function MissingWordGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const { vocabulary, courseId } = await getLessonGameContext(lessonId);
  return (
    <MissingWordGameClient
      lessonId={lessonId}
      courseId={courseId}
      vocabulary={vocabulary}
    />
  );
}
