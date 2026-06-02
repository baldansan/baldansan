import { StrokeGameClient } from "@/components/games/stroke-game-client";
import { getLessonGameContext } from "@/lib/games/game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "\u0414\u0443\u0442\u0443\u0443 \u0431\u04af\u0440\u0434\u044d\u043b \u2014 \u0422\u043e\u0433\u043b\u043e\u043e\u043c",
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
      hskCharacterNotes={context.hskCharacterNotes}
    />
  );
}
