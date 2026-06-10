import { HskQuizGameClient } from "@/components/games/hsk-quiz-game-client";

export const dynamic = "force-dynamic";

export default function ExampleClozePage() {
  return (
    <HskQuizGameClient
      config={{
        title: "Жишээ бөглөх",
        deckPath: "/api/games/example-cloze-deck",
        gameType: "example-cloze",
        hanziOptions: true,
        questionSeconds: 12,
      }}
    />
  );
}
