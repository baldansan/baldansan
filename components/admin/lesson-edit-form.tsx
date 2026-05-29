"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { analyzeLessonQaFromCounts } from "@/lib/admin/lesson-qa";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import { AdminToolGroup } from "@/components/admin/admin-editor-ui";
import { BulkImportEditor } from "@/components/admin/bulk-import-editor";
import { LessonDuplicateCard } from "@/components/admin/lesson-duplicate-card";
import { LessonExportCard } from "@/components/admin/lesson-export-card";
import { LessonRestoreCard } from "@/components/admin/lesson-restore-card";
import { ImportQaSummary } from "@/components/admin/import-qa-summary";
import { LessonPromptGenerator } from "@/components/admin/lesson-prompt-generator";
import { LessonImprovementPrompts } from "@/components/admin/lesson-improvement-prompts";
import { ReleaseReadinessCard } from "@/components/admin/release-readiness-card";
import { LessonApprovalControls } from "@/components/admin/lesson-approval-controls";
import { PublishingControls } from "@/components/admin/publishing-controls";
import type { ImportQaStatus } from "@/lib/admin/import-qa";
import { LessonQaBadge } from "@/components/admin/lesson-qa-badge";
import { SubtitleEditor } from "@/components/admin/subtitle-editor";
import { VocabularyEditor } from "@/components/admin/vocabulary-editor";
import { QuizEditor } from "@/components/admin/quiz-editor";
import { LessonMetadataEditor } from "@/components/admin/lesson-metadata-editor";
import { LessonMediaEditor } from "@/components/admin/lesson-media-editor";
import {
  getLessonMetadataCounts,
  type LessonCompleteness,
} from "@/lib/supabase/admin-content";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  orderIndex: number;
  initialCompleteness: LessonCompleteness;
};

export function LessonEditForm({
  lesson,
  orderIndex,
  initialCompleteness,
}: Props) {
  const publishStatus = getAdminPublishStatus(lesson);
  const [subtitleCount, setSubtitleCount] = useState(
    lesson.timedSubtitles.length
  );
  const [vocabActual, setVocabActual] = useState(lesson.vocabulary.length);
  const [vocabMeta, setVocabMeta] = useState(lesson.vocabularyCount);
  const [quizActual, setQuizActual] = useState(lesson.quizQuestions.length);
  const [quizMeta, setQuizMeta] = useState(lesson.quizCount);
  const [editorReload, setEditorReload] = useState(0);
  const [completeness, setCompleteness] = useState(initialCompleteness);
  const [qaPublishReady, setQaPublishReady] = useState(
    initialCompleteness.readyToPublish
  );

  const handleQaReadiness = useCallback((ready: boolean, _status: ImportQaStatus) => {
    setQaPublishReady(ready);
    setCompleteness((prev) => ({ ...prev, readyToPublish: ready }));
  }, []);

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

  const hasAnyContent =
    subtitleCount > 0 || vocabActual > 0 || quizActual > 0;
  const readyToPublish = qaPublishReady;

  useEffect(() => {
    setCompleteness({
      hasMetadata: qa.hasMetadata,
      subtitleCount,
      vocabularyCount: vocabActual,
      quizCount: quizActual,
      readyToPublish,
    });
  }, [qa.hasMetadata, subtitleCount, vocabActual, quizActual, readyToPublish]);

  const handleImportSuccess = useCallback(() => {
    setEditorReload((n) => n + 1);
    void refreshMetaCounts();
  }, [refreshMetaCounts]);

  const handleSubtitleCountChange = useCallback((count: number) => {
    setSubtitleCount(count);
  }, []);

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
      <div className="admin-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <LessonQaBadge status={qa.qaStatus} />
          {qa.warnings.length > 0 ? (
            <span className="text-xs text-amber-800">
              {qa.warnings.join(" · ")}
            </span>
          ) : null}
        </div>
      </div>

      {publishStatus === "draft" && !hasAnyContent ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Ноорог хичээл — контент байхгүй. Bulk import эсвэл доорх editor-оор
          subtitle, vocabulary, quiz нэмнэ үү.
        </div>
      ) : null}

      {readyToPublish ? (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          Ready to publish — metadata, subtitle, vocabulary, quiz бүрэн байна.
        </div>
      ) : null}

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
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href={`/admin/analytics/lessons/${lesson.id}`}
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          View lesson analytics
        </Link>
        <Link
          href={`/admin/analytics/questions?lesson=${lesson.id}`}
          className="inline-flex rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          Question insights
        </Link>
        <Link
          href={`/admin/analytics/vocabulary?lesson=${lesson.id}`}
          className="inline-flex rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          Vocabulary insights
        </Link>
      </div>

      <AdminToolGroup
        title="Metadata"
        description="Гарчиг, статус, order index — Supabase-д хадгална."
      >
        <LessonMetadataEditor
          lesson={lesson}
          orderIndex={orderIndex}
          vocabActual={vocabActual}
          quizActual={quizActual}
          vocabMeta={vocabMeta}
          quizMeta={quizMeta}
          contentReadyForPublish={qaPublishReady}
          onSaved={() => void refreshMetaCounts()}
          onCountsRefreshed={(vocab, quiz) => {
            setVocabMeta(vocab);
            setQuizMeta(quiz);
          }}
        />
      </AdminToolGroup>

      <AdminToolGroup
        title="Media"
        description="Upload to Supabase Storage or paste URLs — thumbnail, audio, video."
      >
        <LessonMediaEditor lesson={lesson} />
      </AdminToolGroup>

      <AdminToolGroup
        title="Content QA & prompts"
        description="Import-ийн өмнө болон дараа шалгана."
      >
        <ImportQaSummary
          lesson={lesson}
          reloadToken={editorReload}
          onReadinessChange={handleQaReadiness}
        />
        <LessonPromptGenerator lesson={lesson} />
      </AdminToolGroup>

      <AdminToolGroup
        title="Content improvement prompts"
        description="Analytics/QA асуудлаас ChatGPT/Cursor-д paste хийх copy-ready prompt-ууд. AI API дуудахгүй."
      >
        <LessonImprovementPrompts
          lesson={lesson}
          subtitleCount={subtitleCount}
          vocabularyCount={vocabActual}
          quizCount={quizActual}
        />
      </AdminToolGroup>

      <AdminToolGroup
        title="Import, export & safety"
        description="Backup → import/restore → duplicate. Replace өмнө export хийнэ үү."
      >
        <BulkImportEditor
          lessonId={lesson.id}
          onImportSuccess={handleImportSuccess}
        />
        <LessonExportCard lessonId={lesson.id} />
        <LessonRestoreCard
          lessonId={lesson.id}
          orderIndex={orderIndex}
          onRestoreSuccess={handleImportSuccess}
        />
        <LessonDuplicateCard
          sourceLessonId={lesson.id}
          courseId={lesson.courseId}
          sourceTitle={lesson.title}
          sourceChineseTitle={lesson.chineseTitle}
        />
      </AdminToolGroup>

      <AdminToolGroup
        title="Manual editors"
        description="Мөр бүрээр subtitle, vocabulary, quiz засварлана."
      >
        <SubtitleEditor
          lessonId={lesson.id}
          onSubtitleCountChange={handleSubtitleCountChange}
          reloadToken={editorReload}
        />
        <VocabularyEditor
          lessonId={lesson.id}
          onCountsUpdated={handleVocabCounts}
          reloadToken={editorReload}
        />
        <QuizEditor
          lessonId={lesson.id}
          onCountsUpdated={handleQuizCounts}
          reloadToken={editorReload}
        />
      </AdminToolGroup>

      <AdminToolGroup title="Publish" description="Release checklist, approval, publish.">
        <ReleaseReadinessCard lesson={lesson} />
        <LessonApprovalControls lesson={lesson} />
        <PublishingControls
          lesson={lesson}
          initialCompleteness={completeness}
        />
      </AdminToolGroup>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Preview links</h2>
        <p className="mt-1 text-sm text-slate-600">
          {publishStatus === "available"
            ? "Нийтлэгдсэн хичээл — public preview."
            : "Ноорог/архив — ?preview=admin (зөвхөн admin)."}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={lessonPreviewPath(lesson.id, {
              adminPreview: publishStatus !== "available",
            })}
            className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Lesson detail
          </Link>
          <Link
            href={lessonPreviewPath(lesson.id, {
              adminPreview: publishStatus !== "available",
              subpath: "watch",
            })}
            className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Watch
          </Link>
          <Link
            href={lessonPreviewPath(lesson.id, {
              adminPreview: publishStatus !== "available",
              subpath: "vocabulary",
            })}
            className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Vocabulary
          </Link>
          <Link
            href={lessonPreviewPath(lesson.id, {
              adminPreview: publishStatus !== "available",
              subpath: "quiz",
            })}
            className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Quiz
          </Link>
          <Link
            href="/admin/lessons"
            className="inline-flex justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            ← Content QA
          </Link>
        </div>
      </section>
    </div>
  );
}
