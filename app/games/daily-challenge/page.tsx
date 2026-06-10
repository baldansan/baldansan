import { HskQuizGameClient } from "@/components/games/hsk-quiz-game-client";

export const dynamic = "force-dynamic";

export default function DailyChallengePage() {
  return (
    <HskQuizGameClient
      config={{
        title: "Өдрийн сорил",
        deckPath: "/api/games/daily-challenge-deck",
        gameType: "daily-challenge",
        dailyMode: true,
        maxLives: 3,
        questionSeconds: 12,
      }}
    />
  );
}
