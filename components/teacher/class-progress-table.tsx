"use client";

import { useMemo, useState } from "react";

import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import {
  computeClassLearnerScore,
  LEARNER_GRADE_BUCKETS,
  LEARNER_GRADE_LABELS,
  LEARNER_GRADE_RANGES,
  LEARNER_GRADE_TONES,
  type LearnerGradeBucket,
} from "@/lib/learner-grade";
import type { StudentProgressRow } from "@/lib/teacher/analytics-types";

type Props = {
  rows: StudentProgressRow[];
};

const STUDENT_STATUS_LABELS: Record<string, string> = {
  active: "Идэвхтэй",
  invited: "Урисан",
  inactive: "Идэвхгүй",
  removed: "Хасагдсан",
};

function GradeChip({ bucket }: { bucket: LearnerGradeBucket }) {
  return (
    <span
      title={LEARNER_GRADE_LABELS[bucket]}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold ring-1 ${LEARNER_GRADE_TONES[bucket]}`}
    >
      {bucket === "unrated" ? "—" : bucket}
    </span>
  );
}

export function ClassProgressTable({ rows }: Props) {
  const [groupByGrade, setGroupByGrade] = useState(true);

  const graded = useMemo(
    () =>
      rows.map((row) => ({
        row,
        score: computeClassLearnerScore({
          quizPercent: row.latestQuizPercentage,
          completionRate: row.completionRate,
          assignmentsAssigned: row.assignmentsAssigned,
          assignmentsCompleted: row.assignmentsCompleted,
          learnedWords: row.progressUnavailable ? null : row.learnedWordsCount,
        }),
      })),
    [rows]
  );

  const sorted = useMemo(
    () =>
      [...graded].sort((a, b) => (b.score.total ?? -1) - (a.score.total ?? -1)),
    [graded]
  );

  const groups = useMemo(
    () =>
      LEARNER_GRADE_BUCKETS.map((bucket) => ({
        bucket,
        entries: sorted.filter((entry) => entry.score.grade === bucket),
      })).filter((group) => group.entries.length > 0),
    [sorted]
  );

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-600">Энэ ангид сурагч бүртгэгдээгүй.</p>
    );
  }

  const header = (
    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
      <tr>
        <th className="px-4 py-3">Үнэлгээ</th>
        <th className="px-4 py-3">Сурагч</th>
        <th className="px-4 py-3">Оноо</th>
        <th className="px-4 py-3">Төлөв</th>
        <th className="px-4 py-3">Дуусгасан</th>
        <th className="px-4 py-3">Гүйцэтгэл</th>
        <th className="px-4 py-3">Сүүлийн дасгал</th>
        <th className="px-4 py-3">Сурсан үг</th>
        <th className="px-4 py-3">Сүүлд идэвхтэй</th>
      </tr>
    </thead>
  );

  const renderRow = ({
    row,
    score,
  }: {
    row: StudentProgressRow;
    score: ReturnType<typeof computeClassLearnerScore>;
  }) => (
    <tr key={row.studentRowId}>
      <td className="px-4 py-3">
        <GradeChip bucket={score.grade} />
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{row.displayName}</div>
        {row.email ? (
          <div className="text-xs text-slate-500">{row.email}</div>
        ) : null}
      </td>
      <td className="px-4 py-3">
        {score.total == null ? (
          <span
            className="text-xs text-slate-500"
            title={score.unratedReason ?? undefined}
          >
            —
          </span>
        ) : (
          <span className="font-bold text-slate-900">{score.total}</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {STUDENT_STATUS_LABELS[row.status] ?? row.status}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {row.progressUnavailable
          ? "—"
          : `${row.assignmentsCompleted}/${row.assignmentsAssigned}`}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {row.progressUnavailable ? "—" : `${row.completionRate}%`}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {row.latestQuizPercentage != null
          ? `${row.latestQuizPercentage}%`
          : "—"}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {row.learnedWordsCount != null ? row.learnedWordsCount : "—"}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {row.lastActivityAt
          ? formatMongoliaDateTimeWithLabel(row.lastActivityAt, "date")
          : "—"}
      </td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Үнэлгээ нь сүүлийн дасгалын оноо, даалгаврын гүйцэтгэл, сурсан үгээс
          бүрдэнэ.
        </p>
        <button
          type="button"
          onClick={() => setGroupByGrade((value) => !value)}
          className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-700"
        >
          {groupByGrade ? "Нэг жагсаалтаар харах" : "Үнэлгээгээр бүлэглэх"}
        </button>
      </div>

      {groupByGrade ? (
        groups.map((group) => (
          <section
            key={group.bucket}
            className="overflow-hidden rounded-2xl ring-1 ring-slate-200"
          >
            <header className="flex flex-wrap items-center gap-3 bg-slate-50 px-4 py-3">
              <GradeChip bucket={group.bucket} />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {LEARNER_GRADE_LABELS[group.bucket]}
                </h3>
                <p className="text-xs text-slate-500">
                  {LEARNER_GRADE_RANGES[group.bucket]} ·{" "}
                  {group.entries.length} сурагч
                </p>
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                {header}
                <tbody className="divide-y divide-slate-100 bg-white">
                  {group.entries.map(renderRow)}
                </tbody>
              </table>
            </div>
          </section>
        ))
      ) : (
        <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
          <table className="w-full min-w-[820px] text-left text-sm">
            {header}
            <tbody className="divide-y divide-slate-100 bg-white">
              {sorted.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
