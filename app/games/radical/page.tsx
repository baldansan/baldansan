import { RadicalGameClient } from "@/components/games/radical-game-client";
import { getRadicalGameEntries } from "@/lib/games/radical-game-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ханз задлах — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string }>;
};

export default async function RadicalGamePage({ searchParams }: PageProps) {
  const { lessonId = "radical" } = await searchParams;
  const entries = getRadicalGameEntries();

  return (
    <RadicalGameClient lessonId={lessonId} entries={entries} />
  );
}
