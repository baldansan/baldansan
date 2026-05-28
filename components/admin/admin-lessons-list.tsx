"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import { EmptyState } from "@/components/empty-state";
import { lessonPath } from "@/lib/content";
import {
  matchesStatusFilter,
  toAdminContentStatus,
  type AdminStatusFilter,
} from "@/lib/admin/lesson-status";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lessons: LessonContent[];
};

export function AdminLessonsList({ lessons }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      if (!matchesStatusFilter(lesson.status, statusFilter)) return false;
      if (!q) return true;
      return (
        lesson.id.toLowerCase().includes(q) ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.chineseTitle.toLowerCase().includes(q) ||
        lesson.subtitle.toLowerCase().includes(q)
      );
    });
  }, [lessons, query, statusFilter]);

  const draftCount = lessons.filter(
    (l) => toAdminContentStatus(l.status) === "draft"
  ).length;
  const publishedCount = lessons.filter(
    (l) => toAdminContentStatus(l.status) === "available"
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Хичээл удирдах</h1>
          <p className="mt-1 text-sm text-slate-600">
            {lessons.length} хичээл · {draftCount} ноорог · {publishedCount}{" "}
            нийтлэгдсэн (унших горим)
          </p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="inline-flex w-fit rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          + Шинэ хичээл
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Хайх: гарчиг, китай гарчиг, тайлбар..."
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          aria-label="Хичээл хайх"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AdminStatusFilter)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
          aria-label="Статус шүүлт"
        >
          <option value="all">Бүгд</option>
          <option value="draft">draft</option>
          <option value="available">available</option>
          <option value="archived">archived</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Хичээл олдсонгүй"
          description={
            lessons.length === 0
              ? "HSK5 курс дээр хичээл байхгүй байна. Supabase эсвэл local fallback шалгана уу."
              : "Хайлт эсвэл статус шүүлтийг өөрчилж үзнэ үү."
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
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Гарчиг</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 hidden sm:table-cell">Үг / Quiz</th>
                <th className="px-4 py-3 hidden md:table-cell">Хугацаа</th>
                <th className="px-4 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-emerald-50/30">
                  <td className="px-4 py-3 font-mono text-xs">{lesson.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{lesson.title}</p>
                    <p className="text-xs text-slate-500">{lesson.chineseTitle}</p>
                  </td>
                  <td className="px-4 py-3">
                    <LessonStatusBadge status={lesson.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                    {lesson.vocabularyCount} / {lesson.quizCount}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                    {lesson.duration}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs font-medium">
                      <Link
                        href={`/admin/lessons/${lesson.id}/edit`}
                        className="text-emerald-700 hover:text-emerald-800"
                      >
                        Засах
                      </Link>
                      <Link
                        href={lessonPath(lesson.id)}
                        className="text-slate-600 hover:text-emerald-700"
                      >
                        Public →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
