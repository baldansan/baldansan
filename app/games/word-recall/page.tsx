import { HskQuizGameClient } from "@/components/games/hsk-quiz-game-client";

export const dynamic = "force-dynamic";

export default function WordRecallPage() {
  return (
    <HskQuizGameClient
      config={{
        title: "Үг сорих",
        deckPath: "/api/games/word-recall-deck",
        gameType: "word-recall",
        hanziOptions: true,
      }}
    />
  );
}
