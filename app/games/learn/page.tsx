import { Suspense } from "react";
import { LearnGameClient } from "@/components/games/learn/learn-game-client";

export const metadata = {
  title: "Тоглож сурах — Бөөндөө Сурцгаая",
};

export default function LearnGamePage() {
  return (
    <Suspense fallback={null}>
      <LearnGameClient />
    </Suspense>
  );
}
