"use client";

import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { useLearnerLanguageLessons } from "@/hooks/use-learner-language-lessons";
import { KanjiAppView } from "@/components/mobile/kanji-app-view";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { aggregateKanjiFromLessons } from "@/lib/mobile-app-vocab";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  allLessons: LessonContent[];
};

export function LanguageFilteredKanjiView({ allLessons }: Props) {
  const locale = useUiLocale();
  const { lessons, ready, lang } = useLearnerLanguageLessons(allLessons);

  if (!ready) {
    return (
      <MobileAppShell activeTab="kanji" >
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          {tr(locale, "Ачааллаж байна…")}
        </p>
      </MobileAppShell>
    );
  }

  const entries = aggregateKanjiFromLessons(lessons);
  const lessonVocab = lessons.map((lesson) => ({
    lessonId: lesson.id,
    vocabulary: lesson.vocabulary,
  }));

  return (
    <KanjiAppView
      entries={entries}
      lessonVocab={lessonVocab}
      lang={lang}
    />
  );
}
