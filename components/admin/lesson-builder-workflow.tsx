"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LessonBuilderChecklist } from "@/components/admin/lesson-builder-checklist";
import { LessonPackageSummary } from "@/components/admin/lesson-package-summary";
import { LessonQaBadge } from "@/components/admin/lesson-qa-badge";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import {
  analyzeStoredLessonContent,
  type LessonContentQaReport,
} from "@/lib/admin/import-qa";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import type { LessonQaReport } from "@/lib/admin/lesson-qa";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import {
  getQuizQuestionsByLessonId,
  getSubtitleLinesByLessonId,
  getVocabularyWordsByLessonId,
} from "@/lib/supabase/admin-content";

type Props = {
  reports: LessonQaReport[];
};

export function LessonBuilderWorkflow({ reports }: Props) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(
    reports[0]?.lesson.id ?? ""
  );
  const [qaReport, setQaReport] = useState<LessonContentQaReport | null>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  const selectedReport = useMemo(
    () => reports.find((r) => r.lesson.id === selectedId) ?? null,
    [reports, selectedId]
  );
  const selectedLesson = selectedReport?.lesson ?? null;

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.lesson.id.toLowerCase().includes(q) ||
        r.lesson.title.toLowerCase().includes(q) ||
        r.lesson.chineseTitle.toLowerCase().includes(q)
    );
  }, [reports, query]);

  const loadQa = useCallback(async () => {
    if (!selectedLesson) {
      setQaReport(null);
      setQaError(null);
      return;
    }

    setQaLoading(true);
    setQaError(null);

    const [subs, vocab, quiz] = await Promise.all([
      getSubtitleLinesByLessonId(selectedLesson.id),
      getVocabularyWordsByLessonId(selectedLesson.id),
      getQuizQuestionsByLessonId(selectedLesson.id),
    ]);

    setQaLoading(false);

    if (subs.error || vocab.error || quiz.error) {
      setQaError(subs.error ?? vocab.error ?? quiz.error ?? "QA уншихад алдаа.");
      setQaReport(null);
      return;
    }

    setQaReport(
      analyzeStoredLessonContent(
        selectedLesson,
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
      )
    );
  }, [selectedLesson]);

  useEffect(() => {
    loadQa();
  }, [loadQa]);

  const editHref = selectedLesson
    ? `/admin/lessons/${selectedLesson.id}/edit`
    : null;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Lesson Builder
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Шинэ хичээлийг draft үүсгэхээс publish хийх хүртэл алхамчилж бэлдэнэ.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Select lesson
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Existing HSK5 lessons from Supabase. Search by id, title, or Chinese
          title.
        </p>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Хайх: id, гарчиг, 中文…"
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          aria-label="Хичээл хайх"
        />

        <div className="mt-3 max-h-48 overflow-auto rounded-xl border border-slate-100">
          {filteredReports.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Хичээл олдсонгүй.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredReports.map((report) => {
                const { lesson } = report;
                const active = lesson.id === selectedId;
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(lesson.id)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition-colors hover:bg-emerald-50/50 ${
                        active ? "bg-emerald-50 ring-1 ring-inset ring-emerald-200" : ""
                      }`}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">
                          {lesson.id}
                        </span>
                        <LessonStatusBadge
                          status={getAdminPublishStatus(lesson)}
                        />
                        <LessonQaBadge status={report.qaStatus} />
                      </span>
                      <span className="font-medium text-slate-900">
                        {lesson.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        {lesson.chineseTitle}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedLesson && selectedReport ? (
          <div className="mt-4 rounded-xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Selected lesson
            </p>
            <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">ID</dt>
                <dd className="font-mono text-slate-900">{selectedLesson.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <LessonStatusBadge
                    status={getAdminPublishStatus(selectedLesson)}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Title</dt>
                <dd className="text-slate-900">{selectedLesson.title}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Chinese title</dt>
                <dd className="text-slate-900">{selectedLesson.chineseTitle}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Subtitles</dt>
                <dd className="text-slate-900">
                  {qaReport?.subtitleCount ?? selectedReport.subtitleCount}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Vocabulary</dt>
                <dd className="text-slate-900">
                  {qaReport?.vocabularyCount ?? selectedReport.vocabularyActual}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Quiz</dt>
                <dd className="text-slate-900">
                  {qaReport?.quizCount ?? selectedReport.quizActual}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">QA status</dt>
                <dd>
                  {qaReport ? (
                    <span
                      className={`text-sm font-medium ${
                        qaReport.status === "ready"
                          ? "text-emerald-700"
                          : "text-amber-800"
                      }`}
                    >
                      {qaReport.status === "ready"
                        ? "Ready to publish"
                        : qaReport.status === "needs_review"
                          ? "Needs review"
                          : "Missing content"}
                    </span>
                  ) : qaLoading ? (
                    <span className="text-slate-500">Loading…</span>
                  ) : (
                    <LessonQaBadge status={selectedReport.qaStatus} />
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
              <Link
                href={lessonPreviewPath(selectedLesson.id, {
                  adminPreview: true,
                })}
                className="text-emerald-700 hover:text-emerald-800"
              >
                Admin preview →
              </Link>
              <Link
                href={lessonPreviewPath(selectedLesson.id, {
                  adminPreview: true,
                  subpath: "watch",
                })}
                className="text-slate-600 hover:text-emerald-700"
              >
                Watch →
              </Link>
              <Link
                href={lessonPreviewPath(selectedLesson.id, {
                  adminPreview: true,
                  subpath: "vocabulary",
                })}
                className="text-slate-600 hover:text-emerald-700"
              >
                Vocabulary →
              </Link>
              <Link
                href={lessonPreviewPath(selectedLesson.id, {
                  adminPreview: true,
                  subpath: "quiz",
                })}
                className="text-slate-600 hover:text-emerald-700"
              >
                Quiz →
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Quick actions
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/lessons/new"
            className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            New draft lesson
          </Link>
          {editHref ? (
            <Link
              href={editHref}
              className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              Edit selected lesson
            </Link>
          ) : null}
          {selectedLesson ? (
            <>
              <Link
                href={lessonPreviewPath(selectedLesson.id, {
                  adminPreview: true,
                })}
                className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                Admin preview
              </Link>
              <Link
                href={lessonPreviewPath(selectedLesson.id, {
                  adminPreview: true,
                  subpath: "watch",
                })}
                className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                Watch preview
              </Link>
              <Link
                href={editHref!}
                className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                Export backup
              </Link>
            </>
          ) : null}
          <Link
            href="/admin/lessons"
            className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
          >
            Content QA dashboard
          </Link>
        </div>
      </section>

      {selectedLesson ? (
        <LessonPackageSummary
          lesson={selectedLesson}
          qaReport={qaReport}
          loading={qaLoading}
          loadError={qaError}
        />
      ) : null}

      <LessonBuilderChecklist
        lesson={selectedLesson}
        qaReport={qaReport}
        loading={qaLoading}
      />
    </div>
  );
}
