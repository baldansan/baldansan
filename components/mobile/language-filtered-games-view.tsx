"use client";

import { useLearnerLanguageLessons } from "@/hooks/use-learner-language-lessons";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";
import { GamesAppView } from "@/components/mobile/games-app-view";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  allLessons: LessonContent[];
};

export function LanguageFilteredGamesView({ allLessons }: Props) {
  const locale = useUiLocale();
  const { lessons, ready } = useLearnerLanguageLessons(allLessons);

  if (!ready) {
    return (
      <MobileAppShell activeTab="games" >
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          {tr(locale, "Ачааллаж байна…")}
        </p>
      </MobileAppShell>
    );
  }

  return (
    <GamesAppView
      lessonIds={lessons.map((lesson) => lesson.id)}
      lessonTitles={Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson.title]))}
    />
  );
}
