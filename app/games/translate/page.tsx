import { TranslateGameClient } from "@/components/games/translate-game-client";
import { LevelGameHost } from "@/components/games/level-game-host";
import { getLessonGameContext } from "@/lib/games/game-data";
import { clampLevel } from "@/lib/games/level-core";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Орчуулах — Тоглоом",
};

type PageProps = {
  searchParams: Promise<{ lessonId?: string; level?: string; unlock?: string }>;
};

export default async function TranslateGamePage({ searchParams }: PageProps) {
  const { lessonId = "1", level, unlock } = await searchParams;
  // «Үе давах» горим — ?level=N. Багцыг хост клиент талд татна.
  if (level) {
    const parsed = Number(level);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return (
        <LevelGameHost game="translate" level={clampLevel(parsed)} unlock={unlock === "1"} />
      );
    }
  }
  const context = await getLessonGameContext(lessonId);
  return (
    <TranslateGameClient
      lessonId={lessonId}
      courseId={context.courseId}
      vocabulary={context.vocabulary}
      isKorean={context.isKorean}
      isPrelesson={context.isPrelesson}
      labels={context.labels}
    />
  );
}
