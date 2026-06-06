import { RadicalChallengeClient } from "@/components/games/radical-challenge-client";
import { getRadicalChallengeEntries } from "@/lib/games/radical-challenge-game";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ханз задлах — Сорилт горим",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function RadicalChallengePage({ searchParams }: PageProps) {
  const { lessonId = "radical-challenge" } = await searchParams;
  const entries = getRadicalChallengeEntries();

  return <RadicalChallengeClient lessonId={lessonId} entries={entries} />;
}
