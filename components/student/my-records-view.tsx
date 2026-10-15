"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { C } from "@/components/charts";
import { PublicPageShell } from "@/components/public-page-shell";
import { OpenClassQuizBanner } from "@/components/student/open-class-quiz-banner";
import { getLearnerClassExams, type LearnerClassExam } from "@/lib/supabase/class-mock-exams";
import { getMyQuizAttempts, type MyQuizAttempt } from "@/lib/supabase/class-quizzes";
import { getMyClassrooms, getMyLessonRecords, type MyClassroom, type MyLessonRecord } from "@/lib/student/records";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Ulaanbaatar" });
}

function scoreColor(v: number | null): string {
  return v == null ? C.muted : v >= 75 ? C.good : v < 50 ? C.bad : C.ink;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function MyRecordsView() {
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<MyClassroom[]>([]);
  const [records, setRecords] = useState<MyLessonRecord[]>([]);
  const [quizzes, setQuizzes] = useState<MyQuizAttempt[]>([]);
  const [exams, setExams] = useState<LearnerClassExam[]>([]);

  useEffect(() => {
    let off = false;
    void (async () => {
      const cls = await getMyClassrooms();
      if (off) return;
      setClassrooms(cls);
      if (cls.length > 0) {
        const [r, q, e] = await Promise.all([
          getMyLessonRecords(),
          getMyQuizAttempts(),
          getLearnerClassExams(),
        ]);
        if (off) return;
        setRecords(r);
        setQuizzes(q);
        setExams((e.data ?? []).filter((x) => x.sat));
      }
      setLoading(false);
    })();
    return () => {
      off = true;
    };
  }, []);

  if (loading) {
    return (
      <PublicPageShell active="dashboard" showBottomNav={false}>
        <p className="text-sm text-slate-600">Ачаалж байна…</p>
      </PublicPageShell>
    );
  }

  if (classrooms.length === 0) {
    return (
      <PublicPageShell active="dashboard" showBottomNav={false}>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Миний дүн</h1>
          <p className="mt-2 text-sm text-slate-600">
            Энэ хуудас зөвхөн ангид бүртгэлтэй сурагчдад харагдана. Багшийн өгсөн нэгдэх кодоор ангидаа
            орсны дараа дүнгээ эндээс харна.
          </p>
          <Link href="/study" className="mt-3 inline-block text-sm font-semibold text-emerald-700">
            ← Дасгалжуулалтын төв
          </Link>
        </section>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell active="dashboard" showBottomNav={false}>
      <section>
        <Link href="/study" className="text-sm font-medium text-slate-600 hover:text-emerald-600">
          ← Дасгалжуулалтын төв
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Миний дүн</h1>
        <p className="mt-1 text-sm text-slate-600" translate="no">
          {classrooms.map((c) => c.name).filter(Boolean).join(", ")}
        </p>
      </section>

      <OpenClassQuizBanner />

      <Section title="Хичээлийн дасгалын дүн">
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">Хичээлийн дасгал хараахан хийгээгүй байна.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-2 font-semibold">Хичээл</th>
                  <th className="px-2 py-2 text-right font-semibold">Дээд оноо</th>
                  <th className="px-2 py-2 text-right font-semibold">Оролдлого</th>
                  <th className="px-2 py-2 text-right font-semibold">Анх</th>
                  <th className="py-2 pl-2 text-right font-semibold">Сүүлд</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.lessonId} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-2">
                      <Link href={`/lessons/${r.lessonId}`} className="font-medium text-slate-900 hover:text-emerald-700" translate="no">
                        {r.title ?? r.lessonId}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-right font-bold tabular-nums" style={{ color: scoreColor(r.bestScorePct) }}>
                      {r.bestScorePct}%
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-600">{r.attempts}</td>
                    <td className="px-2 py-2 text-right text-xs text-slate-500">{fmtDate(r.firstAttemptAt)}</td>
                    <td className="py-2 pl-2 text-right text-xs text-slate-500">{fmtDate(r.lastAttemptAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Хурдан сорилууд">
        {quizzes.length === 0 ? (
          <p className="text-sm text-slate-500">Хурдан сорил өгөөгүй байна.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {quizzes.map((q) => (
              <li key={q.quizId} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900" translate="no">
                    {q.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {fmtDate(q.submittedAt)}
                    {q.correct != null ? ` · ${q.correct}/${q.total} зөв` : ""}
                  </span>
                </span>
                <span className="text-right">
                  <b className="tabular-nums" style={{ color: scoreColor(q.scorePct) }}>
                    {q.scorePct != null ? `${Math.round(q.scorePct)}%` : "—"}
                  </b>
                  {q.classAvgPct != null ? (
                    <span className="block text-xs text-slate-500">Ангийн дундаж {Math.round(q.classAvgPct)}%</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Загвар шалгалтууд">
        {exams.length === 0 ? (
          <p className="text-sm text-slate-500">Ангийн шалгалт өгөөгүй байна.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-900" translate="no">
                  {e.title ?? e.testTitle ?? e.testId}
                </span>
                <span className="shrink-0 text-right text-xs text-slate-600">
                  {e.score != null ? `${e.score}${e.maxScore ? `/${e.maxScore}` : ""}` : "—"}
                  {e.passed === true ? " · тэнцсэн" : e.passed === false ? " · тэнцээгүй" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PublicPageShell>
  );
}
