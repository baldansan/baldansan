import { HskQuizGameClient } from "@/components/games/hsk-quiz-game-client";

export const dynamic = "force-dynamic";

export default function PinyinPickPage() {
  return (
    <HskQuizGameClient
      config={{
        title: "Пиньинь сонгох",
        deckPath: "/api/games/pinyin-deck",
        gameType: "pinyin-pick",
      }}
    />
  );
}
