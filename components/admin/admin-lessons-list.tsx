"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LessonListActions } from "@/components/admin/lesson-list-actions";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import { EmptyState } from "@/components/empty-state";
import { hasAudioUrl } from "@/lib/lesson-media";
import {
  getAdminPublishStatus,
  matchesStatusFilter,
  type AdminStatusFilter,
} from "@/lib/admin/lesson-status";
import {
  getLessonDetailedWarnings,
  getLessonShortWarnings,
} from "@/lib/admin/lesson-short-warnings";
import type { LessonQaReport } from "@/lib/admin/lesson-qa";

type Props = {
  reports: LessonQaReport[];
};

function audioLabel(hasAudio: boolean): string {
  return hasAudio ? "✓" : "—";
}

export function AdminLessonsList({ reports }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((report) => {
      const { lesson } = report;
      if (!matchesStatusFilter(lesson, statusFilter)) return false;
      if (!q) return true;
      return (
        lesson.id.toLowerCase().includes(q) ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.chineseTitle.toLowerCase().includes(q) ||
        lesson.courseId.toLowerCase().includes(q)
      );
    });
  }, [reports, query, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lessons</h1>
          <p className="mt-1 text-sm text-slate-600">
            {reports.length} хичээл
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Хайх: гарчиг, ID, курс..."
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          aria-label="Хичээл хайх"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AdminStatusFilter)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          aria-label="Статус шүүлт"
        >
          <option value="all">Бүх статус</option>
          <option value="draft">Ноорог</option>
          <option value="available">Нийтлэгдсэн</option>
          <option value="archived">Архив</option>
        </select>
      </div>

      {bannerMessage ? (
        <div
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200"
          role="status"
        >
          {bannerMessage}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="Хичээл олдсонгүй"
          description={
            reports.length === 0
              ? "Одоогоор хичээл байхгүй. Import ZIP эсвэл шинэ хичээл үүсгэнэ үү."
              : "Хайлт эсвэл шүүлтийг өөрчилж үзнэ үү."
          }
          action={
            <Link
              href="/admin/import"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Import ZIP →
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Lesson</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Vocab</th>
                <th className="px-4 py-3">Quiz</th>
                <th className="px-4 py-3">Audio</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((report) => {
                const { lesson } = report;
                const publishStatus = getAdminPublishStatus(lesson);
                const shortWarnings = getLessonShortWarnings(report);
                const detailedWarnings = getLessonDetailedWarnings(report);
                const showAdvanced = expandedId === lesson.id;

                return (
                  <tr key={lesson.id} className="align-top hover:bg-emerald-50/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{lesson.title}</p>
                      <p className="text-xs text-slate-500">{lesson.chineseTitle}</p>
                      {shortWarnings.length > 0 ? (
                        <p className="mt-1 text-xs text-amber-800">
                          {shortWarnings.join(" · ")}
                        </p>
                      ) : null}
                      {detailedWarnings.length > shortWarnings.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(showAdvanced ? null : lesson.id)
                          }
                          className="mt-1 text-xs font-medium text-slate-500 hover:text-emerald-700"
                        >
                          {showAdvanced ? "Hide" : "Advanced details"} ▾
                        </button>
                      ) : null}
                      {showAdvanced ? (
                        <ul className="mt-2 list-inside list-disc text-xs text-slate-600">
                          {detailedWarnings.map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {lesson.courseId}
                    </td>
                    <td className="px-4 py-3">
                      <LessonStatusBadge status={publishStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {report.vocabularyActual}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {report.quizActual}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {audioLabel(hasAudioUrl(lesson))}
                    </td>
                    <td className="px-4 py-3">
                      <LessonListActions
                        lessonId={lesson.id}
                        lessonTitle={lesson.title}
                        publishStatus={publishStatus}
                        onMessage={setBannerMessage}
                      />
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
