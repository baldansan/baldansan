"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PublicPageShell } from "@/components/public-page-shell";
import { ClassExamComposer } from "@/components/teacher/class-exam-composer";
import { ClassExamResults } from "@/components/teacher/class-exam-results";
import type { ClassroomExamSummary } from "@/lib/classroom/exam-types";
import type { Classroom } from "@/lib/classroom/types";
import { getClassroomExamSummaries } from "@/lib/supabase/class-mock-exams";
import { getClassroomById } from "@/lib/supabase/classrooms";

type Props = {
  classroomId: string;
};

export function ClassExamView({ classroomId }: Props) {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [summaries, setSummaries] = useState<ClassroomExamSummary[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Шалгалт товлосон / төлөв сольсон үед энэ тоог нэмээд дахин татна.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [classroomRes, summariesRes] = await Promise.all([
        getClassroomById(classroomId),
        getClassroomExamSummaries(classroomId),
      ]);
      if (cancelled) return;
      setLoading(false);
      setClassroom(classroomRes.data ?? null);
      setError(classroomRes.error ?? summariesRes.error);
      setSummaries(summariesRes.data ?? []);
      setWarnings(summariesRes.warnings);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [classroomId, reloadToken]);

  if (loading) {
    return (
      <PublicPageShell active="help" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="help" showBottomNav={false}>
      <section>
        <Link
          href={`/teacher/classes/${classroomId}`}
          className="text-sm font-medium text-slate-600 hover:text-emerald-600"
        >
          ← Ангийн хуудас
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Ангийн загвар шалгалт
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {classroom?.name ? `${classroom.name} — ` : ""}
          HSK загвар шалгалтыг ангиараа товлож, хэн өгсөн, ангийн дундаж хэд,
          тэнцсэн хувь хэд болохыг нэг дэлгэцээс харна.
        </p>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {warnings.length > 0 ? (
          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Шалгалт товлох</h2>
        <div className="mt-3">
          <ClassExamComposer
            classroomId={classroomId}
            onCreated={reload}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Дүн</h2>
        {summaries.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-600">
            Одоогоор товлосон шалгалт алга. Дээрх маягтаар эхний шалгалтаа
            товлоно уу.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {summaries.map((summary) => (
              <ClassExamResults
                key={summary.exam.id}
                summary={summary}
                onChanged={reload}
              />
            ))}
          </div>
        )}
      </section>
    </PublicPageShell>
  );
}
