"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useActiveHskLevelOptional,
  useRegisterLessonHskLevels,
} from "@/components/providers/active-hsk-level-provider";
import { getSelectedLanguage } from "@/lib/learner-onboarding";
import {
  filterLessonsByLanguage,
  languageTrackLabel,
  type SelectedLanguage,
} from "@/lib/language-track";
import { filterLessonsByActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import type { LessonContent } from "@/types/lesson-content";

export function useLearnerLanguageLessons(allLessons: LessonContent[]) {
  const [lang, setLang] = useState<SelectedLanguage | null>(null);
  const [ready, setReady] = useState(false);
  const hskCtx = useActiveHskLevelOptional();

  useEffect(() => {
    setLang(getSelectedLanguage());
    setReady(true);
  }, []);

  const languageFiltered = useMemo(
    () => (lang ? filterLessonsByLanguage(allLessons, lang) : []),
    [allLessons, lang]
  );

  useRegisterLessonHskLevels(languageFiltered);

  const lessons = useMemo(() => {
    if (lang !== "zh" || !hskCtx?.hydrated) return languageFiltered;
    return filterLessonsByActiveHskLevel(languageFiltered, hskCtx.level);
  }, [languageFiltered, lang, hskCtx?.hydrated, hskCtx?.level]);

  const trackLabel = lang ? languageTrackLabel(lang) : "";

  return { lang, lessons, trackLabel, ready };
}
