"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminEditorSection } from "@/components/admin/admin-editor-ui";
import {
  analyzeStoredLessonContent,
  MIN_QUIZ_FOR_PUBLISH,
  MIN_VOCABULARY_FOR_PUBLISH,
  type ImportQaStatus,
  type LessonContentQaReport,
} from "@/lib/admin/import-qa";
import {
  getQuizQuestionsByLessonId,
  getSubtitleLinesByLessonId,
  getVocabularyWordsByLessonId,
} from "@/lib/supabase/admin-content";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  reloadToken?: number;
  onReadinessChange?: (ready: boolean, status: ImportQaStatus) => void;
};

function StatusBadge({ status }: { status: ImportQaStatus }) {
  const styles: Record<ImportQaStatus, string> = {
    ready: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    needs_review: "bg-amber-50 text-amber-800 ring-amber-200",
    missing_content: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  const labels: Record<ImportQaStatus, string> = {
    ready: "Нийтлэхэд бэлэн",
    needs_review: "Шалгах шаардлагатай",
    missing_content: "Контент дутуу",
  };
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function ImportQaSummary({
  lesson,
  reloadToken = 0,
  onReadinessChange,
}: Props) {
  const [report, setReport] = useState<LessonContentQaReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const [subs, vocab, quiz] = await Promise.all([
      getSubtitleLinesByLessonId(lesson.id),
      getVocabularyWordsByLessonId(lesson.id),
      getQuizQuestionsByLessonId(lesson.id),
    ]);

    setLoading(false);

    if (subs.error || vocab.error || quiz.error) {
      setLoadError(
        subs.error ?? vocab.error ?? quiz.error ?? "Шалгалтыг уншихад алдаа гарлаа."
      );
      return;
    }

    const qa = analyzeStoredLessonContent(
      lesson,
      (subs.data ?? []).map((row) => ({
        chinese: row.chinese,
        pinyin: row.pinyin,
        mongolian: row.mongolian,
        start_time: row.start_time,
        end_time: row.end_time,
      })),
      (vocab.data ?? []).map((row) => ({
        chinese: row.chinese,
        pinyin: row.pinyin,
        mongolian: row.mongolian,
        hsk_level: row.hsk_level,
        example_chinese: row.example_chinese,
        example_mongolian: row.example_mongolian,
      })),
      (quiz.data ?? []).map((row) => ({
        type: row.type,
        question: row.question,
        options: row.options,
        correct_answer: row.correct_answer,
      }))
    );

    setReport(qa);
    onReadinessChange?.(qa.status === "ready", qa.status);
  }, [lesson, onReadinessChange]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  return (
    <AdminEditorSection
      title="Оруулсан контентын чанарын шалгалт"
      description={`Нийтлэхэд бэлэн болох нөхцөл: ${MIN_VOCABULARY_FOR_PUBLISH}-аас доошгүй үг, ${MIN_QUIZ_FOR_PUBLISH}-аас доошгүй дасгал, хариулт зөрөхгүй, монгол орчуулга бүрэн.`}
    >
      {loading ? (
        <p className="text-sm text-slate-500">Шалгаж байна…</p>
      ) : loadError ? (
        <p className="text-sm text-red-800">{loadError}</p>
      ) : report ? (
        <div className="flex flex-col gap-4">
          <StatusBadge status={report.status} />

          <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <li>
              Ерөнхий мэдээлэл: {report.hasMetadata ? "✓ бүрэн" : "✗ дутуу"}
            </li>
            <li>Хадмал: {report.subtitleCount}</li>
            <li>Үгсийн сан: {report.vocabularyCount}</li>
            <li>Дасгалын асуулт: {report.quizCount}</li>
            <li>
              Пиньинь дутуу: хадмал {report.missingPinyinSubtitleCount}, үг{" "}
              {report.missingPinyinVocabCount}
            </li>
            <li>
              Монгол орчуулга дутуу: хадмал{" "}
              {report.missingMongolianSubtitleCount}, үг{" "}
              {report.missingMongolianVocabCount}
            </li>
            <li>Хариулт зөрсөн дасгал: {report.quizAnswerMismatchCount}</li>
            <li>Хоосон жишээ: {report.emptyExampleCount}</li>
            <li>
              Давхардсан үг:{" "}
              {report.duplicateVocabularyChinese.length > 0
                ? report.duplicateVocabularyChinese.join(", ")
                : "алга"}
            </li>
          </ul>

          {Object.keys(report.hskDistribution).length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                HSK түвшний хуваарилалт
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(report.hskDistribution).map(([level, count]) => (
                  <span
                    key={level}
                    className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200"
                  >
                    {level}: {count}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {report.errors.length > 0 ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
              <p className="font-semibold">Алдаа</p>
              <ul className="mt-2 list-inside list-disc">
                {report.errors.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.warnings.length > 0 ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
              <p className="font-semibold">Анхааруулга</p>
              <ul className="mt-2 max-h-40 list-inside list-disc overflow-auto">
                {report.warnings.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminEditorSection>
  );
}
