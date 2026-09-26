import { StrokeGameClient } from "@/components/games/stroke-game-client";
import { getLessonGameContext } from "@/lib/games/game-data";
import { buildServerBreakdownCatalog } from "@/lib/games/hanzi-breakdown-catalog-server";
import { buildHanziStrokeGameItems } from "@/lib/games/hanzi-stroke-game";
import { collectLessonCharacters } from "@/lib/games/hanzi-component-data";
import type { StrokeQuestion } from "@/lib/games/game-types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Дутуу бүрдэл — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function StrokeGamePage({ searchParams }: PageProps) {
  const { lessonId = "1" } = await searchParams;
  const context = await getLessonGameContext(lessonId);

  // Hanzi lessons: build the questions on the server from the verified
  // makemeahanzi-based dataset (char_breakdown_full.json, ~3.4k chars) — the
  // single source of parts, roles and explanations.
  let initialQuestions: StrokeQuestion[] | undefined;
  if (!context.isKorean) {
    const chars = collectLessonCharacters(context.vocabulary);
    const extraCatalog = await buildServerBreakdownCatalog(
      chars,
      context.vocabulary
    );
    initialQuestions = buildHanziStrokeGameItems(
      context.vocabulary,
      6,
      context.hskCharacterNotes ?? [],
      extraCatalog
    );
  }

  return (
    <StrokeGameClient
      lessonId={lessonId}
      vocabulary={context.vocabulary}
      isKorean={context.isKorean}
      isPrelesson={context.isPrelesson}
      labels={context.labels}
      hskCharacterNotes={context.hskCharacterNotes}
      initialQuestions={initialQuestions}
    />
  );
}
