"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DEMO_BADGE_LABEL, DEMO_DATA_NOTE } from "@/lib/demo-data";
import {
  LEARNER_GRADE_BUCKETS,
  LEARNER_GRADE_LABELS,
  LEARNER_GRADE_RANGES,
  LEARNER_GRADE_TONES,
  MIN_QUIZ_ATTEMPTS_FOR_GRADE,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";
import type { LearnerGradeBoard } from "@/lib/supabase/admin-learner-grades";

type Props = {
  board: LearnerGradeBoard;
};

const numberFormatter = new Intl.NumberFormat("mn-MN");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function learnerLabel(userId: string, displayName: string | null): string {
  if (displayName?.trim()) return displayName.trim();
  return `Суралцагч ${userId.slice(0, 8)}`;
}

export function GradeChip({
  bucket,
  size = "md",
}: {
  bucket: LearnerGradeBucket;
  size?: "sm" | "md";
}) {
  const text = bucket === "unrated" ? "—" : bucket;
  return (
    <span
      title={LEARNER_GRADE_LABELS[bucket]}
      className={`inline-flex items-center justify-center rounded-lg font-bold ring-1 ${
        LEARNER_GRADE_TONES[bucket]
      } ${size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"}`}
    >
      {text}
    </span>
  );
}

export function LearnerGradeBoardView({ board }: Props) {
  const [query, setQuery] = useState("");
  const [openBucket, setOpenBucket] = useState<LearnerGradeBucket | null>(null);
  // Real learners are the default view: a mixed count would quietly overstate
  // how many people actually use the app.
  const [showDemo, setShowDemo] = useState(false);

  const scopedRows = useMemo(
    () => (showDemo ? board.rows : board.rows.filter((row) => !row.isDemo)),
    [board.rows, showDemo]
  );

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return scopedRows;
    return scopedRows.filter((row) => {
      const haystack = [
        row.userId,
        row.displayName ?? "",
        row.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [scopedRows, query]);

  const groups = useMemo(
    () =>
      LEARNER_GRADE_BUCKETS.map((bucket) => ({
        bucket,
        rows: filteredRows.filter((row) => row.score.grade === bucket),
      })),
    [filteredRows]
  );

  // Recount from the rows actually on screen, so the cards match the tables.
  const distribution = useMemo(
    () =>
      LEARNER_GRADE_BUCKETS.map((bucket) => ({
        bucket,
        count: scopedRows.filter((row) => row.score.grade === bucket).length,
      })),
    [scopedRows]
  );

  const ratedRows = scopedRows.filter((row) => row.score.total != null);
  const averageScore =
    ratedRows.length > 0
      ? Math.round(
          ratedRows.reduce((sum, row) => sum + (row.score.total ?? 0), 0) /
            ratedRows.length
        )
      : null;

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Үнэлгээний хураангуй">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {distribution.map(({ bucket, count }) => (
            <button
              key={bucket}
              type="button"
              onClick={() =>
                setOpenBucket((current) => (current === bucket ? null : bucket))
              }
              aria-pressed={openBucket === bucket}
              className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                openBucket === bucket
                  ? "border-emerald-300 bg-emerald-50/60"
                  : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <GradeChip bucket={bucket} size="sm" />
                <span className="text-lg font-bold text-slate-900">
                  {formatNumber(count)}
                </span>
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                {LEARNER_GRADE_RANGES[bucket]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Нэр, имэйл, ID-аар хайх…"
          aria-label="Суралцагч хайх"
          className="admin-input sm:max-w-sm"
        />
        <p className="text-xs text-slate-500">
          Нийт {formatNumber(scopedRows.length)} суралцагч ·{" "}
          {formatNumber(ratedRows.length)} нь үнэлэгдсэн
          {averageScore != null ? ` · дундаж ${averageScore} оноо` : ""}
        </p>
      </section>

      {board.demoCount > 0 ? (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <p className="min-w-0 flex-1 text-xs leading-5 text-amber-900">
            {showDemo
              ? DEMO_DATA_NOTE
              : `${formatNumber(board.demoCount)} жишээ суралцагчийг нуусан байна — эдгээр нь үзүүлэх зорилгоор үүсгэсэн өгөгдөл.`}
          </p>
          <button
            type="button"
            onClick={() => setShowDemo((value) => !value)}
            aria-pressed={showDemo}
            className="shrink-0 rounded-full border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-amber-900 hover:border-amber-400"
          >
            {showDemo ? "Жишээг нуух" : "Жишээг харуулах"}
          </button>
        </section>
      ) : null}

      {groups.map(({ bucket, rows }) => {
        if (rows.length === 0 && openBucket !== bucket) return null;
        return (
          <section key={bucket} className="admin-panel overflow-hidden">
            <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <GradeChip bucket={bucket} />
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900">
                  {LEARNER_GRADE_LABELS[bucket]}
                </h2>
                <p className="text-xs text-slate-500">
                  {LEARNER_GRADE_RANGES[bucket]} · {formatNumber(rows.length)}{" "}
                  суралцагч
                </p>
              </div>
            </header>

            {rows.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-500">
                Энэ бүлэгт суралцагч алга.
              </p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Суралцагч</th>
                      <th className="px-4 py-3">Оноо</th>
                      <th className="px-4 py-3">Дасгал</th>
                      <th className="px-4 py-3">Шалгалт</th>
                      <th className="px-4 py-3">Дуусгасан хичээл</th>
                      <th className="px-4 py-3">Сурсан үг</th>
                      <th className="px-4 py-3">Идэвх</th>
                      <th className="px-4 py-3">Сүүлд</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.userId}>
                        <td className="px-4 py-3 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/learner?user=${row.userId}`}
                            className="font-medium text-slate-900 hover:text-emerald-700"
                          >
                            {learnerLabel(row.userId, row.displayName)}
                          </Link>
                          {row.isDemo ? (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                              {DEMO_BADGE_LABEL}
                            </span>
                          ) : null}
                          {row.email ? (
                            <span className="block text-xs text-slate-500">
                              {row.email}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          {row.score.total == null ? (
                            <span
                              className="text-xs text-slate-500"
                              title={row.score.unratedReason ?? undefined}
                            >
                              —
                            </span>
                          ) : (
                            <span className="font-bold text-slate-900">
                              {row.score.total}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.quizAveragePercent == null
                            ? "—"
                            : `${row.quizAveragePercent}%`}
                          <span className="block text-xs text-slate-500">
                            {formatNumber(row.quizAttempts)} оролдлого
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.mockAveragePercent == null
                            ? "—"
                            : `${row.mockAveragePercent}%`}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(row.completedLessons)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(row.learnedWords)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.activeMinutes > 0
                            ? `${formatNumber(row.activeMinutes)} мин`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(row.lastActiveAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}

      {scopedRows.length === 0 ? (
        <p className="admin-panel p-6 text-sm text-slate-600">
          {board.demoCount > 0 && !showDemo
            ? "Жинхэнэ суралцагчийн бүртгэл хараахан алга. Жишээ өгөгдлийг харахыг хүсвэл дээрх товчийг дар."
            : "Одоогоор дасгал хийсэн суралцагч алга. Хэрэглэгчид дасгал ажиллаж эхэлмэгц энд үнэлгээ гарч ирнэ."}
        </p>
      ) : null}

      <section className="admin-panel p-5">
        <h2 className="admin-section-title">Үнэлгээ хэрхэн тооцогддог вэ</h2>
        <p className="admin-section-desc mt-1">
          Дөрвөн хэсгээс 100 оноо бүрдэнэ: дасгалын дундаж (40), шалгалтын
          дундаж (20), хичээл дуусгалт (25), идэвх буюу сурсан үг ба суралцсан
          хугацаа (15). Аль нэг хэсэгт өгөгдөл байхгүй бол түүний жин үлдсэн
          хэсгүүдэд хуваарилагдана — шалгалт өгөөгүй хүн үүнээс болж
          дорд үнэлэгдэхгүй.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {MIN_QUIZ_ATTEMPTS_FOR_GRADE}-аас цөөн дасгал хийсэн суралцагчид үсэг
          олгохгүй — тэднийг «Үнэлэхэд эрт» бүлэгт харуулна.
        </p>
      </section>

      {board.warnings.length > 0 ? (
        <section className="admin-panel border-amber-200 bg-amber-50/60 p-4">
          <h2 className="text-sm font-semibold text-amber-900">Анхааруулга</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {board.warnings.map((warning) => (
              <li key={warning} className="text-xs text-amber-800">
                • {warning}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
