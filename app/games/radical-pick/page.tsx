import { HskQuizGameClient } from "@/components/games/hsk-quiz-game-client";

export const dynamic = "force-dynamic";

export default function RadicalPickPage() {
  return (
    <HskQuizGameClient
      config={{
        title: "Радикал таних",
        deckPath: "/api/games/radical-pick-deck",
        gameType: "radical-pick",
        hanziOptions: true,
      }}
    />
  );
}
