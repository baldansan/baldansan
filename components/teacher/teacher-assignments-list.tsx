"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import type { Assignment } from "@/lib/classroom/types";
import { getTeacherAssignments } from "@/lib/supabase/classrooms";

export function TeacherAssignmentsList() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error: loadError } = await getTeacherAssignments();
      setLoading(false);
      if (loadError) setError(loadError);
      else setAssignments(data ?? []);
    }
    void load();
  }, []);

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href="/teacher-dashboard"
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Teacher dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Даалгаврууд</h1>
      </section>

      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : assignments.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">Одоогоор assignment алга.</p>
          <Link
            href="/teacher/assignments/new"
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Create assignment
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <Link href={`/teacher/assignments/${a.id}`} className="block">
                <h2 className="font-semibold text-slate-900">{a.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {a.classroomName ?? "Class"} · Lesson {a.lessonId} ·{" "}
                  {a.assignmentType} · {a.status}
                </p>
                {a.dueDate ? (
                  <p className="mt-1 text-xs text-slate-500">Due: {a.dueDate}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/teacher/assignments/new"
        className="inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
      >
        Create assignment →
      </Link>
    </PublicPageShell>
  );
}
