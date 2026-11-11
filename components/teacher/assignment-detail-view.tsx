"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssignmentAttachmentLink } from "@/components/teacher/assignment-attachment-link";
import { ReportExportCard } from "@/components/teacher/report-export-card";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { isCustomAssignment } from "@/lib/classroom/types";
import type { AssignmentAnalytics } from "@/lib/teacher/analytics-types";
import { buildAssignmentReportMarkdown } from "@/lib/teacher/report-builder";
import { getAssignmentAnalytics } from "@/lib/supabase/teacher-analytics";

const TYPE_LABELS: Record<string, string> = {
  full_lesson: "Бүтэн хичээл",
  watch: "Бичлэг үзэх",
  vocabulary: "Үг цээжлэх",
  quiz: "Дасгал",
  review: "Давталт",
};

function formatDay(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type Props = {
  assignmentId: string;
};

export function AssignmentDetailView({ assignmentId }: Props) {
  const [analytics, setAnalytics] = useState<AssignmentAnalytics | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await getAssignmentAnalytics(assignmentId);
      setLoading(false);
      if (res.error) setError(res.error);
      else setAnalytics(res.data);
      setWarnings(res.warnings);
    }
    void load();
  }, [assignmentId]);

  const reportMarkdown = useMemo(() => {
    if (!analytics) return "";
    return buildAssignmentReportMarkdown(analytics);
  }, [analytics]);

  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </TeacherShell>
    );
  }

  if (!analytics) {
    return (
      <TeacherShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">{error ?? "Даалгавар олдсонгүй."}</p>
        <Link href="/teacher/assignments" className="mt-2 text-sm text-emerald-600">
          ← Даалгаврууд
        </Link>
      </TeacherShell>
    );
  }

  const { assignment } = analytics;
  const custom = isCustomAssignment(assignment.lessonId);
  // Нэг сурагчид онилсон даалгаварт зөвхөн тэр сурагч л хамаарна.
  const relevant = assignment.targetStudentUserId
    ? analytics.studentResults.filter(
        (r) => r.studentUserId === assignment.targetStudentUserId
      )
    : analytics.studentResults;
  const done = relevant.filter((r) => r.status === "completed");
  const working = relevant.filter(
    (r) => r.status !== "completed" && r.status !== "not_started" && r.status !== "invited"
  );
  const notStarted = relevant.filter((r) => r.status === "not_started");
  const notJoined = relevant.filter((r) => r.status === "invited");
  const total = done.length + working.length + notStarted.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;
  const scored = done.filter((r) => r.quizPercentage != null);
  const lowScore = scored.filter((r) => (r.quizPercentage as number) < 60);

  async function copyReminder() {
    const names = [...notStarted, ...working].map((r) => r.displayName).join(", ");
    const due = assignment.dueDate ? ` (${assignment.dueDate} хүртэл)` : "";
    const text = `Сануулга: «${assignment.title}» даалгавраа${due} хийгээрэй. Одоогоор хийгээгүй: ${names}. Апп-аа нээхэд нүүр хуудасны хамгийн дээр байгаа.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <TeacherShell active="help" showBottomNav={false}>
      <header>
        <Link
          href="/teacher/assignments"
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Бүх даалгавар
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900" translate="no">
          {assignment.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          <Link
            href={`/teacher/classes/${assignment.classroomId}`}
            className="font-semibold hover:text-emerald-700 hover:underline"
            translate="no"
          >
            👥 {assignment.classroomName}
          </Link>{" "}
          ·{" "}
          {custom
            ? "Багшийн өөрийн даалгавар"
            : (TYPE_LABELS[assignment.assignmentType] ?? assignment.assignmentType)}
          {assignment.dueDate ? ` · ${assignment.dueDate} хүртэл` : " · хугацаагүй"}
        </p>
        {assignment.targetStudentUserId ? (
          <p className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Зөвхөн нэг сурагчид өгсөн — ангийн бусад сурагчид харагдахгүй
          </p>
        ) : null}
        {assignment.instructions ? (
          <p
            className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
            translate="no"
          >
            {assignment.instructions}
          </p>
        ) : null}
        <AssignmentAttachmentLink attachment={assignment.attachment} className="mt-3" />
        {warnings.length > 0 ? (
          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        ) : null}
      </header>

      {/* Нэг харцаар */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-3xl font-bold tabular-nums text-slate-900">
            {done.length}
            <span className="text-lg font-semibold text-slate-500"> / {total} сурагч хийсэн</span>
          </p>
          <p className="text-sm text-slate-600">
            {analytics.averageQuizPercentage != null
              ? `Дундаж оноо ${analytics.averageQuizPercentage}%`
              : "Оноо хараахан алга"}
          </p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {total === 0
            ? "Энэ ангид апп-д нэгдсэн сурагч алга."
            : done.length === total
              ? "🎉 Бүх сурагч хийж дуусгасан."
              : `${notStarted.length} сурагч огт эхлээгүй${working.length ? `, ${working.length} нь хийж байгаа` : ""}.`}
          {lowScore.length > 0
            ? ` ${lowScore.length} сурагч 60%-иас доош оноо авсан — тэдэнд давтлага хэрэгтэй.`
            : ""}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Хийгээгүй */}
        <section className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              ⏳ Хийгээгүй{" "}
              <span className="text-sm font-medium text-slate-500">
                ({notStarted.length + working.length})
              </span>
            </h2>
            {notStarted.length + working.length > 0 ? (
              <button
                type="button"
                onClick={() => void copyReminder()}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-800 ring-1 ring-red-200 hover:bg-red-100"
              >
                {copied ? "Хууллаа ✓ — чатдаа буулгана уу" : "Сануулах бичвэр хуулах"}
              </button>
            ) : null}
          </div>
          {notStarted.length + working.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Хийгээгүй сурагч алга.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {[...working, ...notStarted].map((r, i) => (
                <li
                  key={`${r.studentUserId ?? r.displayName}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-red-100"
                >
                  {r.studentUserId ? (
                    <Link
                      href={`/teacher/classes/${assignment.classroomId}/students/${r.studentUserId}`}
                      className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                      translate="no"
                    >
                      {r.displayName}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-900" translate="no">
                      {r.displayName}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {r.status === "not_started" ? "Эхлээгүй" : "Хийж байгаа"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {notJoined.length > 0 && !assignment.targetStudentUserId ? (
            <p className="mt-3 text-xs text-slate-500">
              {notJoined.length} сурагч апп-д нэвтрээгүй тул даалгавар очоогүй:{" "}
              <span translate="no">{notJoined.map((r) => r.displayName).join(", ")}</span>
            </p>
          ) : null}
        </section>

        {/* Хийсэн */}
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <h2 className="text-base font-bold text-slate-900">
            ✅ Хийсэн{" "}
            <span className="text-sm font-medium text-slate-500">({done.length})</span>
          </h2>
          {done.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Одоогоор хийсэн сурагч алга.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {[...done]
                .sort((a, b) => (b.quizPercentage ?? -1) - (a.quizPercentage ?? -1))
                .map((r, i) => (
                  <li
                    key={`${r.studentUserId ?? r.displayName}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-emerald-100"
                  >
                    {r.studentUserId ? (
                      <Link
                        href={`/teacher/classes/${assignment.classroomId}/students/${r.studentUserId}`}
                        className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                        translate="no"
                      >
                        {r.displayName}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-900" translate="no">
                        {r.displayName}
                      </span>
                    )}
                    <span className="flex items-center gap-2 text-xs">
                      {r.quizPercentage != null ? (
                        <b
                          className={`tabular-nums ${
                            r.quizPercentage >= 80
                              ? "text-emerald-700"
                              : r.quizPercentage < 60
                                ? "text-red-600"
                                : "text-slate-700"
                          }`}
                        >
                          {r.quizPercentage}%
                        </b>
                      ) : null}
                      <span className="text-slate-400">{formatDay(r.completedAt)}</span>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Тайланг хуулах / файлаар татах
        </summary>
        <div className="mt-3">
          <ReportExportCard
            markdown={reportMarkdown}
            filename={`assignment-report-${assignmentId.slice(0, 8)}.md`}
          />
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        {custom ? null : (
          <Link
            href={`/lessons/${assignment.lessonId}`}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
          >
            Хичээлийг сурагчийн нүдээр харах
          </Link>
        )}
        <Link
          href={`/teacher/assignments/new?classroom=${assignment.classroomId}`}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          + Энэ ангид өөр даалгавар өгөх
        </Link>
      </div>
    </TeacherShell>
  );
}
