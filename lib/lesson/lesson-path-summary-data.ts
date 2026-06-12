import type { HskLessonPackage } from "@/types/hsk-lesson-package";

export type LessonPathSummaryData = {
  vocabCount: number;
  vocabulary: HskLessonPackage["vocabulary"];
  structureChips: string[];
  reflectionQuestions: string[];
};

export function extractLessonPathSummaryData(
  pkg: HskLessonPackage
): LessonPathSummaryData {
  const vocabulary = pkg.vocabulary ?? [];
  const chips = new Set<string>();

  for (const point of pkg.grammar ?? []) {
    const label = point.point?.trim() || point.gloss_mn?.trim();
    if (label) chips.add(label);
  }
  for (const point of pkg.word_explanation ?? []) {
    const label = point.point?.trim() || point.gloss_mn?.trim();
    if (label) chips.add(label);
  }
  for (const text of pkg.texts ?? []) {
    for (const sentence of text.sentences ?? []) {
      for (const ks of sentence.key_structures ?? []) {
        const label = ks.trim();
        if (label) chips.add(label);
      }
    }
  }

  const reflectionQuestions: string[] = [];
  for (const text of pkg.texts ?? []) {
    for (const q of text.reflection?.questions_mn ?? []) {
      const trimmed = q.trim();
      if (trimmed) reflectionQuestions.push(trimmed);
    }
  }

  return {
    vocabCount: vocabulary.length,
    vocabulary,
    structureChips: [...chips],
    reflectionQuestions,
  };
}
