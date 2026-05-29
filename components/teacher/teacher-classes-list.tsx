"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import type { Classroom } from "@/lib/classroom/types";
import { getTeacherClassrooms } from "@/lib/supabase/classrooms";

export function TeacherClassesList() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await getTeacherClassrooms();
    setLoading(false);
    if (loadError) setError(loadError);
    else setClassrooms(data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href="/teacher-dashboard"
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Teacher dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Миний ангиуд</h1>
      </section>

      {loading ? (
        <p className="text-sm text-slate-600">Loading…</p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : classrooms.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
          <p className="text-sm text-slate-600">Одоогоор анги үүсгээгүй байна.</p>
          <Link
            href="/teacher/classes/new"
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Create new class
          </Link>
        </section>
      ) : (
        <div className="grid gap-4">
          {classrooms.map((cls) => (
            <article
              key={cls.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{cls.name}</h2>
                <span className="text-xs text-slate-500">{cls.status}</span>
              </div>
              {cls.level ? (
                <p className="mt-1 text-sm text-emerald-700">{cls.level}</p>
              ) : null}
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Students</dt>
                  <dd className="font-medium">{cls.studentCount ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Assignments</dt>
                  <dd className="font-medium">{cls.assignmentCount ?? 0}</dd>
                </div>
              </dl>
              <Link
                href={`/teacher/classes/${cls.id}`}
                className="mt-4 inline-flex text-sm font-semibold text-emerald-600"
              >
                View class →
              </Link>
            </article>
          ))}
        </div>
      )}

      <Link
        href="/teacher/classes/new"
        className="inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
      >
        Create new class →
      </Link>
    </PublicPageShell>
  );
}
