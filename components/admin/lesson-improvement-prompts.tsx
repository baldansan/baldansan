"use client";

import { useMemo } from "react";
import { analyzeLessonQaFromCounts } from "@/lib/admin/lesson-qa";
import {
  buildLessonImprovementPrompt,
  buildMissingContentPrompt,
  buildPublishReadinessPrompt,
  buildQuizQualityPrompt,
  buildSubtitleImprovementPrompt,
  buildVocabularyExamplesPrompt,
} from "@/lib/admin/improvement-prompts";
import { ImprovementPromptCard } from "@/components/admin/improvement-prompt-card";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  subtitleCount: number;
  vocabularyCount: number;
  quizCount: number;
};

export function LessonImprovementPrompts({
  lesson,
  subtitleCount,
  vocabularyCount,
  quizCount,
}: Props) {
  const qa = useMemo(
    () =>
      analyzeLessonQaFromCounts(lesson, {
        subtitleCount,
        vocabularyActual: vocabularyCount,
        quizActual: quizCount,
        vocabularyMeta: lesson.vocabularyCount,
        quizMeta: lesson.quizCount,
      }),
    [lesson, subtitleCount, vocabularyCount, quizCount]
  );

  const qaSummary = useMemo(
    () => ({
      subtitleCount: qa.subtitleCount,
      vocabularyCount: qa.vocabularyActual,
      quizCount: qa.quizActual,
      qaStatus: qa.qaStatus,
      warnings: qa.warnings,
    }),
    [qa]
  );

  const subtitleIssues = useMemo(() => {
    const missingPinyin = lesson.timedSubtitles.filter(
      (s) => !s.pinyin?.trim()
    ).length;
    const missingMongolian = lesson.timedSubtitles.filter(
      (s) => !s.mongolian?.trim()
    ).length;
    return {
      missingLines: subtitleCount === 0,
      missingPinyinCount: missingPinyin,
      missingMongolianCount: missingMongolian,
      sampleLines: lesson.timedSubtitles.slice(0, 5).map((s) => ({
        chinese: s.chinese,
        mongolian: s.mongolian,
        pinyin: s.pinyin,
      })),
    };
  }, [lesson.timedSubtitles, subtitleCount]);

  const weakVocab = useMemo(
    () =>
      lesson.vocabulary.slice(0, 8).map((w) => ({
        vocabularyWordId: w.dbId ?? 0,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        chinese: w.chinese,
        pinyin: w.pinyin,
        mongolian: w.mongolian,
        hskLevel: w.hskLevel,
        learnedCount: 0,
        uniqueLearnersCount: 0,
        engagement: "none" as const,
      })),
    [lesson]
  );

  return (
    <div id="content-improvement" className="flex flex-col gap-4">
      <ImprovementPromptCard
        title="Improve full lesson JSON"
        subtitle="Holistic improvement using current QA warnings and lesson context."
        prompt={buildLessonImprovementPrompt(lesson, qa)}
        issueType="full_lesson"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Fix missing subtitle / vocabulary / quiz"
        subtitle="Fill empty sections to meet publish minimums."
        prompt={buildMissingContentPrompt(lesson, qaSummary)}
        issueType="missing_content"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Improve quiz quality"
        subtitle="Clearer questions, better distractors, Mongolian explanations."
        prompt={buildQuizQualityPrompt(lesson, qaSummary)}
        issueType="quiz_quality"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Improve vocabulary examples"
        subtitle="Stronger example sentences and natural Mongolian glosses."
        prompt={buildVocabularyExamplesPrompt(lesson, weakVocab)}
        issueType="vocabulary"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Fix subtitles (pinyin + Mongolian)"
        subtitle="Repair missing translations on timed subtitle lines."
        prompt={buildSubtitleImprovementPrompt(lesson, subtitleIssues)}
        issueType="subtitles"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Prepare publish-ready content"
        subtitle="Checklist-driven JSON to pass import QA and publish."
        prompt={buildPublishReadinessPrompt(lesson, qa)}
        issueType="publish_readiness"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
    </div>
  );
}
