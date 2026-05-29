"use client";

import { useMemo } from "react";
import {
  buildLessonImprovementPrompt,
  buildQuestionImprovementPrompt,
  buildVocabularyImprovementPrompt,
} from "@/lib/admin/improvement-prompts";
import {
  ImprovementPromptCard,
  ImprovementPromptCopyButton,
} from "@/components/admin/improvement-prompt-card";
import type { LessonAnalyticsDetail } from "@/lib/supabase/admin-analytics";

type Props = {
  detail: LessonAnalyticsDetail;
};

export function LessonAnalyticsImprovementSection({ detail }: Props) {
  const { metrics, questionPerformance, vocabularyEngagement, contentWarnings } =
    detail;

  const analyticsContext = useMemo(
    () => ({
      averageQuizPercentage: metrics.averageQuizPercentage,
      completionRate: metrics.completionRate,
      quizAttemptCount: metrics.quizAttemptCount,
      contentWarnings,
    }),
    [metrics, contentWarnings]
  );

  const lessonStub = useMemo(
    () => ({
      id: metrics.lessonId,
      courseId: "hsk5",
      title: metrics.title,
      chineseTitle: metrics.chineseTitle,
      subtitle: "",
      description: "",
      duration: "",
      vocabularyCount: metrics.vocabularyCount,
      quizCount: metrics.quizQuestionCount,
      status: "available" as const,
      publishStatus: "draft" as const,
      videoPlaceholder: "",
      watchTotalTime: "",
      subtitlePreview: [],
      timedSubtitles: [],
      vocabulary: [],
      quizQuestions: [],
      quizTypes: [],
    }),
    [metrics]
  );

  const qaSummary = useMemo(
    () => ({
      subtitleCount: metrics.subtitleCount,
      vocabularyCount: metrics.vocabularyCount,
      quizCount: metrics.quizQuestionCount,
      qaStatus: metrics.qaStatus,
      warnings: [...contentWarnings, ...detail.warnings].filter(
        (w, i, arr) => arr.indexOf(w) === i
      ),
    }),
    [metrics, contentWarnings, detail.warnings]
  );

  const lessonPrompt = useMemo(
    () =>
      buildLessonImprovementPrompt(lessonStub, qaSummary, analyticsContext),
    [lessonStub, qaSummary, analyticsContext]
  );

  const difficultQuestions = questionPerformance.filter((q) => q.needsReview);

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">
        Content improvement prompts
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Analytics + QA signals → copy-ready ChatGPT/Cursor prompts (no API call).
      </p>
      <div className="mt-4 flex flex-col gap-4">
        <ImprovementPromptCard
          title="Improve this lesson"
          subtitle={
            metrics.averageQuizPercentage != null &&
            metrics.averageQuizPercentage < 70
              ? `Low avg quiz score (${metrics.averageQuizPercentage}%) included in prompt.`
              : metrics.completionRate != null &&
                  metrics.completionRate < 30
                ? `Low completion (${metrics.completionRate}%) included in prompt.`
                : "Uses content warnings and learner signals when available."
          }
          prompt={lessonPrompt}
          issueType="full_lesson"
          relatedLessonId={metrics.lessonId}
          defaultCollapsed
        />

        {difficultQuestions.length > 0 ? (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Difficult question fix prompts
            </h3>
            <ul className="mt-3 flex flex-col gap-3 divide-y divide-slate-100">
              {difficultQuestions.slice(0, 5).map((q) => (
                <li key={q.questionKey} className="pt-3 first:pt-0">
                  <p className="text-sm text-slate-800">{q.question}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {q.accuracyPercent}% accuracy · {q.attemptsCount} attempts
                  </p>
                  <ImprovementPromptCopyButton
                    className="mt-2"
                    prompt={buildQuestionImprovementPrompt(q, lessonStub)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {vocabularyEngagement.filter((w) => w.engagement === "none" || w.engagement === "low")
          .length > 0 ? (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Weak vocabulary prompts
            </h3>
            <ul className="mt-3 flex flex-col gap-3 divide-y divide-slate-100">
              {vocabularyEngagement
                .filter((w) => w.engagement === "none" || w.engagement === "low")
                .slice(0, 5)
                .map((w) => (
                  <li key={w.vocabularyWordId} className="pt-3 first:pt-0">
                    <p className="text-sm font-medium text-slate-800">
                      {w.chinese}{" "}
                      <span className="font-normal text-slate-500">
                        {w.pinyin}
                      </span>
                    </p>
                    <ImprovementPromptCopyButton
                      className="mt-2"
                      label="Generate vocabulary improvement prompt"
                      prompt={buildVocabularyImprovementPrompt(w, lessonStub)}
                    />
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
