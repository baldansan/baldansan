"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import { useTeacherAuth } from "@/components/teacher/teacher-auth-gate";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import type { StudentAssignment } from "@/lib/classroom/types";
import { getStudentAssignments } from "@/lib/supabase/classrooms";

function statusLabel(status: string | null): string {
  if (!status || status === "not_started") return "Not started";
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In progress";
  return status;
}

function isCompleted(status: string | null): boolean {
  return status === "completed";
}

export function MyAssignmentsView() {
  const { loggedIn } = useTeacherAuth();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data, error: loadError } = await getStudentAssignments();
      setLoading(false);
      if (loadError) setError(loadError);
      else setAssignments(data ?? []);
    }
    void load();
  }, [loggedIn]);

  if (loggedIn === null || loading) {
    return (
      <PublicPageShell active="dashboard" showBottomNav={false}>
        <p className="text-sm text-slate-600">Loading…</p>
      </PublicPageShell>
    );
  }

  if (!loggedIn) {
    return (
      <PublicPageShell active="dashboard" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">My assignments</h1>
          <p className="mt-2 text-sm text-slate-600">Assignment харахын тулд нэвтэрнэ.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Login
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="dashboard" showBottomNav={false}>
      <section>
        <h1 className="text-3xl font-bold tracking-tight">My assignments</h1>
        <p className="mt-2 text-sm text-slate-600">
          Таны ангид өгсөн даалгаврууд
        </p>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : assignments.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">Одоогоор assignment алга.</p>
          <p className="mt-2 text-xs text-slate-500">
            Багш таны account-ийг classroom-д student_user_id-ээр нэмсэн эсэхийг
            шалгаарай.
          </p>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((a) => {
            const completed = isCompleted(a.resultStatus);
            return (
              <li
                key={a.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-semibold text-slate-900">{a.title}</h2>
                  {completed ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Completed
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {a.classroomName}
                  {a.organizationName ? ` · ${a.organizationName}` : ""} · Lesson{" "}
                  {a.lessonId} · {a.assignmentType}
                </p>
                {a.teacherLabel ? (
                  <p className="text-xs text-slate-500">Teacher: {a.teacherLabel}</p>
                ) : null}
                {a.dueDate ? (
                  <p className="text-xs text-slate-500">Due: {a.dueDate}</p>
                ) : null}
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  Status: {statusLabel(a.resultStatus)}
                </p>
                {a.quizPercentage != null ? (
                  <p className="text-xs text-slate-600">
                    Quiz score: {a.quizPercentage}%
                    {a.quizScore != null && a.quizTotal != null
                      ? ` (${a.quizScore}/${a.quizTotal})`
                      : ""}
                  </p>
                ) : null}
                {a.completedAt ? (
                  <p className="text-xs text-slate-500">
                    Completed: {formatMongoliaDateTimeWithLabel(a.completedAt)}
                  </p>
                ) : null}
                <Link
                  href={`/lessons/${a.lessonId}`}
                  className="mt-3 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  {completed ? "Review lesson" : "Start assignment"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PublicPageShell>
  );
}
