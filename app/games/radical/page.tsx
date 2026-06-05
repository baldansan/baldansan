import { RadicalGameClient } from "@/components/games/radical-game-client";
import { getLessonGameContext } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Үндэс · бүрдэл — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function RadicalGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const context = await getLessonGameContext(lessonId);
  return (
    <RadicalGameClient
      lessonId={lessonId}
      lessonCharacters={context.lessonCharacters}
      labels={context.labels}
    />
  );
}
