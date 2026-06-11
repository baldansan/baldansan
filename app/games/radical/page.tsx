import { RadicalGamePageClient } from "@/components/games/radical-game-page-client";
import { parseWordIdsParam } from "@/lib/games/game-api-level";
import { getRadicalGameEntries } from "@/lib/games/radical-game-data";

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
    mode?: string;
  }>;
};

export default async function RadicalGamePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const lessonId = params.lessonId ?? "radical";
  const wordIds = parseWordIdsParam(params.wordIds ?? params.words ?? null);
  const returnHref = params.returnTo?.trim() || undefined;
  const initialChallenge = params.mode === "challenge";

  const defaultEntries = getRadicalGameEntries();

  return (
    <RadicalGamePageClient
      lessonId={lessonId}
      defaultEntries={defaultEntries}
      returnHref={returnHref}
      initialChallenge={initialChallenge}
      initialWordIds={wordIds}
    />
  );
}
