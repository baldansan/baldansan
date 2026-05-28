"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { lessonPath } from "@/lib/content";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { analyzeLessonQaFromCounts } from "@/lib/admin/lesson-qa";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import { PublishingControls } from "@/components/admin/publishing-controls";
import { LessonQaBadge } from "@/components/admin/lesson-qa-badge";
import { SubtitleEditor } from "@/components/admin/subtitle-editor";
import { VocabularyEditor } from "@/components/admin/vocabulary-editor";
import { QuizEditor } from "@/components/admin/quiz-editor";
import {
  lessonToFormValues,
  LessonFormFields,
} from "@/components/admin/lesson-form-fields";
import {
  getLessonMetadataCounts,
  type LessonCompleteness,
} from "@/lib/supabase/admin-content";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  initialCompleteness: LessonCompleteness;
};

export function LessonEditForm({ lesson, initialCompleteness }: Props) {
  const publishStatus = getAdminPublishStatus(lesson);
  const values = lessonToFormValues(lesson);
  const [subtitleCount, setSubtitleCount] = useState(
    lesson.timedSubtitles.length
  );
  const [vocabActual, setVocabActual] = useState(lesson.vocabulary.length);
  const [vocabMeta, setVocabMeta] = useState(lesson.vocabularyCount);
  const [quizActual, setQuizActual] = useState(lesson.quizQuestions.length);
  const [quizMeta, setQuizMeta] = useState(lesson.quizCount);

  const refreshMetaCounts = useCallback(async () => {
    const result = await getLessonMetadataCounts(lesson.id);
    if (result.data) {
      setVocabActual(result.data.vocabularyCount);
      setVocabMeta(result.data.metaVocabulary);
      setQuizActual(result.data.quizCount);
      setQuizMeta(result.data.metaQuiz);
    }
  }, [lesson.id]);

  useEffect(() => {
    refreshMetaCounts();
  }, [refreshMetaCounts]);

  const qa = analyzeLessonQaFromCounts(lesson, {
    subtitleCount,
    vocabularyActual: vocabActual,
    quizActual: quizActual,
    vocabularyMeta: vocabMeta,
    quizMeta: quizMeta,
  });

  const vocabMismatch = vocabActual !== vocabMeta;
  const quizMismatch = quizActual !== quizMeta;

  const handleVocabCounts = useCallback(
    (_actual: number, _meta: number) => {
      refreshMetaCounts();
    },
    [refreshMetaCounts]
  );

  const handleQuizCounts = useCallback(
    (_actual: number, _meta: number) => {
      refreshMetaCounts();
    },
    [refreshMetaCounts]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Хичээл засах · {lesson.id}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Metadata preview + subtitle / vocabulary / quiz editors. Lesson metadata
          update still coming soon.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <LessonQaBadge status={qa.qaStatus} />
          {qa.warnings.length > 0 ? (
            <span className="text-xs text-amber-800">
              {qa.warnings.join(" · ")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
          Subtitles: {subtitleCount}
        </span>
        <span
          className={`rounded-full px-3 py-1 ring-1 ${
            vocabMismatch
              ? "bg-amber-50 text-amber-900 ring-amber-200"
              : "bg-emerald-50 text-emerald-800 ring-emerald-200"
          }`}
        >
          Vocabulary: {vocabActual} / meta {vocabMeta}
          {vocabMismatch ? " · Count mismatch" : ""}
        </span>
        <span
          className={`rounded-full px-3 py-1 ring-1 ${
            quizMismatch
              ? "bg-amber-50 text-amber-900 ring-amber-200"
              : "bg-emerald-50 text-emerald-800 ring-emerald-200"
          }`}
        >
          Quiz: {quizActual} / meta {quizMeta}
          {quizMismatch ? " · Count mismatch" : ""}
        </span>
        {!vocabMismatch && !quizMismatch && vocabActual > 0 && quizActual > 0 ? (
          <span className="text-xs text-slate-500">Counts synced after save</span>
        ) : null}
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Metadata preview</h2>
        <div className="mt-3">
          <LessonFormFields values={values} readOnly />
        </div>
      </section>

      <SubtitleEditor
        lessonId={lesson.id}
        onSubtitleCountChange={setSubtitleCount}
      />

      <VocabularyEditor
        lessonId={lesson.id}
        onCountsUpdated={handleVocabCounts}
      />

      <QuizEditor lessonId={lesson.id} onCountsUpdated={handleQuizCounts} />

      <PublishingControls
        lesson={lesson}
        initialCompleteness={initialCompleteness}
      />

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500"
          >
            Update lesson — coming soon
          </button>
          <Link
            href={
              publishStatus === "available"
                ? lessonPath(lesson.id)
                : lessonPreviewPath(lesson.id, { adminPreview: true })
            }
            className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            {publishStatus === "available"
              ? "Preview public lesson →"
              : "Admin preview lesson →"}
          </Link>
          <Link
            href="/admin/lessons"
            className="inline-flex justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            ← Content QA
          </Link>
        </div>
      </section>
    </div>
  );
}
