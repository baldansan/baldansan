"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { analyzeLessonQaFromCounts } from "@/lib/admin/lesson-qa";
import {
  AdminCollapsibleSection,
  AdminToolGroup,
} from "@/components/admin/admin-editor-ui";
import { BulkImportEditor } from "@/components/admin/bulk-import-editor";
import { LessonDuplicateCard } from "@/components/admin/lesson-duplicate-card";
import { LessonEditSimplePanel } from "@/components/admin/lesson-edit-simple-panel";
import { LessonExportCard } from "@/components/admin/lesson-export-card";
import { LessonRestoreCard } from "@/components/admin/lesson-restore-card";
import { LessonActivityCard } from "@/components/admin/lesson-activity-card";
import { ImportQaSummary } from "@/components/admin/import-qa-summary";
import { LessonPromptGenerator } from "@/components/admin/lesson-prompt-generator";
import { LessonImprovementPrompts } from "@/components/admin/lesson-improvement-prompts";
import { ReleaseReadinessCard } from "@/components/admin/release-readiness-card";
import { LessonApprovalControls } from "@/components/admin/lesson-approval-controls";
import { PublishingControls } from "@/components/admin/publishing-controls";
import type { ImportQaStatus } from "@/lib/admin/import-qa";
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

  return (
    <div className="flex flex-col gap-6">
      <LessonEditSimplePanel
        lesson={lesson}
        orderIndex={orderIndex}
        vocabularyCount={vocabActual}
        quizCount={quizActual}
        onSaved={() => void refreshMetaCounts()}
      />

      <AdminCollapsibleSection
        title="Advanced tools"
        description="Content editors, backup/restore, publish workflow, QA, and activity log."
      >
        <AdminToolGroup title="Full metadata">
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

        <AdminToolGroup title="Media">
          <LessonMediaEditor lesson={lesson} />
        </AdminToolGroup>

        <AdminToolGroup title="Subtitles, vocabulary, quiz">
          <SubtitleEditor
            lessonId={lesson.id}
            onSubtitleCountChange={setSubtitleCount}
            reloadToken={editorReload}
          />
          <VocabularyEditor
            lessonId={lesson.id}
            onCountsUpdated={() => refreshMetaCounts()}
            reloadToken={editorReload}
          />
          <QuizEditor
            lessonId={lesson.id}
            onCountsUpdated={() => refreshMetaCounts()}
            reloadToken={editorReload}
          />
        </AdminToolGroup>

        <AdminToolGroup title="Publish workflow">
          <ReleaseReadinessCard lesson={lesson} />
          <LessonApprovalControls lesson={lesson} />
          <PublishingControls
            lesson={lesson}
            initialCompleteness={completeness}
          />
        </AdminToolGroup>

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
        <ImportQaSummary
          lesson={lesson}
          reloadToken={editorReload}
          onReadinessChange={handleQaReadiness}
        />
        <LessonPromptGenerator lesson={lesson} />
        <LessonImprovementPrompts
          lesson={lesson}
          subtitleCount={subtitleCount}
          vocabularyCount={vocabActual}
          quizCount={quizActual}
        />

        <AdminToolGroup title="Activity log">
          <LessonActivityCard lessonId={lesson.id} bare />
        </AdminToolGroup>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={`/admin/analytics/lessons/${lesson.id}`}
            className="inline-flex rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
          >
            Lesson analytics
          </Link>
        </div>
      </AdminCollapsibleSection>
    </div>
  );
}
