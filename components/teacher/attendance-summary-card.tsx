"use client";

import { useMemo } from "react";

import {
  ATTENDANCE_STATUS_TONES,
  attendanceStatusLabel,
  formatAttendanceRate,
  formatIsoDay,
  worstAttendanceStudents,
  type ClassroomAttendanceSummary,
} from "@/lib/classroom/attendance-types";

type Props = {
  summary: ClassroomAttendanceSummary;
};

function rateTone(rate: number | null): string {
  if (rate === null) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (rate >= 90) return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (rate >= 75) return "bg-amber-50 text-amber-900 ring-amber-200";
  return "bg-red-50 text-red-800 ring-red-200";
}

function RateChip({ rate }: { rate: number | null }) {
  return (
    <span
      className={`inline-flex min-w-14 justify-center rounded-lg px-2 py-1 text-sm font-bold ring-1 ${rateTone(rate)}`}
      title={rate === null ? "Ирц бүртгээгүй тул тооцоолох боломжгүй" : undefined}
    >
      {formatAttendanceRate(rate)}
    </span>
  );
}

/**
 * Сүүлийн 30 хоногийн ирцийн дүн.
 *
 * Бүртгэлгүй сурагч «—» гэж харагдана, 0% гэж ХЭЗЭЭ Ч харагдахгүй — «бүртгээгүй»
 * болон «нэг ч удаа ирээгүй» хоёр огт өөр баримт.
 */
export function AttendanceSummaryCard({ summary }: Props) {
  const worst = useMemo(() => worstAttendanceStudents(summary), [summary]);

  const sorted = useMemo(
    () =>
      [...summary.students].sort((a, b) => {
        // Бүртгэлгүй хүмүүсийг доор нь байрлуулна — тэднийг эрэмбэлэх үндэс алга.
        if (a.attendanceRate === null && b.attendanceRate === null) {
          return a.displayName.localeCompare(b.displayName, "mn");
        }
        if (a.attendanceRate === null) return 1;
        if (b.attendanceRate === null) return -1;
        return a.attendanceRate - b.attendanceRate;
      }),
    [summary.students]
  );

  if (summary.rosterCount === 0) {
    return (
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Сүүлийн {summary.windowDays} хоногийн ирц
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Ангид сурагч алга. Эхлээд сурагчдаа нэмбэл ирцийн дүн энд гарна.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Сүүлийн {summary.windowDays} хоногийн ирц
        </h2>
        <p className="text-xs text-slate-500">
          {formatIsoDay(summary.fromDate)} – {formatIsoDay(summary.toDate)}
        </p>
      </div>

      {summary.totalRecords === 0 ? (
        <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
          Энэ хугацаанд ирц бүртгээгүй байна. Дээрх огноог сонгоод эхний бүртгэлээ
          хийвэл дүн шинжилгээ энд гарч ирнэ.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Ангийн дундаж ирц
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatAttendanceRate(summary.classRate)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Чөлөөтэй өдрийг тооцохгүй
              </p>
            </article>
            <article className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Бүртгэсэн хичээл
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {summary.sessionDates.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Хамгийн сүүлд: {formatIsoDay(summary.sessionDates[0] ?? null)}
              </p>
            </article>
            <article className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Дүнтэй сурагч
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {summary.recordedStudentCount}/{summary.rosterCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Бусдын ирц хараахан бүртгэгдээгүй
              </p>
            </article>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Хамгийн их анхаарал шаардаж буй сурагчид
            </h3>
            {worst.length === 0 ? (
              <p className="mt-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
                Ирц тасалдсан сурагч алга — бүгд тогтмол ирж байна.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {worst.map((student) => (
                  <li
                    key={student.studentId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
                  >
                    <span className="font-medium">{student.displayName}</span>
                    <span className="text-amber-800">
                      {student.absentDays} өдөр тасалсан
                      {student.lateDays > 0
                        ? `, ${student.lateDays} өдөр хоцорсон`
                        : ""}{" "}
                      · {formatAttendanceRate(student.attendanceRate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3 font-medium">Сурагч</th>
              <th className="py-2 pr-3 font-medium">Ирц</th>
              <th className="py-2 pr-3 font-medium">Ирсэн</th>
              <th className="py-2 pr-3 font-medium">Хоцорсон</th>
              <th className="py-2 pr-3 font-medium">Тасалсан</th>
              <th className="py-2 pr-3 font-medium">Чөлөөтэй</th>
              <th className="py-2 font-medium">Сүүлийн хичээл</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((student) => (
              <tr
                key={student.studentId}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="py-2 pr-3 font-medium text-slate-800">
                  {student.displayName}
                </td>
                <td className="py-2 pr-3">
                  <RateChip rate={student.attendanceRate} />
                </td>
                <td className="py-2 pr-3 text-slate-700">
                  {student.recordedDays === 0 ? "—" : student.presentDays}
                </td>
                <td className="py-2 pr-3 text-slate-700">
                  {student.recordedDays === 0 ? "—" : student.lateDays}
                </td>
                <td className="py-2 pr-3 text-slate-700">
                  {student.recordedDays === 0 ? "—" : student.absentDays}
                </td>
                <td className="py-2 pr-3 text-slate-700">
                  {student.recordedDays === 0 ? "—" : student.excusedDays}
                </td>
                <td className="py-2 text-slate-600">
                  {student.lastSessionDate === null ? (
                    <span className="text-slate-400">Бүртгээгүй</span>
                  ) : (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>{formatIsoDay(student.lastSessionDate)}</span>
                      {student.lastStatus ? (
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${ATTENDANCE_STATUS_TONES[student.lastStatus]}`}
                        >
                          {attendanceStatusLabel(student.lastStatus)}
                        </span>
                      ) : null}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        «—» гэдэг нь тухайн сурагчийн ирц хараахан бүртгэгдээгүй гэсэн үг. Ирцийн
        хувь = (ирсэн + хоцорсон) ÷ (ирсэн + хоцорсон + тасалсан).
      </p>
    </section>
  );
}
