"use client";

import { useState } from "react";

import { TeacherMetricCard } from "@/components/teacher/teacher-metric-card";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import {
  CLASSROOM_EXAM_STATUSES,
  CLASSROOM_EXAM_STATUS_LABELS,
  examDisplayTitle,
  type ClassroomExamStatus,
  type ClassroomExamSummary,
} from "@/lib/classroom/exam-types";
import {
  deleteClassroomExam,
  updateClassroomExamStatus,
} from "@/lib/supabase/class-mock-exams";

type Props = {
  summary: ClassroomExamSummary;
  onChanged?: () => void;
};

function thresholdSentence(summary: ClassroomExamSummary): string {
  const { threshold } = summary;
  if (threshold.source === "hsk") {
    return `Тэнцэх босго: ${threshold.score}/${threshold.maxScore} оноо (${threshold.percent}%) — аппын HSK оноолтын дагуу.`;
  }
  return `Тэнцэх босго: ${threshold.percent}% — энэ шалгалтын HSK түвшин олдоогүй тул түр ашиглаж буй тоо. Албан ёсны HSK босго БИШ.`;
}

export function ClassExamResults({ summary, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { exam, rows } = summary;
  const satRows = rows.filter((row) => row.sat);
  const notSatRows = rows.filter((row) => !row.sat);

  async function handleStatus(next: ClassroomExamStatus) {
    setBusy(true);
    setError(null);
    const { error: updateError } = await updateClassroomExamStatus(exam.id, next);
    setBusy(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    onChanged?.();
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const { error: deleteError } = await deleteClassroomExam(exam.id);
    setBusy(false);
    setConfirmingDelete(false);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    onChanged?.();
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {examDisplayTitle(exam)}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {exam.hskLevel != null ? `HSK ${exam.hskLevel} · ` : ""}
            {exam.testId}
            {exam.scheduledFor ? ` · Шалгалтын өдөр ${exam.scheduledFor}` : ""}
            {exam.dueDate ? ` · Дуусах ${exam.dueDate}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {CLASSROOM_EXAM_STATUS_LABELS[exam.status] ?? exam.status}
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TeacherMetricCard
          label="Өгсөн"
          value={`${summary.satCount}/${summary.totalStudents}`}
          sub={`${summary.notSatCount} өгөөгүй`}
        />
        <TeacherMetricCard
          label="Ангийн дундаж"
          value={
            summary.averageScore != null
              ? `${summary.averageScore}/${summary.threshold.maxScore}`
              : "—"
          }
          sub={
            summary.averagePercentage != null
              ? `${summary.averagePercentage}%`
              : "Өгсөн хүн алга"
          }
        />
        <TeacherMetricCard
          label="Тэнцсэн хувь"
          value={summary.passRate != null ? `${summary.passRate}%` : "—"}
          sub={`${summary.passedCount} тэнцсэн · ${summary.failedCount} тэнцээгүй`}
        />
        <TeacherMetricCard
          label="Тэнцэх босго"
          value={`${summary.threshold.score}`}
          sub={`${summary.threshold.maxScore} онооноос`}
        />
      </div>

      <p
        className={`rounded-lg px-3 py-2 text-xs ${
          summary.threshold.source === "hsk"
            ? "bg-slate-50 text-slate-600"
            : "bg-amber-50 text-amber-900"
        }`}
      >
        {thresholdSentence(summary)}
      </p>

      {summary.undeterminedCount > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {summary.undeterminedCount} сурагчийн бичих хэсэг дүгнэгдээгүй тул
          тэнцсэн эсэх нь тодорхойгүй. Тэднийг тэнцсэн хувьд тооцоогүй.
        </p>
      ) : null}

      <section>
        <h4 className="text-sm font-semibold text-slate-900">
          Шалгалт өгсөн ({satRows.length})
        </h4>
        {satRows.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">
            Одоогоор хэн ч өгөөгүй байна.
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Сурагч</th>
                  <th className="py-2 pr-3 font-medium">Оноо</th>
                  <th className="py-2 pr-3 font-medium">Хувь</th>
                  <th className="py-2 pr-3 font-medium">Дүн</th>
                  <th className="py-2 font-medium">Өгсөн</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {satRows.map((row) => (
                  <tr key={row.studentRowId}>
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {row.displayName}
                    </td>
                    <td className="py-2 pr-3 text-slate-700">
                      {row.score != null
                        ? `${row.score}/${row.maxScore ?? summary.threshold.maxScore}`
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-slate-700">
                      {row.percentage != null ? `${row.percentage}%` : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {row.passed === true ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          Тэнцсэн
                        </span>
                      ) : row.passed === false ? (
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                          Тэнцээгүй
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                          Бичих хэсэг дүгнэгдээгүй
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {row.finishedAt
                        ? formatMongoliaDateTimeWithLabel(row.finishedAt)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-900">
          Өгөөгүй ({notSatRows.length})
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          Эдгээр сурагчийг 0 оноотой гэж тооцоогүй — дундаж, тэнцсэн хувиас
          гадуур байна.
        </p>
        {notSatRows.length === 0 ? (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Бүх сурагч шалгалтаа өгсөн байна.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {notSatRows.map((row) => (
              <li
                key={row.studentRowId}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {row.displayName}
                {row.studentUserId ? "" : " · бүртгэл холбогдоогүй"}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <footer className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">Төлөв солих:</span>
        {CLASSROOM_EXAM_STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            disabled={busy || value === exam.status}
            onClick={() => void handleStatus(value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
              value === exam.status
                ? "bg-emerald-500 text-white"
                : "border border-slate-200 text-slate-600 hover:text-emerald-700"
            }`}
          >
            {CLASSROOM_EXAM_STATUS_LABELS[value]}
          </button>
        ))}

        <span className="ml-auto" />
        {confirmingDelete ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDelete()}
              className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              Устгахыг баталгаажуулах
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Болих
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 disabled:opacity-60"
          >
            Устгах
          </button>
        )}
      </footer>
    </article>
  );
}
