"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import { LessonQaBadge } from "@/components/admin/lesson-qa-badge";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import { EmptyState } from "@/components/empty-state";
import { lessonPath } from "@/lib/content";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import {
  getAdminPublishStatus,
  matchesStatusFilter,
  type AdminStatusFilter,
} from "@/lib/admin/lesson-status";
import {
  isPublishReady,
  summarizeLessonQa,
  type LessonQaReport,
  type LessonQaSummary,
  type QaFilter,
} from "@/lib/admin/lesson-qa";

type Props = {
  reports: LessonQaReport[];
};

export function AdminLessonsList({ reports }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>("all");
  const [qaFilter, setQaFilter] = useState<QaFilter>("all");

  const summary: LessonQaSummary = useMemo(
    () => summarizeLessonQa(reports),
    [reports]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((report) => {
      const { lesson } = report;
      if (!matchesStatusFilter(lesson, statusFilter)) return false;
      if (qaFilter !== "all" && report.qaStatus !== qaFilter) return false;
      if (!q) return true;
      return (
        lesson.id.toLowerCase().includes(q) ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.chineseTitle.toLowerCase().includes(q) ||
        lesson.subtitle.toLowerCase().includes(q) ||
        lesson.description.toLowerCase().includes(q)
      );
    });
  }, [reports, query, statusFilter, qaFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lesson Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Хичээлүүдийн контентын бүрэн байдал, статус, preview-г шалгана.
          </p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="inline-flex w-fit rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          + Шинэ хичээл
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <AdminSummaryCard label="Total lessons" value={summary.totalLessons} />
        <AdminSummaryCard label="Available" value={summary.availableCount} />
        <AdminSummaryCard label="Draft" value={summary.draftCount} />
        <AdminSummaryCard label="Archived" value={summary.archivedCount} />
        <AdminSummaryCard
          label="Total vocabulary"
          value={summary.totalVocabulary}
        />
        <AdminSummaryCard
          label="Total quiz Q"
          value={summary.totalQuizQuestions}
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Хайх: гарчиг, китай, тайлбар..."
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          aria-label="Хичээл хайх"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AdminStatusFilter)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          aria-label="Статус шүүлт"
        >
          <option value="all">Status: All</option>
          <option value="draft">draft</option>
          <option value="available">available</option>
          <option value="archived">archived</option>
        </select>
        <select
          value={qaFilter}
          onChange={(e) => setQaFilter(e.target.value as QaFilter)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          aria-label="QA шүүлт"
        >
          <option value="all">QA: All</option>
          <option value="complete">Complete</option>
          <option value="needs_review">Needs review</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Хичээл олдсонгүй"
          description={
            reports.length === 0
              ? "HSK5 курс дээр хичээл байхгүй. Supabase эсвэл local fallback шалгана уу."
              : "Хайлт эсвэл шүүлтийг өөрчилж үзнэ үү."
          }
          action={
            <Link
              href="/admin/lessons/new"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Шинэ хичээл skeleton →
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Lesson</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">QA</th>
                <th className="hidden px-3 py-3 sm:table-cell">Ready</th>
                <th className="hidden px-3 py-3 md:table-cell">Counts</th>
                <th className="hidden px-3 py-3 lg:table-cell">Warnings</th>
                <th className="px-3 py-3">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((report) => {
                const { lesson } = report;
                const publishStatus = getAdminPublishStatus(lesson);
                const publishReady = isPublishReady(report);
                return (
                  <tr key={lesson.id} className="align-top hover:bg-emerald-50/30">
                    <td className="px-3 py-3 font-mono text-xs">{lesson.id}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{lesson.title}</p>
                      <p className="text-xs text-slate-500">{lesson.chineseTitle}</p>
                      <p className="mt-1 text-xs text-slate-400">{lesson.duration}</p>
                    </td>
                    <td className="px-3 py-3">
                      <LessonStatusBadge status={publishStatus} />
                    </td>
                    <td className="px-3 py-3">
                      <LessonQaBadge status={report.qaStatus} />
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      {publishReady ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                          Publish-ready
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-slate-600 md:table-cell">
                      <p>Meta: {report.hasMetadata ? "✓" : "—"}</p>
                      <p>
                        Sub: {report.subtitleCount} · Voc:{" "}
                        {report.vocabularyActual}/{lesson.vocabularyCount} · Quiz:{" "}
                        {report.quizActual}/{lesson.quizCount}
                      </p>
                    </td>
                    <td className="hidden max-w-[10rem] px-3 py-3 lg:table-cell">
                      {report.warnings.length > 0 ? (
                        <ul className="list-inside list-disc text-xs text-amber-800">
                          {report.warnings.map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-emerald-700">OK</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-[7rem] flex-col gap-0.5 text-xs font-medium">
                        {publishStatus === "available" ? (
                          <Link
                            href={lessonPath(lesson.id)}
                            className="text-slate-600 hover:text-emerald-700"
                          >
                            Public preview
                          </Link>
                        ) : (
                          <Link
                            href={lessonPreviewPath(lesson.id, {
                              adminPreview: true,
                            })}
                            className="text-amber-800 hover:text-amber-900"
                          >
                            Admin preview
                          </Link>
                        )}
                        <Link
                          href={lessonPreviewPath(lesson.id, {
                            adminPreview: publishStatus !== "available",
                            subpath: "watch",
                          })}
                          className="text-slate-600 hover:text-emerald-700"
                        >
                          Watch
                        </Link>
                        <Link
                          href={lessonPreviewPath(lesson.id, {
                            adminPreview: publishStatus !== "available",
                            subpath: "vocabulary",
                          })}
                          className="text-slate-600 hover:text-emerald-700"
                        >
                          Vocabulary
                        </Link>
                        <Link
                          href={lessonPreviewPath(lesson.id, {
                            adminPreview: publishStatus !== "available",
                            subpath: "quiz",
                          })}
                          className="text-slate-600 hover:text-emerald-700"
                        >
                          Quiz
                        </Link>
                        <Link
                          href={`/admin/lessons/${lesson.id}/edit`}
                          className="text-emerald-700 hover:text-emerald-800"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
