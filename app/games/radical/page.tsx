import { RadicalGameClient } from "@/components/games/radical-game-client";
import { parseWordIdsParam } from "@/lib/games/game-api-level";
import { buildRadicalEntriesFromWords } from "@/lib/games/radical-entries-from-words";
import { getRadicalGameEntries } from "@/lib/games/radical-game-data";
import { getWordsByIds } from "@/lib/hsk";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ханз задлах — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{
    lessonId?: string;
    wordIds?: string;
    words?: string;
    returnTo?: string;
  }>;
};

export default async function RadicalGamePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const lessonId = params.lessonId ?? "radical";
  const wordIds = parseWordIdsParam(params.wordIds ?? params.words ?? null);
  const returnHref = params.returnTo?.trim() || undefined;

  let entries = getRadicalGameEntries();
  if (wordIds.length > 0) {
    const words = await getWordsByIds(wordIds);
    entries = await buildRadicalEntriesFromWords(words);
  }

  return (
    <RadicalGameClient
      lessonId={lessonId}
      entries={entries}
      returnHref={returnHref}
      customWordSet={wordIds.length > 0}
    />
  );
}
