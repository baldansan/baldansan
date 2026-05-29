import Link from "next/link";
import { GameCard } from "@/components/games/game-card";

type Props = {
  message: string;
  lessonId?: string;
};

export function GameEmptyState({ message, lessonId }: Props) {
  return (
    <GameCard className="text-center">
      <p className="text-4xl" aria-hidden>
        🎮
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">{message}</p>
      <div className="mt-4 flex flex-col gap-2">
        {lessonId ? (
          <Link
            href={`/lessons/${lessonId}/vocabulary`}
            className="min-h-[44px] app-btn-primary px-5 py-3"
          >
            Үгийн сан үзэх
          </Link>
        ) : null}
        <Link
          href="/games"
          className="min-h-[44px] rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
        >
          Тоглоом руу буцах
        </Link>
      </div>
    </GameCard>
  );
}
