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
        title="Бүтэн хичээлийн JSON-г сайжруулах"
        subtitle="Одоогийн анхааруулга болон хичээлийн агуулгад тулгуурлан бүхэлд нь сайжруулна."
        prompt={buildLessonImprovementPrompt(lesson, qa)}
        issueType="full_lesson"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Дутуу хадмал / үгсийн сан / дасгалыг нөхөх"
        subtitle="Нийтлэхэд шаардлагатай доод хэмжээнд хүргэж хоосон хэсгүүдийг бөглөнө."
        prompt={buildMissingContentPrompt(lesson, qaSummary)}
        issueType="missing_content"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Дасгалын чанарыг сайжруулах"
        subtitle="Асуултыг тодорхой болгож, буруу хариултуудыг сайжруулж, монгол тайлбар нэмнэ."
        prompt={buildQuizQualityPrompt(lesson, qaSummary)}
        issueType="quiz_quality"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Үгийн жишээ өгүүлбэрийг сайжруулах"
        subtitle="Илүү тодорхой жишээ өгүүлбэр, жам ёсны монгол орчуулга."
        prompt={buildVocabularyExamplesPrompt(lesson, weakVocab)}
        issueType="vocabulary"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Хадмал засах (пиньинь + монгол)"
        subtitle="Хадмалын мөрүүдэд дутуу байгаа орчуулгыг нөхнө."
        prompt={buildSubtitleImprovementPrompt(lesson, subtitleIssues)}
        issueType="subtitles"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
      <ImprovementPromptCard
        title="Нийтлэхэд бэлэн агуулга бэлдэх"
        subtitle="Шалгах жагсаалтад тулгуурлан чанарын шалгалтыг давж нийтлэхэд бэлэн JSON гаргана."
        prompt={buildPublishReadinessPrompt(lesson, qa)}
        issueType="publish_readiness"
        relatedLessonId={lesson.id}
        defaultCollapsed
      />
    </div>
  );
}
